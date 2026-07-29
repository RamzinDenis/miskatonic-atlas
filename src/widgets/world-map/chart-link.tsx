"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { FRONT_CHART_ID } from "@/shared/maps";
import { chartPath, getAtlasMap } from "./geometry";
import { warmChart } from "./sheets";

/**
 * A link into the atlas that pulls what the chart will need before the
 * click lands. Three things stand between the click and a drawn sheet: the
 * map widget's own chunk (leaflet is loaded only in the browser, so a page
 * that has never shown a chart does not carry it), the chart's thumb, and
 * the copy of the sheet the opening view will ask for. Pointing at the link
 * happens hundreds of milliseconds before the click, which is enough for
 * all three — and none of it is a second copy of the paper laid out beside
 * the real one, so nothing can disagree about where the sheet sits.
 *
 * The route prefetch `<Link>` already does covers the HTML alone.
 */
export function ChartLink({
  chartId = FRONT_CHART_ID,
  focus,
  ...props
}: {
  /** Sheet the link opens; defaults to the front chart at "/". */
  chartId?: string;
  /** Location slug to land on — the chart's /?focus= deep link. */
  focus?: string;
} & Omit<ComponentProps<typeof Link>, "href">) {
  const warm = () => {
    void import("./world-map-client");
    warmChart(getAtlasMap(chartId));
  };
  return (
    <Link
      href={focus ? `${chartPath(chartId)}?focus=${focus}` : chartPath(chartId)}
      /* Mouse only: an iOS tap synthesizes a mouseenter right before the
         click, which would drop the widget's evaluation into the middle of
         the page turn — the very burst ChartStage keeps out of it. A
         hover that truly precedes the click is worth warming for; a tap has
         no such head start. */
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") warm();
      }}
      onFocus={warm}
      /* The chart is where a reader comes back to, never deeper in: the leaf
         he is on leaves to the right, the way a page turns back. */
      transitionTypes={["nav-back"]}
      {...props}
    />
  );
}
