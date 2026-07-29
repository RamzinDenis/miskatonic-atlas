import Link from "next/link";
import { ChartLink } from "@/widgets/world-map/chart-link";

/**
 * The atlas masthead — one strip, the chart's, wherever it stands. The map
 * page floats it over the full-bleed sheet; the inner leaves make it stick,
 * frosting the print that passes under. Nothing else about it changes: it is
 * the reader's fixed
 * point across a turn (held still by name in globals.css), so a masthead
 * that were a few pixels taller on one side of the turn than the other
 * would jump under a gaze that is resting on it.
 *
 * Hence the scrim rather than a rule under the strip: on the chart it lifts
 * the letters off the engraving, and on a leaf it deepens the head of the
 * page into the same shadow — the sheet below is what draws the line there.
 */
export function SiteHeader({ floating = false }: { floating?: boolean }) {
  return (
    <header
      /* The masthead is the reader's fixed point while a leaf turns under
         it: named here, held still in globals.css. A masthead that slides
         with the content reads as the whole viewport moving. */
      style={{ viewTransitionName: "site-header" }}
      className={`site-header-strip ${
        floating
          ? /* pointer-events-auto: the chart pages' chrome is a pass-through
               layer over the keeper's map, and the masthead is the one thing
               in it that takes the pointer back. */
            "pointer-events-auto absolute inset-x-0 top-0 z-[1100]"
          : /* A leaf is read by scrolling, so here the strip travels with the
               reader; the chart has nothing to scroll and keeps it merely
               laid over the sheet. z-20 is belt-and-braces — a sticky box
               already paints above the leaf's in-flow panels. */
            "site-header-strip--sticky sticky top-0 z-20"
      }`}
    >
      {/* relative: the frosted glass behind a sticky strip is an absolute
          pseudo-element, and only a positioned line of letters paints above
          it — left in the flow, the masthead's own name would be blurred by
          the frosting meant for the print below it. */}
      <div className="relative flex w-full items-baseline justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Both ways back to the chart warm it on the way: the masthead is
            on every page, and most of those pages have never loaded the map
            widget. */}
        <ChartLink className="whitespace-nowrap font-display text-base tracking-wide text-accent sm:text-lg">
          Miskatonic Atlas
        </ChartLink>
        <nav className="flex gap-3 text-xs uppercase tracking-widest sm:gap-6">
          {/* The masthead itself opens the chart, so the phone drops the
              duplicate item; on wide screens Map stays as the plain word
              a first-time reader looks for. */}
          <ChartLink className="hidden text-muted transition-colors hover:text-accent sm:inline">
            Map
          </ChartLink>
          <Link
            href="/creatures"
            className="text-muted transition-colors hover:text-accent"
          >
            Bestiary
          </Link>
          <Link
            href="/contents"
            className="text-muted transition-colors hover:text-accent"
          >
            Index
          </Link>
          <Link
            href="/about"
            className="text-muted transition-colors hover:text-accent"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
