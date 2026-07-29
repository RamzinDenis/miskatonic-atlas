"use client";

import dynamic from "next/dynamic";
import { useTurnSettled } from "./chart-boundary";
import type {
  AtlasMap,
  MapLegendGroup,
  MapLocation,
  UnplacedLocation,
} from "./geometry";
import { widgetIsEvaluated } from "./sheets";

/** The sheet's place while there is nothing to print on it yet: the page
    turn still playing above, or the widget's chunk still on the wire. */
const unrolling = (
  <div className="absolute inset-0 grid place-items-center text-sm text-muted">
    Unrolling the chart…
  </div>
);

/**
 * Leaflet touches `window` at import time, so the real widget loads only in
 * the browser; `ssr: false` requires this wrapper to be a Client Component.
 */
const WorldMapClient = dynamic(() => import("./world-map-client"), {
  ssr: false,
  loading: () => unrolling,
});

export type { AtlasMap, MapLegendGroup, MapLocation, UnplacedLocation };

export function WorldMap(props: {
  /** The chart to draw — an entry of the MAPS registry (shared/maps.ts). */
  chart: AtlasMap;
  locations: MapLocation[];
  legend?: MapLegendGroup[];
  picker?: boolean;
  /** Picker only: locations awaiting a spot on the chart. */
  unplaced?: UnplacedLocation[];
}) {
  /* Two mounts. A first coming waits out the page turn: not rendering the
     widget is what holds back its chunk, and the evaluation of leaflet is a
     main-thread burst the turn must not meet (ChartBoundary). A return —
     chunk already evaluated (sheets.ts) — mounts straight into the
     navigation's commit instead: the build lands in the freeze, where
     nothing is animating yet, and the paper is back under the dissolving
     leaf from its first frame rather than behind a loader the reader has
     no business seeing twice. */
  const settled = useTurnSettled();
  if (!settled && !widgetIsEvaluated()) return unrolling;
  return <WorldMapClient {...props} />;
}
