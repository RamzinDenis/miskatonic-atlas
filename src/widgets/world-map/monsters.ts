import type { PixelPoint } from "./geometry";

/** The beasts of this chart — slug doubles as the creature content slug. */
export type MonsterKind =
  | "tornasuk"
  | "black-winged-ones"
  | "cthulhu"
  | "the-thing"
  | "the-crawling-reptiles-of-the-nameless-city"
  | "the-dunwich-horror";

/**
 * Monsters — the annotator's marginalia on the chart. Pure presentation,
 * like routes: the editor placed each beast in empty water beside its
 * locus, clear of every pin, track and lettered date, as if the owner of
 * this copy had known what surfaces where. Clicking a beast opens its
 * creature page; the legend keys the three under "Here be monsters".
 *
 * The beasts are raster engravings (sources: public/plates/monster-*.png)
 * reduced to alpha masks by scripts/build-monster-masks.mjs and painted
 * through CSS mask-image in currentColor — so hover and selection re-ink
 * them like every other mark. `art` is the display size in screen px;
 * keep its aspect in step with the mask's (the build script prints it).
 *
 * A beast needs blank paper under it, not merely empty geography: inked over
 * engraved forest or hachured slope the silhouette turns to a dark blot
 * (tried on the regional chart — three wooded spots all failed). Open water
 * is the usual answer, which is why the world sheet's five all swim; but any
 * pale unprinted ground serves, and on the Miskatonic sheet the bald crown
 * of a dome holds the drawing as well as the sea does.
 *
 * Points are pixels of the beast's own chart (`mapId`):
 *   Dunwich Horror — squatting on the bare crown of the domed hill above
 *                    Dunwich village, where the engraving leaves the paper
 *                    pale: the one land in that country the drawing reads
 *                    on, and the hill the thing was driven up in the end
 *   Cthulhu        — the sea sheet, at the drawn R'lyeh by the landing
 *   The Thing      — the sea sheet, on the risen plain at the monolith
 *
 * Beasts of the retired world scan (tornasuk, Black-winged Ones, the
 * Crawling Reptiles) wait in public/maps/monsters/ for their theatres.
 */
export interface MapMonster {
  /** Creature content slug — doubles as the mask file name. */
  slug: MonsterKind;
  name: string;
  /** The story the annotator read before drawing this beast — keys the
      legend's "Here be monsters" rows to their stories. */
  storySlug: string;
  /** Chart this beast is drawn on (src/shared/maps.ts). */
  mapId: string;
  at: PixelPoint;
  /** Display size on the chart, screen px. */
  art: { w: number; h: number };
}

/** The beast's alpha mask, painted in currentColor wherever it appears. */
export function monsterMaskUrl(slug: MonsterKind): string {
  return `/maps/monsters/${slug}.png`;
}

export const MONSTERS: MapMonster[] = [
  {
    slug: "cthulhu",
    name: "Cthulhu",
    storySlug: "the-call-of-cthulhu",
    mapId: "pacific",
    at: { x: 850, y: 730 },
    art: { w: 74, h: 75 },
  },
  {
    slug: "the-thing",
    name: "The Thing",
    storySlug: "dagon",
    mapId: "pacific",
    at: { x: 955, y: 120 },
    art: { w: 66, h: 58 },
  },
  {
    slug: "the-dunwich-horror",
    name: "The Dunwich Horror",
    storySlug: "the-dunwich-horror",
    mapId: "new-england",
    at: { x: 400, y: 180 },
    art: { w: 72, h: 74 },
  },
];
