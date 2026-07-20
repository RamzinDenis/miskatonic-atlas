import type { PixelPoint } from "./geometry";
import type { ShipKind } from "./route-glyphs";

/**
 * Routes — editorial voyage tracks on the chart (CONTEXT.md: «Маршрут»).
 * Pure presentation, like plates: the editor places the fixes after quoted
 * passages; nothing here enters content JSON or the extraction pipeline.
 *
 * Points are pixels of world.jpg. Fixes with canon coordinates in the
 * text are placed by the grid calibration documented in geometry.ts:
 *   the Emma–Alert encounter, "S. Latitude 49° 51´, W. Longitude 128° 34´"
 *     → (1971, 2270)
 *   the derelict Alert sighted, "S. Latitude 34° 21', W. Longitude 152° 17'"
 *     → (1743, 2068)
 * Every other point only shapes the line between fixes (a storm bend, a
 * drift wobble) and carries no factual claim — so no date is lettered there.
 */

/**
 * A fix — a track point vouched for by a quoted passage (CONTEXT.md: «Фикс»).
 * Only fixes carry a logged date. A position two tracks share is listed on
 * the leg whose log carries the date, and prints in that leg's ink.
 */
export interface RouteFix {
  x: number;
  y: number;
  /** The logged date, lettered beside the fix, offset in screen pixels. */
  label: string;
  dx: number;
  dy: number;
}

export interface RouteLeg {
  id: string;
  /** Name of the vessel (or of the passage) lettered along the track. */
  vessel: string;
  /** The engraved silhouette sailing the track. */
  ship: ShipKind;
  /** One line for the leg preview: who sailed where. */
  course: string;
  points: PixelPoint[];
  /**
   * The vessel's line style, the way old charts distinguish voyages: dash
   * pattern (leaflet dashArray), ink color and line cap. The dotted derelict
   * drift uses a round cap.
   */
  dash: string;
  color: string;
  cap: "butt" | "round";
  /** Index of the track segment the silhouette and vessel name sit on. */
  labelSegment: number;
  /** The fixes of the voyage — the only points that get a lettered date. */
  fixes: RouteFix[];
  /** The passages the track is drawn after — exact text from the story. */
  quotes: string[];
  attribution: string;
}

/**
 * Hand-tinted survey inks, one per vessel — richer than the chart's own
 * engraving so a voyage reads at first glance, the dash pattern doubling
 * the identity. All stay far from the vermilion that selection reprints
 * a track in.
 */
const SEPIA_INK = "#6f4a0d";
const PRUSSIAN_INK = "#1f4e78";
const OLIVE_INK = "#4a6323";
const PLUM_INK = "#6e2f63";

/** The story whose voyage the tracks below chart. */
export const ROUTE_STORY_SLUG = "the-call-of-cthulhu";

