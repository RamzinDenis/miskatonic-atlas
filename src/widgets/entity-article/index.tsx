import Link from "next/link";
import { ChipSection, SourcesSection, type SourceItem } from "@/shared/ui/sections";

/**
 * Shared page body for characters and creatures — the two collections differ
 * only in their badge field (role vs classification). Locations keep their own
 * page: they carry extra fields (map, realWorld, connectedTo).
 */

export interface EntityArticleProps {
  name: string;
  badge: string;
  summary: string;
  description: string;
  fate?: string;
  locations: { slug: string; name: string }[];
  stories: { slug: string; title: string; year: number }[];
  sources: SourceItem[];
}

export function EntityArticle({
  name,
  badge,
  summary,
  description,
  fate,
  locations,
  stories,
  sources,
}: EntityArticleProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent">
        ← Atlas
      </Link>

      <header className="mt-6">
        <div className="flex items-baseline gap-4">
          <h1 className="font-serif text-4xl">{name}</h1>
          <span className="text-xs uppercase tracking-widest text-muted">{badge}</span>
        </div>
      </header>

      <p className="mt-6 text-lg leading-relaxed">{summary}</p>

      <div className="mt-6 space-y-4 leading-relaxed text-foreground/90">
        {description.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {fate && (
        <p className="mt-6 border-l-2 border-line pl-4 text-foreground/90">
          <span className="text-xs uppercase tracking-widest text-muted">Fate — </span>
          {fate}
        </p>
      )}

      <ChipSection
        title="Locations"
        items={locations.map((l) => ({ href: `/locations/${l.slug}`, label: l.name }))}
      />

      <SourcesSection sources={sources} />

      {stories.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Appears in</h2>
          <ul className="mt-4 space-y-1">
            {stories.map((story) => (
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
  );
}
