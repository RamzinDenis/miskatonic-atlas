"use client";

import { useEffect, useMemo, useState } from "react";
import { WorldMap } from "./index";
import { useChartStage } from "./stage";

/**
 * The keeper of the one long-lived map. Mounted in the root layout, before
 * the pages, so the sheet it holds paints under whatever page is above it;
 * the chart pages stage their sheet through stage.ts and this component
 * turns it toward the reader or away.
 *
 * Away is `visibility: hidden` first — never unmounting, which is the
 * leaflet teardown whose freeze this whole arrangement exists to avoid —
 * and, once the turn is well over, `display: none`: a merely invisible map
 * still holds its full compositing bill (two full-bleed sheet rasters, the
 * marker forest, the svg pane), and carrying that under a heavy page like
 * /creatures is what got the tab jettisoned on the phone. The old objection
 * to display:none — it collapses the container and strands leaflet's idea
 * of its own size — is answered on waking: the widget re-measures with
 * invalidateSize before any per-visit errand lays the sheet out (the
 * `dormant` prop). Waking is render-phase, so the map is displayed again
 * in the very commit that turns it toward the reader.
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

/* Longer than the departure turn and its stragglers (TURN_CAP_MS 1600,
   CHART_LEAVE_MS 1200), so the sheet never blinks out mid-dissolve and a
   quick bounce back never meets a dormant map. */
const DORMANT_AFTER_MS = 3000;

export function ChartKeeper() {
  const { current, held } = useChartStage();
  const active = current !== null;
  const [dormant, setDormant] = useState(false);
  /* Waking must not wait for an effect: the activation's own commit flips
     the display back on, or the enter transition would capture nothing. */
  if (active && dormant) setDormant(false);
  useEffect(() => {
    if (active) return;
    const timer = setTimeout(() => setDormant(true), DORMANT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [active]);
  /* Unkeyed on purpose: switching regions re-renders the ONE live widget —
     the sheet swaps under the map, the marks diff — instead of tearing
     leaflet down and rebuilding it inside the navigation's commit. That
     burst, under the view transition's capture and at two maps' worth of
     memory, is what froze and jettisoned WebKit on the phone. Turning away
     doesn't even re-render: with the same element in hand React leaves the
     widget's whole tree untouched, and re-rendering fifty markers' worth
     of leaflet bindings stays out of the departure's freeze. */
  const map = useMemo(
    () =>
      held ? (
        <WorldMap
          chart={held.chart}
          locations={held.locations}
          legend={held.legend}
          focusEpoch={held.epoch}
          dormant={dormant && !active}
        />
      ) : null,
    [held, dormant, active],
  );
  if (!held) return null;
  return (
    <div
      style={{ viewTransitionName: active ? "chart-sheet" : "none" }}
      className={`fixed inset-0${active ? "" : " invisible"}${dormant && !active ? " hidden" : ""}`}
      aria-hidden={!active}
    >
      {map}
    </div>
  );
}
