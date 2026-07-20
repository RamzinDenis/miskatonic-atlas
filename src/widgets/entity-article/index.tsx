import Link from "next/link";
import type { ReactNode } from "react";
import { ChipSection, SourcesSection, type SourceItem } from "@/shared/ui/sections";

/**
 * The page body of a character. It was shared with creatures while the two
 * differed only in their badge field (role vs classification); creatures now
 * print as naturalist's leaves of the bestiary and lay themselves out, as
 * locations always did with their map and cross-references.
 */

export interface EntityArticleProps {
  name: string;
  badge: string;
  summary: string;
  /** Editorial engraving between summary and description (CONTEXT.md: «Вклейка»). */
  plate?: ReactNode;
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
  plate,
  description,
  fate,
  locations,
  stories,
  sources,
}: EntityArticleProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent">
        ← Atlas
      </Link>

      <article className="parchment mt-4 px-6 py-10 sm:px-12 sm:py-12">
      <header>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-4xl">{name}</h1>
          <span className="text-xs uppercase tracking-widest text-muted">{badge}</span>
        </div>
        <div className="parchment-rule mt-5" />
      </header>

      <p className="mt-6 text-lg leading-relaxed">{summary}</p>

      {plate}

      <div className="drop-cap mt-6 space-y-4 text-[17px] leading-relaxed">
        {description.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {fate && (
        <p className="mt-6 border-l-2 border-line pl-4 text-[17px]">
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
          <h2 className="font-display text-2xl">Appears in</h2>
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

      <div className="fleuron" aria-hidden="true">
        ❦
      </div>
      </article>
    </div>
  );
}
