import { getCharacter, getCharacters } from "@/shared/lib/content";
import { capFirst, ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/shared/og-card";
import { SITE_NAME } from "@/shared/site";

// Mirrors the page's params — keeps the build fully static (see locations).
export const dynamicParams = false;

export function generateStaticParams() {
  return getCharacters().map(({ slug }) => ({ slug }));
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
  const character = getCharacter(slug)!;
  return ogCard({
    overline: "Miskatonic Atlas · Characters",
    title: capFirst(character.name),
    italic: character.role,
  });
}
