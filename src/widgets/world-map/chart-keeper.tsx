"use client";

import { useMemo } from "react";
import { WorldMap } from "./index";
import { useChartStage } from "./stage";

/**
 * The keeper of the one long-lived map. Mounted in the root layout, before
 * the pages, so the sheet it holds paints under whatever page is above it;
 * the chart pages stage their sheet through stage.ts and this component
 * turns it toward the reader or away.
 *
 * Away is `visibility: hidden`, not unmounting and not display:none —
 * unmounting is the leaflet teardown whose freeze this whole arrangement
 * exists to avoid, and display:none collapses the container, which strands
 * leaflet's idea of its own size (a rotation read on a book page would
 * come back to a mis-laid sheet; visibility keeps the box in layout, so
 * leaflet's own resize listener keeps measuring truthfully). The price is
 * one laid-out, unpainted subtree under every page of the book.
 *
 * The host carries the raw `view-transition-name: chart-sheet` the same way
 * the masthead carries its own — a named element, not a React boundary; the
 * ChartStage boundary on the page is what starts the transitions. The name
 * comes OFF while the map is hidden: a hidden element is not captured, so
 * departure snapshots pair as exit (the dissolve), return as enter (the
 * sheet printing in over the resting leaf) — «Turning the leaves» in
 * globals.css keys on exactly those pairings. Since the map now outlives
 * its first visit, every return takes the polished chart-arriving path,
 * with the zoom and pan the reader left behind still standing.
 */
export function ChartKeeper() {
  const { current, held } = useChartStage();
  /* The element is rebuilt only when a page stages a sheet. Turning away
     merely restyles the host: with the same element in hand React leaves
     the widget's whole tree untouched, and re-rendering fifty markers'
     worth of leaflet bindings stays out of the departure's freeze. */
  const map = useMemo(
    () =>
      held ? (
        <WorldMap
          key={held.chart.id}
          chart={held.chart}
          locations={held.locations}
          legend={held.legend}
          focusEpoch={held.epoch}
        />
      ) : null,
    [held],
  );
  if (!held) return null;
  const active = current !== null;
  return (
    <div
      style={{ viewTransitionName: active ? "chart-sheet" : "none" }}
      className={`fixed inset-0${active ? "" : " invisible"}`}
      aria-hidden={!active}
    >
      {map}
    </div>
  );
}
