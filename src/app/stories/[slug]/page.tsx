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
    <article className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent">
        ← Atlas
      </Link>

      <header className="mt-6">
        <div className="flex items-baseline gap-4">
          <h1 className="font-serif text-4xl">{story.title}</h1>
          <span className="text-xs uppercase tracking-widest text-muted">{story.year}</span>
        </div>
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
  );
}
