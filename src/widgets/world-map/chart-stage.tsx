"use client";

import { useEffect, useLayoutEffect, useRef, ViewTransition } from "react";
import type { AtlasMap, MapLegendGroup, MapLocation } from "./geometry";
import { widgetIsEvaluated } from "./sheets";
import { clearStage, publishStage, setTurnSettled, useChartStage } from "./stage";

/**
 * A chart page's end of the keeper's wire (stage.ts): the page stages its
 * sheet on mount and withdraws it on unmount, and the keeper — mounted once
 * in the root layout — shows or hides the one long-lived map accordingly.
 * The map itself is therefore never torn down by a navigation, which is the
 * whole cure for the departure freeze: unmounting leaflet used to run inside
 * the view transition's capture, where WebKit holds every animation still,
 * and the reader watched the dead map hang. Now leaving flips a style.
 *
 * The component is also the page's <ViewTransition> boundary. Not the one
 * that carries the map's looks — the keeper's host div bears the raw
 * `view-transition-name: chart-sheet` (the masthead's own pattern), and all
 * of «Turning the leaves» in globals.css keys on that name — but the
 * boundary a transition needs to exist at all: a bare name only rides along
 * when some React boundary starts the transition, and between two charts
 * there is no other boundary.
 *
 * Root marks, set in the navigation's own commit (they must be on the root
 * before the transition computes its animations):
 *
 * - chart-arriving — a return to a living map. The arriving side carries
 *   the turn: the sheet rises over the resting leaf and prints itself in
 *   (globals.css), instead of the leaf half-dissolving over a drawn map.
 * - chart-leaving — the map's departure. Its dissolve hurries and the
 *   arriving quire drops its courtesy delay: nothing arrives inside the
 *   map's own pair, so every frame it lingers alone reads as a hang. An
 *   arriving chart cancels the mark in the same commit — chart to chart
 *   keeps its cross-fade — and a timer stands behind it, since no map-side
 *   component survives the departure to take it down.
 *
 * The turn-settled latch (stage.ts) holds the widget's FIRST mount back:
 * evaluating leaflet's chunk is a main-thread burst that must not land in
 * the middle of a turn. How the end of the turn is known, without guessing
 * at durations: React calls onEnter after the transition's animations are
 * set running, and calls the function onEnter returns when the transition
 * finishes. Two timers stand behind it: a turn that never comes (direct
 * load; popstate, whose animations React skips) never calls onEnter — the
 * grace timer opens the sheet; a turn that loses its `finished` must not
 * keep the sheet bare forever — the cap opens it regardless. Once the
 * chunk is evaluated the latch is moot: the keeper's map is already there.
 */

/* onEnter rides the passive-effect flush right after the turn's first frame;
   250ms of silence therefore means no turn is coming. */
const TURN_GRACE_MS = 250;

/* Covers the 340ms turn of globals.css with room for a slow capture. */
const TURN_CAP_MS = 1600;

/* How long the departure mark may outlive the page — enough for the turn
   to finish under the worst freeze, short enough not to colour a
   navigation that follows right after. */
const CHART_LEAVE_MS = 1200;

export function ChartStage({
  chart,
  locations,
  legend,
  children,
}: {
  chart: AtlasMap;
  locations: MapLocation[];
  legend?: MapLegendGroup[];
  children: React.ReactNode;
}) {
  const entered = useRef(false);

  useLayoutEffect(() => {
    document.documentElement.classList.remove("chart-leaving");
    if (widgetIsEvaluated()) {
      document.documentElement.classList.add("chart-arriving");
    } else {
      /* A cold coming: close the latch before the keeper hears about the
         sheet, or the chunk's evaluation lands in the turn. */
      setTurnSettled(false);
    }
    return () => {
      document.documentElement.classList.remove("chart-arriving");
      document.documentElement.classList.add("chart-leaving");
      setTimeout(
        () => document.documentElement.classList.remove("chart-leaving"),
        CHART_LEAVE_MS,
      );
    };
  }, []);

  /* Staged after the latch above (declaration order), withdrawn on leave.
     Re-published when the same page component turns to another sheet. */
  useLayoutEffect(() => {
    publishStage({ chart, locations, legend });
    return clearStage;
  }, [chart, locations, legend]);

  const { turnSettled } = useChartStage();
  useEffect(() => {
    if (turnSettled) document.documentElement.classList.remove("chart-arriving");
  }, [turnSettled]);

  useEffect(() => {
    const grace = setTimeout(() => {
      if (!entered.current) setTurnSettled(true);
    }, TURN_GRACE_MS);
    const cap = setTimeout(() => setTurnSettled(true), TURN_CAP_MS);
    return () => {
      clearTimeout(grace);
      clearTimeout(cap);
      /* A reader leaving mid-turn must not bequeath a closed latch to the
         picker or the next cold coming. */
      setTurnSettled(true);
      entered.current = false;
    };
  }, []);

  return (
    <ViewTransition
      name="chart-page"
      share="auto"
      enter="auto"
      exit="auto"
      default="none"
      onEnter={() => {
        entered.current = true;
        return () => setTurnSettled(true);
      }}
      /* Chart to chart is the one arrival that must not wait: the departing
         sheet dissolves over the arriving one, and a bare binding under
         that dissolve is a flash of the void. */
      onShare={() => {
        entered.current = true;
        setTurnSettled(true);
      }}
    >
      {children}
    </ViewTransition>
  );
}
