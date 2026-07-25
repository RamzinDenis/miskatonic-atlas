import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { WindowOutput, type Occurrence } from "../src/shared/draft-schemas.ts";

/**
 * LLM extraction step over the Anthropic SDK (docs/plan-extract-sdk.md,
 * supersedes the run-in-Claude-Code-session mode of ADR-0001). The playbook
 * prompts/extract.md stays the source of truth: its Output + Rules sections
 * are inserted into every window prompt verbatim.
 *
 * Usage: npm run extract -- <storySlug> [--force]
 *   - windows of 12 paragraphs, overlap 2, each an isolated context
 *   - existing window files are skipped; --force reruns everything
 *   - finishes by running verify-quotes --story <slug>: broken quotes of this
 *     story are fatal, debris from other stories is reported as pre-existing
 */

const MODEL = "claude-sonnet-5";
const USD_PER_MTOK = { input: 2, output: 10 }; // Sonnet 5 intro pricing through 2026-08-31
const WINDOW_SIZE = 12;
const WINDOW_STEP = 10;
const CONCURRENCY = 4;

const ROOT = process.cwd();

interface Paragraph {
  n: number;
  chapter: number | null;
  text: string;
}

interface NormalizedStory {
  slug: string;
  title: string;
  author: string;
  chapters: { n: number; title: string }[];
  paragraphs: Paragraph[];
}

function playbookSections(): string {
  const playbook = fs.readFileSync(path.join(ROOT, "prompts", "extract.md"), "utf8");
  const start = playbook.indexOf("## Output");
  const end = playbook.indexOf("## Run");
  if (start === -1 || end === -1) throw new Error("prompts/extract.md: Output/Run sections not found");
  return playbook.slice(start, end).trim();
}

function windowRanges(total: number): [number, number][] {
  const ranges: [number, number][] = [];
  for (let start = 1; ; start += WINDOW_STEP) {
    const end = Math.min(start + WINDOW_SIZE - 1, total);
    ranges.push([start, end]);
    if (end >= total) return ranges;
  }
}

const pad = (n: number) => String(n).padStart(3, "0");

function windowPrompt(story: NormalizedStory, sections: string, from: number, to: number): string {
  const chapterList =
    story.chapters.length > 0
      ? story.chapters.map((c) => `${c.n}. ${c.title}`.trim()).join(" · ")
      : "(no chapters — omit chapter context, use null)";
  const body = story.paragraphs
    .slice(from - 1, to)
    .map((p) => `¶${p.n}${p.chapter === null ? "" : ` [Chapter ${p.chapter}]`}: ${p.text}`)
    .join("\n\n");

  return [
    "You are the extraction step of a literary-atlas pipeline. Extract entity occurrences from one window of a story, following the playbook sections below exactly.",
    sections,
    `Story: ${story.title} by ${story.author} (storySlug: ${story.slug})`,
    `Chapters: ${chapterList}`,
    `Window: paragraphs ${from}–${to}. You see nothing outside this window.`,
    body,
  ].join("\n\n");
}

