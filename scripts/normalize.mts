import fs from "node:fs";
import path from "node:path";

/**
 * corpus/raw/*.md (frontmatter + verbatim Project Gutenberg text)
 *   → corpus/normalized/<slug>.json (numbered paragraphs, chapter map)
 *
 * Deterministic step of the pipeline (see ADR-0001). What it does:
 * - cuts everything outside the `*** START/END OF THE PROJECT GUTENBERG EBOOK ***` markers
 * - drops transcriber's notes, illustration captions, the title/by-line
 * - keeps footnote text as a regular paragraph (CoC's footnote is the story's
 *   subtitle and the only place naming the narrator)
 * - unwraps hard line breaks, strips `_italics_`, converts `--` to `—`
 * - numbers paragraphs sequentially and records which chapter each belongs to
 *
 * Quotes in content/ are verified against this normalized text, so any change
 * to the transforms here must be mirrored in scripts/verify-quotes.ts folding.
 */

const RAW_DIR = path.join(process.cwd(), "corpus", "raw");
const OUT_DIR = path.join(process.cwd(), "corpus", "normalized");

interface Chapter {
  n: number;
  title: string;
}

interface Paragraph {
  n: number;
  /** Chapter number, or null for front matter before the first heading. */
  chapter: number | null;
  text: string;
}

interface NormalizedStory {
  slug: string;
  title: string;
  author: string;
  source: string;
  sourceUrl: string;
  retrieved: string;
  chapters: Chapter[];
  paragraphs: Paragraph[];
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("no frontmatter found");

  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    meta[key] = value;
  }
  return { meta, body: match[2] };
}

function cutGutenbergBody(text: string): string {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.includes("*** START OF THE PROJECT GUTENBERG EBOOK"));
  const end = lines.findIndex((l) => l.includes("*** END OF THE PROJECT GUTENBERG EBOOK"));
  if (start === -1 || end === -1) throw new Error("Gutenberg START/END markers not found");
  return lines.slice(start + 1, end).join("\n");
}

/** Split on blank lines into raw paragraph blocks (still hard-wrapped). */
function splitBlocks(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
}

function unwrapAndClean(block: string): string {
  return block
    .replace(/\s+/g, " ") // unwrap hard line breaks, collapse runs of spaces
    .replace(/_(.+?)_/g, "$1") // _italics_ → plain
    .replace(/--/g, "—")
    .trim();
}

const CHAPTER_RE = /^(\d+)\.\s+(.+?)\.?$/;

export function normalize(raw: string): NormalizedStory {
  const { meta, body } = parseFrontmatter(raw);
  const title = meta.title ?? "";

  const chapters: Chapter[] = [];
  const paragraphs: Paragraph[] = [];
  let currentChapter: number | null = null;

  for (const block of splitBlocks(cutGutenbergBody(body))) {
    if (block.startsWith("[Transcriber") || block.startsWith("[Illustration")) continue;

    let text = unwrapAndClean(block);

    const footnote = text.match(/^\[Footnote \d+: (.+)\]$/);
    if (footnote) text = footnote[1];

    // Title and by-line before the first chapter duplicate the frontmatter.
    if (currentChapter === null && chapters.length === 0) {
      const flat = text.toLowerCase();
      if (flat === title.toLowerCase() || /^by\s+\S+/.test(flat) && text.length < 40) continue;
    }

    const heading = text.length < 60 && text.match(CHAPTER_RE);
    if (heading) {
      currentChapter = Number(heading[1]);
      chapters.push({ n: currentChapter, title: heading[2] });
      continue;
    }

    // Epigraph attribution ("—Algernon Blackwood.") belongs to the quote above it.
    if (text.startsWith("—") && paragraphs.length > 0) {
      paragraphs[paragraphs.length - 1].text += " " + text;
      continue;
    }

    paragraphs.push({ n: paragraphs.length + 1, chapter: currentChapter, text });
  }

  return {
    slug: meta.slug ?? "",
    title,
    author: meta.author ?? "",
    source: meta.source ?? "",
    sourceUrl: meta.sourceUrl ?? "",
    retrieved: meta.retrieved ?? "",
    chapters,
    paragraphs,
  };
}

function main() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.error(`no .md files in ${RAW_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const file of files) {
    const raw = fs.readFileSync(path.join(RAW_DIR, file), "utf8");
    const story = normalize(raw);
    if (!story.slug) {
      console.error(`${file}: frontmatter has no slug`);
      process.exit(1);
    }
    const outPath = path.join(OUT_DIR, `${story.slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(story, null, 2) + "\n");
    console.log(
      `${file} → corpus/normalized/${story.slug}.json ` +
        `(${story.chapters.length} chapters, ${story.paragraphs.length} paragraphs)`,
    );
  }
}

main();
