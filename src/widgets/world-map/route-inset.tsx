import Link from "next/link";
import { WORLD_MAP } from "./geometry";
import { ROUTE_LEGS, ROUTE_STORY_SLUG, legLabelPlacement } from "./routes";

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
            return (
              <g key={leg.id}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke="rgba(238, 226, 197, 0.85)"
                  strokeWidth="9"
                  strokeDasharray="14 12"
                  strokeLinecap="butt"
                />
                <polyline
                  points={pts}
                  fill="none"
                  stroke="#2b1e08"
                  strokeWidth="3.5"
                  strokeDasharray="14 12"
                  strokeLinecap="butt"
                  opacity="0.9"
                />
                <text
                  x={label.at.x}
                  y={label.at.y - 12}
                  transform={`rotate(${label.angleDeg} ${label.at.x} ${label.at.y})`}
                  textAnchor="middle"
                  className="route-inset-label"
                >
                  {leg.vessel}
                </text>
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