/** Drop nulls so the files on disk match the playbook example and CoC windows. */
function toDiskRecord(o: Occurrence): Record<string, unknown> {
  return {
    kind: o.kind,
    name: o.name,
    aliases: o.aliases,
    facts: o.facts,
    typeGuess: o.typeGuess,
    ...(o.realWorld === null ? {} : { realWorld: o.realWorld }),
    ...(o.fate === null ? {} : { fate: o.fate }),
    relatedNames: o.relatedNames,
    sources: o.sources.map((s) => ({
      storySlug: s.storySlug,
      paragraph: s.paragraph,
      quote: s.quote,
      ...(s.context === null ? {} : { context: s.context }),
    })),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const slug = args.find((a) => !a.startsWith("--"));
  if (!slug) {
    console.error("usage: npm run extract -- <storySlug> [--force]");
    process.exit(1);
  }

  const normalizedPath = path.join(ROOT, "corpus", "normalized", `${slug}.json`);
  if (!fs.existsSync(normalizedPath)) {
    console.error(`no ${normalizedPath} — run npm run normalize first`);
    process.exit(1);
  }
  const story: NormalizedStory = JSON.parse(fs.readFileSync(normalizedPath, "utf8"));
  const sections = playbookSections();

  const outDir = path.join(ROOT, "content", "drafts", slug, "windows");
  fs.mkdirSync(outDir, { recursive: true });

  const client = new Anthropic();
  const usage = { input: 0, output: 0 };
  let failed = 0;

  const queue = windowRanges(story.paragraphs.length).filter(([from, to]) => {
    const file = path.join(outDir, `w${pad(from)}-${pad(to)}.json`);
    if (!force && fs.existsSync(file)) {
      console.log(`skip  w${pad(from)}-${pad(to)} (exists, use --force to rerun)`);
      return false;
    }
    return true;
  });
  console.log(`${story.title}: ${story.paragraphs.length} paragraphs, ${queue.length} window(s) to run\n`);

  async function runWindow(from: number, to: number, attempt = 1): Promise<void> {
    const id = `w${pad(from)}-${pad(to)}`;
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        // Sonnet 5 runs adaptive thinking by default; those tokens share the
        // max_tokens budget and were truncating the structured JSON on the
        // densest windows (Unterminated string / Expected ',' after element).
        // Extraction is schema-constrained, so thinking buys little — disable
        // it and hand the full budget to the output.
        thinking: { type: "disabled" },
        output_config: { format: zodOutputFormat(WindowOutput) },
        messages: [{ role: "user", content: windowPrompt(story, sections, from, to) }],
      });
      usage.input += response.usage.input_tokens;
      usage.output += response.usage.output_tokens;

      const raw = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");

      let parsed: ReturnType<typeof WindowOutput.parse>;
      try {
        parsed = WindowOutput.parse(JSON.parse(raw));
      } catch (parseErr) {
        if (response.stop_reason === "max_tokens") {
          throw new Error(
            `output truncated at max_tokens (${response.usage.output_tokens} out tok) — raise max_tokens or shrink the window`,
          );
        }
        const dump = path.join(outDir, `${id}.raw.txt`);
        fs.writeFileSync(dump, raw);
        throw new Error(
          `parse failed (stop_reason=${response.stop_reason}): ${(parseErr as Error).message} — raw dumped to ${dump}`,
        );
      }

      const records = parsed.occurrences.map(toDiskRecord);
      fs.writeFileSync(
        path.join(outDir, `${id}.json`),
        JSON.stringify(records, null, 2) + "\n",
      );
      console.log(`done  ${id}: ${records.length} occurrence(s)`);
    } catch (e) {
      if (attempt === 1) {
        console.log(`retry ${id}: ${(e as Error).message}`);
        return runWindow(from, to, 2);
      }
      failed++;
      console.error(`FAIL  ${id}: ${(e as Error).message}`);
    }
  }

  // Worker pool: up to CONCURRENCY windows in flight (first-tier rate limits).
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (next < queue.length) {
        const [from, to] = queue[next++];
        await runWindow(from, to);
      }
    }),
  );

  const cost = (usage.input / 1e6) * USD_PER_MTOK.input + (usage.output / 1e6) * USD_PER_MTOK.output;
  console.log(
    `\ntokens: ${usage.input} in / ${usage.output} out — $${cost.toFixed(3)} (${MODEL})`,
  );
  if (failed > 0) {
    console.error(`${failed} window(s) failed — rerun to fill the gaps`);
    process.exit(1);
  }

  console.log("\nrunning verify-quotes…");
  const verify = spawnSync(process.execPath, ["scripts/verify-quotes.mts", "--story", slug], {
    stdio: "inherit",
    cwd: ROOT,
  });
  if (verify.status !== 0) {
    console.error(`verify-quotes failed — fix or drop the broken "${slug}" occurrences before merge`);
    process.exit(verify.status ?? 1);
  }
  console.log(`\nnext: npm run merge -- ${slug}`);
}

main();
