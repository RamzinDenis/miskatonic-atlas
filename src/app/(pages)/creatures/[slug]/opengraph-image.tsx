import { getCreature, getCreatures } from "@/shared/lib/content";
import { capFirst, ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/shared/og-card";
import { SITE_NAME } from "@/shared/site";
import { BESTIARY } from "@/widgets/bestiary/registry";

// Mirrors the page's params — keeps the build fully static (see locations).
export const dynamicParams = false;

export function generateStaticParams() {
  return getCreatures().map(({ slug }) => ({ slug }));
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
  const creature = getCreature(slug)!;
  // The curator's binomial where the register has one; the classification
  // holds the caption for an uncurated beast.
  const latin = BESTIARY.find((plate) => plate.slug === slug)?.latin;
  return ogCard({
    overline: "Miskatonic Atlas · Bestiarium",
    title: capFirst(creature.name),
    italic: latin ?? creature.classification.replace(/-/g, " "),
  });
}
