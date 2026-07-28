import Link from "next/link";
import type { CSSProperties } from "react";
import type { MapLegendGroup } from "./geometry";
import { monsterMaskUrl, type MapMonster, type MonsterKind } from "./monsters";
import { SHIP_INK, shipMaskUrl } from "./route-glyphs";
import { ROUTE_STORY_SLUG, type RouteLeg } from "./routes";
import { LOCATION_TYPE_ORDER, VIGNETTES } from "./marks";

/**
 * The legend as a chart cartouche: stories of the sheet, the key of signs,
 * voyage tracks and the annotator's beasts. Pure presentation — the open
 * state and the fly-to callbacks live in world-map-client.
 */

/** The vessel's engraving as it sails the chart, keying the legend row. */
function LegendShip({ leg }: { leg: RouteLeg }) {
  return (
    <span
      className="legend-ship mask-ink"
      style={
        {
          color: SHIP_INK,
          "--ink-mask": `url('${shipMaskUrl(leg.ship)}')`,
        } as CSSProperties
      }
      aria-hidden
    />
  );
}

/** The vessel's line style as a legend swatch. */
function LegendDash({ leg }: { leg: RouteLeg }) {
  return (
    <svg className="legend-dash" viewBox="0 0 26 6" aria-hidden="true">
      <line
        x1="0"
        y1="3"
        x2="26"
        y2="3"
        stroke={leg.color}
        strokeWidth="2"
        strokeDasharray={leg.dash}
        strokeLinecap={leg.cap}
      />
    </svg>
  );
}

/** The beast as engraved on the chart, keying its legend row. */
function LegendMonster({ slug }: { slug: MonsterKind }) {
  return (
    <span
      className="legend-monster mask-ink"
      style={{ "--ink-mask": `url('${monsterMaskUrl(slug)}')` } as CSSProperties}
      aria-hidden
    />
  );
}

/** The same vignette as on the chart, in ink — the legend's key column. */
function LegendGlyph({ type }: { type: string }) {
  return (
    <svg
      className="legend-glyph"
      viewBox="0 0 28 28"
      aria-hidden
      dangerouslySetInnerHTML={{
        __html: VIGNETTES[type] ?? VIGNETTES.default,
      }}
    />
  );
}

interface Props {
  legend: MapLegendGroup[];
  /** How this sheet marks its places (AtlasMap.markerStyle). */
  markerStyle?: "vignette" | "annotation";
  chartLegs: RouteLeg[];
  /** Beasts of this chart, already filtered to the legend's stories. */
  legendMonsters: MapMonster[];
  open: boolean;
  onToggle: () => void;
  selectedLeg: RouteLeg | null;
  onFocusLeg: (leg: RouteLeg) => void;
  onFocusMonster: (monster: MapMonster) => void;
}

export function LegendPanel({
  legend,
  markerStyle,
  chartLegs,
  legendMonsters,
  open,
  onToggle,
  selectedLeg,
  onFocusLeg,
  onFocusMonster,
}: Props) {
  /* The signs actually printed on this sheet, in the schema's order — the
     key row for a type only appears once a charted place wears it. */
  const legendTypes = LOCATION_TYPE_ORDER.filter((type) =>
    legend.some((story) => story.locations.some((l) => l.type === type)),
  );

  /* top-4: the masthead stands on the binding above the plate now, so the
     cartouche needs no clearance beyond the plate's own margin. */
  return (
    <div className="absolute left-4 top-4 z-[1000] flex max-h-[calc(100%-6rem)] flex-col items-start">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="parchment rounded-sm px-3 py-1.5 text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
      >
        Legend {open ? "−" : "+"}
      </button>
      {open && (
        <nav
          aria-label="Map legend"
          className="parchment mt-2 min-h-0 w-64 overflow-y-auto rounded-sm p-2"
        >
          <div className="legend-cartouche px-4 pb-4 pt-3">
            {/* One shared key for the whole sheet: the stories are a
                compact register at its head, not sections of their own —
                every sign below explains marks of any story. */}
            <div
              className="text-center text-base leading-none text-muted"
              aria-hidden="true"
            >
              ❧
            </div>

            {legend.length > 0 && (
              <section className="mt-1.5">
                <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                  Stories of this chart
                </h2>
                <div className="parchment-rule mt-2" />
                <ul className="mt-3 space-y-1.5">
                  {legend.map((story) => (
                    <li
                      key={story.slug}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <Link
                        href={`/stories/${story.slug}`}
                        className="font-display italic leading-snug transition-colors hover:text-accent"
                      >
                        {story.title}
                      </Link>
                      <span className="text-xs tracking-widest text-muted">
                        {story.year}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Each sign is explained once, as a chart's key would —
                the pins themselves carry the place names. */}
            {legendTypes.length > 0 && markerStyle !== "annotation" && (
              <section className="mt-6">
                <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                  Explanation
                </h2>
                <div className="parchment-rule mt-2" />
                <ul className="mt-3 space-y-1.5">
                  {legendTypes.map((type) => (
                    <li
                      key={type}
                      className="flex items-center gap-2.5 text-sm capitalize"
                    >
                      <LegendGlyph type={type} />
                      <span>{type}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Annotation sheets carry no glyphs — the key explains the
                lettering itself: settlements in capitals, the rest in
                the smaller italic. */}
            {legendTypes.length > 0 && markerStyle === "annotation" && (
              <section className="mt-6">
                <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                  Explanation
                </h2>
                <div className="parchment-rule mt-2" />
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li className="flex items-center gap-2.5">
                    <span className="legend-annot-fix" aria-hidden />
                    <span style={{ fontVariant: "small-caps", letterSpacing: "0.14em" }}>
                      Settlement
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="legend-annot-fix" aria-hidden />
                    <span className="italic">Landmark</span>
                  </li>
                </ul>
              </section>
            )}

            {chartLegs.length > 0 && legend.some((story) => story.slug === ROUTE_STORY_SLUG) && (
              <section className="mt-6">
                <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                  Voyage tracks
                </h2>
                <div className="parchment-rule mt-2" />
                <ul className="mt-3 space-y-1.5">
                  {chartLegs.map((leg) => (
                    <li key={leg.id}>
                      <button
                        type="button"
                        onClick={() => onFocusLeg(leg)}
                        className={`flex w-full items-center gap-2.5 text-left text-sm italic transition-colors hover:text-accent ${
                          selectedLeg?.id === leg.id ? "text-accent" : ""
                        }`}
                      >
                        <LegendShip leg={leg} />
                        <LegendDash leg={leg} />
                        <span>{leg.vessel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {legendMonsters.length > 0 && (
              <section className="mt-6">
                <h2 className="text-center text-xs uppercase tracking-widest text-muted">
                  Here be monsters
                </h2>
                <div className="parchment-rule mt-2" />
                <ul className="mt-3 space-y-1.5">
                  {legendMonsters.map((monster) => (
                    <li key={monster.slug}>
                      <button
                        type="button"
                        onClick={() => onFocusMonster(monster)}
                        className="flex w-full items-center gap-2.5 text-left text-sm italic transition-colors hover:text-accent"
                      >
                        <LegendMonster slug={monster.slug} />
                        <span className="cap-first">{monster.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div
              className="mt-5 text-center text-sm leading-none text-muted"
              aria-hidden="true"
            >
              ❦
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
