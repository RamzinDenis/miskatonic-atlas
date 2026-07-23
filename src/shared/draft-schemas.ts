import { z } from "zod";

/**
 * Zod shapes of the two LLM pipeline steps (docs/plan-extract-sdk.md):
 * the Output sections of prompts/extract.md and prompts/merge.md, formalized
 * for structured outputs (`output_config.format` via zodOutputFormat).
 *
 * Deliberately separate from the content schemas in schemas.ts: no defaults,
 * no min/max constraints (structured outputs reject most of them), optional
 * semantics expressed as `.nullable()` — the scripts drop nulls when writing
 * files, so the JSON on disk matches the playbook examples. Final validation
 * stays with `npm run check-drafts` against the real schemas.
 */

export const DraftSourceRef = z.object({
  storySlug: z.string(),
  paragraph: z.number().int().describe("paragraph number the quote comes from"),
  quote: z
    .string()
    .describe("verbatim substring of the paragraph, ≤600 characters, checked by exact search"),
  context: z
    .string()
    .nullable()
    .describe('"Chapter <n>, <chapter title>" — null for front matter or chapterless stories'),
});

export const OccurrenceRecord = z.object({
  kind: z.enum(["location", "character", "creature"]),
  name: z.string().describe("name exactly as written in the passage"),
  aliases: z
    .array(z.string())
    .describe("other spellings/titles used for the same referent in THIS passage"),
  facts: z
    .array(z.string())
    .describe("atomic factual claims stated in the passage, each traceable to a quote"),
  typeGuess: z
    .string()
    .nullable()
    .describe(
      "location: city|town|building|region|ruin|sea|other · character: protagonist|witness|cultist|scholar|other · creature: great-old-one|deity|race|entity — null if the passage gives no basis",
    ),
  realWorld: z
    .string()
    .nullable()
    .describe("real-world identification if the passage itself makes it (locations only)"),
  fate: z
    .string()
    .nullable()
    .describe("the entity's fate if stated in the passage (characters/creatures)"),
  relatedNames: z
    .array(z.string())
    .describe("names of other extracted entities this one is explicitly linked to in the passage"),
  sources: z.array(DraftSourceRef),
});

/** Structured-output envelope for one extraction window. */
export const WindowOutput = z.object({
  occurrences: z
    .array(OccurrenceRecord)
    .describe("every occurrence record for this window; empty when nothing is extractable"),
});

export type Occurrence = z.infer<typeof OccurrenceRecord>;

const NeedsReviewEntry = z.object({
  field: z.string(),
  reason: z.string(),
  candidates: z.array(z.string()),
});

const DraftMeta = z.object({
  aliases: z.array(z.string()).describe("every variant seen across windows"),
  occurrences: z.number().int(),
  windows: z.array(z.string()).describe('window ids, e.g. "w001-012"'),
  facts: z.array(z.string()).describe("union of all facts, deduplicated, each still atomic"),
  needsReview: z.array(NeedsReviewEntry),
});

const draftEntityBase = {
  slug: z.string().describe("kebab-case of the canonical name, apostrophes dropped"),
  name: z.string().describe("canonical name — the fullest form any window saw"),
  summary: z.string().describe("1–2 sentences, synthesized only from the merged facts"),
  description: z.string().describe("2–3 paragraphs separated by \\n\\n, every claim sourced"),
  appearsIn: z.array(z.string()).describe("story slugs only"),
  sources: z.array(DraftSourceRef).describe("the 2–3 strongest quotes, keep paragraph numbers"),
  _draft: DraftMeta,
};

export const DraftLocation = z.object({
  ...draftEntityBase,
  type: z.enum(["city", "town", "building", "region", "ruin", "sea", "other"]),
  realWorld: z
    .string()
    .nullable()
    .describe("only if some occurrence stated it; conflicts go to needsReview"),
  connectedTo: z.array(z.string()).describe("location slugs from this merged set or existing content"),
});

export const DraftCharacter = z.object({
  ...draftEntityBase,
  role: z.enum(["protagonist", "witness", "cultist", "scholar", "other"]),
  locations: z.array(z.string()).describe("location slugs from this merged set or existing content"),
  fate: z.string().nullable().describe("only if some occurrence stated it"),
});

export const DraftCreature = z.object({
  ...draftEntityBase,
  classification: z.enum(["great-old-one", "deity", "race", "entity"]),
  locations: z.array(z.string()).describe("location slugs from this merged set or existing content"),
  fate: z.string().nullable().describe("only if some occurrence stated it"),
});

/** Structured-output envelope of merge wave 1 (locations). */
export const MergeWave1Output = z.object({
  locations: z.array(DraftLocation),
});

/** Structured-output envelope of merge wave 2 (characters + creatures). */
export const MergeWave2Output = z.object({
  characters: z.array(DraftCharacter),
  creatures: z.array(DraftCreature),
});
