import { getMapLocations, getStories } from "@/shared/lib/content";
import { WorldMap } from "@/widgets/world-map";

export default function Home() {
  const points = getMapLocations();
  const stories = getStories();

  return (
    <div className="relative flex-1">
      <WorldMap locations={points} />

      <div className="pointer-events-none absolute right-4 top-4 z-[1000] rounded-lg border border-line bg-surface/90 px-4 py-3 backdrop-blur">
        <p className="text-xs uppercase tracking-widest text-muted">
          {points.length} location{points.length === 1 ? "" : "s"} charted
        </p>
        <p className="mt-1 text-sm text-foreground/90">
          {stories.map((s) => `${s.title} (${s.year})`).join(" · ")}
        </p>
      </div>

      <a
        href="https://commons.wikimedia.org/wiki/File:1852_Colton%27s_Map_of_the_World_on_Mercator%27s_Projection_(_Pocket_Map_)_-_Geographicus_-_World-colton-1852.jpg"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 z-[1000] rounded px-2 py-1 text-[11px] text-muted/80 transition-colors hover:text-muted"
      >
        Basemap: Colton, 1852 — Wikimedia Commons, public domain
      </a>
    </div>
  );
}
