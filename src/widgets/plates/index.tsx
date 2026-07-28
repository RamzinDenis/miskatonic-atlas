import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import alert from "./alert.jpg";
import legrasseIdol from "./legrasse-idol.png";
import monolithRite from "./monolith-rite.png";
import rlyeh from "./rlyeh.png";
import sentinelRite from "./sentinel-rite.png";
import swampRitual from "./swamp-ritual.png";
import theNamelessCity from "./the-nameless-city.png";
import wellRadiance from "./well-radiance.png";
import wilcoxBasRelief from "./wilcox-bas-relief.jpg";
import yuleRite from "./yule-rite.png";

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
  /** The story whose passage the engraving illustrates. */
  storySlug: string;
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
    storySlug: "the-call-of-cthulhu",
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
    storySlug: "the-call-of-cthulhu",
    image: rlyeh,
    alt: "Engraved plate of R'lyeh risen from the sea: sailors landing at a mud-bank beneath tilted Cyclopean blocks and a monolith-crowned citadel of impossible angles",
    caption: "Johansen's landfall on the risen city, drawn after the text:",
    quote:
      "Johansen and his men landed at a sloping mud-bank on this monstrous Acropolis, and clambered slipperily up over titan oozy blocks which could have been no mortal staircase.",
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  "locations/swamp-and-lagoon-country": {
    numeral: "III",
    storySlug: "the-call-of-cthulhu",
    image: swampRitual,
    alt: "Engraved plate of the swamp ritual: worshipers writhing around a ring-shaped bonfire and an eight-foot monolith on a grassy island, bodies hanging from a circle of scaffolds",
    caption: "The rite Legrasse's men stumbled upon in the swamps, drawn after the text:",
    quote:
      "Void of clothing, this hybrid spawn were braying, bellowing and writhing about a monstrous ring-shaped bonfire; in the center of which, revealed by occasional rifts in the curtain of flame, stood a great granite monolith some eight feet in height; on top of which, incongruous in its diminutiveness, rested the noxious carven statuette.",
    attribution: "The Call of Cthulhu (1928) — Chapter 2, The Tale of Inspector Legrasse",
  },
  "stories/the-call-of-cthulhu": {
    numeral: "IV",
    storySlug: "the-call-of-cthulhu",
    image: alert,
    alt: "Engraved plate of the yacht Alert driven head-on against rising Cthulhu, the squid-head with writhing feelers towering over the bowsprit in a stormy sea",
    caption: "The Alert against the risen thing, drawn after the text:",
    quote:
      "The awful squid-head with writhing feelers came nearly up to the bowsprit of the sturdy yacht, but Johansen drove on relentlessly.",
    attribution: "The Call of Cthulhu (1928) — Chapter 3, The Madness from the Sea",
  },
  "locations/cyclopean-monolith": {
    numeral: "VI",
    storySlug: "dagon",
    image: monolithRite,
    alt: "Engraved plate of the monolith rite: a vast scaly sea-thing flung about a carved white monolith rising from dark water in a moonlit chasm, watched by a lone tiny figure on the slimy slope",
    caption: "The thing at the monolith, drawn after the text:",
    quote:
      "Vast, Polyphemus-like, and loathsome, it darted like a stupendous monster of nightmares to the monolith, about which it flung its gigantic scaly arms, the while it bowed its hideous head and gave vent to certain measured sounds.",
    attribution: "Dagon (1919)",
  },
  "locations/the-nameless-city": {
    numeral: "VII",
    storySlug: "the-nameless-city",
    image: theNamelessCity,
    alt: "Engraved plate of the nameless city under the moon: broken walls and shapeless ruins protruding from desert sands beneath a huge low moon, watched from a dark ridge by a tiny traveler with a camel",
    caption: "First sight of the city from the terrible valley, drawn after the text:",
    quote:
      "I was traveling in a parched and terrible valley under the moon, and afar I saw it protruding uncannily above the sands as parts of a corpse might protrude from an ill-made grave.",
    attribution: "The Nameless City (1921)",
  },
  "stories/the-dunwich-horror": {
    numeral: "VIII",
    storySlug: "the-dunwich-horror",
    image: sentinelRite,
    alt: "Engraved plate of the spell on Sentinel Hill: tiny figures among standing stones on a bare summit, the middle one with arms raised under a stroke of lightning, watched from the shadowed road below by a huddled crowd with a telescope — and nothing visible where the horror is",
    caption: "The spell on the summit, seen from the road below, drawn after the text:",
    quote:
      "One figure, he said, seemed to be raising its hands above its head at rhythmic intervals; and as Sawyer mentioned the circumstance the crowd seemed to hear a faint, half-musical sound from the distance, as if a loud chant were accompanying the gestures.",
    attribution: "The Dunwich Horror (1929) — Chapter 10",
  },
  "stories/the-festival": {
    numeral: "IX",
    storySlug: "the-festival",
    image: yuleRite,
    alt: "Engraved plate of the Yule-rite: a cavern of titan toadstools where hooded figures ring a belching column of cold flame beside an oily river, watched by a lone man fallen to his knees",
    caption: "The rite in the cavern under Kingsport, drawn after the text:",
    quote:
      "I looked at that unhallowed Erebus of titan toadstools, leprous fire and slimy water, and saw the cloaked throngs forming a semicircle around the blazing pillar.",
    attribution: "The Festival (1925)",
  },
  "stories/the-colour-out-of-space": {
    numeral: "X",
    storySlug: "the-colour-out-of-space",
    image: wellRadiance,
    alt: "Engraved plate of the blasted farmyard at night: a shaft of pale light rising from the stone well while twisted trees claw at the sky, every bough tipped with points of radiance, watchers crowded at a lit farmhouse window",
    caption: "The night the colour went home, drawn after the text:",
    quote:
      "in a fearsome instant of deeper darkness the watchers saw wriggling at the treetop height a thousand tiny points of faint and unhallowed radiance, tipping each bough like the fire of St. Elmo or the flames that come down on the apostles' heads at Pentecost.",
    attribution: "The Colour Out of Space (1927)",
  },
  "characters/henry-anthony-wilcox": {
    numeral: "V",
    storySlug: "the-call-of-cthulhu",
    image: wilcoxBasRelief,
    alt: "Engraved plate of the Wilcox bas-relief: a clay tablet bearing a pulpy tentacled head on a scaly winged body over rows of unknown hieroglyphics",
    caption: "The clay bas-relief Wilcox brought to Professor Angell, drawn after the text:",
    quote:
      "A pulpy, tentacled head surmounted a grotesque and scaly body with rudimentary wings; but it was the general outline of the whole which made it most shockingly frightful.",
    attribution: "The Call of Cthulhu (1928) — Chapter 1, The Horror in Clay",
  },
};

