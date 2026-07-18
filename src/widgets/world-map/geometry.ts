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
export function pixelToLatLng({ x, y }: PixelPoint): [number, number] {
  return [WORLD_MAP.height - y, x];
}

/** Inverse of {@link pixelToLatLng}, rounded to whole image pixels. */
export function latLngToPixel(lat: number, lng: number): PixelPoint {
  return { x: Math.round(lng), y: Math.round(WORLD_MAP.height - lat) };
}

/* Grid calibration of the scan — the constants from the header comment. */
const PX_PER_LON_DEG = 9.63;
const REF_MERIDIAN = { lonDeg: -150, x: 1765 };
const EQUATOR_Y = 1715;
const MERCATOR_R = (PX_PER_LON_DEG * 180) / Math.PI;

/**
 * Image pixels → geographic degrees by the grid calibration (north- and
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
