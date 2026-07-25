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
 *   tornasuk         — Baffin Bay, off the Greenland cult's coast
 *   Black-winged Ones — open Pacific off Tehuantepec: the Gulf of Mexico
 *                       itself is too small on this sheet to hold the beast
 *                       clear of the swamp-country pins and the printed
 *                       lettering, so it haunts the nearest empty water
 *   Cthulhu          — the empty South Pacific south-east of R'lyeh
 *   The Thing        — beside the risen island of the monolith, clear of
 *                       the Pacific pin and the Emma's track to the south
 *   Crawling Reptiles — the empty Arabian Sea south-east of the city's pin:
 *                       the desert around the pin is cramped against the
 *                       sheet's engraved border, so the beast haunts the
 *                       nearest open water, clear of the border and the fold
 *   Dunwich Horror   — squatting on the bare crown of the domed hill above
 *                       Dunwich village, where the engraving leaves the paper
 *                       pale: the one land in that country the drawing reads
 *                       on, and the hill the thing was driven up in the end
 *
 * The sea sheet (pacific) carries its own copies of the theatre's two
 * beasts — marginalia are presentation, per chart, like routes; the world
 * copy of each stays where the annotator first drew it:
 *   Cthulhu (pacific)  — surfacing right beneath the Emma–Alert encounter
 *                        fix, in the clear water between the "Mch. 22"
 *                        date and the island's breaking foam
 *   The Thing (pacific) — off the mouth of the canyon that cuts the black
 *                        risen plain — the water it rose from — close under
 *                        the monolith without inking over the plain, above
 *                        the Vigilant's corridor
 */
export interface MapMonster {
  /** Creature content slug — doubles as the mask file name. */
  slug: MonsterKind;
  name: string;
  /** The story the annotator read before drawing this beast — keys the
      legend's "Here be monsters" rows to their stories. */
  storySlug: string;
  /** Chart this beast is drawn on (src/shared/maps.ts); defaults to world. */
  mapId?: string;
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
    slug: "the-crawling-reptiles-of-the-nameless-city",
    name: "The Crawling Reptiles",
    storySlug: "the-nameless-city",
    at: { x: 3745, y: 1655 },
    art: { w: 62, h: 47 },
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
