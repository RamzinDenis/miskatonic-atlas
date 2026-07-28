"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/**
 * The turning boundary of a leaf. It has to be keyed by route, and that is
 * the whole reason this component exists: the boundary retires with the old
 * leaf and mounts with the new one, and the layout that holds it does
 * neither — the layout stays put and only its children change.
 *
 * The boundary is *named*, and the turn's CSS is written against that name
 * («Turning the leaves» in globals.css), not against transition types or
 * classes — both of those roads are closed for now:
 *
 * - `transitionTypes` declared on links never reach the commit that swaps
 *   the page: Next loses them on the way (vercel/next.js#88386), every
 *   typed activation resolves to its `default`, and a boundary whose every
 *   activation is "none" makes React cancel the whole transition — root
 *   snapshots included. Nothing animates, silently.
 * - Class activations (`enter="turn"` + `::view-transition-new(.turn)`) do
 *   fire, but Tailwind's build (LightningCSS) silently drops
 *   view-transition pseudo-selectors with a *class* argument, so the
 *   animation falls back to the browser's default cross-fade.
 *
 * Name arguments survive the build (site-header and chart-sheet lean on
 * them already), and a keyed remount of a named boundary is the documented
 * same-route pattern (docs/01-app/02-guides/view-transitions.md, step 4).
 * The links keep declaring their direction (transitions.ts); the day Next
 * delivers the types, enter/exit can map them again without touching CSS.
 *
 * A Client Component only for `usePathname`; the leaves themselves stay
 * server-rendered and are handed through as children.
 */
export function LeafTurn({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition
      key={pathname}
      name="leaf"
      share="auto"
      enter="auto"
      exit="auto"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
