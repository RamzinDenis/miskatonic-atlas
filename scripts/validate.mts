import { ContentError, loadContent } from "../src/shared/lib/content.ts";

/**
 * Prebuild gate: Zod-validates content/ and checks slug-reference integrity
 * by running the same loadContent() the site is built from. Also the fast
 * feedback loop during draft review — `npm run validate` after each edit.
 */
try {
  const content = loadContent();
  console.log(
    `content OK: ${content.stories.length} stories, ${content.locations.length} locations, ` +
      `${content.characters.length} characters, ${content.creatures.length} creatures`,
  );
} catch (e) {
  if (e instanceof ContentError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
