/**
 * The site's public identity — one place for the values every SEO surface
 * (metadata, sitemap, robots, JSON-LD, OG cards) must agree on. Pure data,
 * importable from route handlers and Node scripts alike.
 *
 * The origin is the Vercel deployment until the launch decision picks a real
 * name and domain (PLAN.md); when it does, set NEXT_PUBLIC_SITE_URL and
 * every absolute URL follows.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://miskatonic-atlas.vercel.app";

export const SITE_NAME = "Miskatonic Atlas";

export const SITE_DESCRIPTION =
  "An atlas of H. P. Lovecraft's world — locations, characters and creatures, every fact traced to its quote in the public-domain stories.";
