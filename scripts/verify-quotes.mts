import fs from "node:fs";
import path from "node:path";
import {
  buildSearchable,
  diagnoseQuote,
  findQuote,
  type NormalizedStory,
  type SearchableStory,
} from "../src/shared/lib/quote-search.ts";

/**
 * Every quote in content/ and content/drafts/ must be an exact substring of
 * the normalized story text (corpus/normalized/<storySlug>.json). Deterministic
 * pipeline step (ADR-0001): catches LLM-invented or paraphrased quotes.
 *
 * The comparison itself lives in src/shared/lib/quote-search.ts, shared with
 * the /admin/review UI.
 *
 * Usage: npm run verify-quotes [-- --story <storySlug>]
 *
 * Exit code 1 if any quote is not found. With --story only failures whose
 * source cites that story are fatal; failures citing other stories are
 * reported as pre-existing — so one story's debris can't block another's
 * extraction. A quote found in a different paragraph than the draft claims is
 * reported but not fatal — merge/review fixes the number.
 */

const ROOT = process.cwd();
const NORMALIZED_DIR = path.join(ROOT, "corpus", "normalized");
const CONTENT_DIR = path.join(ROOT, "content");

interface SourceLike {
  storySlug?: string;
  quote?: string;
  /** Draft-only: paragraph number claimed by extraction. */
  paragraph?: number;
}

function* contentFiles(): Generator<string> {
  const stack = [CONTENT_DIR];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort()) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(p);
      else if (entry.name.endsWith(".json") && !entry.name.startsWith("quote-verification")) yield p;
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const storyIdx = argv.indexOf("--story");
  const scopedStory = storyIdx === -1 ? null : (argv[storyIdx + 1] ?? null);
  if (storyIdx !== -1 && scopedStory === null) {
    console.error("usage: npm run verify-quotes [-- --story <storySlug>]");
    process.exit(1);
  }

  const stories = new Map<string, SearchableStory>();
  if (fs.existsSync(NORMALIZED_DIR)) {
    for (const file of fs.readdirSync(NORMALIZED_DIR).filter((f) => f.endsWith(".json"))) {
      const story: NormalizedStory = JSON.parse(
        fs.readFileSync(path.join(NORMALIZED_DIR, file), "utf8"),
      );
      stories.set(story.slug, buildSearchable(story));
    }
  }
  if (stories.size === 0) {
    console.error("no normalized stories — run scripts/normalize.mts first");
    process.exit(1);
  }

  let checked = 0;
  let notFound = 0;
  let preexisting = 0;
  let wrongParagraph = 0;

  /** With --story, a failure citing another story is pre-existing debris, not this run's problem. */
  const outOfScope = (slug: string) => scopedStory !== null && slug !== scopedStory;

  for (const file of contentFiles()) {
    const rel = path.relative(ROOT, file).replaceAll(path.sep, "/");
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      continue; // broken JSON is validate.ts territory
    }

    // Window drafts are arrays of occurrence records; content/ files are single entities.
    const entities = (Array.isArray(parsed) ? parsed : [parsed]) as { sources?: SourceLike[] }[];
    const sources = entities.flatMap((e) => (Array.isArray(e?.sources) ? e.sources : []));

    sources.forEach((source, i) => {
      if (typeof source?.quote !== "string" || typeof source?.storySlug !== "string") return;
      checked++;
      const where = `${rel} sources[${i}]`;

      const story = stories.get(source.storySlug);
      if (!story) {
        if (outOfScope(source.storySlug)) {
          preexisting++;
          console.log(`FAIL* ${where}: no normalized text for story "${source.storySlug}" (pre-existing)`);
          return;
        }
        notFound++;
        console.log(`FAIL  ${where}: no normalized text for story "${source.storySlug}"`);
        return;
      }

      const matchedParagraphs = findQuote(story, source.quote);
      if (matchedParagraphs.length === 0) {
        if (outOfScope(source.storySlug)) {
          preexisting++;
          console.log(`FAIL* ${where}: quote not found in "${story.title}" (pre-existing)`);
          return;
        }
        notFound++;
        console.log(`FAIL  ${where}: quote not found in "${story.title}"`);
        console.log(`      "${source.quote.slice(0, 100)}${source.quote.length > 100 ? "…" : ""}"`);
        const diag = diagnoseQuote(story, source.quote);
        if (diag) {
          console.log(
            `      diverges ${diag.anchor === "start" ? `after ${diag.matched} folded chars` : `${diag.matched} folded chars before the end`} (◆ marks the split):`,
          );
          console.log(`      quote: ${diag.quoteAround}`);
          console.log(`      text:  ${diag.textAround}`);
        }
        return;
      }

      if (typeof source.paragraph === "number" && !matchedParagraphs.includes(source.paragraph)) {
        wrongParagraph++;
        console.log(
          `WARN  ${where}: claims ¶${source.paragraph}, found in ¶${matchedParagraphs.join(", ¶")}`,
        );
      }
    });
  }

  console.log(
    `\n${checked} quotes checked: ${checked - notFound - preexisting} found, ${notFound} not found` +
      (preexisting > 0
        ? `, ${preexisting} pre-existing failure(s) outside --story ${scopedStory} (not fatal here — npm run verify-quotes)`
        : "") +
      (wrongParagraph > 0 ? `, ${wrongParagraph} with wrong paragraph number` : ""),
  );
  if (notFound > 0) process.exit(1);
}

main();
