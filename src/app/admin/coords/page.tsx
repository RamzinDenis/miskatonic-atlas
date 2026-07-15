import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMapLocations } from "@/shared/lib/content";
import { WorldMap } from "@/widgets/world-map";

export const metadata: Metadata = {
  title: "Coordinate picker",
  robots: { index: false },
};

/**
 * Dev-only helper: click the basemap, paste the JSON snippet into a
 * location's `map` field. Compiled out of production builds entirely.
 */
export default function CoordsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="relative h-dvh">
      <WorldMap locations={getMapLocations()} picker />
    </div>
  );
}
