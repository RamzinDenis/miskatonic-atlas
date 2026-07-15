import { z } from "zod";

export const SourceRef = z.object({
  storySlug: z.string(),
  quote: z.string().max(600),
  context: z.string().optional(),
});

export const MapPoint = z.object({
  mapId: z.string().default("world"),
  x: z.number(),
  y: z.number(),
});

/**
 * Editorial weight of an entity in the atlas presentation (see CONTEXT.md).
 * Minor entities keep their pages but stay off the map, indexes and menus.
 * An editorial decision, never set by the extraction pipeline.
 */
export const Prominence = z.enum(["major", "minor"]).default("major");

export const StorySchema = z.object({
  slug: z.string(),
  title: z.string(),
  year: z.number().int(),
  summary: z.string(),
});

export const LocationSchema = z.object({
  slug: z.string(),
  name: z.string(),
  nameRu: z.string().optional(),
  type: z.enum(["city", "town", "building", "region", "ruin", "sea", "other"]),
  prominence: Prominence,
  summary: z.string(),
  description: z.string(),
  map: MapPoint.optional(),
  realWorld: z.string().optional(),
  appearsIn: z.array(z.string()),
  connectedTo: z.array(z.string()),
  sources: z.array(SourceRef).min(1),
  image: z.string().optional(),
});

export const CharacterSchema = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.enum(["protagonist", "witness", "cultist", "scholar", "other"]),
  prominence: Prominence,
  summary: z.string(),
  description: z.string(),
  locations: z.array(z.string()),
  appearsIn: z.array(z.string()),
  fate: z.string().optional(),
  sources: z.array(SourceRef).min(1),
});

export const CreatureSchema = CharacterSchema.omit({ role: true }).extend({
  classification: z.enum(["great-old-one", "deity", "race", "entity"]),
});

// Frozen until post-MVP: events and the timeline are out of MVP scope (see PLAN.md).
export const EventSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  dateSort: z.number(),
  summary: z.string(),
  locations: z.array(z.string()),
  characters: z.array(z.string()),
  appearsIn: z.array(z.string()),
  sources: z.array(SourceRef).min(1),
});

export type Source = z.infer<typeof SourceRef>;
export type MapPosition = z.infer<typeof MapPoint>;
export type Story = z.infer<typeof StorySchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Creature = z.infer<typeof CreatureSchema>;
