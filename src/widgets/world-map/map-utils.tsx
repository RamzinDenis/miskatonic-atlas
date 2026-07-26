import {
  type LatLngBoundsExpression,
  type Map as LeafletMap,
} from "leaflet";
import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import {
  latLngToPixel,
  pixelToLatLng,
  type AtlasMap,
  type MapLocation,
  type PixelPoint,
} from "./geometry";

/** Zoom the legend flies to — close enough to read the chart around a pin. */
export const FOCUS_ZOOM = -0.5;

/**
 * Feature lettering is printed, but an overview sheet with every name set
 * at once is noise: names fade in from this zoom on (hover and selection
 * always show one). The legend keeps the full list at any zoom.
 */
export const LABEL_MIN_ZOOM = -1;

/**
 * Panning must stay within the chart: zooming out stops at "whole map
 * visible", so the image can never float loose inside the viewport. A
 * portrait phone letterboxes the wide sheet into a strip at that fit —
 * below the lettering threshold, with the marginalia beasts towering over
 * the shrunken country — so there the floor is "viewport filled" instead:
 * the sheet always covers the screen and its edges are reached by panning.
 */
function applyFitZoomLimit(map: LeafletMap, bounds: LatLngBoundsExpression) {
  const cover = !window.matchMedia("(min-width: 640px)").matches;
  const fitZoom = map.getBoundsZoom(bounds, cover);
  map.setMinZoom(fitZoom);
  if (map.getZoom() < fitZoom) map.setZoom(fitZoom);
}

export function FitZoomLimit({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMapEvents({
    resize() {
      applyFitZoomLimit(map, bounds);
    },
  });
  useEffect(() => {
    applyFitZoomLimit(map, bounds);
  }, [map, bounds]);
  return null;
}

export function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoom(map.getZoom());
    },
  });
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  return null;
}

/**
 * Deep link from entity pages: /?focus=slug lands the chart on that pin.
 * Read client-side (and inside the map, where the instance is guaranteed),
 * so the page itself stays fully static.
 */
export function DeepLinkFocus({
  chart,
  locations,
  onSelect,
}: {
  chart: AtlasMap;
  locations: MapLocation[];
  onSelect: (location: MapLocation) => void;
}) {
  const map = useMap();
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const slug = new URLSearchParams(window.location.search).get("focus");
    const target = slug ? locations.find((l) => l.slug === slug) : undefined;
    if (!target) return;
    onSelect(target);
    map.setView(
      pixelToLatLng(target, chart),
      Math.max(map.getZoom(), FOCUS_ZOOM),
      { animate: false },
    );
  }, [map, chart, locations, onSelect]);
  return null;
}

/** Clicks on empty map: close the preview panel, or pick coordinates. */
export function MapClicks({
  chart,
  onClick,
}: {
  chart: AtlasMap;
  onClick: (point: PixelPoint) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(latLngToPixel(e.latlng.lat, e.latlng.lng, chart));
    },
  });
  return null;
}
