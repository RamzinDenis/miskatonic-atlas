import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/shared/og-card";
import { SITE_NAME } from "@/shared/site";

export const alt = `${SITE_NAME} — Bestiarium`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    overline: "Miskatonic Atlas",
    title: "Bestiarium",
    italic: "The beasts, devils and Great Old Ones on record",
  });
}
