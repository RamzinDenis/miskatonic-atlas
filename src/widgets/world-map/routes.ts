import type { PixelPoint } from "./geometry";

/**
 * Routes — editorial voyage tracks on the chart (CONTEXT.md: «Маршрут»).
 * Pure presentation, like plates: the editor places track points after quoted
 * passages; nothing here enters content JSON or the extraction pipeline.
 *
 * Points are pixels of world.jpg. Endpoints with canon coordinates in the
 * text are placed by the grid calibration documented in geometry.ts:
 *   the Emma–Alert encounter, "S. Latitude 49° 51´, W. Longitude 128° 34´"
 *     → (1971, 2270)
 *   the derelict Alert sighted, "S. Latitude 34° 21', W. Longitude 152° 17'"
 *     → (1743, 2068)
 * Intermediate points only shape the line between quoted positions
 * (a storm bend, a drift wobble) and carry no factual claim.
 */

/** A dated position lettered beside the track, offset in screen pixels. */
export interface RouteDate {
  x: number;
  y: number;
  label: string;
  dx: number;
  dy: number;
}

export interface RouteLeg {
  id: string;
  /** Name of the vessel (or of the passage) lettered along the track. */
  vessel: string;
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
  /** Index of the track segment the vessel name sits on. */
  labelSegment: number;
  /** Segments carrying a direction arrow at their midpoint. */
  arrowSegments: number[];
  /** Dates of the voyage lettered at quoted positions. */
  dates: RouteDate[];
  /** The passages the track is drawn after — exact text from the story. */
  quotes: string[];
  attribution: string;
}

/** The dark chart ink of most tracks. */
const INK = "#2b1e08";
/** The red survey ink that sets the rescue voyage apart. */
const RED_INK = "#75371a";

/** The story whose voyage the tracks below chart. */
export const ROUTE_STORY_SLUG = "the-call-of-cthulhu";

/** The voyage of the Emma and the Alert — the one route of the atlas so far. */
export const ROUTE_LEGS: RouteLeg[] = [
  {
    id: "emma",
    vessel: "Emma",
    course:
      "Schooner Emma of Auckland, bound for Callao — thrown south by the great storm to the encounter at 49° 51′ S, 128° 34′ W.",
    points: [
      { x: 1426, y: 2097 },
      { x: 1700, y: 1985 },
      { x: 1880, y: 2100 },
      { x: 1971, y: 2270 },
    ],
    dash: "11 7",
    color: INK,
    cap: "butt",
    labelSegment: 0,
    arrowSegments: [1, 2],
    dates: [
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
    course:
      "The captured yacht Alert under Second Mate Johansen — ahead on the original course, to the risen island.",
    points: [
      { x: 1971, y: 2270 },
      { x: 1989, y: 2231 },
    ],
    dash: "4 6",
    color: INK,
    cap: "butt",
    labelSegment: 0,
    arrowSegments: [],
    dates: [{ x: 1989, y: 2231, label: "Mch. 23", dx: 32, dy: 12 }],
    quotes: [
      "Three of the Emma's men, including Capt. Collins and First Mate Green, were killed; and the remaining eight under Second Mate Johansen proceeded to navigate the captured yacht, going ahead in their original direction to see if any reason for their ordering back had existed.",
      "The next day, it appears, they raised and landed on a small island, although none is known to exist in that part of the ocean.",
    ],
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  {
    id: "johansen-adrift",
    vessel: "Johansen adrift",
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
    color: INK,
    cap: "round",
    labelSegment: 2,
    arrowSegments: [0, 3],
    dates: [{ x: 1743, y: 2068, label: "Apr. 12", dx: 2, dy: -18 }],
    quotes: [
      "Later, it seems, he and one companion boarded the yacht and tried to manage her, but were beaten about by the storm of April 2nd.",
      "The Morrison Co.'s freighter Vigilant, bound from Valparaiso, arrived this morning at its wharf in Darling Harbour, having in tow the battled and disabled but heavily armed steam yacht Alert of Dunedin, N. Z., which was sighted April 12th in S. Latitude 34° 21', W. Longitude 152° 17', with one living and one dead man aboard.",
    ],
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  {
    id: "vigilant",
    vessel: "Vigilant",
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
    color: RED_INK,
    cap: "butt",
    labelSegment: 0,
    arrowSegments: [1, 3],
    dates: [
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
 * like CSS — the angle transfers to screen rotations as is. Arrows use the
 * raw heading (they must point the direction of travel).
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
