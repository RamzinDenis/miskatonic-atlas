"use client";

import { useEffect, useState } from "react";

/**
 * The chart opening: two rolls of paper part from the middle and run off the
 * edges, uncovering the sheet. Looks live in globals.css («Opening the chart»);
 * this only mounts them and takes them down again the moment the paper is
 * clear, so the finished animation leaves nothing standing over the map.
 *
 * The layer is inert (`pointer-events: none`): a reader who reaches for the
 * chart while it opens gets the chart, not the wrapping.
 */
export function ChartUnroll({ run, onDone }: { run: boolean; onDone: () => void }) {
  const [gone, setGone] = useState(false);

  /* One roll finishes a frame before the other; the layer goes when the last
     one is off, and unconditionally soon after — an animation that never
     fires (a tab woken in the background) must not leave the sheet covered.
     The same beat releases the marks' mask on the chart. */
  useEffect(() => {
    if (!run) return;
    const timer = setTimeout(() => {
      setGone(true);
      onDone();
    }, 1600);
    return () => clearTimeout(timer);
  }, [run, onDone]);

  if (!run || gone) return null;

  return (
    <div className="chart-unroll" aria-hidden="true">
      <div className="chart-unroll-roll chart-unroll-roll--left" />
      <div className="chart-unroll-roll chart-unroll-roll--right" />
    </div>
  );
}
