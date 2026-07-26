import { getStories, getStory } from "@/shared/lib/content";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/shared/og-card";
import { SITE_NAME } from "@/shared/site";

// Mirrors the page's params — keeps the build fully static (see locations).
export const dynamicParams = false;

export function generateStaticParams() {
  return getStories().map(({ slug }) => ({ slug }));
}

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStory(slug)!;
  return ogCard({
    overline: "Miskatonic Atlas · Stories",
    title: story.title,
    italic: `H. P. Lovecraft, ${story.year}`,
  });
}
