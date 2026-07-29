import type { MetadataRoute } from "next";
import {
  getCharacters,
  getCreatures,
  getStories,
  getLocations,
} from "@/shared/lib/content";
import { chartPath, MAPS } from "@/shared/maps";
import { SITE_URL } from "@/shared/site";

/**
 * The sitemap follows Prominence (ADR-0005): it is an index, so it lists
 * majors only — minor pages stay reachable through cross-links, exactly as
 * they are on the site itself. Sub-locations have no routes of their own
 * (ADR-0003), so top-level locations stand for their children. No lastmod:
 * the build is static and content carries no timestamps worth inventing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const major = <T extends { prominence: "major" | "minor" }>(items: T[]) =>
    items.filter((item) => item.prominence === "major");

  return [
    // The charts, the front sheet first.
    ...Object.keys(MAPS).map((mapId) => ({
      url: `${SITE_URL}${chartPath(mapId)}`,
      priority: chartPath(mapId) === "/" ? 1 : 0.8,
    })),
    { url: `${SITE_URL}/contents`, priority: 0.8 },
    { url: `${SITE_URL}/creatures`, priority: 0.8 },
    { url: `${SITE_URL}/about`, priority: 0.5 },
    ...getStories().map(({ slug }) => ({
      url: `${SITE_URL}/stories/${slug}`,
      priority: 0.7,
    })),
    ...major(getLocations()).map(({ slug }) => ({
      url: `${SITE_URL}/locations/${slug}`,
      priority: 0.6,
    })),
    ...major(getCharacters()).map(({ slug }) => ({
      url: `${SITE_URL}/characters/${slug}`,
      priority: 0.6,
    })),
    ...major(getCreatures()).map(({ slug }) => ({
      url: `${SITE_URL}/creatures/${slug}`,
      priority: 0.6,
    })),
  ];
}
