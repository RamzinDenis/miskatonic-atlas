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

/**
 * Zoom a focus lands at: the sheet just covering the frame — the first zoom
 * at which the pin can actually stand at the centre. Any farther out the
 * whole sheet fits the viewport and maxBounds pins the view in place, so a
 * fixed focus constant quietly stopped moving the map on desktop viewports.
 * getBoundsZoom is clamped by the chart's own close-up ceiling (maxZoom),
 * and a reader already zoomed closer stays where they are.
 */
export function focusZoom(map: LeafletMap, chart: AtlasMap): number {
  const bounds: LatLngBoundsExpression = [
    [0, 0],
    [chart.height, chart.width],
  ];
  return Math.max(map.getZoom(), map.getBoundsZoom(bounds, true));
}

/**
 * Feature lettering is printed, but an overview sheet with every name set
 * at once is noise: names fade in from this zoom on (hover and selection
 * always show one). The legend keeps the full list at any zoom.
 */
export const LABEL_MIN_ZOOM = -1;

/**
 * Panning must stay within the chart: zooming out stops at "whole map
 * visible", so the image can never float loose inside the viewport — on
 * every device, so a phone can still pinch out to the full sheet.
 */
function applyFitZoomLimit(map: LeafletMap, bounds: LatLngBoundsExpression) {
  const fitZoom = map.getBoundsZoom(bounds, false);
  map.setMinZoom(fitZoom);
  if (map.getZoom() < fitZoom) map.setZoom(fitZoom);
}

export function FitZoomLimit({ bounds }: { bounds: LatLngBoundsExpression }) {
  const covered = useRef(false);
  const map = useMapEvents({
    resize() {
      applyFitZoomLimit(map, bounds);
    },
  });
  useEffect(() => {
    applyFitZoomLimit(map, bounds);
    /* A portrait phone letterboxes the wide sheet into a strip at the fit
       zoom — below the lettering threshold, with the marginalia beasts
       towering over the shrunken country. So a phone OPENS at "viewport
       filled" instead (once, not on every resize): the sheet covers the
       screen and the lettering is up, while zooming out to the whole
       sheet stays available. Runs before DeepLinkFocus mounts, so a
       /?focus= link still lands on its pin. */
    if (!covered.current) {
      covered.current = true;
      if (!window.matchMedia("(min-width: 640px)").matches) {
        map.setZoom(map.getBoundsZoom(bounds, true), { animate: false });
      }
    }
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
    map.setView(pixelToLatLng(target, chart), focusZoom(map, chart), {
      animate: false,
    });
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
