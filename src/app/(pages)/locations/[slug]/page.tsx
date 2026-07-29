import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getChildLocations,
  getCharactersAt,
  getCreaturesAt,
  getLocation,
  getLocations,
  getStory,
  locationHref,
} from "@/shared/lib/content";
import { metaDescription } from "@/shared/lib/meta";
import { chartPath } from "@/shared/maps";
import type { Location } from "@/shared/schemas";
import { ChipSection, Description, SourcesSection } from "@/shared/ui/sections";
import { ChartLink } from "@/widgets/world-map/chart-link";
import { getPlate } from "@/widgets/plates";
import { MapInset } from "@/widgets/world-map/map-inset";

export const dynamicParams = false;

export function generateStaticParams() {
  // A leaf for every location, sub-location or not (ADR-0007).
  return getLocations().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/locations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocation(slug);
  return location
    ? { title: location.name, description: metaDescription(location.summary) }
    : {};
}

/** Deep link of a location's inset onto the full chart. Majors only — a minor
    place has no public pin to focus, and its inset alone shows where it lies
    (ADR-0005). Containment says nothing here: every charted place is pinned in
    its own right (ADR-0007). */
function insetChartHref(location: Location): string | undefined {
  return location.map && location.prominence === "major"
    ? `${chartPath(location.map.mapId)}?focus=${location.slug}`
    : undefined;
}

/** The body of a location's leaf, below its heading. */
function LocationBody({ location }: { location: Location }) {
  const connected = location.connectedTo.flatMap((ref) => {
    const loc = getLocation(ref);
    return loc ? [{ href: locationHref(ref), label: loc.name }] : [];
  });
  const characters = getCharactersAt(location.slug);
  const creatures = getCreaturesAt(location.slug);

  return (
    <>
      <p className="mt-6 text-lg leading-relaxed">{location.summary}</p>

      {/* The leaf's own opening engraving, so it is worth preloading. */}
      {getPlate("locations", location.slug, true)}

      <Description text={location.description} />

      {location.map && (
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
  const parent = location.parentSlug ? getLocation(location.parentSlug) : undefined;
  const appearsIn = location.appearsIn.flatMap((s) => getStory(s) ?? []);
  // Back to the sheet this place is charted on — an unplaced parent borrows
  // its first placed child's; only a theatre-less location falls back to the
  // front chart.
  const homeChart = location.map ?? children.find((child) => child.map)?.map;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <ChartLink
        chartId={homeChart?.mapId}
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Map
      </ChartLink>

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
          {/* The containment line, printed under the heading where a
              gazetteer prints it: this leaf stands on its own, and the town
              it lies in is a fact about it, not the page that holds it. */}
          {parent && (
            <p className="mt-2 text-sm text-muted">
              Part of{" "}
              <Link
                href={locationHref(parent.slug)}
                className="text-accent transition-colors hover:text-foreground"
              >
                {parent.name}
              </Link>
            </p>
          )}
          <div className="parchment-rule mt-5" />
        </header>

        <LocationBody location={location} />

        {children.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Within {location.name}</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {children.map((child) => (
                <li key={child.slug}>
                  <Link
                    href={locationHref(child.slug)}
                    className="cap-first inline-block rounded-md border border-line bg-surface px-4 py-2 text-sm transition-colors hover:border-accent"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
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
