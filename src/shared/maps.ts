/**
 * The atlas' charts. Every basemap the site can draw lives in this registry;
 * a location's `map.mapId` must name an entry here (enforced by content
 * integrity). Pure data on purpose: content.ts imports this module and is
 * itself run under plain Node by scripts/validate.mts, so nothing framework-
 * or browser-bound belongs in this file.
 *
 * Adding a chart (see docs/regional-map.md): drop the full-size source into
 * public/maps/, run `node scripts/build-map-images.mjs` for the resolution
 * ladder and thumb, and register the entry below — routes, the picker, the
 * insets and content validation all read this registry.
 */

export interface MapSheet {
  width: number;
  url: string;
}

export interface AtlasMap {
  id: string;
  /** Display name, as a chart heading: "The World". */
  title: string;
  /** The full-size source everything below is cut from, never served whole. */
  url: string;
  /** Ageing sheet multiplied over the scan; omit for a copy without one. */
  wearUrl?: string;
  /** A 128px thumb of the sheet, under it until a real copy arrives. */
  lqipUrl: string;
  /** Quarter-size copy for the static insets on content pages. */
  insetUrl: string;
  width: number;
  height: number;
  /** Resolution ladder, smallest first (scripts/build-map-images.mjs). */
  sheets: readonly MapSheet[];
  /**
   * True when the sheet has a real degree grid (see the calibration in
   * src/widgets/world-map/geometry.ts). Fictional geography has no degrees
   * to print, so uncalibrated charts show no coordinates anywhere.
   */
  calibrated?: boolean;
  /**
   * Leaflet zoom ceiling; default 1 (2× the source pixels). A chart whose
   * source is small holds a lower ceiling so a close-up never turns to blur.
   */
  maxZoom?: number;
  /**
   * How the site tones the sheet (globals.css). The default "scan" tint was
   * calibrated for the pale Colton scan; generated artwork arrives already
   * aged, so "art" applies only a light harmonizing touch — the full scan
   * tint would drown its hand-tinted color.
   */
  tone?: "scan" | "art";
  /**
   * Which placed locations get a public pin. The default "top-level" hides
   * sub-locations (ADR-0003): on a world chart a landmark inside a town is
   * noise. A close-up regional sheet is the opposite — its whole point is
   * the landmarks — so it declares "all" and pins children too.
   */
  pins?: "top-level" | "all";
  /**
   * How a location is marked. "vignette" (default) — the engraved glyph on
   * a paper clearing, made for the scan whose etching is background. On a
   * generated close-up the artwork itself draws the places, and a badge
   * would bury exactly what it points at — "annotation" instead circles
   * the feature in the margin-annotator's ink and letters the name beside.
   */
  markerStyle?: "vignette" | "annotation";
  attribution?: { label: string; href: string };
}

/** True when the chart pins sub-locations too (pins: "all"). */
export function chartShowsChildren(mapId: string): boolean {
  return MAPS[mapId]?.pins === "all";
}

/**
 * Basemap: Colton's "Map of the World on Mercator's Projection" (1852
 * pocket-map issue), Geographicus scan via Wikimedia Commons, public domain.
 * Downscaled to 4096×2950 as public/maps/world.jpg.
 *
 * Content stores map positions as pixels of the chart's source image
 * (x right, y down from the top-left corner), so points survive re-tinting
 * of a basemap but not re-cropping/re-scaling it.
 */
export const WORLD_MAP: AtlasMap = {
  id: "world",
  title: "The World",
  url: "/maps/world.jpg",
  wearUrl: "/maps/world-wear.webp",
  lqipUrl: "/maps/world-lqip.webp",
  insetUrl: "/maps/world-1024.webp",
  width: 4096,
  height: 2950,
  sheets: [
    { width: 1024, url: "/maps/world-1024.webp" },
    { width: 2048, url: "/maps/world-2048.webp" },
    { width: 4096, url: "/maps/world.jpg" },
  ],
  calibrated: true,
  attribution: {
    label: "Basemap: Colton, 1852 — Wikimedia Commons, public domain",
    href: "https://commons.wikimedia.org/wiki/File:1852_Colton%27s_Map_of_the_World_on_Mercator%27s_Projection_(_Pocket_Map_)_-_Geographicus_-_World-colton-1852.jpg",
  },
};

export const MAPS: Record<string, AtlasMap> = {
  world: WORLD_MAP,
  /**
   * The regional chart of fictional New England (docs/regional-map.md):
   * an editor-generated bird's-eye engraving, drawn strictly after the
   * corpus' own geography — no degree grid, so not `calibrated`. The png
   * is the cutting source (kept in the repo, never served); the ladder is
   * all webp. Replacing the source with a larger original before any pins
   * are placed is free — after, it is a coordinate migration (ADR-0002).
   */
  "new-england": {
    id: "new-england",
    title: "The Miskatonic Country",
    url: "/maps/new-england-1448.webp",
    lqipUrl: "/maps/new-england-lqip.webp",
    insetUrl: "/maps/new-england-1024.webp",
    width: 1448,
    height: 1086,
    sheets: [
      { width: 1024, url: "/maps/new-england-1024.webp" },
      { width: 1448, url: "/maps/new-england-1448.webp" },
    ],
    // ~1450px is ChatGPT's native output ceiling — cap the close-up at
    // ×1.4 so the engraving never dissolves into upscale blur.
    maxZoom: 0.5,
    tone: "art",
    // A close-up sheet lives on its landmarks: sub-locations pin publicly.
    pins: "all",
    markerStyle: "annotation",
  },
  /**
   * The sea sheet of the southern theatre (docs/pacific-map.md, ADR-0004):
   * generated open-ocean chart drawn strictly after "The Call of Cthulhu"
   * and "Dagon". The sheet is uncalibrated — R'lyeh's canonical degrees are
   * a fact of its annotation, not of the chart. Top-level pins only: the
   * theatre has no sub-locations.
   */
  pacific: {
    id: "pacific",
    title: "The South Pacific",
    url: "/maps/pacific-1448.webp",
    lqipUrl: "/maps/pacific-lqip.webp",
    insetUrl: "/maps/pacific-1024.webp",
    width: 1448,
    height: 1086,
    sheets: [
      { width: 1024, url: "/maps/pacific-1024.webp" },
      { width: 1448, url: "/maps/pacific-1448.webp" },
    ],
    // Same generator ceiling as new-england (~1450px source): cap the
    // close-up so the engraving never dissolves into upscale blur.
    maxZoom: 0.5,
    tone: "art",
    markerStyle: "annotation",
  },
};

export function getAtlasMap(mapId: string): AtlasMap {
  const map = MAPS[mapId];
  if (!map) throw new Error(`Unknown mapId "${mapId}"`);
  return map;
}

/** Route of a chart's page — the world chart is the front page. */
export function chartPath(mapId: string): string {
  return mapId === "world" ? "/" : `/maps/${mapId}`;
}
