import type { Metadata } from "next";
import Link from "next/link";
import {
  getCharacters,
  getCreatures,
  getLocations,
  getStories,
  majorOnly,
} from "@/shared/lib/content";

export const metadata: Metadata = {
  title: "Index",
  description:
    "Alphabetical index of the atlas — locations, characters, creatures and stories.",
};

interface IndexEntry {
  href: string;
  name: string;
  note: string;
}

function byName(a: IndexEntry, b: IndexEntry) {
  return a.name.localeCompare(b.name, "en");
}

function IndexSection({ title, entries }: { title: string; entries: IndexEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-2xl">{title}</h2>
      <ul className="mt-4 gap-x-10 space-y-2 sm:columns-2">
        {entries.sort(byName).map((entry) => (
          <li key={entry.href} className="break-inside-avoid">
            <Link
              href={entry.href}
              className="cap-first inline-block transition-colors hover:text-accent"
            >
              {entry.name}
            </Link>
            <span className="ml-2 text-xs uppercase tracking-widest text-muted">
              {entry.note}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function IndexPage() {
  const stories: IndexEntry[] = getStories().map((s) => ({
    href: `/stories/${s.slug}`,
    name: s.title,
    note: String(s.year),
  }));
  const locations: IndexEntry[] = majorOnly(getLocations()).map((l) => ({
    href: `/locations/${l.slug}`,
    name: l.name,
    note: l.type,
  }));
  const characters: IndexEntry[] = majorOnly(getCharacters()).map((c) => ({
    href: `/characters/${c.slug}`,
    name: c.name,
    note: c.role,
  }));
  const creatures: IndexEntry[] = majorOnly(getCreatures()).map((c) => ({
    href: `/creatures/${c.slug}`,
    name: c.name,
    note: c.classification.replace(/-/g, " "),
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <article className="parchment px-6 py-10 sm:px-12 sm:py-12">
        <header>
          <h1 className="font-display text-4xl">Index</h1>
          <p className="mt-2 text-sm text-muted">
            The charted part of the atlas. The world is deeper than the map —
            passing mentions surface through cross-references.
          </p>
          <div className="parchment-rule mt-5" />
        </header>

        <div className="mt-8">
          <IndexSection title="Stories" entries={stories} />
          <IndexSection title="Locations" entries={locations} />
          <IndexSection title="Characters" entries={characters} />
          <IndexSection title="Creatures" entries={creatures} />
        </div>
      </article>
    </div>
  );
}
