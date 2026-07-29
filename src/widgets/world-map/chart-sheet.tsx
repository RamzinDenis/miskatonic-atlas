"use client";

import type { LatLngBoundsExpression } from "leaflet";
import { useCallback, useRef, useState } from "react";
import { ImageOverlay, useMap, useMapEvents } from "react-leaflet";
import type { AtlasMap } from "./geometry";
import { OVERVIEW_CEILING, fetched, pickSheet, warmSheet } from "./sheets";

/**
 * The chart itself: one bitmap, swapped for a larger copy when a close-up
 * outgrows it. The swap waits on the browser having the new copy decoded,
 * so the sheet is replaced in a single frame rather than blanking; and it
 * only ever goes up, since stepping back down would be a visible loss of
 * detail bought with another download.
 */
export function ChartSheet({
  chart,
  bounds,
  onReady,
}: {
  chart: AtlasMap;
  bounds: LatLngBoundsExpression;
  onReady: () => void;
}) {
  const map = useMap();
  const [sheet, setSheet] = useState(() => {
    const wanted = pickSheet(chart, map.getZoom(), OVERVIEW_CEILING);
    const warm = warmSheet(chart);
    // A copy already fetched costs nothing to show and is never coarser
    // than the rung this view asks for.
    return warm && warm.width > wanted.width ? warm : wanted;
  });
  const shown = useRef(sheet);
  const fetching = useRef<string | null>(null);

  const considerUpgrade = useCallback(
    (zoom: number) => {
      const wanted = pickSheet(chart, zoom);
      if (wanted.width <= shown.current.width) return;
      if (fetching.current === wanted.url) return;
      fetching.current = wanted.url;
      const copy = new Image();
      copy.onload = () => {
        fetched.add(wanted.url);
        shown.current = wanted;
        setSheet(wanted);
      };
      copy.src = wanted.url;
    },
    [chart],
  );

  const handleLoad = useCallback(() => {
    fetched.add(shown.current.url);
    onReady();
  }, [onReady]);

  useMapEvents({
    zoomend() {
      considerUpgrade(map.getZoom());
    },
  });

  /* "art" sheets arrive already aged — the scan tint would drown them. */
  const toneClass = `atlas-scan${chart.tone === "art" ? " atlas-scan--art" : ""}`;

  return (
    <>
      {/* The thumb below: the paper is there from the first frame, and a
          copy still in flight has aged paper under it, not the binding. */}
      <ImageOverlay
        url={chart.lqipUrl}
        bounds={bounds}
        className={toneClass}
        zIndex={0}
      />
      <ImageOverlay
        url={sheet.url}
        bounds={bounds}
        className={toneClass}
        zIndex={1}
        eventHandlers={{ load: handleLoad }}
      />
      {/* The sheet's biography (scripts/generate-map-wear.mjs): folds,
          grimed rim, damp, foxing — multiplied over the paper. On the
          sheet's own bounds, so the wear rides pan and zoom with it and
          the binding around stays clean; pins live in the marker pane,
          well above it. */}
      <ImageOverlay
        url="/paper/map-wear.webp"
        bounds={bounds}
        className="atlas-wear"
        zIndex={2}
      />
    </>
  );
}
