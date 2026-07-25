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
import { MAPS } from "../maps.ts"; // relative + extension for the same reason
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
    // A placement must name a registered chart (src/shared/maps.ts).
    if (location.map && !MAPS[location.map.mapId]) {
      errors.push(`${from}: map.mapId → unknown chart "${location.map.mapId}"`);
    }
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

function toMapLocation(content: AtlasContent, mapId: string) {
  return (location: Location): MapLocation[] => {
    // Each location lives on exactly one chart (docs/regional-map.md): a pin
    // appears only on the map its `map.mapId` names.
    if (!location.map || location.map.mapId !== mapId) return [];
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
        prominence: location.prominence,
        x: location.map.x,
        y: location.map.y,
      },
    ];
  };
}

/**
 * A provisional first-pass placement for every location that has no `map` yet
 * (the /admin/coords "Seed queue" button): anchor each near a related placed
 * pin — its containment parent, else a placed connection — with a small
 * deterministic fan-out so siblings don't stack. Rough on purpose; the editor
 * drags each to its real spot afterward.
 *
 * `mapId` is the chart the picker is open on, and it decides only where the
 * *unanchored* land: a fresh cluster whose whole story is still unpinned (the
 * Dunwich country on an empty regional sheet) belongs on the chart the editor
 * is actually curating, not on the world scan. Anchored seeds still follow
 * their anchor onto whatever chart it sits on.
 */
export function getSeedPlacements(
  mapId = "world",
): { slug: string; mapId: string; x: number; y: number }[] {
  const content = loadContent();
  const placed = new Map<string, { mapId: string; x: number; y: number }>();
  for (const l of content.locations)
    if (l.map) placed.set(l.slug, { mapId: l.map.mapId, x: l.map.x, y: l.map.y });
  // Snapshot: connectedTo may anchor only to pins that existed before seeding,
  // so a chain of thematic links (Harvard↔Paris) can't drag a whole cluster
  // abroad. Containment (parentSlug) still chains through freshly-seeded pins.
  const originalPlaced = new Set(placed.keys());
  const bySlug = new Map(content.locations.map((l) => [l.slug, l]));
  const sharesStory = (a: Location, b: Location) =>
    a.appearsIn.some((s) => b.appearsIn.includes(s));

  // Fallback for anything with no placed relation at all: the New England
  // landmarks when they are on this very chart (the world scan's case), else
  // the middle of the open sheet — a regional chart with nothing pinned yet
  // has no landmark to hang off.
  const chart = MAPS[mapId] ?? MAPS.world;
  const onChart = (p: { mapId: string; x: number; y: number } | undefined) =>
    p && p.mapId === chart.id ? p : undefined;
  const fallback = onChart(placed.get("boston")) ??
    onChart(placed.get("new-england")) ?? {
      mapId: chart.id,
      x: Math.round(chart.width / 2),
      y: Math.round(chart.height / 2),
    };
  const counter = new Map<string, number>();
  const offset = (key: string): { x: number; y: number } => {
    const n = counter.get(key) ?? 0;
    counter.set(key, n + 1);
    const angle = n * 2.399963; // golden angle — even, deterministic fan-out
    const radius = 34 + n * 12;
    return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
  };

  // A same-story connection already on the chart — geographic neighbours
  // co-occur; far thematic links usually don't share a story.
  const connAnchor = (
    l: Location,
  ): { at: { mapId: string; x: number; y: number }; key: string } | null => {
    for (const ref of l.connectedTo) {
      const s = refSlug(ref);
      const target = bySlug.get(s);
      if (originalPlaced.has(s) && target && sharesStory(l, target))
        return { at: placed.get(s)!, key: s };
    }
    return null;
  };

  const result: { slug: string; mapId: string; x: number; y: number }[] = [];
  const unplaced = content.locations.filter((l) => !l.map);
  // A seed lands on its anchor's chart: sub-locations of a regionally-pinned
  // parent cluster on the regional map, not on the world scan.
  const seed = (l: Location, base: { mapId: string; x: number; y: number }, key: string) => {
    const o = offset(key);
    const p = { mapId: base.mapId, x: base.x + o.x, y: base.y + o.y };
    result.push({ slug: l.slug, ...p });
    placed.set(l.slug, p);
  };
  // Top-level first: anchor to a same-story pin, else the open chart.
  for (const l of unplaced) {
    if (l.parentSlug) continue;
    const anc = connAnchor(l);
    seed(l, anc ? anc.at : fallback, anc ? anc.key : "__fallback__");
  }
  // Then sub-locations cluster around their now-placed parent.
  for (const l of unplaced) {
    if (!l.parentSlug) continue;
    const parent = placed.get(l.parentSlug);
    seed(l, parent ?? fallback, parent ? l.parentSlug : "__fallback__");
  }
  return result;
}

/**
 * Major locations pinned on the given chart, shaped for the WorldMap widget.
 * Sub-locations never pin publicly (ADR-0003 — their anchor is a section of
 * the parent's page); placing one in the picker only feeds its page inset.
 */
export function getMapLocations(mapId = "world"): MapLocation[] {
  const content = loadContent();
  return majorOnly(content.locations)
    .filter((l) => !l.parentSlug)
    .flatMap(toMapLocation(content, mapId));
}

/**
 * The dev coordinate picker's view (/admin/coords): every placed location
 * regardless of prominence — minors are curated there too, they just stay
 * off the shared map — plus the placement queue of locations that have no
 * `map` yet (fresh from review promotion).
 */
export function getPickerLocations(mapId = "world"): {
  placed: MapLocation[];
  unplaced: UnplacedLocation[];
} {
  const content = loadContent();
  return {
    placed: content.locations.flatMap(toMapLocation(content, mapId)),
    // The queue is chart-agnostic: an unplaced location can be pinned on
    // whichever chart the picker is currently showing.
    unplaced: content.locations
      .filter((l) => !l.map)
      .map(({ slug, name, type }) => ({ slug, name, type }))
      .sort((a, b) => a.name.localeCompare(b.name, "en")),
  };
}

/** The legend panel: the chart's stories in order of publication, each with
    its charted major locations A→Z. A story belongs to the charts its places
    are actually pinned on — one with no pins here is another sheet's story. */
export function getMapLegend(mapId = "world"): MapLegendGroup[] {
  const content = loadContent();
  return [...content.stories]
    .sort((a, b) => a.year - b.year)
    .map((story) => ({
      slug: story.slug,
      title: story.title,
      year: story.year,
      locations: majorOnly(content.locations)
        .filter((l) => !l.parentSlug && l.appearsIn.includes(story.slug))
        .flatMap(toMapLocation(content, mapId))
        .sort((a, b) => a.name.localeCompare(b.name, "en")),
    }))
    .filter((group) => group.locations.length > 0);
}
