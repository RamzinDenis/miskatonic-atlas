import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCreature, getCreatures, getLocation, getStory } from "@/shared/lib/content";
import { getCreaturePlate } from "@/widgets/creature-plate";
import { EntityArticle } from "@/widgets/entity-article";

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

  return (
    <EntityArticle
      name={creature.name}
      badge={creature.classification}
      summary={creature.summary}
      plate={getCreaturePlate(creature.slug)}
      description={creature.description}
      fate={creature.fate}
      locations={creature.locations.flatMap((s) => getLocation(s) ?? [])}
      stories={creature.appearsIn.flatMap((s) => getStory(s) ?? [])}
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
  );
}
