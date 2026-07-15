"use client";

import "leaflet/dist/leaflet.css";
import {
  CRS,
  divIcon,
  type LatLngBoundsExpression,
  type Map as LeafletMap,
} from "leaflet";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ImageOverlay,
  MapContainer,
  Marker,
  ZoomControl,
  useMapEvents,
} from "react-leaflet";
import {
  WORLD_MAP,
  latLngToPixel,
  pixelToLatLng,
  type MapLegendGroup,
  type MapLocation,
  type PixelPoint,
} from "./geometry";

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

function locationIcon(name: string, active: boolean) {
  return divIcon({
    className: "atlas-pin-wrap",
    html: `<span class="atlas-pin${active ? " atlas-pin--active" : ""}"><span class="atlas-pin-dot"></span><span class="atlas-pin-label">${name}</span></span>`,
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
    }
  };

  const focusLocation = (location: MapLocation) => {
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
        {locations.map((location) => (
          <Marker
            key={location.slug}
            position={pixelToLatLng(location)}
            icon={locationIcon(location.name, selected?.slug === location.slug)}
            alt={location.name}
            eventHandlers={{ click: () => setSelected(location) }}
          />
        ))}
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
        <aside className="parchment absolute bottom-6 left-4 right-4 z-[1000] max-w-sm rounded-sm p-5 sm:right-auto">
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
          <div className="parchment-rule mt-2" />
          <p className="mt-3 text-sm leading-relaxed">{selected.summary}</p>
          <Link
            href={`/locations/${selected.slug}`}
            className="mt-4 inline-block text-sm italic text-accent transition-colors hover:text-foreground"
          >
            Open location →
          </Link>
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
