"use client";

import dynamic from "next/dynamic";
import type { MapLegendGroup, MapLocation } from "./geometry";

/**
 * Leaflet touches `window` at import time, so the real widget loads only in
 * the browser; `ssr: false` requires this wrapper to be a Client Component.
 */
const WorldMapClient = dynamic(() => import("./world-map-client"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-sm text-muted">
      Unrolling the chart…
    </div>
  ),
});

export type { MapLegendGroup, MapLocation };

export function WorldMap(props: {
  locations: MapLocation[];
  legend?: MapLegendGroup[];
  picker?: boolean;
}) {
  return <WorldMapClient {...props} />;
}
