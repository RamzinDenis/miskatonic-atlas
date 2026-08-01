"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLink } from "@/widgets/world-map/chart-link";

/**
 * The masthead's nav, aware of where the reader stands: the current
 * section's word sits in the annotator's vermilion — the same voice the
 * regions cartouche uses for the sheet in hand — so the strip answers
 * "where am I" at a glance instead of only "where can I go". Client-side
 * for the pathname; the masthead around it stays a server strip.
 *
 * Only the four section words are marked. A story or a location leaf
 * belongs to no section of the strip — the reader got there through the
 * chart or the index, and lighting Index for them would claim a lineage
 * the visit may not have.
 */
const leafWord = (active: boolean) =>
  `${active ? "text-accent" : "text-muted"} transition-colors hover:text-accent`;

export function MastheadNav() {
  const pathname = usePathname();
  const onChart = pathname === "/" || pathname.startsWith("/maps");
  const section = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);
  return (
    <nav className="flex gap-3 text-xs uppercase tracking-widest sm:gap-6">
      {/* The masthead itself opens the chart, so the phone drops the
          duplicate item; on wide screens Map stays as the plain word
          a first-time reader looks for. */}
      <ChartLink
        aria-current={onChart ? "page" : undefined}
        className={`hidden sm:inline ${leafWord(onChart)}`}
      >
        Map
      </ChartLink>
      <Link
        href="/creatures"
        aria-current={section("/creatures") ? "page" : undefined}
        className={leafWord(section("/creatures"))}
      >
        Bestiary
      </Link>
      <Link
        href="/contents"
        aria-current={section("/contents") ? "page" : undefined}
        className={leafWord(section("/contents"))}
      >
        Index
      </Link>
      <Link
        href="/about"
        aria-current={section("/about") ? "page" : undefined}
        className={leafWord(section("/about"))}
      >
        About
      </Link>
    </nav>
  );
}
