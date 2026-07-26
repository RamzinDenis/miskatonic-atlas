import { describe, expect, it } from "vitest";
import { CharacterSchema, CreatureSchema, LocationSchema } from "./schemas";

/* The schema invariants the whole atlas leans on: no entity without a source,
   prominence defaults to major without printing a field (ADR-0005), and a
   creature is a character minus role plus classification. */

const source = { storySlug: "dagon", quote: "I shall never sleep calmly again." };

const location = {
  slug: "rlyeh",
  name: "R'lyeh",
  type: "ruin",
  summary: "s",
  description: "d",
  appearsIn: ["the-call-of-cthulhu"],
  connectedTo: [],
  sources: [source],
};

describe("sources gate", () => {
  it("rejects an entity with an empty sources array", () => {
    expect(LocationSchema.safeParse({ ...location, sources: [] }).success).toBe(false);
  });

  it("rejects a quote longer than the 600-char cap", () => {
    const long = { storySlug: "dagon", quote: "x".repeat(601) };
    expect(LocationSchema.safeParse({ ...location, sources: [long] }).success).toBe(false);
  });
});

describe("prominence (ADR-0005)", () => {
  it("defaults to major when the field is absent from JSON", () => {
    const parsed = LocationSchema.parse(location);
    expect(parsed.prominence).toBe("major");
  });

  it("accepts an explicit minor and rejects anything else", () => {
    expect(LocationSchema.parse({ ...location, prominence: "minor" }).prominence).toBe("minor");
    expect(LocationSchema.safeParse({ ...location, prominence: "hidden" }).success).toBe(false);
  });
});

describe("creature = character − role + classification", () => {
  const character = {
    slug: "johansen",
    name: "Gustaf Johansen",
    role: "witness",
    summary: "s",
    description: "d",
    locations: [],
    appearsIn: ["the-call-of-cthulhu"],
    sources: [source],
  };

  it("accepts a character with a role", () => {
    expect(CharacterSchema.safeParse(character).success).toBe(true);
  });

  it("requires classification on a creature and drops role", () => {
    const base: Record<string, unknown> = { ...character };
    delete base.role;
    expect(CreatureSchema.safeParse(base).success).toBe(false);
    expect(
      CreatureSchema.safeParse({ ...base, classification: "great-old-one" }).success,
    ).toBe(true);
  });
});
