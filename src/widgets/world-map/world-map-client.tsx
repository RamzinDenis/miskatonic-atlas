"use client";

import "leaflet/dist/leaflet.css";
import {
  CRS,
  latLngBounds,
  svg,
  type LatLngBoundsExpression,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
} from "leaflet";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  type CSSProperties,
} from "react";
import { MapContainer, Marker, Polyline, ZoomControl } from "react-leaflet";
import { ChartSheet, chartIsWarm } from "./chart-sheet";
import {
  MAPS,
  latLngToPixel,
  pixelToLatLng,
  type AtlasMap,
  type MapLegendGroup,
  type MapLocation,
  type PixelPoint,
  type UnplacedLocation,
} from "./geometry";
import { LegendPanel } from "./legend-panel";
import {
  DeepLinkFocus,
  FitZoomLimit,
  focusCenter,
  focusZoom,
  LABEL_MIN_ZOOM,
  MapClicks,
  ZoomWatcher,
} from "./map-utils";
import {
  locationIcon,
  monsterIcon,
  pickedIcon,
  routeDateIcon,
  routeHalo,
  routeInk,
  routeLabelIcon,
  routeShipIcon,
} from "./marks";
import { MONSTERS, type MapMonster } from "./monsters";
import { PickerPanel } from "./picker-panel";
import { LocationPreview, TrackPreview } from "./previews";
import { RegionsNav } from "./regions-nav";
import { legLabelPlacement, legShipPlacement, routeLegs, shipFits, type RouteLeg } from "./routes";

/**
 * The chart's stateful core: leaflet map, markers, tracks and beasts, plus
 * the selection / picker state every panel shares. The looks of the marks
 * live in marks.ts, the panels in legend-panel / regions-nav / previews /
 * picker-panel, the map-instance helpers in map-utils.
 */

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
  /* Leaflet's svg pane only covers the viewport plus 10% by default, so a
     pan past that edge visibly reprints the voyage tracks — constant on a
     phone, where the cover zoom shows half the sheet. Two viewports of
     padding keep the whole chart's ink drawn at once. */
  const inkRenderer = useMemo(() => svg({ padding: 2 }), []);
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
  // is known on first render: the legend and the region toggle start open
  // except on phones, where either cartouche would cover half the sheet.
  const [legendOpen, setLegendOpen] = useState(
    () => window.matchMedia("(min-width: 640px)").matches,
  );
  const [regionsOpen, setRegionsOpen] = useState(
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
    const zoom = focusZoom(map, chart);
    map.flyTo(focusCenter(map, pixelToLatLng(monster.at, chart), zoom), zoom, {
      duration: 1.1,
    });
    if (!window.matchMedia("(min-width: 640px)").matches) {
      setLegendOpen(false);
    }
  };

  /* Beasts of the stories this legend lists — each marginalia keys to the
     story whose annotator drew it, so a new story brings its own beasts. */
  const legendMonsters = legend
    ? chartMonsters.filter((monster) =>
        legend.some((story) => story.slug === monster.storySlug),
      )
    : [];

  return (
    <div
      className={`world-map absolute inset-0${labelsShown ? " world-map--labels" : ""}${paperReady ? " world-map--printed" : ""}${chart.tone === "art" ? " world-map--art" : ""}`}
      /* The thumb, blown up to fill the frame, stands behind the leaflet
         map until the sheet is printed: a chart opened for the first time
         this session takes a moment to draw, and that moment should show
         aged paper rather than the bare binding. Once printed the underlay
         is dropped and the binding shows through the sheet's margins as
         before. */
      style={{ "--chart-thumb": `url(${chart.lqipUrl})` } as CSSProperties}
    >
      <MapContainer
        ref={mapRef}
        crs={CRS.Simple}
        renderer={inkRenderer}
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
            icon={locationIcon(location, selected?.slug === location.slug, chart)}
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
        <LegendPanel
          legend={legend}
          markerStyle={chart.markerStyle}
          chartLegs={chartLegs}
          legendMonsters={legendMonsters}
          open={legendOpen}
          onToggle={() => setLegendOpen((open) => !open)}
          selectedLeg={selectedLeg}
          onFocusLeg={focusLeg}
          onFocusMonster={focusMonster}
        />
      )}

      {!picker && Object.keys(MAPS).length > 1 && (
        <RegionsNav
          chartId={chart.id}
          open={regionsOpen}
          onToggle={() => setRegionsOpen((open) => !open)}
        />
      )}

      {!picker && selected && (
        <LocationPreview location={selected} onClose={() => setSelected(null)} />
      )}

      {!picker && selectedLeg && (
        <TrackPreview leg={selectedLeg} onClose={() => setSelectedLeg(null)} />
      )}

      {picker && (
        <PickerPanel
          chart={chart}
          selected={selected}
          unplaced={unplaced}
          placing={placing}
          saving={saving}
          saveError={saveError}
          picked={picked}
          snippet={snippet}
          copied={copied}
          moves={moves}
          onToggleProminence={(location) =>
            setProminence(
              location.slug,
              location.prominence === "minor" ? "major" : "minor",
            )
          }
          onUnplace={unplace}
          onTogglePlacing={(slug) => setPlacing(placing === slug ? null : slug)}
          onSeedQueue={seedQueue}
          onCopySnippet={copySnippet}
          onSaveMoves={saveMoves}
          onResetMoves={() => setMoves({})}
        />
      )}
    </div>
  );
}
