import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMapLegend, getMapLocations } from "@/shared/lib/content";
import { FRONT_CHART_ID, MAPS } from "@/shared/maps";
import { ChartImprint } from "@/shared/ui/imprint";
import { SiteHeader } from "@/shared/ui/site-header";
import { ChartStage } from "@/widgets/world-map/chart-stage";

/**
 * A chart of the atlas — any MAPS entry besides the front chart, which is
 * the front page. Same full-bleed presentation as the frontispiece — and
 * the same arrangement: the sheet is staged for the keeper, not rendered
 * here (the frontispiece explains why). The chart-bound layers (voyage
 * tracks, marginalia beasts) key themselves by chart id inside the widget.
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
    <ChartStage
      chart={chart}
      locations={getMapLocations(chart.id)}
      legend={getMapLegend(chart.id)}
    >
      <div className="pointer-events-none relative h-dvh overflow-hidden">
        {/* Thumb + overview copy with the HTML, as on the frontispiece. */}
        <link rel="preload" as="image" href={chart.lqipUrl} />
        <link
          rel="preload"
          as="image"
          href={chart.sheets[chart.sheets.length - 1].url}
        />

        <SiteHeader floating />
        <ChartImprint />
      </div>
    </ChartStage>
  );
}
