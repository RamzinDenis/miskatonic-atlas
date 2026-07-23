import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStories, getStory, getStoryEntities } from "@/shared/lib/content";
import { ChipSection } from "@/shared/ui/sections";
import { getPlate, getStoryPlates } from "@/widgets/plates";
import { RouteInset } from "@/widgets/world-map/route-inset";

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
  const storyPlates = getStoryPlates(slug);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent">
        ← Map
      </Link>

      <article className="parchment mt-4 px-6 py-10 sm:px-12 sm:py-12">
      <header>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-4xl">{story.title}</h1>
          <span className="text-xs uppercase tracking-widest text-muted">{story.year}</span>
        </div>
        <div className="parchment-rule mt-5" />
      </header>

      <p className="drop-cap-p mt-6 text-lg leading-relaxed">{story.summary}</p>

      {getPlate("stories", story.slug)}

      <RouteInset storySlug={story.slug} />

      {storyPlates.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Plates of this story</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {storyPlates.map((plate) => (
              <li key={plate.numeral}>
                <Link
                  href={plate.href}
                  className="block border border-line bg-surface p-2 transition-colors hover:border-accent"
                >
                  <Image
                    src={plate.image}
                    alt={plate.alt}
                    placeholder="blur"
                    sizes="(max-width: 640px) 50vw, 224px"
                    className="block h-auto w-full"
                  />
                  <span className="mt-2 block text-center text-xs uppercase tracking-widest text-muted">
                    Plate {plate.numeral}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <div className="fleuron" aria-hidden="true">
        ❦
      </div>
      </article>
    </div>
  );
}
