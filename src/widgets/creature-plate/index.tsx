import Image from "next/image";
import type { ReactNode } from "react";
import legrasseIdol from "./legrasse-idol.png";

/**
 * Plates — editorial engravings shown on entity pages (CONTEXT.md: «Вклейка»).
 * Pure presentation: interpretations drawn after quoted passages, deliberately
 * kept out of schemas, content JSON and the extraction pipeline. The engraving
 * follows the idol description in The Call of Cthulhu, ch. 2, ¶26; a hand-coded
 * SVG rendition is kept in svg-plate.tsx for comparison.
 */

function CthulhuPlate() {
  return (
    <figure className="mt-8">
      <div className="mx-auto max-w-md border border-line bg-surface p-3 sm:p-4">
        <Image
          src={legrasseIdol}
          alt="Engraved plate of the Cthulhu idol: a winged anthropoid monster with a tentacled head bent forward, crouching on a hieroglyphed stone pedestal"
          placeholder="blur"
          sizes="(max-width: 640px) 100vw, 448px"
          className="block h-auto w-full"
        />
      </div>
      <figcaption className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-muted">
        <span className="text-xs uppercase tracking-widest">Plate I</span> — The Cthulhu idol
        seized by Inspector Legrasse at the Louisiana swamp worship, drawn after the text:
        <span className="mt-2 block font-serif italic text-foreground/80">
          “It represented a monster of vaguely anthropoid outline, but with an octopuslike head
          whose face was a mass of feelers, a scaly, rubbery-looking body, prodigious claws on
          hind and fore feet, and long, narrow wings behind.”
        </span>
        <span className="mt-1 block text-xs">
          The Call of Cthulhu (1928) — Chapter 2, The Tale of Inspector Legrasse
        </span>
      </figcaption>
    </figure>
  );
}

const plates: Record<string, () => ReactNode> = {
  cthulhu: CthulhuPlate,
};

/** The plate for a creature page, or null — most creatures have none. */
export function getCreaturePlate(slug: string): ReactNode {
  const Plate = plates[slug];
  return Plate ? <Plate /> : null;
}
