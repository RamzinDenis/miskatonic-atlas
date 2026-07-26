import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/shared/og-card";
import { SITE_NAME } from "@/shared/site";

/** The site-wide card: every route without a closer opengraph-image
    (charts, the index, 404) shares the atlas' own title leaf. */

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    overline: "An atlas of H. P. Lovecraft's world",
    title: SITE_NAME,
    italic: "Charts, gazetteer, dramatis personae & bestiary",
  });
}
