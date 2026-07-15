import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCharacter, getCharacters, getLocation, getStory } from "@/shared/lib/content";
import { EntityArticle } from "@/widgets/entity-article";
import { getPlate } from "@/widgets/plates";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCharacters().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/characters/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const character = getCharacter(slug);
  return character ? { title: character.name, description: character.summary } : {};
}

export default async function CharacterPage({ params }: PageProps<"/characters/[slug]">) {
  const { slug } = await params;
  const character = getCharacter(slug);
  if (!character) notFound();

  return (
    <EntityArticle
      name={character.name}
      badge={character.role}
      summary={character.summary}
      plate={getPlate("characters", character.slug)}
      description={character.description}
      fate={character.fate}
      locations={character.locations.flatMap((s) => getLocation(s) ?? [])}
      stories={character.appearsIn.flatMap((s) => getStory(s) ?? [])}
      sources={character.sources.map((source) => {
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
