import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPickerLocations } from "@/shared/lib/content";
import { WorldMap } from "@/widgets/world-map";

export const metadata: Metadata = {
  title: "Coordinate picker",
  robots: { index: false },
};

/**
 * Dev-only helper: drag pins to move placed locations, pick a location from
 * the placement queue and click the chart to place it, or click bare map for
 * a JSON snippet. Compiled out of production builds entirely.
 */
export default function CoordsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { placed, unplaced } = getPickerLocations();
  return (
    <div className="relative h-dvh">
      <WorldMap locations={placed} unplaced={unplaced} picker />
    </div>
  );
}
