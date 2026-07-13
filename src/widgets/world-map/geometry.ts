/**
 * Basemap: Colton's "Map of the World on Mercator's Projection" (1852
 * pocket-map issue), Geographicus scan via Wikimedia Commons, public domain.
 * Downscaled to 4096×2950 as public/maps/world.jpg.
 *
 * Content stores map positions as pixels of that image (x right, y down
 * from the top-left corner), so points survive re-tinting of the basemap
 * but not re-cropping/re-scaling it.
 *
 * Grid calibration of the scan (used to place locations by coordinates
 * given in the stories; re-derive if world.jpg is ever regenerated):
 *   longitude — linear, 9.63 px/deg, reference meridian W150° at x = 1765
 *   latitude  — Mercator, equator at y = 1715, R = 9.63·180/π ≈ 551.7 px/rad
 *   y(φ) = 1715 − R·ln(tan(45° + φ/2)), φ north-positive
 * e.g. R'lyeh, canon "S. Latitude 47° 9', W. Longitude 126° 43'" → (1989, 2232).
 */
export const WORLD_MAP = {
  id: "world",
  url: "/maps/world.jpg",
  width: 4096,
  height: 2950,
} as const;

export interface PixelPoint {
  x: number;
  y: number;
}

/** A location as the map widget needs it — plain and serializable. */
export interface MapLocation extends PixelPoint {
  slug: string;
  name: string;
  type: string;
  summary: string;
}

/**
 * Image pixels → Leaflet CRS.Simple coordinates. The image overlay spans
 * [[0, 0], [height, width]], so "lat" grows upwards while y grows downwards.
 */
export function pixelToLatLng({ x, y }: PixelPoint): [number, number] {
  return [WORLD_MAP.height - y, x];
}

/** Inverse of {@link pixelToLatLng}, rounded to whole image pixels. */
export function latLngToPixel(lat: number, lng: number): PixelPoint {
  return { x: Math.round(lng), y: Math.round(WORLD_MAP.height - lat) };
}
