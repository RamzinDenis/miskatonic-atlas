import { divIcon } from "leaflet";
import type { AtlasMap, MapLocation } from "./geometry";
import { monsterMaskUrl, type MapMonster } from "./monsters";
import { INK_ROUGH_FILTER, SHIP_ART, SHIP_INK, shipMaskUrl } from "./route-glyphs";
import {
  legShipPlacement,
  shipFits,
  type RouteFix,
  type RouteLeg,
} from "./routes";

/**
 * The marks of the chart — every leaflet divIcon and path style the sheet
 * prints: location vignettes and annotations, the picker's fix, the
 * annotator's beasts, and the voyage tracks' ink, silhouettes, dates and
 * lettering. Pure builders: state lives in world-map-client.
 */

/**
 * Chart vignettes by kind of feature, drawn the way this scan draws its own
 * ships and compass rose: bold black engraving sitting on a cleared patch
 * of paper (the .atlas-pin clearing), which is what keeps a mark legible on
 * Colton's dense etching.
 *
 * Every type in the schema's enum carries its own sign — a key whose rows
 * repeat a symbol explains nothing. They are told apart by silhouette, not
 * by detail, because the legend prints them at 17px: a steepled skyline for
 * a city against two low gambrel cottages for a town (the city's vertical
 * spire is the whole difference); a pedimented portico for the single named
 * hall or library; a hachured range for a region, kept distinct from the
 * town's roofs by having no walls under its peaks; a broken column with a
 * fallen drum for a ruin; waves with a crossed fix for open sea; a field
 * cairn — low and squat where the ruin is tall and narrow — for whatever
 * fits no other kind. The bare circle-and-dot is now only the fallback for
 * a type this map has never heard of.
 *
 * Drawn in currentColor so CSS states re-ink them (engraving black at rest,
 * vermilion when chosen), and roughened by the shared turbulence filter
 * (route-glyphs.ts) so the vector edge sits in the etched scan instead of
 * floating over it. The same markup feeds the legend, which is what keys
 * the symbols to the chart.
 */
export const VIGNETTES: Record<string, string> = {
  city: `<g filter="url(#atlas-ink-rough)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 24h17"/><path d="M9.2 24v-9.8L11.8 8l2.6 6.2V24"/><path d="M11.8 8V5.2"/><path d="M11.8 5.2l2.4 1-2.4 1z" fill="currentColor" stroke="none"/><path d="M14.4 18h5.9v6"/><path d="M13.9 18l2.6-2.6 3.8 2.6"/><path d="M17.1 24v-2.3" stroke-width="1.2"/></g>`,
  town: `<g filter="url(#atlas-ink-rough)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 24h20"/><path d="M6.2 24v-8h7.2v8"/><path d="M5 16 9.8 12.2 14.6 16"/><path d="M12.1 13.4V10.2M11.2 10.2h1.9" stroke-width="1.2"/><path d="M15.6 24v-6.2h5.6V24"/><path d="M14.6 17.8 18.4 14.8 22.2 17.8"/><path d="M8.6 24v-3.4h2.2V24" stroke-width="1.2"/></g>`,
  building: `<g filter="url(#atlas-ink-rough)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.2 24.2h17.6"/><path d="M7 21.6h14"/><path d="M9.7 21.6v-6.6M14 21.6v-6.6M18.3 21.6v-6.6" stroke-width="1.5"/><path d="M6.6 15h14.8"/><path d="M6.6 15 14 8.8 21.4 15"/><circle cx="14" cy="12.6" r="1" fill="currentColor" stroke="none"/></g>`,
  region: `<g filter="url(#atlas-ink-rough)" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 22 10.6 10l4.3 6.9 3.5-5.5L24.8 22z"/><path d="M8.3 15.7l-1.9 3M10.3 17.2l-1.7 2.7M20 17l-1.5 2.8" stroke-width="1.2"/></g>`,
  ruin: `<g filter="url(#atlas-ink-rough)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 24.5h14M6.8 21.7h10"/><path d="M9.3 21.7V10.2l2.1-2.6 1.7 2.2 2.4-3.4.8 4v11.3"/><path d="M12.6 12.6v9.1" stroke-width="1.2"/><ellipse cx="22" cy="22.6" rx="2.6" ry="1.7"/></g>`,
  sea: `<g filter="url(#atlas-ink-rough)" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 3.6l4 4M16 3.6l-4 4"/><path d="M3.4 15q3.5-3.8 7 0t7 0t7 0"/><path d="M6.4 20.6q3.5-3.8 7 0t7 0"/></g>`,
  other: `<g filter="url(#atlas-ink-rough)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.6 24h16.8"/><path d="M7.6 24 8.6 18.6l4-.9 1.3 6.3z"/><path d="M14.6 24l.6-5 4-.4.9 5.4z"/><path d="M10.4 18.2l1.4-4.2 4.2.6.2 4z"/></g>`,
  default: `<g filter="url(#atlas-ink-rough)"><circle cx="14" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="14" r="1.5" fill="currentColor"/></g>`,
};

