import { describe, expect, it } from "vitest";
import {
  buildSearchable,
  diagnoseQuote,
  findQuote,
  fold,
  type NormalizedStory,
} from "./quote-search";

/* The invariant under test is the whole "no fact without a quote" gate:
   verify-quotes and /admin/review both judge quotes through this module. */

const story: NormalizedStory = {
  slug: "test-story",
  title: "A Test of the Gate",
  paragraphs: [
    { n: 1, chapter: 1, text: "In his house at R'lyeh dead Cthulhu waits dreaming." },
    { n: 2, chapter: 1, text: "The Thing cannot be described—there is no language for such abysms." },
    { n: 3, chapter: 2, text: "In his house at R'lyeh dead Cthulhu waits dreaming." },
  ],
};

const searchable = buildSearchable(story);

describe("fold", () => {
  it("normalizes curly quotes to straight ones", () => {
    expect(fold("R’lyeh and “the deep”")).toBe(`R'lyeh and "the deep"`);
  });

  it("folds double hyphens and en dashes into em dashes", () => {
    expect(fold("night--gaunt")).toBe("night—gaunt");
    expect(fold("night–gaunt")).toBe("night—gaunt");
  });

  it("expands ellipsis, drops emphasis underscores, collapses whitespace", () => {
    expect(fold("_Cthulhu_ …  fhtagn \n ")).toBe("Cthulhu ... fhtagn");
  });
});

describe("buildSearchable", () => {
  it("records the start offset of every paragraph", () => {
    const [p1, p2] = searchable.offsets;
    expect(p1).toBe(0);
    // +1 for the space that joins folded paragraphs.
    expect(p2).toBe(fold(story.paragraphs[0].text).length + 1);
  });
});

describe("findQuote", () => {
  it("returns the paragraph number of an exact quote", () => {
    expect(findQuote(searchable, "The Thing cannot be described")).toEqual([2]);
  });

  it("returns every paragraph a repeated quote occurs in", () => {
    expect(findQuote(searchable, "dead Cthulhu waits dreaming")).toEqual([1, 3]);
  });

  it("matches across punctuation styles via folding", () => {
    // The story prints an em dash; the quote arrives with a double hyphen.
    expect(findQuote(searchable, "described--there is no language")).toEqual([2]);
  });

  it("returns empty for a quote that is not in the text", () => {
    expect(findQuote(searchable, "That is not dead which can eternal lie")).toEqual([]);
  });

  it("attributes a quote spanning two paragraphs to the first one", () => {
    expect(findQuote(searchable, "waits dreaming. The Thing cannot")).toEqual([1]);
  });
});

describe("diagnoseQuote", () => {
  it("anchors a corrupted tail at the start and marks the divergence", () => {
    const d = diagnoseQuote(searchable, "The Thing cannot be described—but here the LLM invented");
    expect(d).not.toBeNull();
    expect(d!.anchor).toBe("start");
    expect(d!.matched).toBeGreaterThanOrEqual(12);
    expect(d!.quoteAround).toContain("◆but here the LLM invented");
  });

  it("anchors a corrupted head at the end", () => {
    const d = diagnoseQuote(searchable, "Words never written there is no language for such abysms.");
    expect(d).not.toBeNull();
    expect(d!.anchor).toBe("end");
  });

  it("returns null when nothing long enough anchors", () => {
    expect(diagnoseQuote(searchable, "zzz qqq vvv www yyy")).toBeNull();
  });
});
