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
  /** Display name, as a chart heading: "The South Pacific". */
  title: string;
  /** The full-size source everything below is cut from, never served whole. */
  url: string;
  /** A 128px thumb of the sheet, under it until a real copy arrives. */
  lqipUrl: string;
  /** Quarter-size copy for the static insets on content pages. */
  insetUrl: string;
  width: number;
  height: number;
  /** Resolution ladder, smallest first (scripts/build-map-images.mjs). */
  sheets: readonly MapSheet[];
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
   * sub-locations (ADR-0003): on an overview sheet a landmark inside a town
   * is noise. A close-up regional sheet is the opposite — its whole point
   * is the landmarks — so it declares "all" and pins children too.
   */
  pins?: "top-level" | "all";
  /**
   * The stories of this chart's theatre (ADR-0004). When declared, the
   * legend groups only these; without it every story with a placed major
   * location shows. The gate exists for shared locations: Irem stands on
   * the desert sheet as the Nameless City's neighbour, and Castro's one
   * sentence about it must not drag "The Call of Cthulhu" onto a chart
   * whose theatre it is not.
   */
  stories?: readonly string[];
  /**
   * How a location is marked. "vignette" (default) — the engraved glyph on
   * a paper clearing, made for a sheet whose etching is background. On a
   * generated close-up the artwork itself draws the places, and a badge
   * would bury exactly what it points at — "annotation" instead circles
   * the feature in the margin-annotator's ink and letters the name beside.
   */
  markerStyle?: "vignette" | "annotation";
}

/** True when the chart pins sub-locations too (pins: "all"). */
export function chartShowsChildren(mapId: string): boolean {
  return MAPS[mapId]?.pins === "all";
}

/** The sheet the front page opens on — chartPath maps it to "/". */
export const FRONT_CHART_ID = "pacific";

/*
 * Content stores map positions as pixels of the chart's source image
 * (x right, y down from the top-left corner), so points survive re-tinting
 * of a basemap but not re-cropping/re-scaling it.
 *
 * The Colton world scan that once anchored the atlas (ADR-0002) was retired
 * by the theater-chart verdict (ADR-0004): every sheet is now a generated
 * theatre in the manner of docs/regional-map.md / docs/pacific-map.md.
 */
export const MAPS: Record<string, AtlasMap> = {
  /**
   * The regional chart of fictional New England (docs/regional-map.md):
   * an editor-generated bird's-eye engraving, drawn strictly after the
   * corpus' own geography — no degree grid. The png is the cutting source
   * (kept in the repo, never served); the ladder is all webp. Replacing
   * the source with a larger original before any pins are placed is free —
   * after, it is a coordinate migration (ADR-0002).
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
  /**
   * The desert sheet of the Arabian theatre (ADR-0004): generated dune-sea
   * chart drawn strictly after "The Nameless City" (plus Irem's one Castro
   * sentence in "The Call of Cthulhu"). Uncalibrated like every generated
   * sheet; the underworld (the mummy corridor, the abyss) is interior and
   * stays on the location's own page. Top-level pins only.
   */
  desert: {
    id: "desert",
    title: "The Desert of Araby",
    stories: ["the-nameless-city"],
    url: "/maps/desert-1448.webp",
    lqipUrl: "/maps/desert-lqip.webp",
    insetUrl: "/maps/desert-1024.webp",
    width: 1448,
    height: 1086,
    sheets: [
      { width: 1024, url: "/maps/desert-1024.webp" },
      { width: 1448, url: "/maps/desert-1448.webp" },
    ],
    // Same generator ceiling as the other sheets (~1450px source).
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

/** Route of a chart's page — the front chart is the front page. */
export function chartPath(mapId: string): string {
  return mapId === FRONT_CHART_ID ? "/" : `/maps/${mapId}`;
}
