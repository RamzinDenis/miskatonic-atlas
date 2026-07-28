import Link from "next/link";
import { ChartLink } from "@/widgets/world-map/chart-link";

/**
 * The atlas masthead. Inner pages render it as a normal document header;
 * the map page floats it as a thin strip over the full-bleed chart.
 */
export function SiteHeader({ floating = false }: { floating?: boolean }) {
  return (
    <header
      className={
        floating
          ? "site-header-floating absolute inset-x-0 top-0 z-[1100]"
          : "border-b border-line"
      }
    >
      <div
        className={`flex w-full items-baseline justify-between gap-4 px-4 sm:px-6 ${
          floating ? "py-3" : "py-4"
        }`}
      >
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
