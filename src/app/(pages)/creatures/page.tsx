import type { Metadata } from "next";
import { getCreatures } from "@/shared/lib/content";
import {
  assertBestiaryComplete,
  BESTIARY,
  type BestiaryEntry,
} from "@/widgets/bestiary/registry";
import { BestiaryShowcase } from "@/widgets/bestiary/showcase";

/**
 * The bestiary (CONTEXT.md: «Бестиарий») — the folio of beasts held open at
 * one plate. The server joins the content with the curator's register and
 * hands the showcase plain data; the island only turns the sheet.
 *
 * Unlike the Index, this page shows every beast on record, passing ones
 * included: the showcase is their place in the atlas's navigation.
 */

export const metadata: Metadata = {
  title: "Bestiary",
  description:
    "The bestiarium of the atlas — every beast, devil and Great Old One on record, engraved where any hand dared draw them.",
};

export default function BestiaryPage() {
  const creatures = getCreatures();
  assertBestiaryComplete(creatures.map((c) => c.slug));

  /* The register sets the order of the folio, so the join runs through it. */
  const bySlug = new Map(creatures.map((creature) => [creature.slug, creature]));
  const entries: BestiaryEntry[] = BESTIARY.flatMap((plate, i) => {
    const creature = bySlug.get(plate.slug);
    return creature
      ? [
          {
            ...plate,
            name: creature.name,
            classification: creature.classification,
            summary: creature.summary,
            fig: i + 1,
          },
        ]
      : [];
  });

  /* Wider than the reading column and vertically centred: the folio is an
     object held open, not an article, and on a tall screen the sheet should
     sit in the middle of the desk rather than hang from the top. */
  return (
    <div className="m-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-5xl lg:py-8">
      <article className="parchment px-6 py-10 sm:px-12 sm:py-12">
        <header>
          <h1 className="font-display text-4xl tracking-wide">BESTIARIUM</h1>
          <p className="mt-2 text-sm text-muted">
            Being the beasts, devils and Great Old Ones on record in the atlas —
            drawn where any hand dared draw them.
          </p>
          <div className="parchment-rule mt-5" />
        </header>

        <BestiaryShowcase entries={entries} />

        <div className="fleuron" aria-hidden="true">
          ❦
        </div>
      </article>
    </div>
  );
}
