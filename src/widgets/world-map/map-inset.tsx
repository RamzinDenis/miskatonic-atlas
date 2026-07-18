import Link from "next/link";
import { WORLD_MAP, formatDegrees } from "./geometry";

/**
 * A static excerpt of the chart on a location page: the scan cropped around
 * the location's pin, no leaflet involved. Rendering an inset for a minor
 * location is fine — prominence only keeps it off the shared map and
 * indexes; the deep link to the chart is therefore majors-only.
 */

/** world.jpg pixels per inset pixel — a regional view around the pin. */
const INSET_SCALE = 0.5;

export function MapInset({
  x,
  y,
  name,
  chartHref,
}: {
  x: number;
  y: number;
  name: string;
  /** Link target on the full chart; omit for minor locations. */
  chartHref?: string;
}) {
  // background-position: `calc(50% + Npx)` resolves the percentage against
  // (container − image), so N = imageSize/2 − point·scale centers the pin
  // regardless of the container's width.
  const offsetX = (WORLD_MAP.width * INSET_SCALE) / 2 - x * INSET_SCALE;
  const offsetY = (WORLD_MAP.height * INSET_SCALE) / 2 - y * INSET_SCALE;

  return (
    <figure className="mt-10">
      <div
        className="map-inset h-44 w-full rounded-sm"
        role="img"
        aria-label={`Excerpt of the world chart around ${name}`}
      >
        <div
          className="map-inset-scan"
          style={{
            backgroundImage: `url(${WORLD_MAP.url})`,
            backgroundSize: `${WORLD_MAP.width * INSET_SCALE}px ${WORLD_MAP.height * INSET_SCALE}px`,
            backgroundPosition: `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`,
          }}
        />
        <span className="atlas-pin map-inset-pin">
          <span className="atlas-pin-dot" />
        </span>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs uppercase tracking-widest text-muted">
        <span>{formatDegrees({ x, y })}</span>
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
