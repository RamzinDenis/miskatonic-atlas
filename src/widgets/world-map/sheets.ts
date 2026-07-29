import type { AtlasMap, MapSheet } from "./geometry";

/**
 * Which copy of a chart to pull, and what the browser already holds. Kept
 * clear of leaflet so a page that merely links to a chart can warm it
 * without dragging the map library into its bundle.
 */

/**
 * Past 2× the screen has more pixels than the eye has receptors for a
 * photograph of paper, and the rungs double — so a third rung of density
 * would cost a step of the ladder for nothing.
 */
export const MAX_DENSITY = 2;

/**
 * An overview never pulls the full scan, even where the density would
 * justify it: the reader has asked to see the whole chart, which is the one
 * view where detail is invisible by definition. It arrives on the first
 * close-up instead.
 */
export const OVERVIEW_CEILING = 2048;

/** The smallest copy that still has a pixel for every pixel of `needed`. */
export function sheetForWidth(
  chart: AtlasMap,
  needed: number,
  ceiling = Infinity,
): MapSheet {
  const usable = chart.sheets.filter((sheet) => sheet.width <= ceiling);
  return (
    usable.find((sheet) => sheet.width >= needed) ?? usable[usable.length - 1]
  );
}

/** The smallest copy that still has a pixel for every pixel on screen. */
export function pickSheet(
  chart: AtlasMap,
  zoom: number,
  ceiling = Infinity,
): MapSheet {
  const density = Math.min(window.devicePixelRatio || 1, MAX_DENSITY);
  return sheetForWidth(chart, chart.width * 2 ** zoom * density, ceiling);
}

/**
 * Copies the browser has already pulled in this session. Leaving the chart
 * for a location page tears the whole widget down, and coming back builds
 * it from nothing — without this the reader watches the ladder replay from
 * the thumb up over a copy that is already in the cache.
 */
export const fetched = new Set<string>();

/** The best copy already in hand for an overview of this chart, if any. */
export function warmSheet(chart: AtlasMap): MapSheet | undefined {
  return chart.sheets.filter(
    (sheet) => sheet.width <= OVERVIEW_CEILING && fetched.has(sheet.url),
  ).pop();
}

/**
 * Whether the chart can be printed whole on the first frame — read by the
 * widget so a return visit skips the fade the first visit needs.
 */
export function chartIsWarm(chart: AtlasMap): boolean {
  return warmSheet(chart) !== undefined;
}

/**
 * Whether the widget's own chunk has been evaluated in this session —
 * recorded by world-map-client at module scope, so evaluation itself is the
 * fact. The wrapper reads it to choose between two mounts: a first coming
 * defers past the page turn (the evaluation burst would hang the turn on
 * WebKit), a return mounts straight into the navigation's commit, where the
 * freeze absorbs the build and the paper is under the dissolving leaf from
 * its first frame — no loader over a chart the reader has already seen.
 */
let widgetEvaluated = false;

export function markWidgetEvaluated(): void {
  widgetEvaluated = true;
}

export function widgetIsEvaluated(): boolean {
  return widgetEvaluated;
}

/**
 * Pull a chart's paper before the reader asks for it — from a link that
 * leads to it, on hover or focus. An overview lands with the sheet fitted
 * to the frame, so the copy it will want is the one sized to the viewport;
 * the thumb comes too, as the chart draws that first.
 *
 * Marking the copy fetched is the point as much as the download is: the
 * widget reads it (chartIsWarm) and opens printed, without fading its marks
 * up over paper that is already there.
 */
export function warmChart(chart: AtlasMap): void {
  new Image().src = chart.lqipUrl;
  const density = Math.min(window.devicePixelRatio || 1, MAX_DENSITY);
  const sheet = sheetForWidth(
    chart,
    window.innerWidth * density,
    OVERVIEW_CEILING,
  );
  if (fetched.has(sheet.url)) return;
  const copy = new Image();
  copy.onload = () => fetched.add(sheet.url);
  copy.src = sheet.url;
}
