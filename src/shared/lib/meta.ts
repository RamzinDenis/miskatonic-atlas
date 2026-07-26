/**
 * Meta description for search results and link previews. Entity summaries
 * run long (up to ~600 chars); Google and the social cards truncate around
 * 150–160, dropping an ellipsis mid-phrase. Clipping at a sentence boundary
 * keeps the preview a complete thought — the page itself still carries the
 * full summary, as does JSON-LD.
 */
const LIMIT = 160;

export function metaDescription(summary: string): string {
  if (summary.length <= LIMIT) return summary;
  const chunks = summary.match(/[^.!?]+[.!?]+["')\]]*\s*/g);
  // A period after a title is not a sentence end: "Dr." made a description.
  const abbreviation = /\b(?:Dr|Mr|Mrs|Ms|Prof|St)\.$/;
  let clipped = "";
  let sentence = "";
  for (const chunk of chunks ?? []) {
    sentence += chunk;
    if (abbreviation.test(sentence.trimEnd())) continue;
    if ((clipped + sentence).trimEnd().length > LIMIT) break;
    clipped += sentence;
    sentence = "";
  }
  clipped = clipped.trimEnd();
  if (clipped) return clipped;
  /* Most summaries open with one long clause-chained sentence, so a clause
     boundary (colon, semicolon, dash) is the next honest place to stop;
     only a boundary past a third of the limit, or the cut loses the thought. */
  const head = summary.slice(0, LIMIT - 1);
  const clause = Math.max(
    ...[": ", "; ", " — "].map((mark) => head.lastIndexOf(mark)),
  );
  if (clause > LIMIT / 3) return head.slice(0, clause);
  // A single unbroken sentence: cut at the last word that fits, mark the cut.
  return head.replace(/\s+\S*$/, "") + "…";
}
