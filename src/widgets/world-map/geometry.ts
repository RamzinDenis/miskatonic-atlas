import type { AtlasMap } from "@/shared/maps";

/**
 * Pixel geometry of the atlas' charts. The charts themselves — sizes, image
 * ladders, the registry — live in src/shared/maps.ts (pure data, shared with
 * Node-run scripts); this module holds the math and the widget-facing shapes.
 *
 * Content stores map positions as pixels of a chart's source image (x right,
 * y down from the top-left corner), so points survive re-tinting of a
 * basemap but not re-cropping/re-scaling it.
 */

export { MAPS, chartPath, getAtlasMap } from "@/shared/maps";
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
  /** Page of the location: its own route, or its section of the parent's
      page for a sub-location (ADR-0003 — children have no routes). */
  href: string;
  name: string;
  type: string;
  summary: string;
  figures: MapFigure[];
  /** Editorial weight — the picker toggles it; the public map is major-only. */
  prominence?: "major" | "minor";
  /** Log-book line lettered under an annotation's name (schemas.ts MapPoint). */
  sublabel?: string;
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
  map: AtlasMap,
): [number, number] {
  return [map.height - y, x];
}

/** Inverse of {@link pixelToLatLng}, rounded to whole image pixels. */
export function latLngToPixel(
  lat: number,
  lng: number,
  map: AtlasMap,
): PixelPoint {
  return { x: Math.round(lng), y: Math.round(map.height - lat) };
}
