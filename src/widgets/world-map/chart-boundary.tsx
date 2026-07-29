"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { widgetIsEvaluated } from "./sheets";

/**
 * The chart-sheet boundary of a chart page, plus the fact it publishes: has
 * the page turn above the chart finished yet.
 *
 * The boundary itself is the frontispiece's story — a real <ViewTransition>
 * named like every other sheet, so departing and arriving charts pair up and
 * the looks in globals.css apply. What this component adds is *when the
 * widget below may start building*: leaflet raises hundreds of nodes in one
 * burst, and WebKit holds even accelerated animations still while the render
 * tree is rebuilt — a burst in the middle of the turn is the hang where the
 * old leaf stops half-dissolved. So on the widget's first coming the sheet
 * stays bare until the turn is over, and the widget (which waits on
 * useTurnSettled) mounts onto a screen where nothing is moving. A return is
 * different — the chunk is already evaluated, the build is cheap enough for
 * the commit's freeze, and the wrapper mounts it at once (index.tsx).
 *
 * How the end of the turn is known, without guessing at durations:
 * React calls onEnter after the transition's animations are set running, and
 * calls the function onEnter returns when the transition finishes — the
 * cleanup rides `finished` (react-dom: commitPassiveMountEffects →
 * `committedViewTransition.finished.finally(cleanup)`). Two timers stand
 * behind it:
 *
 * - a turn that never comes (direct load; popstate, whose animations React
 *   skips) never calls onEnter — the grace timer opens the sheet;
 * - a turn that loses its `finished` (interrupted mid-flight, tab hidden)
 *   must not leave the sheet bare forever — the cap opens it regardless.
 */

const TurnSettled = createContext(true);

/**
 * True once no page turn is playing over the chart. Defaults to true so the
 * widget mounts at once wherever it renders without a ChartBoundary (the
 * dev-only coords picker).
 */
export function useTurnSettled(): boolean {
  return useContext(TurnSettled);
}

/* onEnter rides the passive-effect flush right after the turn's first frame;
   250ms of silence therefore means no turn is coming. Misread only by a
   phone whose capture outlasts the grace — which mounts the widget into the
   turn, exactly what happened on every arrival before this boundary. */
const TURN_GRACE_MS = 250;

/* Covers the 340ms turn of globals.css with room for a slow capture. */
const TURN_CAP_MS = 1600;

/* How long the departure mark may outlive the boundary — enough for the
   turn to finish under the worst freeze, short enough not to colour a
   navigation that follows right after. */
const CHART_LEAVE_MS = 1200;

export function ChartBoundary({ children }: { children: React.ReactNode }) {
  const [settled, setSettled] = useState(false);
  const entered = useRef(false);

  /* A returning chart prints under the turn from its first frame
     (index.tsx), which frees the arriving side to carry the animation: the
     root is marked so globals.css can raise the incoming sheet over the
     resting leaf and print it in, instead of dissolving the leaf over the
     map. Marked in the navigation's own commit (layout effect — it must be
     on the root before the transition computes its animations), taken down
     once the turn is over, and on unmount — a reader leaving mid-turn must
     not bequeath the mark to the next turn's styles. */
  useLayoutEffect(() => {
    /* A chart arriving right after another left (Regions, chart to chart)
       cancels the departure mark in the same commit — the two sheets keep
       their cross-fade; the quickened exit below is for leaving the atlas
       for the book, where nothing map-shaped arrives. */
    document.documentElement.classList.remove("chart-leaving");
    if (widgetIsEvaluated()) {
      document.documentElement.classList.add("chart-arriving");
    }
    return () => {
      document.documentElement.classList.remove("chart-arriving");
      /* The departing chart marks the root in the navigation's own commit
         (unmount cleanups run before the transition computes animations),
         so globals.css can hurry the map's dissolve and lift the arriving
         quire's delay: inside the chart's own pair nothing arrives under
         it, and every frame the map lingers alone reads as a hang — the
         teardown of leaflet's nodes freezes WebKit long enough already.
         Nobody map-side is left mounted to take the mark down, so a timer
         does, safely past the 340ms turn even if a slow commit delays it. */
      document.documentElement.classList.add("chart-leaving");
      setTimeout(
        () => document.documentElement.classList.remove("chart-leaving"),
        CHART_LEAVE_MS,
      );
    };
  }, []);
  useEffect(() => {
    if (settled) document.documentElement.classList.remove("chart-arriving");
  }, [settled]);

  useEffect(() => {
    const grace = setTimeout(() => {
      if (!entered.current) setSettled(true);
    }, TURN_GRACE_MS);
    const cap = setTimeout(() => setSettled(true), TURN_CAP_MS);
    return () => {
      clearTimeout(grace);
      clearTimeout(cap);
    };
  }, []);

  return (
    <ViewTransition
      name="chart-sheet"
      share="auto"
      enter="auto"
      exit="auto"
      default="none"
      onEnter={() => {
        entered.current = true;
        return () => setSettled(true);
      }}
      /* Chart to chart is the one arrival that must not wait: the departing
         sheet dissolves over the arriving one (Regions, warmed on hover),
         and a bare binding under that dissolve is a flash of the void. */
      onShare={() => {
        entered.current = true;
        setSettled(true);
      }}
    >
      <TurnSettled.Provider value={settled}>{children}</TurnSettled.Provider>
    </ViewTransition>
  );
}
