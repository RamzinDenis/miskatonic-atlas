import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocation, getLocations, getStory } from "@/shared/lib/content";

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

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent">
        ← Atlas
      </Link>

      <header className="mt-6">
        <div className="flex items-baseline gap-4">
          <h1 className="font-serif text-4xl">{location.name}</h1>
          <span className="text-xs uppercase tracking-widest text-muted">
            {location.type}
          </span>
        </div>
        {location.realWorld && (
          <p className="mt-2 text-sm text-muted">Real-world: {location.realWorld}</p>
        )}
      </header>

      <p className="mt-6 text-lg leading-relaxed">{location.summary}</p>

      <div className="mt-6 space-y-4 leading-relaxed text-foreground/90">
        {location.description.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {connected.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Connected locations</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {connected.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/locations/${c.slug}`}
                  className="inline-block rounded-md border border-line bg-surface px-4 py-2 text-sm transition-colors hover:border-accent"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Sources</h2>
        <p className="mt-2 text-sm text-muted">
          Every fact above traces back to the text.
        </p>
        <ul className="mt-4 space-y-6">
          {location.sources.map((source, i) => {
            const story = getStory(source.storySlug);
            return (
              <li key={i}>
                <blockquote className="border-l-2 border-accent pl-4 font-serif italic leading-relaxed">
                  “{source.quote}”
                </blockquote>
                <p className="mt-2 pl-4 text-sm text-muted">
                  {story ? `${story.title} (${story.year})` : source.storySlug}
                  {source.context && ` — ${source.context}`}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {appearsIn.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Appears in</h2>
          <ul className="mt-4 space-y-1 text-muted">
            {appearsIn.map((story) => (
              <li key={story.slug}>
                {story.title} ({story.year})
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
