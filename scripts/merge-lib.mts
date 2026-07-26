import type { Occurrence } from "../src/shared/draft-schemas.ts";

/**
 * Pure logic of the merge step (scripts/merge.mts), split out so it can be
 * unit-tested: merge.mts runs main() on import, this module has no side
 * effects. Everything fs/LLM-bound stays in merge.mts.
 */

export const KINDS = ["locations", "characters", "creatures"] as const;
export type Kind = (typeof KINDS)[number];

export interface RegistryEntry {
  slug: string;
  name: string;
  json: Record<string, unknown>;
}

/** Loose name folding for enrichment matching (mirrors the playbook's identity rule). */
export function foldName(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the /, "");
}

export function matchingExisting(
  occurrences: Occurrence[],
  registry: RegistryEntry[],
): RegistryEntry[] {
  const seen = new Set<string>();
  for (const o of occurrences) {
    seen.add(foldName(o.name));
    for (const a of o.aliases) seen.add(foldName(a));
  }
  return registry.filter((e) => seen.has(foldName(e.name)) || seen.has(foldName(e.slug)));
}

export type DiskEntity = Record<string, unknown>;

/** Field order of the content/ files; nulls dropped, existing-only fields preserved. */
export function toDiskEntity(
  draft: Record<string, unknown>,
  kind: Kind,
  existing: RegistryEntry | undefined,
): DiskEntity {
  const keep = (existing?.json ?? {}) as Record<string, unknown>;
  const val = (k: string) => (draft[k] === null ? undefined : draft[k]);
  const entity: DiskEntity = {
    slug: draft.slug,
    name: draft.name,
    ...(keep.nameRu !== undefined && { nameRu: keep.nameRu }),
    ...(keep.parentSlug !== undefined && { parentSlug: keep.parentSlug }),
    ...(keep.subtitle !== undefined && { subtitle: keep.subtitle }),
    ...(kind === "locations" && { type: draft.type }),
    ...(kind === "characters" && { role: draft.role }),
    ...(kind === "creatures" && { classification: draft.classification }),
    ...(keep.prominence !== undefined && { prominence: keep.prominence }),
    summary: draft.summary,
    description: draft.description,
    ...(kind === "locations" && keep.map !== undefined && { map: keep.map }),
    ...(kind === "locations" && val("realWorld") !== undefined && { realWorld: val("realWorld") }),
    ...(kind !== "locations" && { locations: draft.locations }),
    appearsIn: draft.appearsIn,
    ...(kind === "locations" && { connectedTo: draft.connectedTo }),
    ...(kind !== "locations" && val("fate") !== undefined && { fate: val("fate") }),
    sources: (draft.sources as { context: string | null }[]).map((s) => ({
      ...s,
      ...(s.context === null ? { context: undefined } : {}),
    })),
    ...(keep.image !== undefined && { image: keep.image }),
    _draft: draft._draft,
  };
  return JSON.parse(JSON.stringify(entity)); // strip undefined
}
