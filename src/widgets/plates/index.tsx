import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import alert from "./alert.jpg";
import legrasseIdol from "./legrasse-idol.png";
import rlyeh from "./rlyeh.png";
import swampRitual from "./swamp-ritual.png";

/**
 * Plates — editorial engravings on entity and story pages (CONTEXT.md:
 * «Вклейка»). Pure presentation: interpretations drawn after quoted passages,
 * deliberately kept out of schemas, content JSON and the extraction pipeline.
 * A hand-coded SVG rendition of Plate I is kept in svg-plate.tsx for
 * comparison.
 *
 * A plate with `image: null` is prepared but unpublished: its caption and
 * quote are ready, the engraving is still being made. Once the PNG lands in
 * this directory, add a static import and set `image` — nothing else.
 */

interface PlateDef {
  /** Roman numeral of the plate, in order of appearance in the atlas. */
  numeral: string;
  image: StaticImageData | null;
  alt: string;
  /** Caption line after the numeral: what the engraving shows. */
  caption: string;
  /** The passage the engraving is drawn after — exact text from the story. */
  quote: string;
  attribution: string;
}

/** Keyed by route kind + slug: "creatures/cthulhu", "stories/…", … */
const plates: Record<string, PlateDef> = {
  "creatures/cthulhu": {
    numeral: "I",
    image: legrasseIdol,
    alt: "Engraved plate of the Cthulhu idol: a winged anthropoid monster with a tentacled head bent forward, crouching on a hieroglyphed stone pedestal",
    caption:
      "The Cthulhu idol seized by Inspector Legrasse at the Louisiana swamp worship, drawn after the text:",
    quote:
      "It represented a monster of vaguely anthropoid outline, but with an octopuslike head whose face was a mass of feelers, a scaly, rubbery-looking body, prodigious claws on hind and fore feet, and long, narrow wings behind.",
    attribution: "The Call of Cthulhu (1928) — Chapter 2, The Tale of Inspector Legrasse",
  },
  "locations/rlyeh": {
    numeral: "II",
    image: rlyeh,
    alt: "Engraved plate of R'lyeh risen from the sea: sailors landing at a mud-bank beneath tilted Cyclopean blocks and a monolith-crowned citadel of impossible angles",
    caption: "Johansen's landfall on the risen city, drawn after the text:",
    quote:
      "Johansen and his men landed at a sloping mud-bank on this monstrous Acropolis, and clambered slipperily up over titan oozy blocks which could have been no mortal staircase.",
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  "locations/swamp-and-lagoon-country": {
    numeral: "III",
    image: swampRitual,
    alt: "Engraved plate of the swamp ritual: worshipers writhing around a ring-shaped bonfire and an eight-foot monolith on a grassy island, bodies hanging from a circle of scaffolds",
    caption: "The rite Legrasse's men stumbled upon in the swamps, drawn after the text:",
    quote:
      "Void of clothing, this hybrid spawn were braying, bellowing and writhing about a monstrous ring-shaped bonfire; in the center of which, revealed by occasional rifts in the curtain of flame, stood a great granite monolith some eight feet in height; on top of which, incongruous in its diminutiveness, rested the noxious carven statuette.",
    attribution: "The Call of Cthulhu (1928) — Chapter 2, The Tale of Inspector Legrasse",
  },
  "stories/the-call-of-cthulhu": {
    numeral: "IV",
    image: alert,
    alt: "Engraved plate of the yacht Alert driven head-on against rising Cthulhu, the squid-head with writhing feelers towering over the bowsprit in a stormy sea",
    caption: "The Alert against the risen thing, drawn after the text:",
    quote:
      "The awful squid-head with writhing feelers came nearly up to the bowsprit of the sturdy yacht, but Johansen drove on relentlessly.",
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  "characters/henry-anthony-wilcox": {
    numeral: "V",
    image: null,
    alt: "Engraved plate of the Wilcox bas-relief: a clay tablet bearing a pulpy tentacled head on a scaly winged body over rows of unknown hieroglyphics",
    caption: "The clay bas-relief Wilcox brought to Professor Angell, drawn after the text:",
    quote:
      "A pulpy, tentacled head surmounted a grotesque and scaly body with rudimentary wings; but it was the general outline of the whole which made it most shockingly frightful.",
    attribution: "The Call of Cthulhu (1928) — Chapter 1, The Horror in Clay",
  },
};

function Plate({ def }: { def: PlateDef }) {
  if (!def.image) return null;
  return (
    <figure className="mt-8">
      <div className="mx-auto max-w-md border border-line bg-surface p-3 sm:p-4">
        <Image
          src={def.image}
          alt={def.alt}
          placeholder="blur"
          sizes="(max-width: 640px) 100vw, 448px"
          className="block h-auto w-full"
        />
      </div>
      <figcaption className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-muted">
        <span className="text-xs uppercase tracking-widest">Plate {def.numeral}</span> —{" "}
        {def.caption}
        <span className="mt-2 block font-serif italic text-foreground/80">
          “{def.quote}”
        </span>
        <span className="mt-1 block text-xs">{def.attribution}</span>
      </figcaption>
    </figure>
  );
}

/** The plate for a page, or null — most pages have none. */
export function getPlate(
  kind: "locations" | "characters" | "creatures" | "stories",
  slug: string,
): ReactNode {
  const def = plates[`${kind}/${slug}`];
  return def && def.image ? <Plate def={def} /> : null;
}

export interface PlateThumb {
  numeral: string;
  image: StaticImageData;
  alt: string;
}

/** A published plate as a thumbnail (map preview panel, story galleries). */
export function getPlateThumb(
  kind: "locations" | "characters" | "creatures" | "stories",
  slug: string,
): PlateThumb | null {
  const def = plates[`${kind}/${slug}`];
  return def && def.image
    ? { numeral: def.numeral, image: def.image, alt: def.alt }
    : null;
}