/* Display order of the legend's key, matching the schema's type enum —
   VIGNETTES carries a sign for every entry, so `default` never shows here. */
export const LOCATION_TYPE_ORDER = [
  "city",
  "town",
  "building",
  "region",
  "ruin",
  "sea",
  "other",
];

/* Every svg carries its own filter defs: pins are leaflet-built html strings,
   so no single shared <defs> element is guaranteed to be mounted first. */
function vignetteSvg(type: string): string {
  return `<svg class="atlas-pin-glyph" viewBox="0 0 28 28" aria-hidden="true"><defs>${INK_ROUGH_FILTER}</defs>${VIGNETTES[type] ?? VIGNETTES.default}</svg>`;
}

/**
 * How a mark stands at this moment: at rest, chosen by the reader, or one
 * of the places the chosen one is tied to — «linked» is the chart answering
 * a selection, not a second kind of selection, so it re-inks by half.
 */
export type MarkState = "rest" | "active" | "linked";

function markClass(base: string, state: MarkState) {
  return state === "rest" ? base : `${base} ${base}--${state}`;
}

export function locationIcon(
  location: MapLocation,
  state: MarkState,
  chart: AtlasMap,
) {
  if (chart.markerStyle === "annotation") {
    return annotationIcon(location, state, chart);
  }
  return divIcon({
    className: "atlas-pin-wrap",
    html: `<span class="${markClass("atlas-pin", state)}">${vignetteSvg(location.type)}<span class="atlas-pin-label">${location.name}</span></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/*
 * Annotation marks (markerStyle: "annotation"): on a generated close-up the
 * artwork itself draws every place, so a glyph on a paper clearing would
 * bury exactly what it points at. The mark is the lettered name itself with
 * a small fix-point at the exact spot — the way the scan letters its own
 * features. Hover and selection reprint in vermilion, as everywhere.
 */
function annotationIcon(location: MapLocation, state: MarkState, chart: AtlasMap) {
  const s = 12;
  const town = location.type === "town" || location.type === "city";
  /* A name letters to the right of its fix; near the sheet's right edge it
     would run off the paper (Valparaiso), so there it letters to the left. */
  const flip = location.x > chart.width * 0.85;
  /* The sublabel is a log-book line under the name — canon degrees on an
     uncalibrated sheet print as a fact of the annotation, not of the chart
     (docs/pacific-map.md №4). */
  const sub = location.sublabel
    ? `<span class="atlas-annot-sub">${location.sublabel}</span>`
    : "";
  return divIcon({
    className: "atlas-pin-wrap",
    html: `<span class="${markClass("atlas-annot", state)}" style="width:${s}px;height:${s}px"><span class="atlas-annot-fix"></span><span class="atlas-annot-label${town ? " atlas-annot-label--town" : ""}${flip ? " atlas-annot-label--flip" : ""}">${location.name}${sub}</span></span>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

export const pickedIcon = divIcon({
  className: "atlas-pin-wrap",
  html: `<span class="atlas-pin atlas-pin--picked"><span class="atlas-pin-dot"></span></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/**
 * A beast of the margins, drawn at its natural marginalia size — larger
 * than any printed mark, because it is not a printed mark: the annotator's
 * iron-gall engraving of what surfaces there. The engraving is an alpha
 * mask painted in currentColor (see monsters.ts), so CSS re-inks it like
 * every other mark. Clicking one opens its creature page; there is nothing
 * else to preview about a thing like this.
 */
export function monsterIcon(monster: MapMonster) {
  const { w, h } = monster.art;
  return divIcon({
    className: "atlas-monster-wrap",
    html: `<span class="atlas-monster"><span class="mask-ink" style="--ink-mask:url('${monsterMaskUrl(monster.slug)}')"></span><span class="atlas-monster-label">${monster.name}</span></span>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
  });
}

/**
 * Voyage tracks in the manner of the scan's own expedition tracks (Cook,
 * the Vincennes), held apart per vessel by hand-tinted inks and dash
 * patterns (routes.ts). A paper twin under the line keeps the dashes
 * readable on the etching. Only fixes get a lettered date, and each track
 * carries its vessel's silhouette, bow along the course — the bow, smoke
 * and wake are what tell the direction of travel. Selection "reprints"
 * the whole leg in vermilion — the same accent the pins use.
 */
export const TRACK_ACCENT = "#75371a";

export function routeHalo(leg: RouteLeg) {
  return {
    color: "rgba(238, 226, 197, 0.75)",
    weight: 6.2,
    dashArray: leg.dash,
    lineCap: leg.cap,
    interactive: false,
  } as const;
}

export function routeInk(leg: RouteLeg, active: boolean) {
  return {
    color: active ? TRACK_ACCENT : leg.color,
    weight: active ? 3.9 : 3,
    opacity: active ? 1 : 0.95,
    dashArray: leg.dash,
    lineCap: leg.cap,
    bubblingMouseEvents: false,
  } as const;
}

/**
 * The vessel's silhouette sailing just above its track, bow along the
 * course — lifted clear of the line the way the scan floats its own ships
 * beside the expedition tracks.
 */
export function routeShipIcon(leg: RouteLeg, active: boolean) {
  const placement = legShipPlacement(leg);
  const art = SHIP_ART[leg.ship];
  const flip = placement.flip ? " scaleX(-1)" : "";
  /* The sr-only name is the button's accessible name: leaflet only writes
     `alt` onto img icons, so a divIcon button is nameless without it. */
  return divIcon({
    className: "atlas-route-ship-wrap",
    html: `<span class="atlas-route-ship" style="color:${active ? TRACK_ACCENT : SHIP_INK};width:${art.w}px;height:${art.h}px;transform:translate(-50%,-50%) rotate(${placement.angleDeg}deg) translateY(-14px)${flip}"><span class="mask-ink" style="--ink-mask:url('${shipMaskUrl(leg.ship)}')"></span><span class="sr-only">The ${leg.vessel} — voyage track</span></span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** A logged date beside its fix — "Mch. 22", in the ink of its track. */
export function routeDateIcon(fix: RouteFix, leg: RouteLeg, active: boolean) {
  return divIcon({
    className: "atlas-route-date-wrap",
    html: `<span class="atlas-route-date" style="color:${active ? TRACK_ACCENT : leg.color};left:${fix.dx}px;top:${fix.dy}px">${fix.label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function routeLabelIcon(leg: RouteLeg, angleDeg: number, active: boolean) {
  /* The silhouette floats above the line, so its name letters below it;
     a leg without a silhouette keeps the name above the bare line. */
  const lift = shipFits(leg) ? 13 : -10;
  return divIcon({
    className: "atlas-route-label-wrap",
    html: `<span class="atlas-route-label${active ? " atlas-route-label--active" : ""}" style="color:${active ? TRACK_ACCENT : leg.color};transform:translate(-50%,-50%) rotate(${angleDeg}deg) translateY(${lift}px)">${leg.vessel}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}
