import { getAtlasTally } from "@/shared/lib/content";

/**
 * The imprint line along the foot of the front chart: how large the atlas
 * actually is, set as a printer's line rather than as counters. It answers,
 * before a single click, whether the sheet is a picture or the front page of
 * a body of work. Counted from the content itself, so it can never drift.
 *
 * The phone drops it — there the sheet takes the whole screen and a line of
 * small caps over its lower edge costs more than it tells.
 */
export function ChartImprint() {
  const tally = getAtlasTally();
  return (
    <p className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] hidden px-6 pb-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted/80 sm:block">
      {tally.locations} places · {tally.characters} persons · {tally.creatures} beasts
      <span className="mx-2">—</span>
      {tally.quotations} quotations from {tally.stories} tales
    </p>
  );
}
