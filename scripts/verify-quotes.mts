import fs from "node:fs";
import path from "node:path";

/**
 * Every quote in content/ and content/drafts/ must be an exact substring of
 * the normalized story text (corpus/normalized/<storySlug>.json). Deterministic
 * pipeline step (ADR-0001): catches LLM-invented or paraphrased quotes.
 *
 * Comparison folds punctuation variants that normalize.ts and hand-typed
 * quotes may legitimately disagree on (apostrophes, dashes, ellipses,
 * whitespace). Any change to transforms in scripts/normalize.mts must be
 * mirrored here.
 *
 * Exit code 1 if any quote is not found. A quote found in a different
 * paragraph than the draft claims is reported but not fatal — merge/review
 * fixes the number.
 */

const ROOT = process.cwd();
const NORMALIZED_DIR = path.join(ROOT, "corpus", "normalized");
const CONTENT_DIR = path.join(ROOT, "content");

interface Paragraph {
  n: number;
  chapter: number | null;
  text: string;
}

interface NormalizedStory {
  slug: string;
  title: string;
  paragraphs: Paragraph[];
}

interface SourceLike {
  storySlug?: string;
  quote?: string;
  /** Draft-only: paragraph number claimed by extraction. */
  paragraph?: number;
}

function fold(s: string): string {
  return s
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/--|–/g, "—")
    .replace(/…/g, "...")
    .replace(/_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface SearchableStory {
  title: string;
  full: string;
  /** Start offset of each paragraph inside `full`, parallel to paragraphs. */
  offsets: number[];
  paragraphs: Paragraph[];
}

function buildSearchable(story: NormalizedStory): SearchableStory {
  const folded = story.paragraphs.map((p) => fold(p.text));
  const offsets: number[] = [];
  let full = "";
  for (const text of folded) {
    offsets.push(full.length);
    full += text + " ";
  }
  return { title: story.title, full, offsets, paragraphs: story.paragraphs };
}

function paragraphAt(story: SearchableStory, offset: number): Paragraph {
  let i = story.offsets.findLastIndex((o) => o <= offset);
  if (i === -1) i = 0;
  return story.paragraphs[i];
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
  let wrongParagraph = 0;

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
        notFound++;
        console.log(`FAIL  ${where}: no normalized text for story "${source.storySlug}"`);
        return;
      }

      const needle = fold(source.quote);
      const matchedParagraphs: number[] = [];
      for (let o = story.full.indexOf(needle); o !== -1; o = story.full.indexOf(needle, o + 1)) {
        matchedParagraphs.push(paragraphAt(story, o).n);
      }
      if (matchedParagraphs.length === 0) {
        notFound++;
        console.log(`FAIL  ${where}: quote not found in "${story.title}"`);
        console.log(`      "${source.quote.slice(0, 100)}${source.quote.length > 100 ? "…" : ""}"`);
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
    `\n${checked} quotes checked: ${checked - notFound} found, ${notFound} not found` +
      (wrongParagraph > 0 ? `, ${wrongParagraph} with wrong paragraph number` : ""),
  );
  if (notFound > 0) process.exit(1);
}

main();