/** The voyage of the Emma and the Alert — the one route of the atlas so far. */
export const ROUTE_LEGS: RouteLeg[] = [
  {
    id: "emma",
    vessel: "Emma",
    ship: "schooner",
    course:
      "Schooner Emma of Auckland, bound for Callao — thrown south by the great storm to the encounter at 49° 51′ S, 128° 34′ W.",
    points: [
      { x: 1426, y: 2097 },
      { x: 1700, y: 1985 },
      { x: 1880, y: 2100 },
      { x: 1971, y: 2270 },
    ],
    dash: "11 7",
    color: SEPIA_INK,
    cap: "butt",
    labelSegment: 0,
    fixes: [
      { x: 1426, y: 2097, label: "Feb. 20", dx: 18, dy: 18 },
      { x: 1971, y: 2270, label: "Mch. 22", dx: -30, dy: 12 },
    ],
    quotes: [
      "He is Gustaf Johansen, a Norwegian of some intelligence, and had been second mate of the two-masted schooner Emma of Auckland, which sailed for Callao February 20th, with a complement of eleven men.",
      "The Emma, he says, was delayed and thrown widely south of her course by the great storm of March 1st, and on March 22d, in S. Latitude 49° 51´, W. Longitude 128° 34´, encountered the Alert, manned by a queer and evil-looking crew of Kanakas and half-castes.",
    ],
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  {
    id: "alert",
    vessel: "Alert",
    ship: "steam-yacht",
    course:
      "The captured yacht Alert under Second Mate Johansen — ahead on the original course, to the risen island.",
    points: [
      { x: 1971, y: 2270 },
      { x: 1989, y: 2231 },
    ],
    dash: "4 6",
    color: PRUSSIAN_INK,
    cap: "butt",
    labelSegment: 0,
    fixes: [
      { x: 1989, y: 2231, label: "Mch. 23", dx: 32, dy: 12 },
    ],
    quotes: [
      "Three of the Emma's men, including Capt. Collins and First Mate Green, were killed; and the remaining eight under Second Mate Johansen proceeded to navigate the captured yacht, going ahead in their original direction to see if any reason for their ordering back had existed.",
      "The next day, it appears, they raised and landed on a small island, although none is known to exist in that part of the ocean.",
    ],
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  {
    id: "johansen-adrift",
    vessel: "Johansen adrift",
    ship: "derelict",
    course:
      "Johansen and Briden beaten about by the storm — the derelict Alert, adrift until sighted at 34° 21′ S, 152° 17′ W.",
    points: [
      { x: 1989, y: 2231 },
      { x: 1925, y: 2208 },
      { x: 1868, y: 2148 },
      { x: 1802, y: 2122 },
      { x: 1743, y: 2068 },
    ],
    dash: "2 7",
    color: OLIVE_INK,
    cap: "round",
    labelSegment: 2,
    fixes: [
      { x: 1743, y: 2068, label: "Apr. 12", dx: 2, dy: -18 },
    ],
    quotes: [
      "Later, it seems, he and one companion boarded the yacht and tried to manage her, but were beaten about by the storm of April 2nd.",
      "The Morrison Co.'s freighter Vigilant, bound from Valparaiso, arrived this morning at its wharf in Darling Harbour, having in tow the battled and disabled but heavily armed steam yacht Alert of Dunedin, N. Z., which was sighted April 12th in S. Latitude 34° 21', W. Longitude 152° 17', with one living and one dead man aboard.",
    ],
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  {
    id: "vigilant",
    vessel: "Vigilant",
    ship: "freighter",
    course:
      "Freighter Vigilant out of Valparaiso, driven south of her course — the derelict taken in tow to Darling Harbour, Sydney.",
    points: [
      { x: 2520, y: 2053 },
      { x: 2160, y: 2145 },
      { x: 1743, y: 2068 },
      { x: 1450, y: 2052 },
      { x: 1189, y: 2066 },
    ],
    dash: "14 6 4 6",
    color: PLUM_INK,
    cap: "butt",
    labelSegment: 0,
    fixes: [
      { x: 2520, y: 2053, label: "Mch. 25", dx: 6, dy: -16 },
      { x: 1189, y: 2066, label: "Apr. 18", dx: 10, dy: 22 },
    ],
    quotes: [
      "The Vigilant left Valparaiso March 25th, and on April 2d was driven considerably south of her course by exceptionally heavy storms and monster waves. On April 12th the derelict was sighted; and though apparently deserted, was found upon boarding to contain one survivor in a half-delirious condition and one man who had evidently been dead for more than a week.",
    ],
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
];

/**
 * Midpoint and heading of one track segment. Pixel space has y down, exactly
 * like CSS — the angle transfers to screen rotations as is.
 */
export function segmentDirection(
  leg: RouteLeg,
  segment: number,
): { at: PixelPoint; angleDeg: number } {
  const a = leg.points[segment];
  const b = leg.points[segment + 1];
  return {
    at: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    angleDeg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}

/**
 * Where a leg's vessel name sits: the label segment's midpoint, with the
 * heading flipped when the text would read upside down.
 */
export function legLabelPlacement(leg: RouteLeg): {
  at: PixelPoint;
  angleDeg: number;
} {
  const direction = segmentDirection(leg, leg.labelSegment);
  let angleDeg = direction.angleDeg;
  if (angleDeg > 90) angleDeg -= 180;
  if (angleDeg < -90) angleDeg += 180;
  return { at: direction.at, angleDeg };
}

/**
 * Where the vessel silhouette sails: the label segment's midpoint, bow along
 * the direction of travel. Headings past ±90° flip the glyph horizontally
 * instead of rotating it — a ship is never printed keel-up.
 */
export function legShipPlacement(leg: RouteLeg): {
  at: PixelPoint;
  angleDeg: number;
  flip: boolean;
} {
  const direction = segmentDirection(leg, leg.labelSegment);
  let angleDeg = direction.angleDeg;
  let flip = false;
  if (angleDeg > 90) {
    angleDeg -= 180;
    flip = true;
  }
  if (angleDeg < -90) {
    angleDeg += 180;
    flip = true;
  }
  return { at: direction.at, angleDeg, flip };
}

/**
 * A silhouette needs sea room: on a label segment shorter than this the
 * glyph would dwarf its own track (the Alert's one-day hop), so that leg
 * sails without one — its silhouette still keys the legend.
 */
export function shipFits(leg: RouteLeg): boolean {
  const a = leg.points[leg.labelSegment];
  const b = leg.points[leg.labelSegment + 1];
  return Math.hypot(b.x - a.x, b.y - a.y) > 70;
}
