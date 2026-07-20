/**
 * Chart-mark masks from the raster engravings.
 *
 * Sources: public/plates/{monster,ship}-<name>.png — engravings (black ink
 * on white) generated for the world map's beasts and vessels. They are too
 * heavy to ship as-is and carry a white ground the chart must not get;
 * this script turns each into a small alpha mask: ink density → alpha,
 * paper → transparent. The map paints a mask via CSS mask-image with
 * background-color: currentColor (the story-page inset tints it with an
 * feFlood filter), so the site keeps re-inking every mark — iron-gall or
 * track ink at rest, vermilion when chosen — exactly as it did the SVGs.
 *
 * Output: public/maps/monsters/<slug>.png, public/maps/ships/<kind>.png and
 * public/bestiary/<slug>.webp — the same beasts a second time, large enough
 * for the bestiary's showcase and leaves (webp: an alpha png that size runs
 * to half a megabyte). Prints trimmed aspect ratios — monsters.ts,
 * route-glyphs.ts and the bestiary registry hold the display sizes; keep
 * them in step.
 *
 * Usage: node scripts/build-monster-masks.mjs
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public", "plates");

/* Beasts keep their creature slug; vessels map source file → ShipKind. */
const MONSTERS = ["tornasuk", "cthulhu", "black-winged-ones"];

/* Beasts engraved for the bestiary alone, with no marginalia on the chart:
   their small mask has nowhere to live under maps/, so it is written beside
   the plate-size one and the register points the ribbon at it. */
const BESTIARY_ONLY = ["white-polypous-thing"];
const SHIPS = {
  "ship-emma": "schooner",
  "ship-alert": "steam-yacht",
  "ship-derelict": "derelict",
  "ship-vigilant": "freighter",
};

const MONSTER_SIZE = 300; // longest side, ~2.5× the largest display size
const SHIP_SIZE = 160;
const BESTIARY_SIZE = 1024; // the bestiary prints a beast ~448 px wide

async function buildMask(source, out, size, { gamma = 0.8, gain = 1 } = {}) {
  const { data, info } = await sharp(source)
    .trim({ background: "#ffffff", threshold: 20 })
    .resize(size, size, { fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  /* Ink density → alpha, with a mild gamma so the engraving's midtone
     hatching survives the tint instead of washing out. */
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const ink = Math.max(0, (240 - data[i]) / 240);
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = 255;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = Math.min(255, Math.round(255 * gain * ink ** gamma));
  }

  /* Encoder follows the output extension: chart marks are small enough to
     stay lossless png, plate-size masks are not (an alpha png at 1024 runs
     to half a megabyte). All the drawing lives in the alpha channel, so
     alphaQuality is what sets the weight — at 70 the hatching still reads
     identically once the mask is printed at its display size. */
  const encoded = sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
  await (out.endsWith(".webp")
    ? encoded.webp({ quality: 70, alphaQuality: 70 })
    : encoded.png({ compressionLevel: 9 })
  ).toFile(out);
  console.log(
    `${path.basename(out)}: ${info.width}×${info.height} (aspect ${(info.height / info.width).toFixed(3)}) → ${out}`,
  );
}

const monsterDir = path.join(ROOT, "public", "maps", "monsters");
await mkdir(monsterDir, { recursive: true });
for (const slug of MONSTERS) {
  await buildMask(
    path.join(SRC, `monster-${slug}.png`),
    path.join(monsterDir, `${slug}.png`),
    MONSTER_SIZE,
  );
}

/* Vessels print far smaller than the beasts, and their rigging is thin
   line-work — pushed toward solid ink so a ship still reads at ~50 px. */
const shipDir = path.join(ROOT, "public", "maps", "ships");
await mkdir(shipDir, { recursive: true });
for (const [file, kind] of Object.entries(SHIPS)) {
  await buildMask(
    path.join(SRC, `${file}.png`),
    path.join(shipDir, `${kind}.png`),
    SHIP_SIZE,
    { gamma: 0.5, gain: 1.4 },
  );
}

/* The same beasts at plate size for the bestiary. Same ink curve as the
   chart marks — the showcase paints them through the very same .mask-ink. */
const bestiaryDir = path.join(ROOT, "public", "bestiary");
await mkdir(bestiaryDir, { recursive: true });
for (const slug of [...MONSTERS, ...BESTIARY_ONLY]) {
  await buildMask(
    path.join(SRC, `monster-${slug}.png`),
    path.join(bestiaryDir, `${slug}.webp`),
    BESTIARY_SIZE,
  );
}

/* Ribbon thumbnails of the beasts that have no chart mark to borrow one from. */
for (const slug of BESTIARY_ONLY) {
  await buildMask(
    path.join(SRC, `monster-${slug}.png`),
    path.join(bestiaryDir, `${slug}-thumb.png`),
    MONSTER_SIZE,
  );
}
