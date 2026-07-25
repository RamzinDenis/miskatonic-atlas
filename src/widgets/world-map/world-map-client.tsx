"use client";

import "leaflet/dist/leaflet.css";
import {
  CRS,
  divIcon,
  latLngBounds,
  type LatLngBoundsExpression,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
} from "leaflet";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { getPlateThumb } from "@/widgets/plates";
import { ChartSheet, chartIsWarm } from "./chart-sheet";
import {
  MAPS,
  chartPath,
  latLngToPixel,
  pixelToLatLng,
  type AtlasMap,
  type MapLegendGroup,
  type MapLocation,
  type PixelPoint,
  type UnplacedLocation,
} from "./geometry";
import {
  MONSTERS,
  monsterMaskUrl,
  type MapMonster,
  type MonsterKind,
} from "./monsters";
import {
  INK_ROUGH_FILTER,
  SHIP_ART,
  SHIP_INK,
  shipMaskUrl,
} from "./route-glyphs";
import {
  ROUTE_STORY_SLUG,
  legLabelPlacement,
  legShipPlacement,
  routeLegs,
  shipFits,
  type RouteFix,
  type RouteLeg,
} from "./routes";

/** Zoom the legend flies to — close enough to read the chart around a pin. */
const FOCUS_ZOOM = -0.5;

/**
 * Panning must stay within the chart: zooming out stops at "whole map
 * visible", so the image can never float loose inside the viewport.
 */
function applyFitZoomLimit(map: LeafletMap, bounds: LatLngBoundsExpression) {
  const fitZoom = map.getBoundsZoom(bounds, false);
  map.setMinZoom(fitZoom);
  if (map.getZoom() < fitZoom) map.setZoom(fitZoom);
}

