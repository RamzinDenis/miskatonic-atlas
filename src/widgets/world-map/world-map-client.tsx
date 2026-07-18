"use client";

import "leaflet/dist/leaflet.css";
import {
  CRS,
  divIcon,
  type LatLngBoundsExpression,
  type Map as LeafletMap,
} from "leaflet";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ImageOverlay,
  MapContainer,
  Marker,
  Polyline,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { getPlateThumb } from "@/widgets/plates";
import {
  WORLD_MAP,
  formatDegrees,
  latLngToPixel,
  pixelToLatLng,
  type MapLegendGroup,
  type MapLocation,
  type PixelPoint,
} from "./geometry";
import { ROUTE_LEGS, legLabelPlacement, type RouteLeg } from "./routes";

const IMAGE_BOUNDS: LatLngBoundsExpression = [
  [0, 0],
  [WORLD_MAP.height, WORLD_MAP.width],
];

/** Zoom the legend flies to — close enough to read the chart around a pin. */
const FOCUS_ZOOM = -0.5;

/**
 * Panning must stay within the chart: zooming out stops at "whole map
 * visible", so the image can never float loose inside the viewport.
 */
function applyFitZoomLimit(map: LeafletMap) {
  const fitZoom = map.getBoundsZoom(IMAGE_BOUNDS, false);
  map.setMinZoom(fitZoom);
  if (map.getZoom() < fitZoom) map.setZoom(fitZoom);
}

function FitZoomLimit() {
  const map = useMapEvents({
    resize() {
      applyFitZoomLimit(map);
    },
  });
  useEffect(() => {
    applyFitZoomLimit(map);
  }, [map]);
  return null;
}

/**
 * Chart symbols by kind of feature: a brass ring for settlements, an island
 * peak for ruins, waves for open sea, a diamond for regions — the way old
 * charts vary their marks. Stroke colors are literal because leaflet builds
 * these outside the styled tree.
 */
const PIN_GLYPHS: Record<string, string> = {
  ruin: `<svg class="atlas-pin-glyph" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 11.5 L7 2.5 L12 11.5 Z" fill="rgba(19,16,9,0.55)" stroke="#c39e66" stroke-width="2" stroke-linejoin="round"/></svg>`,
  sea: `<svg class="atlas-pin-glyph" viewBox="0 0 14 14" aria-hidden="true"><path d="M1.5 5.5 q2.75 -3 5.5 0 t5.5 0 M1.5 9.5 q2.75 -3 5.5 0 t5.5 0" fill="none" stroke="#c39e66" stroke-width="2" stroke-linecap="round"/></svg>`,
  region: `<svg class="atlas-pin-glyph" viewBox="0 0 14 14" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" transform="rotate(45 7 7)" fill="rgba(19,16,9,0.55)" stroke="#c39e66" stroke-width="2"/></svg>`,
};

