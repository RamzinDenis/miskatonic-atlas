"use client";

import type { LatLngBoundsExpression } from "leaflet";
import { useCallback, useRef, useState } from "react";
import { ImageOverlay, useMap, useMapEvents } from "react-leaflet";
import type { AtlasMap, MapSheet } from "./geometry";

/**
 * Past 2× the screen has more pixels than the eye has receptors for a
 * photograph of paper, and the rungs double — so a third rung of density
 * would cost a step of the ladder for nothing.
 */
const MAX_DENSITY = 2;

/**
 * An overview never pulls the full scan, even where the density would
 * justify it: the reader has asked to see the whole chart, which is the one
 * view where detail is invisible by definition. It arrives on the first
 * close-up instead.
 */
const OVERVIEW_CEILING = 2048;

/** The smallest copy that still has a pixel for every pixel on screen. */
function pickSheet(chart: AtlasMap, zoom: number, ceiling = Infinity): MapSheet {
  const density = Math.min(window.devicePixelRatio || 1, MAX_DENSITY);
  const needed = chart.width * 2 ** zoom * density;
  const usable = chart.sheets.filter((sheet) => sheet.width <= ceiling);
  return (
    usable.find((sheet) => sheet.width >= needed) ?? usable[usable.length - 1]
  );
}

/**
 * Copies the browser has already pulled in this session. Leaving the chart
 * for a location page tears the whole widget down, and coming back builds
 * it from nothing — without this the reader watches the ladder replay from
 * the thumb up over a copy that is already in the cache.
 */
const fetched = new Set<string>();

/** The best copy already in hand for an overview of this chart, if any. */
function warmSheet(chart: AtlasMap): MapSheet | undefined {
  return chart.sheets.filter(
    (sheet) => sheet.width <= OVERVIEW_CEILING && fetched.has(sheet.url),
  ).pop();
}

/**
 * Whether the chart can be printed whole on the first frame — read by the
 * widget so a return visit skips the fade the first visit needs.
 */
export function chartIsWarm(chart: AtlasMap): boolean {
  return warmSheet(chart) !== undefined;
}

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
    </>
  );
}
