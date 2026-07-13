import Link from "next/link";
import { getLocations, getStories } from "@/shared/lib/content";

export default function Home() {
  const locations = getLocations();
  const stories = getStories();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl leading-tight">
        An atlas of Lovecraft country
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        Locations, characters and creatures extracted from the public-domain
        stories of H. P. Lovecraft, every fact traced to its quote in the text.
        The interactive map arrives with M1 — for now the atlas covers{" "}
        {locations.length} locations from{" "}
        {stories.length === 1 ? "one story" : `${stories.length} stories`}.
      </p>

      <h2 className="mt-14 font-serif text-2xl">Locations</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {locations.map((location) => (
          <li key={location.slug}>
            <Link
              href={`/locations/${location.slug}`}
              className="block h-full rounded-lg border border-line bg-surface p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-serif text-xl">{location.name}</span>
                <span className="text-xs uppercase tracking-widest text-muted">
                  {location.type}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {location.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 font-serif text-2xl">Stories</h2>
      <ul className="mt-6 space-y-4">
        {stories.map((story) => (
          <li
            key={story.slug}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-xl">{story.title}</span>
              <span className="text-sm text-muted">{story.year}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {story.summary}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
