import { WORLD_MAP, type AtlasMap } from "@/shared/maps";

/**
 * Pixel geometry of the atlas' charts. The charts themselves — sizes, image
 * ladders, the registry — live in src/shared/maps.ts (pure data, shared with
 * Node-run scripts); this module holds the math and the widget-facing shapes.
 *
 * Content stores map positions as pixels of a chart's source image (x right,
 * y down from the top-left corner), so points survive re-tinting of a
 * basemap but not re-cropping/re-scaling it.
 */

export { MAPS, WORLD_MAP, chartPath, getAtlasMap } from "@/shared/maps";
export type { AtlasMap, MapSheet } from "@/shared/maps";

export interface PixelPoint {
  x: number;
  y: number;
}

/** A major character or creature to meet at a charted location. */
export interface MapFigure {
  slug: string;
  name: string;
  kind: "characters" | "creatures";
}

/** A location as the map widget needs it — plain and serializable. */
export interface MapLocation extends PixelPoint {
  slug: string;
  name: string;
  type: string;
  summary: string;
  figures: MapFigure[];
  /** Editorial weight — the picker toggles it; the public map is major-only. */
  prominence?: "major" | "minor";
}

/** A location still off the chart — the picker's placement queue. */
export interface UnplacedLocation {
  slug: string;
  name: string;
  type: string;
}

/** One story's section of the map legend panel. */
export interface MapLegendGroup {
  slug: string;
  title: string;
  year: number;
  locations: MapLocation[];
}

/**
 * Image pixels → Leaflet CRS.Simple coordinates. The image overlay spans
 * [[0, 0], [height, width]], so "lat" grows upwards while y grows downwards.
 */
export function pixelToLatLng(
  { x, y }: PixelPoint,
  map: AtlasMap = WORLD_MAP,
): [number, number] {
  return [map.height - y, x];
}

/** Inverse of {@link pixelToLatLng}, rounded to whole image pixels. */
export function latLngToPixel(
  lat: number,
  lng: number,
  map: AtlasMap = WORLD_MAP,
): PixelPoint {
  return { x: Math.round(lng), y: Math.round(map.height - lat) };
}

/*
 * Grid calibration of the world scan (used to place locations by coordinates
 * given in the stories; re-derive if world.jpg is ever regenerated):
 *   longitude — linear, 9.63 px/deg, reference meridian W150° at x = 1765
 *   latitude  — Mercator, equator at y = 1715, R = 9.63·180/π ≈ 551.7 px/rad
 *   y(φ) = 1715 − R·ln(tan(45° + φ/2)), φ north-positive
 * e.g. R'lyeh, canon "S. Latitude 47° 9', W. Longitude 126° 43'" → (1989, 2231).
 *
 * The world chart is the only calibrated one (AtlasMap.calibrated): fictional
 * geography has no degree grid, so callers gate every degree readout on it.
 */
const PX_PER_LON_DEG = 9.63;
const REF_MERIDIAN = { lonDeg: -150, x: 1765 };
const EQUATOR_Y = 1715;
const MERCATOR_R = (PX_PER_LON_DEG * 180) / Math.PI;

/**
 * World-chart pixels → geographic degrees by the grid calibration (north- and
 * east-positive). Longitude is wrapped to (−180°, 180°]: the scan runs past
 * the antimeridian on both edges.
 */
export function pixelToDegrees({ x, y }: PixelPoint): { lat: number; lon: number } {
  const rawLon = (x - REF_MERIDIAN.x) / PX_PER_LON_DEG + REF_MERIDIAN.lonDeg;
  const lon = ((((rawLon + 180) % 360) + 360) % 360) - 180;
  const lat =
    ((2 * Math.atan(Math.exp((EQUATOR_Y - y) / MERCATOR_R)) - Math.PI / 2) * 180) /
    Math.PI;
  return { lat, lon };
}

/** "47° 9′ S, 126° 43′ W" — the way the stories themselves give positions. */
export function formatDegrees(point: PixelPoint): string {
  const { lat, lon } = pixelToDegrees(point);
  const part = (value: number, positive: string, negative: string) => {
    let deg = Math.floor(Math.abs(value));
    let min = Math.round((Math.abs(value) - deg) * 60);
    if (min === 60) {
      deg += 1;
      min = 0;
    }
    return `${deg}° ${min}′ ${value >= 0 ? positive : negative}`;
  };
  return `${part(lat, "N", "S")}, ${part(lon, "E", "W")}`;
}
