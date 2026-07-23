import type { PixelPoint } from "./geometry";

/** The beasts of this chart — slug doubles as the creature content slug. */
export type MonsterKind =
  | "tornasuk"
  | "black-winged-ones"
  | "cthulhu"
  | "the-thing";

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
 * Points are pixels of world.jpg:
 *   tornasuk         — Baffin Bay, off the Greenland cult's coast
 *   Black-winged Ones — open Pacific off Tehuantepec: the Gulf of Mexico
 *                       itself is too small on this sheet to hold the beast
 *                       clear of the swamp-country pins and the printed
 *                       lettering, so it haunts the nearest empty water
 *   Cthulhu          — the empty South Pacific south-east of R'lyeh
 *   The Thing        — beside the risen island of the monolith, clear of
 *                       the Pacific pin and the Emma's track to the south
 */
export interface MapMonster {
  /** Creature content slug — doubles as the mask file name. */
  slug: MonsterKind;
  name: string;
  /** The story the annotator read before drawing this beast — keys the
      legend's "Here be monsters" rows to their stories. */
  storySlug: string;
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
    slug: "tornasuk",
    name: "tornasuk",
    storySlug: "the-call-of-cthulhu",
    at: { x: 2520, y: 640 },
    art: { w: 58, h: 53 },
  },
  {
    slug: "black-winged-ones",
    name: "Black-winged Ones",
    storySlug: "the-call-of-cthulhu",
    at: { x: 2255, y: 1622 },
    art: { w: 64, h: 63 },
  },
  {
    slug: "cthulhu",
    name: "Cthulhu",
    storySlug: "the-call-of-cthulhu",
    at: { x: 2140, y: 2400 },
    art: { w: 74, h: 75 },
  },
  {
    slug: "the-thing",
    name: "The Thing",
    storySlug: "dagon",
    at: { x: 1960, y: 1890 },
    art: { w: 66, h: 58 },
  },
];
