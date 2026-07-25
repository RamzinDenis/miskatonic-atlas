/**
 * The bestiary's UI register — the curator's layer over creature content
 * (CONTEXT.md: «Бестиарий»). Latin names, epithets, the order of the plates
 * and the engravings themselves are presentation, exactly like plates and
 * routes: they are written here by hand and never enter schemas, content
 * JSON or the extraction pipeline.
 *
 * The register is curation, not a gate: a creature promoted from review with
 * no entry here still prints — as a wanting plate (lost-plate.tsx) under its
 * content name, with no binomial and no epithet until the curator writes
 * them. A registered beast whose engraving was never made carries `art: null`
 * and prints as a wanting plate too; adding the art later means dropping a
 * mask into public/bestiary/ and filling `art` here, nothing else. The only
 * hard error left is an entry whose creature is gone from content/.
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
    slug: "the-thing",
    latin: "Polyphemus abyssorum",
    epithet: "Vast, Polyphemus-like, and loathsome",
    art: {
      mask: "/bestiary/the-thing.webp",
      thumb: "/maps/monsters/the-thing.png",
      aspect: 0.88,
      effects: ["breath", "ink-shiver", "gaze-tilt"],
    },
  },
  {
    slug: "the-crawling-reptiles-of-the-nameless-city",
    latin: "Lacerta palaeogaea",
    epithet: "Outside all established categories",
    art: {
      mask: "/bestiary/the-crawling-reptiles-of-the-nameless-city.webp",
      thumb: "/maps/monsters/the-crawling-reptiles-of-the-nameless-city.png",
      aspect: 0.765,
      effects: ["breath", "ink-shiver", "gaze-tilt"],
    },
  },
  {
    slug: "the-dunwich-horror",
    latin: "Progenies dunvicensis",
    epithet: "Bigger than a barn, and all of squirming ropes",
    art: {
      mask: "/bestiary/the-dunwich-horror.webp",
      thumb: "/maps/monsters/the-dunwich-horror.png",
      aspect: 1.036,
      effects: ["breath", "ink-shiver", "gaze-tilt", "vermilion-pulse"],
    },
  },
  {
    /* The one ordinary animal in the folio, so the one plate with no
       marginalia twin: a bird of the Dunwich nights belongs on the page,
       not adrift in the Atlantic where the chart keeps its beasts. */
    slug: "whippoorwills",
    latin: "Caprimulgus psychopompus",
    epithet: "Lying in wait for the souls of the dying",
    art: {
      mask: "/bestiary/whippoorwills.webp",
      thumb: "/bestiary/whippoorwills-thumb.png",
      aspect: 0.643,
      effects: ["ink-shiver", "gaze-tilt"],
    },
  },
  {
    slug: "hybrid-winged-things",
    latin: "Volucris tartarea",
    epithet: "Not altogether crows, nor moles, nor buzzards",
    art: {
      mask: "/bestiary/hybrid-winged-things.webp",
      thumb: "/maps/monsters/hybrid-winged-things.png",
      aspect: 0.87,
      effects: ["breath", "ink-shiver", "gaze-tilt"],
    },
  },
  {
    slug: "amorphous-flute-player",
    latin: "Tibicen informis",
    epithet: "Piping noisomely beyond the light",
    art: {
      mask: "/bestiary/amorphous-flute-player.webp",
      thumb: "/bestiary/amorphous-flute-player-thumb.png",
      aspect: 0.748,
      effects: ["breath", "ink-shiver"],
    },
  },
  {
    /* The folio's one mineral, engraved like a cabinet specimen — its
       marginalia twin lies beside the well on the Miskatonic sheet. */
    slug: "the-meteorite",
    latin: "Aerolithus contrahens",
    epithet: "A piece of the great outside",
    art: {
      mask: "/bestiary/the-meteorite.webp",
      thumb: "/maps/monsters/the-meteorite.png",
      aspect: 0.858,
      effects: ["ink-shiver", "vermilion-pulse"],
    },
  },
  {
    slug: "great-old-ones",
    latin: "Prisci siderei",
    epithet: "Star-born rulers of the elder earth",
    art: null,
  },
  {
    slug: "yog-sothoth",
    latin: "Ianitor portarum",
    epithet: "The gate, the key, and the guardian of the gate",
    art: null,
  },
  {
    slug: "the-old-ones",
    latin: "Antiqui interstitiales",
    epithet: "Not in the spaces we know, but between them",
    art: null,
  },
  {
    slug: "elder-things",
    latin: "Priores lapsi",
    epithet: "They wished to strip the earth and drag it away",
    art: null,
  },
  {
    slug: "black-spirits-of-earth",
    latin: "Umbrae telluris",
    epithet: "Of whom old Castro dared not speak",
    art: null,
  },
  {
    slug: "dagon",
    latin: "Dagon philistaeus",
    epithet: "The Fish-God of the ancient Philistine legend",
    art: null,
  },
  {
    /* A wanting plate by the story's own decree: "it was only by analogy
       that they called it colour at all" — black ink cannot print the
       un-colour, so the folio never will. Plate X shows its light instead. */
    slug: "the-colour-out-of-space",
    latin: "Color extraneus",
    epithet: "A frightful messenger from unformed realms of infinity",
    art: null,
  },
];

/** The creature content the folio needs — structural, so the widget never
    imports the content gateway (a node:fs module) or its schemas. */
export interface FolioCreature {
  slug: string;
  name: string;
  classification: string;
  summary: string;
}

/**
 * A plate joined with its content — what the server hands the showcase
 * island. Plain JSON: no ReactNode, nothing to serialize around. For an
 * uncurated beast `latin` and `epithet` are null and the caption prints
 * without them.
 */
export interface BestiaryEntry {
  slug: string;
  name: string;
  classification: string;
  summary: string;
  latin: string | null;
  epithet: string | null;
  art: BestiaryArt | null;
  /** Number of the figure in the folio, 1-based over the final order. */
  fig: number;
}

/**
 * The folio itself: every creature of the content joined with its register
 * entry. Curated plates come first in the register's order; uncurated beasts
 * close the folio A→Z as wanting plates. Throws only for an orphaned entry —
 * a register row whose creature is gone would print a name the atlas cannot
 * open, so the static build stops.
 */
export function bestiaryFolio(creatures: FolioCreature[]): BestiaryEntry[] {
  const bySlug = new Map(creatures.map((creature) => [creature.slug, creature]));

  const orphaned = BESTIARY.filter((plate) => !bySlug.has(plate.slug));
  if (orphaned.length > 0) {
    throw new Error(
      `bestiary register out of step with content/creatures — no creature for ${orphaned
        .map((plate) => plate.slug)
        .join(", ")} (src/widgets/bestiary/registry.ts)`,
    );
  }

  const registered = new Set(BESTIARY.map((plate) => plate.slug));
  const uncurated = creatures
    .filter((creature) => !registered.has(creature.slug))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  return [
    ...BESTIARY.map((plate) => ({
      ...plate,
      name: bySlug.get(plate.slug)!.name,
      classification: bySlug.get(plate.slug)!.classification,
      summary: bySlug.get(plate.slug)!.summary,
    })),
    ...uncurated.map((creature) => ({
      ...creature,
      latin: null,
      epithet: null,
      art: null,
    })),
  ].map((entry, i) => ({ ...entry, fig: i + 1 }));
}
