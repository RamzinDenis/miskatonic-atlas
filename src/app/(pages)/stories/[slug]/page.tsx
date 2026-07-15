import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStories, getStory, getStoryEntities } from "@/shared/lib/content";
import { ChipSection } from "@/shared/ui/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStories().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  return story ? { title: story.title, description: story.summary } : {};
}

export default async function StoryPage({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();

  const { locations, characters, creatures } = getStoryEntities(slug);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent">
        ← Atlas
      </Link>

      <article className="parchment mt-4 px-6 py-10 sm:px-12 sm:py-12">
      <header>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-4xl">{story.title}</h1>
          <span className="text-xs uppercase tracking-widest text-muted">{story.year}</span>
        </div>
        <div className="parchment-rule mt-5" />
      </header>

      <p className="mt-6 text-lg leading-relaxed">{story.summary}</p>

      <ChipSection
        title="Locations"
        items={locations.map((l) => ({ href: `/locations/${l.slug}`, label: l.name }))}
      />
      <ChipSection
        title="Characters"
        items={characters.map((c) => ({ href: `/characters/${c.slug}`, label: c.name }))}
      />
      <ChipSection
        title="Creatures"
        items={creatures.map((c) => ({ href: `/creatures/${c.slug}`, label: c.name }))}
      />
      </article>
    </div>
  );
}
