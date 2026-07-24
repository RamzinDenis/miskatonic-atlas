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
} from "../schemas.ts"; // relative + extension so Node can run this file directly (scripts/validate.mts)
import type {
  MapFigure,
  MapLegendGroup,
  MapLocation,
  UnplacedLocation,
} from "@/widgets/world-map/geometry";

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

/** The file slug behind a location reference — the segment after any parent
    prefix, so a composite id `parentSlug/slug` resolves to its file. */
function refSlug(ref: string): string {
  const i = ref.lastIndexOf("/");
  return i === -1 ? ref : ref.slice(i + 1);
}

function checkIntegrity(content: AtlasContent, errors: string[]) {
  const storySlugs = new Set(content.stories.map((s) => s.slug));
  const locationSlugs = new Set(content.locations.map((l) => l.slug));
  const locationParent = new Map(content.locations.map((l) => [l.slug, l.parentSlug]));

  // A (possibly composite `parentSlug/slug`) location reference: the file must
  // exist, a sub-location must be referenced by its composite id, and the
  // prefix must match the target's actual parent (ADR-0003).
  const checkLocationRefs = (from: string, field: string, refs: readonly string[]) => {
    for (const ref of refs) {
      const slug = refSlug(ref);
      if (!locationSlugs.has(slug)) {
        errors.push(`${from}: ${field} → unknown location "${ref}"`);
        continue;
      }
      const parent = locationParent.get(slug);
      const i = ref.lastIndexOf("/");
      if (i === -1) {
        if (parent) errors.push(`${from}: ${field} → "${ref}" is a sub-location; use "${parent}/${slug}"`);
      } else if (ref.slice(0, i) !== parent) {
        errors.push(`${from}: ${field} → "${ref}" parent mismatch (expected "${parent ?? "—"}/${slug}")`);
      }
    }
  };

  for (const location of content.locations) {
    const from = `content/locations/${location.slug}.json`;
    checkRefs(from, "appearsIn", location.appearsIn, storySlugs, "story", errors);
    checkLocationRefs(from, "connectedTo", location.connectedTo);
    checkRefs(from, "sources", location.sources.map((s) => s.storySlug), storySlugs, "story", errors);
    // Containment invariants: parent resolves, no self-parent, depth ≤ 2.
    if (location.parentSlug) {
      if (location.parentSlug === location.slug) {
        errors.push(`${from}: parentSlug points at itself`);
      } else if (!locationSlugs.has(location.parentSlug)) {
        errors.push(`${from}: parentSlug → unknown location "${location.parentSlug}"`);
      } else if (locationParent.get(location.parentSlug)) {
        errors.push(`${from}: parentSlug "${location.parentSlug}" is itself a sub-location — nesting is two levels only`);
      }
    }
  }

  for (const [dirName, entities] of [
    ["characters", content.characters],
    ["creatures", content.creatures],
  ] as const) {
    for (const entity of entities) {
      const from = `content/${dirName}/${entity.slug}.json`;
      checkLocationRefs(from, "locations", entity.locations);
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

/**
 * Visibility filter for the atlas presentation: the map, the Index and menus
 * show only major entities. Minor ones keep their pages and are reachable
 * through cross-links — the world is deeper than the map.
 */
export function majorOnly<T extends { prominence: "major" | "minor" }>(
  entities: T[],
): T[] {
  return entities.filter((e) => e.prominence === "major");
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

/** Top-level locations only — sub-locations render as sections of their parent
    page, so they are not their own routes (ADR-0003). */
export function getTopLocations(): Location[] {
  return loadContent().locations.filter((l) => !l.parentSlug);
}

/** The sub-locations of a location, A→Z — the sections of its fandom page. */
export function getChildLocations(parentSlug: string): Location[] {
  return loadContent()
    .locations.filter((l) => l.parentSlug === parentSlug)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** Resolves a location reference, accepting a composite id `parentSlug/slug`. */
export function getLocation(ref: string): Location | undefined {
  return loadContent().locations.find((l) => l.slug === refSlug(ref));
}

/** The canonical id of a location: `parentSlug/slug` for a sub-location, else `slug`. */
export function locationId(location: Pick<Location, "slug" | "parentSlug">): string {
  return location.parentSlug ? `${location.parentSlug}/${location.slug}` : location.slug;
}

/** Href for a location reference: a sub-location deep-links to its section
    (`#slug`) on its parent's page; a top-level location gets its own page. */
export function locationHref(ref: string): string {
  const i = ref.lastIndexOf("/");
  return i === -1 ? `/locations/${ref}` : `/locations/${ref.slice(0, i)}#${ref.slice(i + 1)}`;
}

export function getCharacters(): Character[] {
  return loadContent().characters;
}

export function getCharacter(slug: string): Character | undefined {
  return loadContent().characters.find((c) => c.slug === slug);
}

export function getCreatures(): Creature[] {
  return loadContent().creatures;
}

export function getCreature(slug: string): Creature | undefined {
  return loadContent().creatures.find((c) => c.slug === slug);
}

/** Everything that appears in one story — the story page's table of contents. */
export function getStoryEntities(storySlug: string): {
  locations: Location[];
  characters: Character[];
  creatures: Creature[];
} {
  const content = loadContent();
  return {
    locations: content.locations.filter((l) => l.appearsIn.includes(storySlug)),
    characters: content.characters.filter((c) => c.appearsIn.includes(storySlug)),
    creatures: content.creatures.filter((c) => c.appearsIn.includes(storySlug)),
  };
}

export function getCharactersAt(locationSlug: string): Character[] {
  return loadContent().characters.filter((c) => c.locations.some((l) => refSlug(l) === locationSlug));
}

export function getCreaturesAt(locationSlug: string): Creature[] {
  return loadContent().creatures.filter((c) => c.locations.some((l) => refSlug(l) === locationSlug));
}

function toMapLocation(content: AtlasContent) {
  return (location: Location): MapLocation[] => {
    if (!location.map) return [];
    // The preview panel is map navigation, so it follows the prominence rule:
    // only major figures are listed (minor ones stay on the location page).
    const figures: MapFigure[] = [
      ...majorOnly(content.characters)
        .filter((c) => c.locations.some((l) => refSlug(l) === location.slug))
        .map((c) => ({ slug: c.slug, name: c.name, kind: "characters" as const })),
      ...majorOnly(content.creatures)
        .filter((c) => c.locations.some((l) => refSlug(l) === location.slug))
        .map((c) => ({ slug: c.slug, name: c.name, kind: "creatures" as const })),
    ];
    return [
      {
        slug: location.slug,
        name: location.name,
        type: location.type,
        summary: location.summary,
        figures,
        x: location.map.x,
        y: location.map.y,
      },
    ];
  };
}

/** Major locations that have map coordinates, shaped for the WorldMap widget. */
export function getMapLocations(): MapLocation[] {
  const content = loadContent();
  return majorOnly(content.locations).flatMap(toMapLocation(content));
}

/**
 * The dev coordinate picker's view (/admin/coords): every placed location
 * regardless of prominence — minors are curated there too, they just stay
 * off the shared map — plus the placement queue of locations that have no
 * `map` yet (fresh from review promotion).
 */
export function getPickerLocations(): {
  placed: MapLocation[];
  unplaced: UnplacedLocation[];
} {
  const content = loadContent();
  return {
    placed: content.locations.flatMap(toMapLocation(content)),
    unplaced: content.locations
      .filter((l) => !l.map)
      .map(({ slug, name, type }) => ({ slug, name, type }))
      .sort((a, b) => a.name.localeCompare(b.name, "en")),
  };
}

/** The legend panel: the chart's stories in order of publication, each with
    its charted major locations A→Z. */
export function getMapLegend(): MapLegendGroup[] {
  const content = loadContent();
  return [...content.stories].sort((a, b) => a.year - b.year).map((story) => ({
    slug: story.slug,
    title: story.title,
    year: story.year,
    locations: majorOnly(content.locations)
      .filter((l) => l.appearsIn.includes(story.slug))
      .flatMap(toMapLocation(content))
      .sort((a, b) => a.name.localeCompare(b.name, "en")),
  }));
}
