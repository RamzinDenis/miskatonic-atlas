import { getLocation, getLocations } from "@/shared/lib/content";
import { capFirst, ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/shared/og-card";
import { SITE_NAME } from "@/shared/site";

// Mirrors the page's params: the card is drawn at build, the build stays
// fully static (a dynamic-segment metadata route deploys a lambda otherwise).
export const dynamicParams = false;

export function generateStaticParams() {
  return getLocations().map(({ slug }) => ({ slug }));
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
  const location = getLocation(slug)!;
  return ogCard({
    overline: "Miskatonic Atlas · Locations",
    title: capFirst(location.name),
    italic:
      location.type +
      (location.realWorld ? ` — ${location.realWorld}` : ""),
  });
}
