import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getChildLocations,
  getCharactersAt,
  getCreaturesAt,
  getLocation,
  getStory,
  getTopLocations,
  locationHref,
} from "@/shared/lib/content";
import { chartPath, chartShowsChildren } from "@/shared/maps";
import type { Location } from "@/shared/schemas";
import { ChipSection, Description, SourcesSection } from "@/shared/ui/sections";
import { getPlate } from "@/widgets/plates";
import { MapInset } from "@/widgets/world-map/map-inset";

export const dynamicParams = false;

export function generateStaticParams() {
  // Sub-locations are sections of their parent's page, not their own routes.
  return getTopLocations().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/locations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocation(slug);
  return location ? { title: location.name, description: location.summary } : {};
}

/** Deep link of a location's inset onto the full chart. Majors only; a
    sub-location links out only when its chart pins children (pins: "all") —
    elsewhere it has no public pin to focus (ADR-0003) and its inset alone
    shows where it lies. */
function insetChartHref(location: Location): string | undefined {
  return location.map &&
    location.prominence === "major" &&
    (!location.parentSlug || chartShowsChildren(location.map.mapId))
    ? `${chartPath(location.map.mapId)}?focus=${location.slug}`
    : undefined;
}

/** The shared body of a location, rendered for the parent article and for each
    sub-location section alike. */
function LocationBody({
  location,
  inset = true,
}: {
  location: Location;
  /** Sub-location sections drop their inset when the parent already printed
      one — a town and its landmarks are the same crop of the same sheet,
      and one page needs it once. */
  inset?: boolean;
}) {
  const connected = location.connectedTo.flatMap((ref) => {
    const loc = getLocation(ref);
    return loc ? [{ href: locationHref(ref), label: loc.name }] : [];
  });
  const characters = getCharactersAt(location.slug);
  const creatures = getCreaturesAt(location.slug);

  return (
    <>
      <p className="mt-6 text-lg leading-relaxed">{location.summary}</p>

      {getPlate("locations", location.slug)}

      <Description text={location.description} />

      {inset && location.map && (
        <MapInset
          map={location.map}
          name={location.name}
          chartHref={insetChartHref(location)}
        />
      )}

      <ChipSection title="Connected locations" items={connected} />
      <ChipSection
        title="Characters"
        items={characters.map((c) => ({ href: `/characters/${c.slug}`, label: c.name }))}
      />
      <ChipSection
        title="Creatures"
        items={creatures.map((c) => ({ href: `/creatures/${c.slug}`, label: c.name }))}
      />

      <SourcesSection
        sources={location.sources.map((source) => {
          const story = getStory(source.storySlug);
          return {
            quote: source.quote,
            attribution:
              (story ? `${story.title} (${story.year})` : source.storySlug) +
              (source.context ? ` — ${source.context}` : ""),
          };
        })}
      />
    </>
  );
}

export default async function LocationPage({ params }: PageProps<"/locations/[slug]">) {
  const { slug } = await params;
  const location = getLocation(slug);
  if (!location) notFound();

  const children = getChildLocations(location.slug);
  const appearsIn = location.appearsIn.flatMap((s) => getStory(s) ?? []);
  // Back to the sheet this place is charted on — an unplaced parent borrows
  // its first placed child's; only a theatre-less location falls back to the
  // front chart.
  const homeChart = location.map ?? children.find((child) => child.map)?.map;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href={homeChart ? chartPath(homeChart.mapId) : "/"}
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Map
      </Link>

      <article className="parchment mt-4 px-6 py-10 sm:px-12 sm:py-12">
        <header>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-4xl">{location.name}</h1>
            <span className="text-xs uppercase tracking-widest text-muted">{location.type}</span>
          </div>
          {location.subtitle && (
            <p className="mt-2 text-base italic text-muted">{location.subtitle}</p>
          )}
          {location.realWorld && (
            <p className="mt-2 text-sm text-muted">Real-world: {location.realWorld}</p>
          )}
          <div className="parchment-rule mt-5" />
        </header>

        {/* One inset serves the whole page (a town and its landmarks are the
            same crop of the same sheet). With sub-locations it closes the
            article instead of opening it, so the chart excerpt arrives once
            every place it covers has been read — not before the first. */}
        <LocationBody location={location} inset={children.length === 0} />

        {children.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Within {location.name}</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {children.map((child) => (
                <li key={child.slug}>
                  <Link
                    href={`#${child.slug}`}
                    className="cap-first inline-block rounded-md border border-line bg-surface px-4 py-2 text-sm transition-colors hover:border-accent"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {children.map((child) => (
          <section
            key={child.slug}
            id={child.slug}
            className="mt-14 scroll-mt-24 border-t border-line pt-10"
          >
            <header>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="font-display text-3xl">{child.name}</h2>
                <span className="text-xs uppercase tracking-widest text-muted">{child.type}</span>
              </div>
              {child.subtitle && (
                <p className="mt-2 text-sm italic text-muted">{child.subtitle}</p>
              )}
              {child.realWorld && (
                <p className="mt-1 text-sm text-muted">Real-world: {child.realWorld}</p>
              )}
            </header>
            <LocationBody location={child} inset={!location.map} />
          </section>
        ))}

        {children.length > 0 && location.map && (
          <MapInset
            map={location.map}
            name={location.name}
            chartHref={insetChartHref(location)}
          />
        )}

        {appearsIn.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Appears in</h2>
            <ul className="mt-4 space-y-1">
              {appearsIn.map((story) => (
                <li key={story.slug}>
                  <Link
                    href={`/stories/${story.slug}`}
                    className="text-muted transition-colors hover:text-accent"
                  >
                    {story.title} ({story.year})
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="fleuron" aria-hidden="true">
          ❦
        </div>
      </article>
    </div>
  );
}
