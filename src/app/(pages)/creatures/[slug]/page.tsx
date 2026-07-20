import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCreature, getCreatures, getLocation, getStory } from "@/shared/lib/content";
import { ChipSection, SourcesSection } from "@/shared/ui/sections";
import { BestiaryFigure } from "@/widgets/bestiary/figure";
import { LostPlate } from "@/widgets/bestiary/lost-plate";
import { bestiaryFigure, getBestiaryPlate } from "@/widgets/bestiary/registry";
import { getPlate } from "@/widgets/plates";

/**
 * The naturalist's leaf of a beast: the engraving under its figure number,
 * the binomial the atlas gave it, and everything the stories say. Laid out
 * here rather than through EntityArticle — like locations, creatures carry
 * matter of their own (CONTEXT.md: «Бестиарий»).
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return getCreatures().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/creatures/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const creature = getCreature(slug);
  return creature ? { title: creature.name, description: creature.summary } : {};
}

export default async function CreaturePage({ params }: PageProps<"/creatures/[slug]">) {
  const { slug } = await params;
  const creature = getCreature(slug);
  if (!creature) notFound();

  const plate = getBestiaryPlate(slug);
  if (!plate) {
    throw new Error(
      `no bestiary register entry for creature "${slug}" — add one in src/widgets/bestiary/registry.ts`,
    );
  }
  const fig = bestiaryFigure(slug);

  const locations = creature.locations.flatMap((s) => getLocation(s) ?? []);
  const appearsIn = creature.appearsIn.flatMap((s) => getStory(s) ?? []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/creatures"
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Bestiarium
      </Link>

      <article className="parchment mt-4 px-6 py-10 sm:px-12 sm:py-12">
        <header>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-4xl">{creature.name}</h1>
            <span className="text-xs uppercase tracking-widest text-muted">
              {creature.classification.replace(/-/g, " ")}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            <span className="font-serif italic">{plate.latin}</span>
            <span className="mx-2">—</span>
            {plate.epithet}
          </p>
          <div className="parchment-rule mt-5" />
        </header>

        <figure className="mt-8">
          <div className="mx-auto max-w-md">
            {plate.art ? (
              <BestiaryFigure {...plate.art} label={`Engraving of ${creature.name}`} />
            ) : (
              <LostPlate fig={fig} />
            )}
          </div>
          <figcaption className="mt-4 text-center text-xs uppercase tracking-widest text-muted">
            Fig. {fig} — Bestiarium
          </figcaption>
        </figure>

        <p className="mt-8 text-lg leading-relaxed">{creature.summary}</p>

        <div className="drop-cap mt-6 space-y-4 text-[17px] leading-relaxed">
          {creature.description.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {getPlate("creatures", creature.slug)}

        {creature.fate && (
          <p className="mt-6 border-l-2 border-line pl-4 text-[17px]">
            <span className="text-xs uppercase tracking-widest text-muted">Fate — </span>
            {creature.fate}
          </p>
        )}

        <ChipSection
          title="Haunts"
          items={locations.map((l) => ({
            href: `/locations/${l.slug}`,
            label: l.name,
          }))}
        />

        <SourcesSection
          sources={creature.sources.map((source) => {
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

        <div className="fleuron" aria-hidden="true">
          ❦
        </div>
      </article>
    </div>
  );
}
