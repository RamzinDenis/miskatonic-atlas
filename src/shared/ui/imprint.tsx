import { getAtlasTally } from "@/shared/lib/content";

/**
 * The imprint line along the foot of every chart page: how large the atlas
 * actually is, set as a printer's line rather than as counters. It answers,
 * before a single click, whether the sheet is a picture or a page of a body
 * of work — the same line on every sheet, as an imprint is the volume's,
 * not the leaf's. Counted from the content itself, so it can never drift.
 *
 * The phone drops it — there the sheet takes the whole screen and a line of
 * small caps over its lower edge costs more than it tells.
 */
export function ChartImprint() {
  const tally = getAtlasTally();
  return (
    <p className="chart-imprint pointer-events-none absolute inset-x-0 bottom-0 z-[1000] hidden px-6 pb-3 pt-10 text-center text-[11px] uppercase tracking-[0.2em] text-foreground sm:block">
      {tally.locations} places · {tally.characters} persons · {tally.creatures} beasts
      <span className="mx-2">—</span>
      {tally.quotations} quotations from {tally.stories} tales
    </p>
  );
}
