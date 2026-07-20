/**
 * The bestiary's UI register — the curator's layer over creature content
 * (CONTEXT.md: «Бестиарий»). Latin names, epithets, the order of the plates
 * and the engravings themselves are presentation, exactly like plates and
 * routes: they are written here by hand and never enter schemas, content
 * JSON or the extraction pipeline.
 *
 * Every creature of the atlas has an entry, major or minor — the showcase is
 * where the passing beasts are shown. A beast whose engraving was never made
 * carries `art: null` and prints as a wanting plate (lost-plate.tsx); adding
 * the art later means dropping a mask into public/bestiary/ and filling `art`
 * here, nothing else.
 *
 * Masks are the raster engravings reduced to alpha by
 * scripts/build-monster-masks.mjs and painted through CSS mask-image in
 * currentColor — the same technique the chart's marginalia use, so the
 * bestiary re-inks a beast on hover like every other mark of the atlas.
 */

/** The stirrings of a live engraving — see the `.bestiary-fx-*` rules. */
export type BestiaryEffect = "breath" | "ink-shiver" | "gaze-tilt" | "vermilion-pulse";

export interface BestiaryArt {
  /** Plate-size alpha mask under public/. */
  mask: string;
  /**
   * The same drawing at ribbon size. Beasts that also haunt the margins of
   * the chart lend their mark to the showcase instead of carrying a second
   * small mask of their own.
   */
  thumb: string;
  /** height / width of the trimmed mask (the build script prints it). */
  aspect: number;
  effects: BestiaryEffect[];
}

export interface BestiaryPlate {
  /** Creature content slug. */
  slug: string;
  /** The naturalist's binomial — invented for the atlas, not the stories. */
  latin: string;
  /** One line under the name, drawn from the text. */
  epithet: string;
  art: BestiaryArt | null;
}

/** Beasts that were engraved come first; the wanting plates close the folio. */
export const BESTIARY: BestiaryPlate[] = [
  {
    slug: "cthulhu",
    latin: "Cthulhu rlyehensis",
    epithet: "The dreamer in the sunken city",
    art: {
      mask: "/bestiary/cthulhu.webp",
      thumb: "/maps/monsters/cthulhu.png",
      aspect: 1.008,
      effects: ["breath", "gaze-tilt", "vermilion-pulse"],
    },
  },
  {
    slug: "tornasuk",
    latin: "Tornasuk groenlandicus",
    epithet: "Supreme elder devil of the ice",
    art: {
      mask: "/bestiary/tornasuk.webp",
      thumb: "/maps/monsters/tornasuk.png",
      aspect: 0.924,
      effects: ["ink-shiver", "gaze-tilt"],
    },
  },
  {
    slug: "black-winged-ones",
    latin: "Nigripennes nemorum",
    epithet: "Killers out of the haunted wood",
    art: {
      mask: "/bestiary/black-winged-ones.webp",
      thumb: "/maps/monsters/black-winged-ones.png",
      aspect: 0.993,
      effects: ["breath", "ink-shiver", "gaze-tilt"],
    },
  },
  {
    slug: "white-polypous-thing",
    latin: "Polypus lacustris",
    epithet: "Nightmare itself; to see it is to die",
    art: {
      mask: "/bestiary/white-polypous-thing.webp",
      thumb: "/bestiary/white-polypous-thing-thumb.png",
      aspect: 0.953,
      effects: ["breath", "gaze-tilt"],
    },
  },
  {
    slug: "great-old-ones",
    latin: "Prisci siderei",
    epithet: "Star-born rulers of the elder earth",
    art: null,
  },
  {
    slug: "black-spirits-of-earth",
    latin: "Umbrae telluris",
    epithet: "Of whom old Castro dared not speak",
    art: null,
  },
];

/** The register entry for a creature, or undefined if it has none. */
export function getBestiaryPlate(slug: string): BestiaryPlate | undefined {
  return BESTIARY.find((entry) => entry.slug === slug);
}

/** The plate's number in the folio, as printed under every figure. */
export function bestiaryFigure(slug: string): number {
  return BESTIARY.findIndex((entry) => entry.slug === slug) + 1;
}

/**
 * Build-time guard on the two halves of a beast. Every creature in the
 * content needs an entry here or it would vanish from the showcase; every
 * entry here needs its creature or the showcase would print a name the
 * atlas cannot open. Either way the static build stops.
 */
export function assertBestiaryComplete(contentSlugs: string[]): void {
  const registered = new Set(BESTIARY.map((entry) => entry.slug));
  const unregistered = contentSlugs.filter((slug) => !registered.has(slug));
  const orphaned = BESTIARY.map((entry) => entry.slug).filter(
    (slug) => !contentSlugs.includes(slug),
  );
  if (unregistered.length || orphaned.length) {
    throw new Error(
      "bestiary register out of step with content/creatures — " +
        [
          unregistered.length && `no register entry for ${unregistered.join(", ")}`,
          orphaned.length && `no creature for ${orphaned.join(", ")}`,
        ]
          .filter(Boolean)
          .join("; ") +
        " (src/widgets/bestiary/registry.ts)",
    );
  }
}

/**
 * A register entry joined with its content — what the server hands the
 * showcase island. Plain JSON: no ReactNode, nothing to serialize around.
 */
export interface BestiaryEntry extends BestiaryPlate {
  name: string;
  classification: string;
  summary: string;
  /** Number of the figure in the folio, 1-based. */
  fig: number;
}
