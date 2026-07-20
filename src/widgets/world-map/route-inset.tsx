import Link from "next/link";
import { WORLD_MAP } from "./geometry";
import { INK_ROUGH_FILTER, SHIP_GLYPHS } from "./route-glyphs";
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
          <defs
            dangerouslySetInnerHTML={{
              __html: `${INK_ROUGH_FILTER}<radialGradient id="route-inset-clearing"><stop offset="0%" stop-color="rgba(238, 226, 197, 0.92)"/><stop offset="55%" stop-color="rgba(238, 226, 197, 0.7)"/><stop offset="100%" stop-color="rgba(238, 226, 197, 0)"/></radialGradient>`,
            }}
          />
          <image
            href={WORLD_MAP.url}
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
                    style={{ color: leg.color }}
                  >
                    <ellipse rx="24" ry="15" fill="url(#route-inset-clearing)" />
                    <g
                      transform="translate(-20 -12)"
                      dangerouslySetInnerHTML={{
                        __html: SHIP_GLYPHS[leg.ship],
                      }}
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
