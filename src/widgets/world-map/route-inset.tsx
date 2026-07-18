import Link from "next/link";
import { WORLD_MAP } from "./geometry";
import {
  ROUTE_LEGS,
  ROUTE_STORY_SLUG,
  legLabelPlacement,
  segmentDirection,
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
 * world.jpg pixels, so track points transfer to it verbatim.
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
            const dash = scaleDash(leg.dash);
            return (
              <g key={leg.id}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke="rgba(238, 226, 197, 0.85)"
                  strokeWidth="9"
                  strokeDasharray={dash}
                  strokeLinecap={leg.cap}
                />
                <polyline
                  points={pts}
                  fill="none"
                  stroke={leg.color}
                  strokeWidth="3.5"
                  strokeDasharray={dash}
                  strokeLinecap={leg.cap}
                  opacity="0.9"
                />
                {leg.arrowSegments.map((segment) => {
                  const direction = segmentDirection(leg, segment);
                  return (
                    <path
                      key={`arrow-${segment}`}
                      d="M-9 -7 L11 0 L-9 7 Z"
                      fill={leg.color}
                      transform={`translate(${direction.at.x} ${direction.at.y}) rotate(${direction.angleDeg})`}
                    />
                  );
                })}
                {leg.dates.map((date) => (
                  <text
                    key={date.label}
                    x={date.x + date.dx * DASH_SCALE}
                    y={date.y + date.dy * DASH_SCALE}
                    textAnchor="middle"
                    className="route-inset-date"
                  >
                    {date.label}
                  </text>
                ))}
                {labelFits(leg) && (
                  <text
                    x={label.at.x}
                    y={label.at.y - 12}
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
