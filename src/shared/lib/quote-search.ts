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
