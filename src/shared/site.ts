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

export const GITHUB_URL = "https://github.com/RamzinDenis/miskatonic-atlas";

export const CONTACT_EMAIL = "d.ramzin96@gmail.com";

/**
 * Umami Cloud website id (cloud.umami.is → your site → Website ID).
 * Empty until the account exists; the tracker is not rendered without it.
 */
export const UMAMI_WEBSITE_ID = "b4391bb6-c396-4f57-94e3-1d9f1bdb8133";

/**
 * Formspree form id (formspree.io → your form → the token after /f/).
 * While empty, the about page falls back to a mailto link.
 */
export const FORMSPREE_FORM_ID = "xkodkwke";
