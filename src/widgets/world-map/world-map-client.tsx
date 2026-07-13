"use client";

import "leaflet/dist/leaflet.css";
import {
  CRS,
  divIcon,
  type LatLngBoundsExpression,
  type Map as LeafletMap,
} from "leaflet";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageOverlay, MapContainer, Marker, useMapEvents } from "react-leaflet";
import {
  WORLD_MAP,
  latLngToPixel,
  pixelToLatLng,
  type MapLocation,
  type PixelPoint,
} from "./geometry";

const IMAGE_BOUNDS: LatLngBoundsExpression = [
  [0, 0],
  [WORLD_MAP.height, WORLD_MAP.width],
];

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

function locationIcon(name: string) {
  return divIcon({
    className: "atlas-pin-wrap",
    html: `<span class="atlas-pin"><span class="atlas-pin-dot"></span><span class="atlas-pin-label">${name}</span></span>`,
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
  /** Dev-only coordinate picker mode: click → pixel coords + JSON snippet. */
  picker?: boolean;
}

export default function WorldMapClient({ locations, picker = false }: Props) {
  const [selected, setSelected] = useState<MapLocation | null>(null);
  const [picked, setPicked] = useState<PixelPoint | null>(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="world-map absolute inset-0">
      <MapContainer
        crs={CRS.Simple}
        bounds={IMAGE_BOUNDS}
        maxBounds={IMAGE_BOUNDS}
        maxBoundsViscosity={1}
        minZoom={-2}
        maxZoom={1}
        zoomSnap={0.25}
        zoomDelta={0.5}
        attributionControl={false}
        className="h-full w-full"
      >
        <ImageOverlay url={WORLD_MAP.url} bounds={IMAGE_BOUNDS} />
        <FitZoomLimit />
        <MapClicks onClick={handleMapClick} />
        {locations.map((location) => (
          <Marker
            key={location.slug}
            position={pixelToLatLng(location)}
            icon={locationIcon(location.name)}
            alt={location.name}
            eventHandlers={{ click: () => setSelected(location) }}
          />
        ))}
        {picker && picked && (
          <Marker position={pixelToLatLng(picked)} icon={pickedIcon} />
        )}
      </MapContainer>

      <div className="world-map-vignette" aria-hidden="true" />

      {!picker && selected && (
        <aside className="absolute bottom-4 left-4 right-4 z-[1000] max-w-sm rounded-lg border border-line bg-surface/95 p-5 shadow-xl shadow-black/40 backdrop-blur sm:right-auto">
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
          <h2 className="mt-1 font-serif text-2xl">{selected.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {selected.summary}
          </p>
          <Link
            href={`/locations/${selected.slug}`}
            className="mt-4 inline-block text-sm text-accent transition-colors hover:text-foreground"
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
