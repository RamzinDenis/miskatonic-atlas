import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCharactersAt,
  getCreaturesAt,
  getLocation,
  getLocations,
  getStory,
} from "@/shared/lib/content";
import { ChipSection, SourcesSection } from "@/shared/ui/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return getLocations().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/locations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocation(slug);
  return location ? { title: location.name, description: location.summary } : {};
}

export default async function LocationPage({
  params,
}: PageProps<"/locations/[slug]">) {
  const { slug } = await params;
  const location = getLocation(slug);
  if (!location) notFound();

  const connected = location.connectedTo.flatMap((s) => getLocation(s) ?? []);
  const appearsIn = location.appearsIn.flatMap((s) => getStory(s) ?? []);
  const characters = getCharactersAt(slug);
  const creatures = getCreaturesAt(slug);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent">
        ← Atlas
      </Link>

      <article className="parchment mt-4 px-6 py-10 sm:px-12 sm:py-12">
      <header>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-4xl">{location.name}</h1>
          <span className="text-xs uppercase tracking-widest text-muted">
            {location.type}
          </span>
        </div>
        {location.realWorld && (
          <p className="mt-2 text-sm text-muted">Real-world: {location.realWorld}</p>
        )}
        <div className="parchment-rule mt-5" />
      </header>

      <p className="mt-6 text-lg leading-relaxed">{location.summary}</p>

      <div className="mt-6 space-y-4 leading-relaxed text-foreground/90">
        {location.description.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <ChipSection
        title="Connected locations"
        items={connected.map((c) => ({ href: `/locations/${c.slug}`, label: c.name }))}
      />
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

      {appearsIn.length > 0 && (
        <section className="mt-10">
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
      </article>
    </div>
  );
}
