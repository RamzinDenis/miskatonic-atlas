import type { PixelPoint } from "./geometry";

/** The beasts of this chart — slug doubles as the creature content slug. */
export type MonsterKind = "tornasuk" | "black-winged-ones" | "cthulhu";

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
 *   Black-winged Ones — over the Gulf of Mexico, off the swamp country
 *   Cthulhu          — the empty South Pacific south-east of R'lyeh
 */
export interface MapMonster {
  /** Creature content slug — doubles as the mask file name. */
  slug: MonsterKind;
  name: string;
  at: PixelPoint;
  /** Display size on the chart, screen px. */
  art: { w: number; h: number };
}

/** The story whose beasts haunt the chart's margins. */
export const MONSTER_STORY_SLUG = "the-call-of-cthulhu";

/** The beast's alpha mask, painted in currentColor wherever it appears. */
export function monsterMaskUrl(slug: MonsterKind): string {
  return `/maps/monsters/${slug}.png`;
}

export const MONSTERS: MapMonster[] = [
  {
    slug: "tornasuk",
    name: "tornasuk",
    at: { x: 2520, y: 640 },
    art: { w: 72, h: 66 },
  },
  {
    slug: "black-winged-ones",
    name: "Black-winged Ones",
    at: { x: 2245, y: 1505 },
    art: { w: 80, h: 79 },
  },
  {
    slug: "cthulhu",
    name: "Cthulhu",
    at: { x: 2140, y: 2400 },
    art: { w: 108, h: 109 },
  },
];
