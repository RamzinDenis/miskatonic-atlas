/**
 * Cuts the world chart down to the sizes a screen actually uses.
 *
 *   public/maps/world-1024.webp — 186 KB, phones and the page insets
 *   public/maps/world-2048.webp — 803 KB, the usual desktop overview
 *   public/maps/world.jpg       — 3.6 MB, the scan itself, for close-ups
 *   public/maps/world-lqip.webp — 2 KB, the sheet while a copy is in flight
 *
 * Why a ladder and not a tile pyramid: tiles are for maps too large to ever
 * hold — a world that has to be fetched a window at a time. This chart is
 * one fixed sheet, small enough to hold whole, and tiling it only buys the
 * pathologies: the reader watches a coarse level get swapped for a fine one
 * (which reads as the engraving going in and out of focus) and the browser
 * re-lays dozens of elements on every frame of a zoom (which reads as the
 * voyage tracks lurching). A single bitmap has neither — it is resampled by
 * the GPU, smoothly, at any zoom.
 *
 * The widget picks a rung from the zoom and the pixel density, and climbs
 * when a close-up needs more (see chart-sheet.tsx). It never climbs down:
 * once a copy is decoded, dropping back to a coarser one would be a visible
 * loss for no gain.
 *
 * Usage: node scripts/build-map-images.mjs
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAPS = path.join(ROOT, "public", "maps");
const SCAN = path.join(MAPS, "world.jpg");

/** Must match SHEETS in src/widgets/world-map/geometry.ts. */
const RUNGS = [1024, 2048];

/* Engraving is all hairlines, so the rungs are cut generously — at these
   sizes the whole point is that they are already small. */
const QUALITY = 72;

for (const width of RUNGS) {
  await sharp(SCAN)
    .resize(width)
    .webp({ quality: QUALITY, effort: 5 })
    .toFile(path.join(MAPS, `world-${width}.webp`));
  console.log(`wrote world-${width}.webp`);
}

/* Shown under the sheet until it arrives. 128px rather than fewer: this
   scan is pale hand tinting on cream, so a smaller thumb averages out into
   a blank sheet — the continents have to be readable for it to look like a
   chart arriving rather than paper that failed to print. */
await sharp(SCAN)
  .resize(128)
  .blur(0.7)
  .webp({ quality: 68 })
  .toFile(path.join(MAPS, "world-lqip.webp"));

console.log("wrote world-lqip.webp");
