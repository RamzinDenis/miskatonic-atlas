import Link from "next/link";
import { MAPS, chartPath } from "./geometry";
import { warmChart } from "./sheets";

/**
 * The atlas' sheets as a toggle of framed, lettered tiles in a cartouche of
 * their own, apart from the legend's key. Collapsible like the legend,
 * behind a "Regions" button — the reader's word, not the chart's: "Charts"
 * beside the header's "Map" read as two names for one thing. The current
 * sheet is no link; its frame is the annotator's vermilion.
 */
export function RegionsNav({
  chartId,
  open,
  onToggle,
}: {
  chartId: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-end">
      {open && (
        <nav
          aria-label="Regions of the atlas"
          className="parchment mb-2 rounded-sm p-2"
        >
          <div className="legend-cartouche px-3 pb-3 pt-2">
            {/* On a phone the cartouche must not eat the chart: the tiles
                shrink (globals.css) and sit in a row along the sheet's
                foot. */}
            <div className="mt-1 flex flex-row gap-2.5 sm:flex-col sm:gap-3">
              {Object.values(MAPS).map((m) =>
                m.id === chartId ? (
                  <span
                    key={m.id}
                    aria-current="page"
                    title={`${m.title} — this sheet`}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className="chart-tile chart-tile--current"
                      style={{ backgroundImage: `url(${m.insetUrl})` }}
                    />
                    <span className="font-display text-[11px] italic leading-none text-accent sm:text-[13px]">
                      {m.shortTitle}
                    </span>
                    <span className="sr-only">{m.title} — this sheet</span>
                  </span>
                ) : (
                  <Link
                    key={m.id}
                    href={chartPath(m.id)}
                    title={m.title}
                    /* The widget's chunk is here already — this nav is
                       drawn by it. What the next sheet still needs is its
                       paper, and pointing at a tile buys the time to
                       fetch it. A phone has no pointing: the touch itself
                       is the earliest signal there is, a beat before its
                       click commits the navigation. */
                    onMouseEnter={() => warmChart(m)}
                    onTouchStart={() => warmChart(m)}
                    onFocus={() => warmChart(m)}
                    className="group flex flex-col items-center gap-1"
                  >
                    <span
                      className="chart-tile"
                      style={{ backgroundImage: `url(${m.insetUrl})` }}
                    />
                    <span className="font-display text-[11px] italic leading-none transition-colors group-hover:text-accent sm:text-[13px]">
                      {m.shortTitle}
                    </span>
                    <span className="sr-only">{m.title}</span>
                  </Link>
                ),
              )}
            </div>
          </div>
        </nav>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="parchment rounded-sm px-3 py-1.5 text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
      >
        Regions {open ? "−" : "+"}
      </button>
    </div>
  );
}
