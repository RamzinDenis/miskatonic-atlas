import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMapLegend, getMapLocations } from "@/shared/lib/content";
import { MAPS } from "@/shared/maps";
import { SiteHeader } from "@/shared/ui/site-header";
import { WorldMap } from "@/widgets/world-map";

/**
 * A regional chart of the atlas — any MAPS entry besides the world, which is
 * the front page. Same full-bleed presentation as the frontispiece; the
 * world-only layers (voyage tracks, marginalia beasts) gate themselves off
 * inside the widget. Until a regional basemap is registered this route
 * simply builds no pages.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(MAPS)
    .filter((mapId) => mapId !== "world")
    .map((mapId) => ({ mapId }));
}

export async function generateMetadata({
  params,
}: PageProps<"/maps/[mapId]">): Promise<Metadata> {
  const { mapId } = await params;
  const chart = MAPS[mapId];
  return chart ? { title: chart.title } : {};
}

export default async function RegionalMapPage({ params }: PageProps<"/maps/[mapId]">) {
  const { mapId } = await params;
  const chart = MAPS[mapId];
  if (!chart || mapId === "world") notFound();

  return (
    <div className="relative h-dvh overflow-hidden">
      <link rel="preload" as="image" href={chart.lqipUrl} />

      <WorldMap
        chart={chart}
        locations={getMapLocations(chart.id)}
        legend={getMapLegend(chart.id)}
      />

      <SiteHeader floating />

      {chart.attribution && (
        <a
          href={chart.attribution.href}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 z-[1000] rounded px-2 py-1 text-[11px] text-muted/80 transition-colors hover:text-muted"
        >
          {chart.attribution.label}
        </a>
      )}
    </div>
  );
}
