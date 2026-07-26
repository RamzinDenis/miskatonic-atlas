import { getMapLegend, getMapLocations } from "@/shared/lib/content";
import { FRONT_CHART_ID, getAtlasMap } from "@/shared/maps";
import { SiteHeader } from "@/shared/ui/site-header";
import { WorldMap } from "@/widgets/world-map";

/**
 * The atlas frontispiece: the front chart (FRONT_CHART_ID) full-bleed under
 * a floating masthead. No footer here.
 */
export default function Home() {
  const chart = getAtlasMap(FRONT_CHART_ID);
  return (
    <div className="relative h-dvh overflow-hidden">
      {/* The sheet's thumb and the overview copy are fetched with the HTML
          rather than after leaflet has loaded and mounted, so the paper is
          the first thing on screen instead of the last. The top rung is the
          copy nearly every viewport picks (retina and full-width displays
          alike); a small 1× window fetches the lower rung and wastes this
          preload once — the accepted cost. */}
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
