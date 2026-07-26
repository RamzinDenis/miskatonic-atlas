import { describe, expect, it } from "vitest";
import type { Occurrence } from "../src/shared/draft-schemas.ts";
import { foldName, matchingExisting, toDiskEntity, type RegistryEntry } from "./merge-lib.mts";

/* The merge step's identity rule and disk shape: folding decides which window
   occurrences enrich an existing entity, toDiskEntity decides what survives a
   re-merge (editorial fields must never be lost to a fresh draft). */

const occurrence = (name: string, aliases: string[] = []) =>
  ({ name, aliases }) as Occurrence;

const entry = (slug: string, name: string, json: Record<string, unknown> = {}): RegistryEntry => ({
  slug,
  name,
  json,
});

describe("foldName", () => {
  it("lowercases, strips apostrophes and punctuation, drops a leading article", () => {
    expect(foldName("R'lyeh")).toBe("rlyeh");
    expect(foldName("The Call of Cthulhu")).toBe("call of cthulhu");
    expect(foldName("  Great—Old   Ones! ")).toBe("great old ones");
  });
});

describe("matchingExisting", () => {
  const registry = [
    entry("rlyeh", "R'lyeh"),
    entry("the-blasted-heath", "The Blasted Heath"),
    entry("arkham", "Arkham"),
  ];

  it("matches by folded name and by alias", () => {
    const hits = matchingExisting(
      [occurrence("R’lyeh"), occurrence("the heath", ["Blasted Heath"])],
      registry,
    );
    expect(hits.map((e) => e.slug)).toEqual(["rlyeh", "the-blasted-heath"]);
  });

  it("matches by folded slug when the names differ", () => {
    const hits = matchingExisting([occurrence("the blasted heath")], registry);
    expect(hits.map((e) => e.slug)).toEqual(["the-blasted-heath"]);
  });

  it("returns nothing for unknown names", () => {
    expect(matchingExisting([occurrence("Yuggoth")], registry)).toEqual([]);
  });
});

describe("toDiskEntity", () => {
  const draft = {
    slug: "rlyeh",
    name: "R'lyeh",
    type: "ruin",
    summary: "s",
    description: "d",
    realWorld: null,
    appearsIn: ["the-call-of-cthulhu"],
    connectedTo: ["pacific"],
    sources: [{ storySlug: "the-call-of-cthulhu", quote: "q", context: null }],
    _draft: { aliases: [], occurrences: 1, windows: ["w001"], facts: [], needsReview: [] },
  };

  it("preserves editorial fields of the existing entity across a re-merge", () => {
    const existing = entry("rlyeh", "R'lyeh", {
      prominence: "minor",
      map: { mapId: "pacific", x: 995, y: 710 },
      image: "rlyeh.png",
    });
    const disk = toDiskEntity(draft, "locations", existing);
    expect(disk.prominence).toBe("minor");
    expect(disk.map).toEqual({ mapId: "pacific", x: 995, y: 710 });
    expect(disk.image).toBe("rlyeh.png");
  });

  it("drops nulls instead of writing them to disk", () => {
    const disk = toDiskEntity(draft, "locations", undefined);
    expect("realWorld" in disk).toBe(false);
    const [source] = disk.sources as Record<string, unknown>[];
    expect("context" in source).toBe(false);
  });

  it("shapes fields by kind: locations carry no locations array, characters do", () => {
    const location = toDiskEntity(draft, "locations", undefined);
    expect("locations" in location).toBe(false);
    expect(location.connectedTo).toEqual(["pacific"]);

    const character = toDiskEntity(
      { ...draft, role: "witness", locations: ["rlyeh"], fate: null },
      "characters",
      undefined,
    );
    expect(character.role).toBe("witness");
    expect(character.locations).toEqual(["rlyeh"]);
    expect("connectedTo" in character).toBe(false);
    expect("fate" in character).toBe(false);
  });
});