function locationIcon(location: MapLocation, active: boolean) {
  const glyph =
    PIN_GLYPHS[location.type] ?? `<span class="atlas-pin-dot"></span>`;
  return divIcon({
    className: "atlas-pin-wrap",
    html: `<span class="atlas-pin${active ? " atlas-pin--active" : ""}">${glyph}<span class="atlas-pin-label">${location.name}</span></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const pickedIcon = divIcon({
  className: "atlas-pin-wrap",
  html: `<span class="atlas-pin atlas-pin--picked"><span class="atlas-pin-dot"></span></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/**
 * Voyage tracks: each dashed ink line is drawn over a slightly wider
 * paper-colored twin with the same dash pattern, so every dash gets the
 * light halo that keeps chart lettering legible on the etched scan.
 */
const ROUTE_HALO = {
  color: "rgba(238, 226, 197, 0.85)",
  weight: 5,
  dashArray: "7 7",
  lineCap: "butt",
  interactive: false,
} as const;

function routeInk(active: boolean) {
  return {
    color: active ? "#75371a" : "#2b1e08",
    weight: 2,
    opacity: 0.9,
    dashArray: "7 7",
    lineCap: "butt",
    bubblingMouseEvents: false,
  } as const;
}

function routeLabelIcon(leg: RouteLeg, angleDeg: number, active: boolean) {
  return divIcon({
    className: "atlas-route-label-wrap",
    html: `<span class="atlas-route-label${active ? " atlas-route-label--active" : ""}" style="transform:translate(-50%,-50%) rotate(${angleDeg}deg) translateY(-11px)">${leg.vessel}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Deep link from entity pages: /?focus=slug lands the chart on that pin.
 * Read client-side (and inside the map, where the instance is guaranteed),
 * so the page itself stays fully static.
 */
function DeepLinkFocus({
  locations,
  onSelect,
}: {
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
      pixelToLatLng(target),
      Math.max(map.getZoom(), FOCUS_ZOOM),
      { animate: false },
    );
  }, [map, locations, onSelect]);
  return null;
}

/** Clicks on empty map: close the preview panel, or pick coordinates. */
function MapClicks({
  onClick,
}: {
  onClick: (point: PixelPoint) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(latLngToPixel(e.latlng.lat, e.latlng.lng));
    },
  });
  return null;
}

interface Props {
  locations: MapLocation[];
  /** Story sections of the legend panel; omit to render the bare chart. */
  legend?: MapLegendGroup[];
  /** Dev-only coordinate picker mode: click → pixel coords + JSON snippet. */
  picker?: boolean;
}

export default function WorldMapClient({
  locations,
  legend,
  picker = false,
}: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [selected, setSelected] = useState<MapLocation | null>(null);
  const [selectedLeg, setSelectedLeg] = useState<RouteLeg | null>(null);
  const [picked, setPicked] = useState<PixelPoint | null>(null);
  const [copied, setCopied] = useState(false);
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const snippet = picked
    ? `"map": { "x": ${picked.x}, "y": ${picked.y} }`
    : "";

  const copySnippet = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMapClick = (point: PixelPoint) => {
    if (picker) {
      const inside =
        point.x >= 0 &&
        point.x <= WORLD_MAP.width &&
        point.y >= 0 &&
        point.y <= WORLD_MAP.height;
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

  const focusLocation = (location: MapLocation) => {
    setSelectedLeg(null);
    setSelected(location);
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(
      pixelToLatLng(location),
      Math.max(map.getZoom(), FOCUS_ZOOM),
      { duration: 1.1 },
    );
    // On a phone the open legend covers the pin the user just chose.
    if (!window.matchMedia("(min-width: 640px)").matches) {
      setLegendOpen(false);
    }
  };

  return (
    <div className="world-map absolute inset-0">
      <MapContainer
        ref={mapRef}
        crs={CRS.Simple}
        bounds={IMAGE_BOUNDS}
        maxBounds={IMAGE_BOUNDS}
        maxBoundsViscosity={1}
        minZoom={-2}
        maxZoom={1}
        zoomSnap={0.25}
        zoomDelta={0.5}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <ImageOverlay url={WORLD_MAP.url} bounds={IMAGE_BOUNDS} />
        <ZoomControl position="topright" />
        <FitZoomLimit />
        <MapClicks onClick={handleMapClick} />
        {!picker && (
          <DeepLinkFocus
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
            position={pixelToLatLng(location)}
            icon={locationIcon(location, selected?.slug === location.slug)}
            alt={location.name}
            eventHandlers={{
              click: () => {
                setSelectedLeg(null);
                setSelected(location);
              },
            }}
          />
        ))}
        {!picker &&
          ROUTE_LEGS.map((leg) => {
            const positions = leg.points.map(pixelToLatLng);
            const label = legLabelPlacement(leg);
            const active = selectedLeg?.id === leg.id;
            return (
              <Fragment key={leg.id}>
                <Polyline positions={positions} pathOptions={ROUTE_HALO} />
                <Polyline
                  positions={positions}
                  pathOptions={routeInk(active)}
                  eventHandlers={{ click: () => selectLeg(leg) }}
                />
                <Marker
                  position={pixelToLatLng(label.at)}
                  icon={routeLabelIcon(leg, label.angleDeg, active)}
                  alt={`Track of the ${leg.vessel}`}
                  eventHandlers={{ click: () => selectLeg(leg) }}
                />
              </Fragment>
            );
          })}
        {picker && picked && (
          <Marker position={pixelToLatLng(picked)} icon={pickedIcon} />
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
              className="parchment mt-2 min-h-0 w-64 overflow-y-auto rounded-sm p-5"
            >
              {legend.map((story) => (
                <section key={story.slug} className="mt-6 first:mt-0">
                  <h2 className="font-display text-lg italic leading-snug">
                    <Link
                      href={`/stories/${story.slug}`}
                      className="transition-colors hover:text-accent"
                    >
                      {story.title}
                    </Link>
                  </h2>
                  <p className="text-xs tracking-widest text-muted">
                    {story.year}
                  </p>
                  <div className="parchment-rule mt-2" />
                  <ul className="mt-3 space-y-1.5">
                    {story.locations.map((location) => (
                      <li key={location.slug}>
                        <button
                          type="button"
                          onClick={() => focusLocation(location)}
                          className={`w-full text-left text-sm transition-colors hover:text-accent ${
                            selected?.slug === location.slug
                              ? "text-accent"
                              : ""
                          }`}
                        >
                          {location.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </nav>
          )}
        </div>
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
          <h2 className="mt-1 font-display text-2xl">{selected.name}</h2>
          <p className="mt-0.5 text-xs tracking-widest text-muted">
            {formatDegrees(selected)}
          </p>
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
            href={`/locations/${selected.slug}`}
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
              Click the map to get pixel coordinates of world.jpg for a
              location&apos;s <code className="font-mono">map</code> field.
            </p>
          )}
        </aside>
      )}
    </div>
  );
}
