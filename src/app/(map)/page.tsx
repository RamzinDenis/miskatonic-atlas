import { getMapLegend, getMapLocations } from "@/shared/lib/content";
import { FRONT_CHART_ID, getAtlasMap } from "@/shared/maps";
import { ChartImprint } from "@/shared/ui/imprint";
import { SiteHeader } from "@/shared/ui/site-header";
import { ChartStage } from "@/widgets/world-map/chart-stage";

/**
 * The atlas frontispiece: the front chart (FRONT_CHART_ID) full-bleed under
 * a floating masthead. No footer here.
 *
 * The map itself is not rendered here: the page stages its sheet through
 * ChartStage and the keeper in the root layout (chart-keeper.tsx) turns the
 * one long-lived map toward the reader — tearing leaflet down in a
 * navigation's commit was the freeze WebKit showed as the map hanging. The
 * page contributes the chrome above the sheet, and since that chrome stands
 * over the keeper's map in paint order, it must not stand between the
 * reader and the map in hit-testing — pointer-events pass through except
 * where something real (the masthead) takes them back.
 */
export default function Home() {
  const chart = getAtlasMap(FRONT_CHART_ID);
  return (
    <ChartStage
      chart={chart}
      locations={getMapLocations(chart.id)}
      legend={getMapLegend(chart.id)}
    >
      <div className="pointer-events-none relative h-dvh overflow-hidden">
        {/* The sheet's thumb and the overview copy are fetched with the HTML
            rather than after leaflet has loaded and mounted, so the paper is
            the first thing on screen instead of the last. The top rung is the
            copy nearly every viewport picks (retina and full-width displays
            alike); a small 1× window fetches the lower rung and wastes this
            preload once — the accepted cost. */}
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