function FitZoomLimit({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMapEvents({
    resize() {
      applyFitZoomLimit(map, bounds);
    },
  });
  useEffect(() => {
    applyFitZoomLimit(map, bounds);
  }, [map, bounds]);
  return null;
}

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

const VIGNETTES: Record<string, string> = {
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
const LOCATION_TYPE_ORDER = [
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

function locationIcon(location: MapLocation, active: boolean, style?: AtlasMap["markerStyle"]) {
  if (style === "annotation") return annotationIcon(location, active);
  return divIcon({
    className: "atlas-pin-wrap",
    html: `<span class="atlas-pin${active ? " atlas-pin--active" : ""}">${vignetteSvg(location.type)}<span class="atlas-pin-label">${location.name}</span></span>`,
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
function annotationIcon(location: MapLocation, active: boolean) {
  const s = 12;
  const town = location.type === "town" || location.type === "city";
  /* The sublabel is a log-book line under the name — canon degrees on an
     uncalibrated sheet print as a fact of the annotation, not of the chart
     (docs/pacific-map.md №4). */
  const sub = location.sublabel
    ? `<span class="atlas-annot-sub">${location.sublabel}</span>`
    : "";
  return divIcon({
    className: "atlas-pin-wrap",
    html: `<span class="atlas-annot${active ? " atlas-annot--active" : ""}" style="width:${s}px;height:${s}px"><span class="atlas-annot-fix"></span><span class="atlas-annot-label${town ? " atlas-annot-label--town" : ""}">${location.name}${sub}</span></span>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

const pickedIcon = divIcon({
  className: "atlas-pin-wrap",
  html: `<span class="atlas-pin atlas-pin--picked"><span class="atlas-pin-dot"></span></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/**
 * Feature lettering is printed, but an overview sheet with every name set
 * at once is noise: names fade in from this zoom on (hover and selection
 * always show one). The legend keeps the full list at any zoom.
 */
const LABEL_MIN_ZOOM = -1;

function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoom(map.getZoom());
    },
  });
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  return null;
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
const TRACK_ACCENT = "#75371a";

function routeHalo(leg: RouteLeg) {
  return {
    color: "rgba(238, 226, 197, 0.75)",
    weight: 6.2,
    dashArray: leg.dash,
    lineCap: leg.cap,
    interactive: false,
  } as const;
}

function routeInk(leg: RouteLeg, active: boolean) {
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
function routeShipIcon(leg: RouteLeg, active: boolean) {
  const placement = legShipPlacement(leg);
  const art = SHIP_ART[leg.ship];
  const flip = placement.flip ? " scaleX(-1)" : "";
  return divIcon({
    className: "atlas-route-ship-wrap",
    html: `<span class="atlas-route-ship" style="color:${active ? TRACK_ACCENT : SHIP_INK};width:${art.w}px;height:${art.h}px;transform:translate(-50%,-50%) rotate(${placement.angleDeg}deg) translateY(-14px)${flip}"><span class="mask-ink" style="--ink-mask:url('${shipMaskUrl(leg.ship)}')"></span></span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * A beast of the margins, drawn at its natural marginalia size — larger
 * than any printed mark, because it is not a printed mark: the annotator's
 * iron-gall engraving of what surfaces there. The engraving is an alpha
 * mask painted in currentColor (see monsters.ts), so CSS re-inks it like
 * every other mark. Clicking one opens its creature page; there is nothing
 * else to preview about a thing like this.
 */
function monsterIcon(monster: MapMonster) {
  const { w, h } = monster.art;
  return divIcon({
    className: "atlas-monster-wrap",
    html: `<span class="atlas-monster"><span class="mask-ink" style="--ink-mask:url('${monsterMaskUrl(monster.slug)}')"></span><span class="atlas-monster-label">${monster.name}</span></span>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
  });
}

/** A logged date beside its fix — "Mch. 22", in the ink of its track. */
function routeDateIcon(fix: RouteFix, leg: RouteLeg, active: boolean) {
  return divIcon({
    className: "atlas-route-date-wrap",
    html: `<span class="atlas-route-date" style="color:${active ? TRACK_ACCENT : leg.color};left:${fix.dx}px;top:${fix.dy}px">${fix.label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function routeLabelIcon(leg: RouteLeg, angleDeg: number, active: boolean) {
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

/** The vessel's engraving as it sails the chart, keying the legend row. */
function LegendShip({ leg }: { leg: RouteLeg }) {
  return (
    <span
      className="legend-ship mask-ink"
      style={
        {
          color: SHIP_INK,
          "--ink-mask": `url('${shipMaskUrl(leg.ship)}')`,
        } as CSSProperties
      }
      aria-hidden
    />
  );
}

/** The vessel's line style as a legend swatch. */
function LegendDash({ leg }: { leg: RouteLeg }) {
  return (
    <svg className="legend-dash" viewBox="0 0 26 6" aria-hidden="true">
      <line
        x1="0"
        y1="3"
        x2="26"
        y2="3"
        stroke={leg.color}
        strokeWidth="2"
        strokeDasharray={leg.dash}
        strokeLinecap={leg.cap}
      />
    </svg>
  );
}

/** The beast as engraved on the chart, keying its legend row. */
function LegendMonster({ slug }: { slug: MonsterKind }) {
  return (
    <span
      className="legend-monster mask-ink"
      style={{ "--ink-mask": `url('${monsterMaskUrl(slug)}')` } as CSSProperties}
      aria-hidden
    />
  );
}

/** The same vignette as on the chart, in ink — the legend's key column. */
function LegendGlyph({ type }: { type: string }) {
  return (
    <svg
      className="legend-glyph"
      viewBox="0 0 28 28"
      aria-hidden
      dangerouslySetInnerHTML={{
        __html: VIGNETTES[type] ?? VIGNETTES.default,
      }}
    />
  );
}

/**
 * Deep link from entity pages: /?focus=slug lands the chart on that pin.
 * Read client-side (and inside the map, where the instance is guaranteed),
 * so the page itself stays fully static.
 */
function DeepLinkFocus({
  chart,
  locations,
  onSelect,
}: {
  chart: AtlasMap;
  locations: MapLocation[];
  onSelect: (location: MapLocation) => void;
}) {
  const map = useMap();
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const slug = new URLSearchParams(window.location.search).get("focus");
    const target = slug ? locations.find((l) => l.slug === slug) : undefined;
    if (!target) return;
    onSelect(target);
    map.setView(
      pixelToLatLng(target, chart),
      Math.max(map.getZoom(), FOCUS_ZOOM),
      { animate: false },
    );
  }, [map, chart, locations, onSelect]);
  return null;
}

/** Clicks on empty map: close the preview panel, or pick coordinates. */
function MapClicks({
  chart,
  onClick,
}: {
  chart: AtlasMap;
  onClick: (point: PixelPoint) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(latLngToPixel(e.latlng.lat, e.latlng.lng, chart));
    },
  });
  return null;
}

interface Props {
  /** The chart this widget draws — an entry of the MAPS registry. */
  chart: AtlasMap;
  locations: MapLocation[];
  /** Story sections of the legend panel; omit to render the bare chart. */
  legend?: MapLegendGroup[];
  /** Dev-only coordinate picker mode: click → pixel coords + JSON snippet. */
  picker?: boolean;
  /** Picker only: the placement queue — locations with no `map` yet. */
  unplaced?: UnplacedLocation[];
}

export default function WorldMapClient({
  chart,
  locations,
  legend,
  picker = false,
  unplaced = [],
}: Props) {
  const router = useRouter();
  const mapRef = useRef<LeafletMap | null>(null);
  /* Voyage tracks are logged in the pixels of the chart that carries them —
     the per-chart registry (routes.ts) says which legs this sheet sails.
     The annotator's beasts likewise name their chart (monsters.ts). */
  const chartLegs = routeLegs(chart.id);
  const chartMonsters = useMemo(
    () => MONSTERS.filter((monster) => monster.mapId === chart.id),
    [chart.id],
  );
  const bounds = useMemo<LatLngBoundsExpression>(
    () => [
      [0, 0],
      [chart.height, chart.width],
    ],
    [chart],
  );
  const [selected, setSelected] = useState<MapLocation | null>(null);
  const [selectedLeg, setSelectedLeg] = useState<RouteLeg | null>(null);
  const [labelsShown, setLabelsShown] = useState(false);
  /* Nothing is marked on a sheet that isn't there yet: the pins, tracks and
     beasts stay unprinted until the chart's first tiles are down, or the
     small marks arrive first and hover for a moment over the dark binding.
     A chart already in the cache starts printed, so a reader coming back
     from a location page doesn't sit through the marks fading up again. */
  const [paperReady, setPaperReady] = useState(() => chartIsWarm(chart));
  /* Stable: ChartTiles holds a leaflet layer, and a new identity here would
     tear the chart down and rebuild it on every selection and every zoom. */
  const handlePaperReady = useCallback(() => setPaperReady(true), []);
  const [picked, setPicked] = useState<PixelPoint | null>(null);
  const [copied, setCopied] = useState(false);
  /* Picker mode: the queued location the next chart click will pin. */
  const [placing, setPlacing] = useState<string | null>(null);
  /* Picker mode: pins dragged off their printed position, keyed by slug.
     Saved to content/locations/*.json by the dev-only /admin/coords/save. */
  const [moves, setMoves] = useState<Record<string, PixelPoint>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // This component only renders client-side (ssr: false), so the viewport
  // is known on first render: the legend starts open except on phones.
  const [legendOpen, setLegendOpen] = useState(
    () => window.matchMedia("(min-width: 640px)").matches,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setSelectedLeg(null);
        setPicked(null);
        setPlacing(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const snippet = picked
    ? `"map": { "mapId": "${chart.id}", "x": ${picked.x}, "y": ${picked.y} }`
    : "";

  const copySnippet = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveMoves = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/admin/coords/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moves: Object.entries(moves).map(([slug, p]) => ({ slug, mapId: chart.id, ...p })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMoves({});
      router.refresh();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /** Placement queue: pin the chosen location where the click landed and
      save at once — the refreshed page returns it as an ordinary pin. */
  const placeAt = async (slug: string, point: PixelPoint) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/admin/coords/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves: [{ slug, mapId: chart.id, ...point }] }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPlacing(null);
      router.refresh();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /** Dev-only picker ops that touch content/locations/*.json then refresh. */
  const postOp = async (body: Record<string, unknown>) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/admin/coords/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * First pass: provisional coordinates for the whole placement queue. The
   * open chart goes along — anything without a placed anchor lands here,
   * not on the world scan.
   */
  const seedQueue = () => postOp({ seed: true, mapId: chart.id });

  /** Send a pin back to the queue (drop its `map`). */
  const unplace = (slug: string) => {
    setSelected(null);
    return postOp({ unplace: [slug] });
  };

  const setProminence = (slug: string, value: "major" | "minor") => {
    // Optimistic so the toggle label flips before the refresh lands.
    setSelected((prev) => (prev && prev.slug === slug ? { ...prev, prominence: value } : prev));
    return postOp({ prominence: [{ slug, value }] });
  };

  const handleMapClick = (point: PixelPoint) => {
    if (picker) {
      const inside =
        point.x >= 0 &&
        point.x <= chart.width &&
        point.y >= 0 &&
        point.y <= chart.height;
      if (placing && inside && !saving) {
        void placeAt(placing, point);
        return;
      }
      setPicked(inside ? point : null);
      setCopied(false);
    } else {
      setSelected(null);
      setSelectedLeg(null);
    }
  };

  const selectLeg = (leg: RouteLeg) => {
    setSelected(null);
    setSelectedLeg(leg);
  };

  /** Legend click on a vessel: fly to its whole track and open its preview. */
  const focusLeg = (leg: RouteLeg) => {
    selectLeg(leg);
    const map = mapRef.current;
    if (!map) return;
    map.flyToBounds(latLngBounds(leg.points.map((p) => pixelToLatLng(p, chart))), {
      padding: [70, 70],
      maxZoom: 0,
      duration: 1.1,
    });
    if (!window.matchMedia("(min-width: 640px)").matches) {
      setLegendOpen(false);
    }
  };

  /** Legend click on a beast: fly to where the annotator drew it. */
  const focusMonster = (monster: MapMonster) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(
      pixelToLatLng(monster.at, chart),
      Math.max(map.getZoom(), FOCUS_ZOOM),
      { duration: 1.1 },
    );
    if (!window.matchMedia("(min-width: 640px)").matches) {
      setLegendOpen(false);
    }
  };

  /* The signs actually printed on this sheet, in the schema's order — the
     key row for a type only appears once a charted place wears it. */
  const legendTypes = legend
    ? LOCATION_TYPE_ORDER.filter((type) =>
        legend.some((story) => story.locations.some((l) => l.type === type)),
      )
    : [];

  /* Beasts of the stories this legend lists — each marginalia keys to the
     story whose annotator drew it, so a new story brings its own beasts. */
  const legendMonsters = legend
    ? chartMonsters.filter((monster) =>
        legend.some((story) => story.slug === monster.storySlug),
      )
    : [];

  return (
    <div
      className={`world-map absolute inset-0${labelsShown ? " world-map--labels" : ""}${paperReady ? " world-map--printed" : ""}`}
    >
      <MapContainer
        ref={mapRef}
        crs={CRS.Simple}
        bounds={bounds}
        maxBounds={bounds}
        maxBoundsViscosity={1}
        minZoom={-2}
        maxZoom={chart.maxZoom ?? 1}
        zoomSnap={0.25}
        zoomDelta={0.5}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <ChartSheet chart={chart} bounds={bounds} onReady={handlePaperReady} />
        <ZoomControl position="topright" />
        <FitZoomLimit bounds={bounds} />
        <ZoomWatcher
          onZoom={(zoom) => setLabelsShown(zoom >= LABEL_MIN_ZOOM)}
        />
        <MapClicks chart={chart} onClick={handleMapClick} />
        {!picker && (
          <DeepLinkFocus
            chart={chart}
            locations={locations}
            onSelect={(location) => {
              setSelected(location);
              if (!window.matchMedia("(min-width: 640px)").matches) {
                setLegendOpen(false);
              }
            }}
          />
        )}
        {locations.map((location) => (
          <Marker
            key={location.slug}
            position={pixelToLatLng(moves[location.slug] ?? location, chart)}
            icon={locationIcon(location, selected?.slug === location.slug, chart.markerStyle)}
            alt={location.name}
            draggable={picker}
            eventHandlers={{
              click: () => {
                /* Annotation sheets: the first tap/click highlights the mark
                   and opens its preview, the second opens the page — the
                   hover-highlight contract of docs/pacific-map.md №3. */
                if (
                  !picker &&
                  chart.markerStyle === "annotation" &&
                  selected?.slug === location.slug
                ) {
                  router.push(location.href);
                  return;
                }
                setSelectedLeg(null);
                setSelected(location);
              },
              dragend: (e) => {
                const at = (e.target as LeafletMarker).getLatLng();
                setMoves((prev) => ({
                  ...prev,
                  [location.slug]: latLngToPixel(at.lat, at.lng, chart),
                }));
              },
            }}
          />
        ))}
        {/* Mounted with the paper, not faded in with it: the tracks are svg,
            and leaflet needs sole ownership of that element's transitions
            (see globals.css) — so they wait by not existing yet. */}
        {!picker &&
          paperReady &&
          chartLegs.map((leg) => {
            const positions = leg.points.map((p) => pixelToLatLng(p, chart));
            const label = legLabelPlacement(leg);
            const active = selectedLeg?.id === leg.id;
            return (
              <Fragment key={leg.id}>
                <Polyline positions={positions} pathOptions={routeHalo(leg)} />
                <Polyline
                  positions={positions}
                  pathOptions={routeInk(leg, active)}
                  eventHandlers={{ click: () => selectLeg(leg) }}
                />
                {leg.fixes.map((fix) => (
                  <Marker
                    key={fix.label}
                    position={pixelToLatLng(fix, chart)}
                    icon={routeDateIcon(fix, leg, active)}
                    interactive={false}
                    keyboard={false}
                  />
                ))}
                {shipFits(leg) && (
                  <Marker
                    position={pixelToLatLng(legShipPlacement(leg).at, chart)}
                    icon={routeShipIcon(leg, active)}
                    alt={`The ${leg.vessel}`}
                    eventHandlers={{ click: () => selectLeg(leg) }}
                  />
                )}
                <Marker
                  position={pixelToLatLng(label.at, chart)}
                  icon={routeLabelIcon(leg, label.angleDeg, active)}
                  alt={`Track of the ${leg.vessel}`}
                  eventHandlers={{ click: () => selectLeg(leg) }}
                />
              </Fragment>
            );
          })}
        {!picker &&
          chartMonsters.map((monster) => (
            <Marker
              key={monster.slug}
              position={pixelToLatLng(monster.at, chart)}
              icon={monsterIcon(monster)}
              alt={monster.name}
              eventHandlers={{
                click: () => router.push(`/creatures/${monster.slug}`),
              }}
            />
          ))}
        {picker && picked && (
          <Marker position={pixelToLatLng(picked, chart)} icon={pickedIcon} />
        )}
      </MapContainer>

      <div className="world-map-vignette" aria-hidden="true" />

      {legend && !picker && (
        <div className="absolute left-4 top-16 z-[1000] flex max-h-[calc(100%-8rem)] flex-col items-start">
          <button
            type="button"
            onClick={() => setLegendOpen((open) => !open)}
            aria-expanded={legendOpen}
            className="parchment rounded-sm px-3 py-1.5 text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
          >
            Legend {legendOpen ? "−" : "+"}
          </button>
          {legendOpen && (
            <nav
              aria-label="Map legend"
              className="parchment mt-2 min-h-0 w-64 overflow-y-auto rounded-sm p-2"
            >
              <div className="legend-cartouche px-4 pb-4 pt-3">
                {/* One shared key for the whole sheet: the stories are a
                    compact register at its head, not sections of their own —
                    every sign below explains marks of any story. */}
                <div
                  className="text-center text-base leading-none text-muted"
                  aria-hidden="true"
                >
                  ❧
                </div>

                {legend.length > 0 && (
                  <section className="mt-1.5">
                    <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                      Stories of this chart
                    </h2>
                    <div className="parchment-rule mt-2" />
                    <ul className="mt-3 space-y-1.5">
                      {legend.map((story) => (
                        <li
                          key={story.slug}
                          className="flex items-baseline justify-between gap-3 text-sm"
                        >
                          <Link
                            href={`/stories/${story.slug}`}
                            className="font-display italic leading-snug transition-colors hover:text-accent"
                          >
                            {story.title}
                          </Link>
                          <span className="text-xs tracking-widest text-muted">
                            {story.year}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Each sign is explained once, as a chart's key would —
                    the pins themselves carry the place names. */}
                {legendTypes.length > 0 && chart.markerStyle !== "annotation" && (
                  <section className="mt-6">
                    <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                      Explanation
                    </h2>
                    <div className="parchment-rule mt-2" />
                    <ul className="mt-3 space-y-1.5">
                      {legendTypes.map((type) => (
                        <li
                          key={type}
                          className="flex items-center gap-2.5 text-sm capitalize"
                        >
                          <LegendGlyph type={type} />
                          <span>{type}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Annotation sheets carry no glyphs — the key explains the
                    lettering itself: settlements in capitals, the rest in
                    the smaller italic. */}
                {legendTypes.length > 0 && chart.markerStyle === "annotation" && (
                  <section className="mt-6">
                    <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                      Explanation
                    </h2>
                    <div className="parchment-rule mt-2" />
                    <ul className="mt-3 space-y-1.5 text-sm">
                      <li className="flex items-center gap-2.5">
                        <span className="legend-annot-fix" aria-hidden />
                        <span style={{ fontVariant: "small-caps", letterSpacing: "0.14em" }}>
                          Settlement
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="legend-annot-fix" aria-hidden />
                        <span className="italic">Landmark</span>
                      </li>
                    </ul>
                  </section>
                )}

                {chartLegs.length > 0 && legend.some((story) => story.slug === ROUTE_STORY_SLUG) && (
                  <section className="mt-6">
                    <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                      Voyage tracks
                    </h2>
                    <div className="parchment-rule mt-2" />
                    <ul className="mt-3 space-y-1.5">
                      {chartLegs.map((leg) => (
                        <li key={leg.id}>
                          <button
                            type="button"
                            onClick={() => focusLeg(leg)}
                            className={`flex w-full items-center gap-2.5 text-left text-sm italic transition-colors hover:text-accent ${
                              selectedLeg?.id === leg.id ? "text-accent" : ""
                            }`}
                          >
                            <LegendShip leg={leg} />
                            <LegendDash leg={leg} />
                            <span>{leg.vessel}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {legendMonsters.length > 0 && (
                  <section className="mt-6">
                    <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                      Here be monsters
                    </h2>
                    <div className="parchment-rule mt-2" />
                    <ul className="mt-3 space-y-1.5">
                      {legendMonsters.map((monster) => (
                        <li key={monster.slug}>
                          <button
                            type="button"
                            onClick={() => focusMonster(monster)}
                            className="flex w-full items-center gap-2.5 text-left text-sm italic transition-colors hover:text-accent"
                          >
                            <LegendMonster slug={monster.slug} />
                            <span className="cap-first">{monster.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <div
                  className="mt-5 text-center text-sm leading-none text-muted"
                  aria-hidden="true"
                >
                  ❦
                </div>
              </div>
            </nav>
          )}
        </div>
      )}

      {/* The atlas' sheets as a toggle of framed, lettered tiles in a
          cartouche of their own, apart from the legend's key — a nameless
          strip of miniatures read as decoration, not navigation. The current
          sheet is no link; its frame is the annotator's vermilion. */}
      {!picker && Object.keys(MAPS).length > 1 && (
        <nav
          aria-label="Charts of the atlas"
          className="parchment absolute bottom-6 right-4 z-[1000] rounded-sm p-2"
        >
          <div className="legend-cartouche px-3 pb-3 pt-2">
            <h2 className="text-center text-xs uppercase tracking-widest text-muted">
              Charts
            </h2>
            <div className="parchment-rule mt-2" />
            <div className="mt-3 flex flex-col gap-3">
              {Object.values(MAPS).map((m) =>
                m.id === chart.id ? (
                  <span
                    key={m.id}
                    aria-current="page"
                    title={`${m.title} — this sheet`}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className="chart-tile chart-tile--current"
                      style={{ backgroundImage: `url(${m.insetUrl})` }}
                    />
                    <span className="font-display text-[13px] italic leading-none text-accent">
                      {m.shortTitle}
                    </span>
                    <span className="sr-only">{m.title} — this sheet</span>
                  </span>
                ) : (
                  <Link
                    key={m.id}
                    href={chartPath(m.id)}
                    title={m.title}
                    className="group flex flex-col items-center gap-1"
                  >
                    <span
                      className="chart-tile"
                      style={{ backgroundImage: `url(${m.insetUrl})` }}
                    />
                    <span className="font-display text-[13px] italic leading-none transition-colors group-hover:text-accent">
                      {m.shortTitle}
                    </span>
                    <span className="sr-only">{m.title}</span>
                  </Link>
                ),
              )}
            </div>
          </div>
        </nav>
      )}

      {!picker && selected && (
        <aside className="parchment absolute bottom-6 left-4 right-4 z-[1000] max-h-[55%] max-w-sm overflow-y-auto rounded-sm p-5 sm:right-auto">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs uppercase tracking-widest text-muted">
              {selected.type}
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="-mr-1 -mt-1 px-1 text-muted transition-colors hover:text-foreground"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
          <h2 className="cap-first mt-1 font-display text-2xl">{selected.name}</h2>
          <div className="parchment-rule mt-2" />
          {(() => {
            const thumb = getPlateThumb("locations", selected.slug);
            return (
              <div className="mt-3 flex items-start gap-3">
                <p className="min-w-0 flex-1 text-sm leading-relaxed">
                  {selected.summary}
                </p>
                {thumb && (
                  <Image
                    src={thumb.image}
                    alt={thumb.alt}
                    width={80}
                    className="mt-1 h-auto w-20 shrink-0 border border-line"
                  />
                )}
              </div>
            );
          })()}
          {selected.figures.length > 0 && (
            <p className="mt-3 text-sm leading-relaxed">
              <span className="text-xs uppercase tracking-widest text-muted">
                Encountered here —{" "}
              </span>
              {selected.figures.map((figure, i) => (
                <Fragment key={`${figure.kind}/${figure.slug}`}>
                  {i > 0 && ", "}
                  <Link
                    href={`/${figure.kind}/${figure.slug}`}
                    className="italic transition-colors hover:text-accent"
                  >
                    {figure.name}
                  </Link>
                </Fragment>
              ))}
            </p>
          )}
          <Link
            href={selected.href}
            className="mt-4 inline-block text-sm italic text-accent transition-colors hover:text-foreground"
          >
            Open location →
          </Link>
        </aside>
      )}

      {!picker && selectedLeg && (
        <aside className="parchment absolute bottom-6 left-4 right-4 z-[1000] max-h-[55%] max-w-md overflow-y-auto rounded-sm p-5 sm:right-auto">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs uppercase tracking-widest text-muted">
              Voyage track
            </span>
            <button
              type="button"
              onClick={() => setSelectedLeg(null)}
              className="-mr-1 -mt-1 px-1 text-muted transition-colors hover:text-foreground"
              aria-label="Close track preview"
            >
              ✕
            </button>
          </div>
          <h2 className="mt-1 font-display text-2xl italic">{selectedLeg.vessel}</h2>
          <div className="parchment-rule mt-2" />
          <p className="mt-3 text-sm leading-relaxed">{selectedLeg.course}</p>
          {selectedLeg.quotes.map((quote) => (
            <blockquote
              key={quote.slice(0, 40)}
              className="mt-3 border-l-2 border-accent pl-3 font-serif text-sm italic leading-relaxed"
            >
              “{quote}”
            </blockquote>
          ))}
          <p className="mt-2 text-xs uppercase tracking-widest text-muted">
            {selectedLeg.attribution}
          </p>
        </aside>
      )}

      {picker && (
        <aside className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md rounded-lg border border-line bg-surface/95 p-5 shadow-xl shadow-black/40 backdrop-blur sm:right-auto">
          <span className="text-xs uppercase tracking-widest text-muted">
            Coordinate picker · dev only
          </span>
          {Object.keys(MAPS).length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {/* Plain anchors: the picker page reads ?map= server-side, so
                  switching charts is a full reload with fresh picker data. */}
              {Object.values(MAPS).map((m) => (
                <a
                  key={m.id}
                  href={`/admin/coords?map=${m.id}`}
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                    m.id === chart.id
                      ? "border-accent text-accent"
                      : "border-line text-muted hover:border-accent"
                  }`}
                >
                  {m.title}
                </a>
              ))}
            </div>
          )}
          {selected && (
            <div className="mt-3 border-b border-line pb-3">
              <p className="text-sm font-medium">
                {selected.name}
                <span className="ml-2 text-xs uppercase tracking-widest text-muted">
                  {selected.prominence ?? "major"}
                </span>
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setProminence(
                      selected.slug,
                      selected.prominence === "minor" ? "major" : "minor",
                    )
                  }
                  className="rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent disabled:opacity-50"
                >
                  → {selected.prominence === "minor" ? "major" : "minor"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => unplace(selected.slug)}
                  className="rounded-md border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent disabled:opacity-50"
                >
                  ⌫ off map
                </button>
              </div>
            </div>
          )}
          {unplaced.length > 0 && (
            <div className="mt-3 border-b border-line pb-3">
              <p className="text-xs uppercase tracking-widest text-muted">
                Placement queue
              </p>
              <ul className="mt-1.5 max-h-32 space-y-1 overflow-y-auto">
                {unplaced.map((location) => (
                  <li key={location.slug}>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setPlacing(placing === location.slug ? null : location.slug)
                      }
                      className={`w-full rounded-md border px-2 py-1 text-left text-sm transition-colors disabled:opacity-50 ${
                        placing === location.slug
                          ? "border-accent text-accent"
                          : "border-line hover:border-accent"
                      }`}
                    >
                      {location.name}
                      <span className="ml-2 text-xs uppercase tracking-widest text-muted">
                        {location.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                {placing
                  ? saving
                    ? "Saving…"
                    : "Click the chart to place it (Esc to cancel)."
                  : "Pick a location, then click the chart — or seed them all at once."}
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={seedQueue}
                title="Provisional pins near each location's parent / connection / New England — then drag to refine"
                className="mt-2 w-full rounded-md border border-accent px-3 py-1.5 text-sm text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
              >
                {saving ? "Seeding…" : `Seed queue (${unplaced.length}) near anchors`}
              </button>
              {saveError && Object.keys(moves).length === 0 && (
                <p className="mt-1 text-xs text-red-400">{saveError}</p>
              )}
            </div>
          )}
          {picked ? (
            <>
              <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-background px-3 py-2 font-mono text-sm">
                {snippet}
              </pre>
              <button
                type="button"
                onClick={copySnippet}
                className="mt-3 rounded-md border border-line px-3 py-1.5 text-sm text-accent transition-colors hover:border-accent"
              >
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Drag a pin to move a location, or click the map to get pixel
              coordinates for a new one.
            </p>
          )}
          {Object.keys(moves).length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <ul className="max-h-32 space-y-1 overflow-y-auto font-mono text-xs text-muted">
                {Object.entries(moves).map(([slug, p]) => (
                  <li key={slug}>
                    {slug} → {p.x}, {p.y}
                  </li>
                ))}
              </ul>
              {saveError && (
                <p className="mt-2 text-xs text-red-400">{saveError}</p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={saveMoves}
                  disabled={saving}
                  className="rounded-md border border-line px-3 py-1.5 text-sm text-accent transition-colors hover:border-accent disabled:opacity-50"
                >
                  {saving
                    ? "Saving…"
                    : `Save ${Object.keys(moves).length} to content/`}
                </button>
                <button
                  type="button"
                  onClick={() => setMoves({})}
                  disabled={saving}
                  className="rounded-md border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
