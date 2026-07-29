"use client";

import { useSyncExternalStore } from "react";
import type { AtlasMap, MapLegendGroup, MapLocation } from "./geometry";

/**
 * The wire between the chart pages and the keeper. A chart page no longer
 * renders the map: leaving a page unmounts everything it rendered, and
 * unmounting leaflet in the navigation's commit is the freeze WebKit shows
 * as the map hanging on screen (the whole teardown runs inside the view
 * transition's capture, where even accelerated animations stand still). So
 * the map lives with the keeper in the root layout — mounted once, never
 * torn down by a navigation — and the page merely *stages* its sheet here:
 * publishes which chart to show on mount, withdraws it on unmount.
 *
 * Module state rather than context, because the two ends of the wire hang
 * from different branches of the tree: the keeper stands in the root layout,
 * the stage directions come from whatever page is passing through it.
 */

export type ChartStage = {
  chart: AtlasMap;
  locations: MapLocation[];
  legend?: MapLegendGroup[];
  /** Bumped on every publication: the widget outlives the visit, so
      per-visit errands (the ?focus= deep link) key off this, not off
      mounting. */
  epoch: number;
};

type StageState = {
  /** The sheet a chart page is presenting right now, if any. */
  current: ChartStage | null;
  /** The last sheet presented — what the keeper keeps alive while the
      reader is elsewhere in the book. */
  held: ChartStage | null;
  /** True once no page turn is playing over the chart (ChartStage). */
  turnSettled: boolean;
};

const INITIAL: StageState = { current: null, held: null, turnSettled: true };

let state = INITIAL;
let epochCounter = 0;
const listeners = new Set<() => void>();

function emit(next: StageState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function publishStage(stage: Omit<ChartStage, "epoch">): void {
  epochCounter += 1;
  const staged = { ...stage, epoch: epochCounter };
  emit({ ...state, current: staged, held: staged });
}

export function clearStage(): void {
  emit({ ...state, current: null });
}

export function setTurnSettled(turnSettled: boolean): void {
  if (state.turnSettled !== turnSettled) emit({ ...state, turnSettled });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useChartStage(): StageState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}