function Plate({ def, priority }: { def: PlateDef; priority: boolean }) {
  if (!def.image) return null;
  return (
    <figure className="mt-8">
      <div className="mx-auto max-w-md border border-line bg-surface p-3 sm:p-4">
        <Image
          src={def.image}
          alt={def.alt}
          placeholder="blur"
          priority={priority}
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

/**
 * The plate for a page, or null — most pages have none.
 *
 * `priority` is for the page whose plate is its first image: next/image is
 * lazy by default, so an engraving standing under the header is only
 * discovered once the browser has laid the page out, and the reader watches
 * its blur for a beat. Preloading it with the document removes that beat.
 * A plate further down the page must stay lazy — pulling an engraving the
 * reader may never scroll to would take bandwidth from the one on screen.
 */
export function getPlate(
  kind: "locations" | "characters" | "creatures" | "stories",
  slug: string,
  priority = false,
): ReactNode {
  const def = plates[`${kind}/${slug}`];
  return def && def.image ? <Plate def={def} priority={priority} /> : null;
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

/**
 * All published plates of one story, in numeral order, linking to the pages
 * they live on. The story's own plate is excluded — the story page already
 * shows it in full.
 */
export function getStoryPlates(
  storySlug: string,
): (PlateThumb & { href: string })[] {
  return Object.entries(plates)
    .filter(
      ([key, def]) =>
        def.storySlug === storySlug &&
        def.image &&
        key !== `stories/${storySlug}`,
    )
    .map(([key, def]) => ({
      numeral: def.numeral,
      image: def.image as StaticImageData,
      alt: def.alt,
      href: `/${key}`,
    }));
}
