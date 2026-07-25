/**
 * Exact-substring quote search over normalized story texts
 * (corpus/normalized/<storySlug>.json). Shared by scripts/verify-quotes.mts
 * and the /admin/review UI so both judge quotes identically.
 *
 * `fold` mirrors the punctuation transforms of scripts/normalize.mts —
 * any change to the transforms there must be mirrored here.
 */

export interface Paragraph {
  n: number;
  chapter: number | null;
  text: string;
}

export interface NormalizedStory {
  slug: string;
  title: string;
  paragraphs: Paragraph[];
}

export interface SearchableStory {
  title: string;
  full: string;
  /** Start offset of each paragraph inside `full`, parallel to paragraphs. */
  offsets: number[];
  paragraphs: Paragraph[];
}

export function fold(s: string): string {
  return s
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/--|–/g, "—")
    .replace(/…/g, "...")
    .replace(/_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchable(story: NormalizedStory): SearchableStory {
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

/** Numbers of every paragraph the folded quote occurs in (empty = not found). */
export function findQuote(story: SearchableStory, quote: string): number[] {
  const needle = fold(quote);
  const matched: number[] = [];
  for (let o = story.full.indexOf(needle); o !== -1; o = story.full.indexOf(needle, o + 1)) {
    matched.push(paragraphAt(story, o).n);
  }
  return matched;
}

/** Shortest anchor worth diagnosing — below this a "match" is coincidence. */
const MIN_ANCHOR = 12;
const CLIP = 45;

/** Longest prefix (or suffix) of `needle` that occurs somewhere in `full`. */
function longestMatch(full: string, needle: string, side: "start" | "end"): number {
  let lo = 0;
  let hi = needle.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const piece = side === "start" ? needle.slice(0, mid) : needle.slice(needle.length - mid);
    if (full.includes(piece)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export interface QuoteDivergence {
  /** Which end of the quote anchors in the text. */
  anchor: "start" | "end";
  /** Folded chars that match around that anchor. */
  matched: number;
  /** Quote and text around the divergence point; ◆ separates matched from unmatched. */
  quoteAround: string;
  textAround: string;
}

/**
 * Explain why a not-found quote fails: anchor its longest matching prefix or
 * suffix in the text and show both sides at the point they diverge. Null when
 * no anchor of at least MIN_ANCHOR folded chars matches anywhere.
 */
export function diagnoseQuote(story: SearchableStory, quote: string): QuoteDivergence | null {
  const needle = fold(quote);
  const pre = longestMatch(story.full, needle, "start");
  const suf = longestMatch(story.full, needle, "end");
  if (Math.max(pre, suf) < MIN_ANCHOR) return null;

  // Divergence offset inside the quote, and where its matched part sits in the text.
  const d = pre >= suf ? pre : needle.length - suf;
  const pos =
    pre >= suf
      ? story.full.indexOf(needle.slice(0, pre)) + pre
      : story.full.indexOf(needle.slice(d));
  return {
    anchor: pre >= suf ? "start" : "end",
    matched: Math.max(pre, suf),
    quoteAround: `…${needle.slice(Math.max(0, d - CLIP), d)}◆${needle.slice(d, d + CLIP)}…`,
    textAround: `…${story.full.slice(Math.max(0, pos - CLIP), pos)}◆${story.full.slice(pos, pos + CLIP)}…`,
  };
}
