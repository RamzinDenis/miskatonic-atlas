import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  CharacterSchema,
  CreatureSchema,
  LocationSchema,
  StorySchema,
  type Character,
  type Creature,
  type Location,
  type Story,
} from "@/shared/schemas";

/**
 * The only gateway to atlas content. Pages and widgets must never read
 * `content/*.json` directly — in the product phase this module is replaced
 * by a database client without touching anything above it.
 *
 * All content is read and validated at build time (full SSG). Any schema
 * violation or broken slug reference fails the build.
 */

export interface AtlasContent {
  stories: Story[];
  locations: Location[];
  characters: Character[];
  creatures: Creature[];
}

export class ContentError extends Error {}

const CONTENT_DIR = path.join(process.cwd(), "content");

function readCollection<S extends z.ZodType<{ slug: string }>>(
  dirName: string,
  schema: S,
  errors: string[],
): z.output<S>[] {
  const dir = path.join(CONTENT_DIR, dirName);
  if (!fs.existsSync(dir)) return [];

  const entities: z.output<S>[] = [];
  const seenSlugs = new Set<string>();

  for (const file of fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()) {
    const relPath = `content/${dirName}/${file}`;
    let json: unknown;
    try {
      json = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (e) {
      errors.push(`${relPath}: invalid JSON — ${(e as Error).message}`);
      continue;
    }

    const result = schema.safeParse(json);
    if (!result.success) {
      errors.push(`${relPath}:\n${z.prettifyError(result.error)}`);
      continue;
    }

    const entity = result.data;
    if (entity.slug !== file.replace(/\.json$/, "")) {
      errors.push(`${relPath}: slug "${entity.slug}" does not match file name`);
    }
    if (seenSlugs.has(entity.slug)) {
      errors.push(`${relPath}: duplicate slug "${entity.slug}"`);
    }
    seenSlugs.add(entity.slug);
    entities.push(entity);
  }

  return entities;
}

function checkRefs(
  from: string,
  field: string,
  slugs: readonly string[],
  known: ReadonlySet<string>,
  kind: string,
  errors: string[],
) {
  for (const slug of slugs) {
    if (!known.has(slug)) {
      errors.push(`${from}: ${field} → unknown ${kind} slug "${slug}"`);
    }
  }
}

function checkIntegrity(content: AtlasContent, errors: string[]) {
  const storySlugs = new Set(content.stories.map((s) => s.slug));
  const locationSlugs = new Set(content.locations.map((l) => l.slug));

  for (const location of content.locations) {
    const from = `content/locations/${location.slug}.json`;
    checkRefs(from, "appearsIn", location.appearsIn, storySlugs, "story", errors);
    checkRefs(from, "connectedTo", location.connectedTo, locationSlugs, "location", errors);
    checkRefs(from, "sources", location.sources.map((s) => s.storySlug), storySlugs, "story", errors);
  }

  for (const [dirName, entities] of [
    ["characters", content.characters],
    ["creatures", content.creatures],
  ] as const) {
    for (const entity of entities) {
      const from = `content/${dirName}/${entity.slug}.json`;
      checkRefs(from, "locations", entity.locations, locationSlugs, "location", errors);
      checkRefs(from, "appearsIn", entity.appearsIn, storySlugs, "story", errors);
      checkRefs(from, "sources", entity.sources.map((s) => s.storySlug), storySlugs, "story", errors);
    }
  }
}

let cache: AtlasContent | null = null;

export function loadContent(): AtlasContent {
  if (cache && process.env.NODE_ENV === "production") return cache;

  const errors: string[] = [];
  const content: AtlasContent = {
    stories: readCollection("stories", StorySchema, errors),
    locations: readCollection("locations", LocationSchema, errors),
    characters: readCollection("characters", CharacterSchema, errors),
    creatures: readCollection("creatures", CreatureSchema, errors),
  };
  checkIntegrity(content, errors);

  if (errors.length > 0) {
    throw new ContentError(
      `Content validation failed (${errors.length} error${errors.length > 1 ? "s" : ""}):\n\n${errors.join("\n\n")}`,
    );
  }

  cache = content;
  return content;
}

export function getStories(): Story[] {
  return loadContent().stories;
}

export function getStory(slug: string): Story | undefined {
  return loadContent().stories.find((s) => s.slug === slug);
}

export function getLocations(): Location[] {
  return loadContent().locations;
}

export function getLocation(slug: string): Location | undefined {
  return loadContent().locations.find((l) => l.slug === slug);
}
