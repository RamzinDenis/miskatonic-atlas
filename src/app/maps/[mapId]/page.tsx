import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMapLegend, getMapLocations } from "@/shared/lib/content";
import { FRONT_CHART_ID, MAPS } from "@/shared/maps";
import { SiteHeader } from "@/shared/ui/site-header";
import { WorldMap } from "@/widgets/world-map";

/**
 * A chart of the atlas — any MAPS entry besides the front chart, which is
 * the front page. Same full-bleed presentation as the frontispiece; the
 * chart-bound layers (voyage tracks, marginalia beasts) key themselves by
 * chart id inside the widget.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(MAPS)
    .filter((mapId) => mapId !== FRONT_CHART_ID)
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
  if (!chart || mapId === FRONT_CHART_ID) notFound();

  return (
    /* Held still through a page turn — the frontispiece explains why. */
    <div
      style={{ viewTransitionName: "chart-sheet" }}
      className="relative h-dvh overflow-hidden"
    >
      {/* Thumb + overview copy with the HTML, as on the frontispiece. */}
      <link rel="preload" as="image" href={chart.lqipUrl} />
      <link rel="preload" as="image" href={chart.sheets[chart.sheets.length - 1].url} />

      <WorldMap
        chart={chart}
        locations={getMapLocations(chart.id)}
        legend={getMapLegend(chart.id)}
      />

      <SiteHeader floating />
    </div>
  );
}
