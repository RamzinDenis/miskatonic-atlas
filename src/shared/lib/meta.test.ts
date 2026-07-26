import { describe, expect, it } from "vitest";
import { metaDescription } from "./meta";

/* Search results and social cards truncate around 150–160 characters; the
   description must arrive already cut at a sentence, never mid-phrase. */

describe("metaDescription", () => {
  it("returns a short summary untouched", () => {
    const short = "A drowned city rises when the stars are right.";
    expect(metaDescription(short)).toBe(short);
  });

  it("clips a long summary at a sentence boundary within 160 chars", () => {
    const first = "A".repeat(100) + " ends here.";
    const clipped = metaDescription(`${first} ${"B".repeat(120)} tail.`);
    expect(clipped).toBe(first);
    expect(clipped.length).toBeLessThanOrEqual(160);
  });

  it("does not treat a title's period as a sentence end", () => {
    const summary =
      "The physician Dr. Hartwell attends the stricken household on the hill. " +
      "He climbs through the dark to Nahum Gardner's farm and finds the water tainted. " +
      "Nothing he prescribes has any effect on the grey brittle sickness.";
    expect(metaDescription(summary)).toBe(
      "The physician Dr. Hartwell attends the stricken household on the hill. " +
        "He climbs through the dark to Nahum Gardner's farm and finds the water tainted.",
    );
  });

  it("falls back to a word cut with an ellipsis on one run-on sentence", () => {
    const runOn = "word ".repeat(60).trim();
    const clipped = metaDescription(runOn);
    expect(clipped.length).toBeLessThanOrEqual(160);
    expect(clipped.endsWith("…")).toBe(true);
    expect(clipped).not.toMatch(/wor…$/);
  });
});
