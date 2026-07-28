"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";
import { TURN } from "./transitions";

/**
 * The turning boundary of a leaf. It has to be keyed by route, and that is
 * the whole reason this component exists: `enter` and `exit` fire when the
 * boundary mounts and unmounts, and the layout that holds it does neither
 * when the reader moves between two leaves of the same section — the layout
 * stays put and only its children change. Keying by pathname retires the old
 * boundary and mounts a new one, which is what the animation needs.
 *
 * A Client Component only for `usePathname`; the leaves themselves stay
 * server-rendered and are handed through as children.
 */
export function LeafTurn({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter={TURN} exit={TURN} default="none">
      {children}
    </ViewTransition>
  );
}
