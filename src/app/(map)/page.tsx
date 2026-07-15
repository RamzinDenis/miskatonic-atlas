import { getMapLegend, getMapLocations } from "@/shared/lib/content";
import { SiteHeader } from "@/shared/ui/site-header";
import { WorldMap } from "@/widgets/world-map";

/**
 * The atlas frontispiece: a full-bleed chart under a floating masthead.
 * No footer here — the PD attribution stays as a small line over the map.
 */
export default function Home() {
  return (
    <div className="relative h-dvh overflow-hidden">
      <WorldMap locations={getMapLocations()} legend={getMapLegend()} />

      <SiteHeader floating />

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
