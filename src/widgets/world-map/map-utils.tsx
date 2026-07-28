import {
  type LatLng,
  type LatLngBoundsExpression,
  type LatLngExpression,
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
 * Where a focus flight can actually end. maxBounds shoves any centre that
 * would expose margin back inside — but only after the animation, on
 * moveend, so a beast drawn near the sheet edge got a smooth flight ending
 * in a jerk. Clamp the target with the same routine Leaflet corrects with
 * (private, but the only way the two computations can't drift apart), so
 * the flight lands exactly where the map would have settled.
 */
export function focusCenter(
  map: LeafletMap,
  target: LatLngExpression,
  zoom: number,
): LatLng {
  const limiting = map as unknown as {
    _limitCenter(
      center: LatLngExpression,
      zoom: number,
      bounds?: LatLngBoundsExpression,
    ): LatLng;
  };
  return limiting._limitCenter(target, zoom, map.options.maxBounds);
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

/** How much closer the opening gesture starts, and how long it pulls back. */
const OPENING_LIFT = 0.75;
const OPENING_SECONDS = 1.8;

/**
 * Whether this visit gets the chart's opening at all — the unrolling and the
 * camera's draw-back alike. Motion stays away where it would be wrong or
 * unwelcome: a `?focus=` deep link has its own place to land and must not be
 * overruled, and a reduced-motion setting means what it says. The caller adds
 * the rest of the test — the frontispiece only, and only on a cold sheet
 * (see `startedWarm`), since greeting a reader on every return from a
 * location page turns a greeting into a tic.
 *
 * Touches `window`, so call it from an effect or a lazy initialiser.
 */
export function greetingAllowed(): boolean {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !new URLSearchParams(window.location.search).get("focus")
  );
}

/**
 * The opening gesture of the front chart: the sheet prints a little closer
 * than it rests, then draws back to its resting frame while the wrapping
 * rolls off it. A reader who has just arrived learns in under two seconds
 * that the chart is a thing that moves — that it can be pushed, pulled and
 * opened — without being told so in words.
 *
 * It yields to the reader immediately: the first press, touch, wheel or key
 * stops the flight where it stands, and a reader who took hold of the sheet
 * before the paper finished printing never sees it at all.
 */
export function OpeningGesture({ run }: { run: boolean }) {
  const map = useMap();
  const played = useRef(false);
  const seized = useRef(false);

  useEffect(() => {
    const container = map.getContainer();
    const seize = () => {
      seized.current = true;
      map.stop();
    };
    const events = ["mousedown", "touchstart", "wheel", "keydown"] as const;
    for (const event of events) {
      container.addEventListener(event, seize, { passive: true });
    }
    return () => {
      for (const event of events) container.removeEventListener(event, seize);
    };
  }, [map]);

  useEffect(() => {
    if (!run || played.current || seized.current) return;
    played.current = true;

    const rest = map.getZoom();
    const start = Math.min(rest + OPENING_LIFT, map.getMaxZoom());
    if (start <= rest) return;

    map.setZoom(start, { animate: false });
    map.flyTo(map.getCenter(), rest, { duration: OPENING_SECONDS });
  }, [map, run]);

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
