import Link from "next/link";
import { getAtlasMap } from "./geometry";

/**
 * A static excerpt of the chart on a location page: the scan cropped around
 * the location's pin, no leaflet involved. Rendering an inset for a minor
 * location is fine — prominence only keeps it off the shared map and
 * indexes; the deep link to the chart is therefore majors-only.
 */

/**
 * Scan pixels per inset pixel — a regional view around the pin. The source
 * is the chart's quarter-size inset copy (for the world, 190 KB against the
 * scan's 3.6 MB, which every location page would otherwise pull for a 176px
 * strip), so the backdrop is drawn at twice its own size: softer, but it
 * sits under sepia and a wear sheet at strip height, where the hairlines
 * were never legible.
 */
const INSET_SCALE = 0.5;

export function MapInset({
  map,
  name,
  chartHref,
}: {
  /** The location's placement — `map` as stored in content. */
  map: { mapId: string; x: number; y: number };
  name: string;
  /** Link target on the full chart; omit for minor locations. */
  chartHref?: string;
}) {
  const chart = getAtlasMap(map.mapId);
  const sheetW = chart.width * INSET_SCALE;
  const sheetH = chart.height * INSET_SCALE;
  const pinX = map.x * INSET_SCALE;
  const pinY = map.y * INSET_SCALE;
  // The sheet layer is a positioned child of the strip: `50% − pin` centers
  // the pin, and the clamp keeps the sheet's edges at or past the strip's —
  // a pin near a margin gets an off-center crop instead of blank backing.
  // The ring is anchored to the same variables, so it follows the pin
  // wherever the crop settles. (Valid while the sheet outsizes the strip,
  // which the article column guarantees.)
  const inset = {
    "--inset-left": `clamp(calc(100% - ${sheetW}px), calc(50% - ${pinX}px), 0px)`,
    "--inset-top": `clamp(calc(100% - ${sheetH}px), calc(50% - ${pinY}px), 0px)`,
    "--inset-x": `${pinX}px`,
    "--inset-y": `${pinY}px`,
  } as React.CSSProperties;

  return (
    <figure className="mt-10">
      <div
        className="map-inset h-44 w-full rounded-sm"
        role="img"
        aria-label={`Excerpt of the chart around ${name}`}
        style={inset}
      >
        <div
          className="map-inset-scan"
          style={{
            backgroundImage: `url(${chart.insetUrl})`,
            width: `${sheetW}px`,
            height: `${sheetH}px`,
            backgroundSize: `${sheetW}px ${sheetH}px`,
          }}
        />
        <span className="atlas-pin map-inset-pin">
          <span className="atlas-pin-dot" />
        </span>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs uppercase tracking-widest text-muted">
        {/* Fictional geography has no degree grid — the chart's name stands
            where a surveyed chart would print coordinates. */}
        <span>{chart.title}</span>
        {chartHref && (
          <Link
            href={chartHref}
            className="normal-case tracking-normal text-sm italic text-accent transition-colors hover:text-foreground"
          >
            View on the chart →
          </Link>
        )}
      </figcaption>
    </figure>
  );
}
