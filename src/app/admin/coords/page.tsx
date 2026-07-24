import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPickerLocations } from "@/shared/lib/content";
import { MAPS, WORLD_MAP } from "@/shared/maps";
import { WorldMap } from "@/widgets/world-map";

export const metadata: Metadata = {
  title: "Coordinate picker",
  robots: { index: false },
};

/**
 * Dev-only helper: drag pins to move placed locations, pick a location from
 * the placement queue and click the chart to place it, or click bare map for
 * a JSON snippet. `?map=<id>` switches to another registered chart — the
 * queue is shared, so a queued location lands on whichever chart is open.
 * Compiled out of production builds entirely.
 */
export default async function CoordsPage({ searchParams }: PageProps<"/admin/coords">) {
  if (process.env.NODE_ENV === "production") notFound();

  const { map } = await searchParams;
  const chart = MAPS[typeof map === "string" ? map : "world"] ?? WORLD_MAP;
  const { placed, unplaced } = getPickerLocations(chart.id);
  return (
    <div className="relative h-dvh">
      <WorldMap chart={chart} locations={placed} unplaced={unplaced} picker />
    </div>
  );
}
