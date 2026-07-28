import Link from "next/link";
import type { CompanyAtPlace, CompanyFigure } from "@/shared/lib/content";

/** Shared building blocks of entity pages: chip link lists and source quotes. */

/**
 * Entity description body. Paragraphs are separated by `\n\n`; a paragraph
 * starting with `## ` renders as a subheading — used when a minor location is
 * folded into its parent article as a titled section (prompts/merge.md,
 * «Parts & allusions»).
 */
export function Description({ text }: { text: string }) {
  return (
    <div className="drop-cap mt-6 space-y-4 text-[17px] leading-relaxed">
      {text.split("\n\n").map((paragraph, i) =>
        paragraph.startsWith("## ") ? (
          <h2 key={i} className="pt-4 font-display text-xl tracking-wide">
            {paragraph.slice(3)}
          </h2>
        ) : (
          <p key={i}>{paragraph}</p>
        ),
      )}
    </div>
  );
}

export interface ChipItem {
  href: string;
  label: string;
}

export function ChipSection({ title, items }: { title: string; items: ChipItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{title}</h2>
      <ul className="mt-4 flex flex-wrap gap-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="cap-first inline-block rounded-md border border-line bg-surface px-4 py-2 text-sm transition-colors hover:border-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * An entity's places with the company each one holds (ADR-0006) — the
 * character's and the creature's answer to the cross-references a location
 * page has always printed. Rows keep the entity's own order of places; a
 * place with nobody else in it still prints, because this section *is* the
 * list of locations. Company is set in a running line rather than in chips:
 * a Dunwich figure shares its village with twenty others, and twenty boxes
 * would read as a wall where a printed line reads as a crowd.
 *
 * Persons and beasts are set on lines of their own under a small-caps label.
 * Run together they misread: a beast can be named for the tale it comes from
 * («The Colour Out of Space» is both a story and a creature here), and in
 * italics at the end of a line of people it looks like a source credit
 * rather than a member of the company.
 */
function CompanyLine({
  label,
  figures,
}: {
  label: string;
  figures: CompanyFigure[];
}) {
  if (figures.length === 0) return null;
  return (
    <p className="mt-1 text-sm leading-relaxed text-muted">
      <span className="mr-2 text-[11px] uppercase tracking-widest text-muted/70">
        {label}
      </span>
      {figures.map((figure, i) => (
        <span key={figure.href}>
          {i > 0 && <span className="mx-1.5">·</span>}
          <Link
            href={figure.href}
            className={`cap-first transition-colors hover:text-accent ${
              figure.kind === "creatures" ? "font-serif italic" : ""
            }`}
          >
            {figure.name}
          </Link>
        </span>
      ))}
    </p>
  );
}

export function CompanySection({
  title,
  places,
}: {
  title: string;
  places: CompanyAtPlace[];
}) {
  if (places.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">{title}</h2>
      <ul className="mt-4 space-y-4">
        {places.map((place) => (
          <li key={place.href} className="border-l-2 border-line pl-4">
            <Link
              href={place.href}
              className="cap-first font-display text-lg transition-colors hover:text-accent"
            >
              {place.name}
            </Link>
            <CompanyLine
              label="Persons"
              figures={place.figures.filter((f) => f.kind === "characters")}
            />
            <CompanyLine
              label="Creatures"
              figures={place.figures.filter((f) => f.kind === "creatures")}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface SourceItem {
  quote: string;
  attribution: string;
}

export function SourcesSection({ sources }: { sources: SourceItem[] }) {
  if (sources.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">Sources</h2>
      <p className="mt-2 text-sm text-muted">Every fact above traces back to the text.</p>
      <ul className="mt-4 space-y-6">
        {sources.map((source, i) => (
          <li key={i}>
            <blockquote className="border-l-2 border-accent pl-4 font-serif italic leading-relaxed">
              “{source.quote}”
            </blockquote>
            <p className="mt-2 pl-4 text-xs uppercase tracking-widest text-muted">
              {source.attribution}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
