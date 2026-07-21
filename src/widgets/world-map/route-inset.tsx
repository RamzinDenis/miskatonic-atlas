import Link from "next/link";
import { WORLD_MAP } from "./geometry";
import { SHIP_ART, shipMaskUrl } from "./route-glyphs";
import {
  ROUTE_LEGS,
  ROUTE_STORY_SLUG,
  legLabelPlacement,
  legShipPlacement,
  shipFits,
} from "./routes";

/** Map dash patterns are screen px at base zoom; the inset's viewBox units
 * are scan pixels, roughly twice as large on screen. */
const DASH_SCALE = 2;

function scaleDash(dash: string): string {
  return dash
    .split(" ")
    .map((n) => Number(n) * DASH_SCALE)
    .join(" ");
}

/**
 * At the inset's scale a very short leg (the Alert's one-day hop) has no
 * room for lettering — its dated fixes carry the sequence instead.
 */
function labelFits(leg: (typeof ROUTE_LEGS)[number]): boolean {
  const a = leg.points[leg.labelSegment];
  const b = leg.points[leg.labelSegment + 1];
  return Math.hypot(b.x - a.x, b.y - a.y) > 90;
}

/**
 * The voyage on a story page: a static excerpt of the chart with the dashed
 * tracks drawn in SVG — no leaflet. The SVG viewBox is the crop window in
 * world.jpg pixels, so track points transfer to it verbatim. The marks
 * speak the live chart's language: the ✕ of a fix and the vessel's
 * silhouette, both in the track's own ink on a cleared patch of paper.
 */

const PAD_X = 90;
const PAD_Y = 100;

export function RouteInset({ storySlug }: { storySlug: string }) {
  if (storySlug !== ROUTE_STORY_SLUG) return null;
  const points = ROUTE_LEGS.flatMap((leg) => leg.points);
  const minX = Math.min(...points.map((p) => p.x)) - PAD_X;
  const maxX = Math.max(...points.map((p) => p.x)) + PAD_X;
  const minY = Math.min(...points.map((p) => p.y)) - PAD_Y;
  const maxY = Math.max(...points.map((p) => p.y)) + PAD_Y;

  return (
    <figure className="mt-8">
      <div className="map-inset rounded-sm">
        <svg
          viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
          className="block w-full"
          role="img"
          aria-label="Chart of the voyage: the Emma out of Auckland, the captured Alert to R'lyeh, Johansen adrift, and the Vigilant towing the derelict to Sydney"
        >
          {/* The tint filters fill each vessel's mask with its track's ink —
              the SVG twin of the live chart's mask-ink treatment. */}
          <defs
            dangerouslySetInnerHTML={{
              __html: `<radialGradient id="route-inset-clearing"><stop offset="0%" stop-color="rgba(238, 226, 197, 0.92)"/><stop offset="55%" stop-color="rgba(238, 226, 197, 0.7)"/><stop offset="100%" stop-color="rgba(238, 226, 197, 0)"/></radialGradient>${ROUTE_LEGS.map(
                (leg) =>
                  `<filter id="route-inset-tint-${leg.id}" x="-10%" y="-10%" width="120%" height="120%"><feFlood flood-color="${leg.color}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`,
              ).join("")}`,
            }}
          />
          {/* The quarter-size scan, drawn at the scan's own dimensions: the
              svg scales it back up, and the story page is spared the 3.6 MB
              original for a figure this size. */}
          <image
            href={WORLD_MAP.insetUrl}
            x="0"
            y="0"
            width={WORLD_MAP.width}
            height={WORLD_MAP.height}
            className="route-inset-scan"
          />
          {ROUTE_LEGS.map((leg) => {
            const pts = leg.points.map((p) => `${p.x},${p.y}`).join(" ");
            const label = legLabelPlacement(leg);
            const ship = legShipPlacement(leg);
            const dash = scaleDash(leg.dash);
            return (
              <g key={leg.id}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke="rgba(238, 226, 197, 0.6)"
                  strokeWidth="11"
                  strokeDasharray={dash}
                  strokeLinecap={leg.cap}
                />
                <polyline
                  points={pts}
                  fill="none"
                  stroke={leg.color}
                  strokeWidth="5.5"
                  strokeDasharray={dash}
                  strokeLinecap={leg.cap}
                  opacity="0.9"
                />
                {shipFits(leg) && (
                  <g
                    transform={`translate(${ship.at.x} ${ship.at.y}) rotate(${ship.angleDeg}) translate(0 -28) scale(${ship.flip ? -2 : 2} 2)`}
                  >
                    <ellipse rx="26" ry="16" fill="url(#route-inset-clearing)" />
                    <image
                      href={shipMaskUrl(leg.ship)}
                      x={-SHIP_ART[leg.ship].w / 2}
                      y={-SHIP_ART[leg.ship].h / 2}
                      width={SHIP_ART[leg.ship].w}
                      height={SHIP_ART[leg.ship].h}
                      filter={`url(#route-inset-tint-${leg.id})`}
                    />
                  </g>
                )}
                {leg.fixes.map((fix) => (
                  <text
                    key={fix.label}
                    x={fix.x + fix.dx * DASH_SCALE}
                    y={fix.y + fix.dy * DASH_SCALE}
                    textAnchor="middle"
                    className="route-inset-date"
                    style={{ fill: leg.color }}
                  >
                    {fix.label}
                  </text>
                ))}
                {labelFits(leg) && (
                  <text
                    x={label.at.x}
                    y={label.at.y + (shipFits(leg) ? 34 : -12)}
                    transform={`rotate(${label.angleDeg} ${label.at.x} ${label.at.y})`}
                    textAnchor="middle"
                    className="route-inset-label"
                    style={{ fill: leg.color }}
                  >
                    {leg.vessel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-4 text-center text-sm leading-relaxed text-muted">
        The voyage of the Emma and the Alert, February–April 1925 — tracks
        drawn after Johansen&rsquo;s story.{" "}
        <Link
          href="/"
          className="whitespace-nowrap italic text-accent transition-colors hover:text-foreground"
        >
          Open the chart →
        </Link>
      </figcaption>
    </figure>
  );
}
