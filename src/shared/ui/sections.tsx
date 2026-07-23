import Link from "next/link";

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
