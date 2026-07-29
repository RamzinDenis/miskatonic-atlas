/**
 * Wear texture for the chart sheets: public/paper/map-wear.webp.
 *
 * Same idea as the book leaves (generate-page-wear.mjs): the scan stays
 * clean, ageing is a separate white-neutral sheet composited in the
 * browser with mix-blend-mode: multiply. Mounted as an ImageOverlay on
 * the same bounds as the sheet, so the wear rides pan and zoom with the
 * paper and never touches the binding around it — the mistake of the
 * static container grain this replaces.
 *
 * A pocket map's biography differs from a book leaf's: it was *folded* —
 * a centre fold each way and fainter quarter creases, worn deepest where
 * the creases cross; the rim is grimed by handling; damp has crept in
 * from the borders; foxing gathers along the edges. The middle carries
 * only grain and the crease lines themselves: the drawing must stay
 * legible under all of it.
 *
 * Usage: node scripts/generate-map-wear.mjs [--preview]
 *   --preview also writes a multiply-composite over the pacific sheet
 *   (or flat paper) for eyeballing.
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "paper");
const OUT = path.join(OUT_DIR, "map-wear.webp");

/* Landscape sheet: charts are served up to 1448 px wide. */
const W = 2048;
const H = 1408;
const SEED = 1926; // "The Call of Cthulhu" written

/* --- Seeded noise (as in generate-page-wear.mjs) ----------------------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer lattice hash → [0, 1), stable per (x, y, salt). */
function hash2(ix, iy, salt) {
  let h = Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iy, 0x165667b1) ^ salt;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);

/** Value noise on a lattice of `cell` px. */
function vnoise(x, y, cell, salt) {
  const gx = x / cell;
  const gy = y / cell;
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const fx = smooth(gx - ix);
  const fy = smooth(gy - iy);
  const a = hash2(ix, iy, salt);
  const b = hash2(ix + 1, iy, salt);
  const c = hash2(ix, iy + 1, salt);
  const d = hash2(ix + 1, iy + 1, salt);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Fractal value noise, `oct` octaves from `cell` px down — [0, 1]. */
function fbm(x, y, cell, oct, salt) {
  let sum = 0;
  let amp = 0.5;
  let c = cell;
  for (let o = 0; o < oct; o++) {
    sum += amp * vnoise(x, y, c, salt + o * 101);
    amp *= 0.5;
    c /= 2;
  }
  return sum / (1 - 0.5 ** oct);
}

/* --- Wear maps --------------------------------------------------------- */

/*
 * Two darkening fields, combined per channel at the end:
 *   warm — creases, rim grime, damp washes, grain: brown;
 *   rust — foxing, tide lines, worn crossings: redder, iron-gall.
 */
const warm = new Float32Array(W * H);
const rust = new Float32Array(W * H);
const rand = mulberry32(SEED);

/*
 * The folds. A pocket map folds in half each way, then the halves in
 * half again: two strong centre creases, two fainter verticals at the
 * quarters. Each crease is a sharp line in a soft shadow, its depth
 * wandering along the run so it reads as worn paper, not ruled ink.
 */
const foldsX = [
  { at: W / 2, line: 0.1, shade: 0.038 },
  { at: W / 4, line: 0.055, shade: 0.022 },
  { at: (3 * W) / 4, line: 0.055, shade: 0.022 },
];
const foldsY = [{ at: H / 2, line: 0.09, shade: 0.034 }];
const LINE_SIGMA = 2.2;
const SHADE_SIGMA = 16;

/* Damp stains: creeping in from the borders, the middle stays legible. */
const stains = [];
for (let i = 0; i < 6; i++) {
  let cx = rand() * W;
  let cy = rand() * H;
  if (rand() < 0.5) cx = cx < W / 2 ? cx * 0.22 : W - (W - cx) * 0.22;
  else cy = cy < H / 2 ? cy * 0.22 : H - (H - cy) * 0.22;
  stains.push({
    cx,
    cy,
    r: 90 + rand() * 160,
    depth: 0.03 + rand() * 0.035,
    ring: 0.07 + rand() * 0.08,
    salt: (SEED + i * 977) | 0,
  });
}

const GRIME_W = 90; // rim width over which the handling grime fades in
const EDGE_DARK = 0.26; // warm darkening right at the paper's edge

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;

    /* Paper grain — barely-there mottling over the whole sheet. */
    let w = 0.022 * fbm(x, y, 90, 5, 11);

    /* Grimed rim: distance to edge, gnawed at by noise so the line of
       handling wanders instead of framing the sheet evenly. */
    const d = Math.min(x, W - 1 - x, y, H - 1 - y);
    if (d < GRIME_W * 1.6) {
      const wobble = (fbm(x, y, 190, 4, 23) - 0.5) * 60;
      const t = Math.min(1, Math.max(0, (d + wobble) / GRIME_W));
      const grime = (1 - smooth(t)) ** 1.7;
      const touch = 0.7 + 0.5 * fbm(x, y, 60, 3, 37);
      w += EDGE_DARK * grime * touch;
    }

    /* The creases, depth wandering along each run. */
    for (const f of foldsX) {
      const dl = x - f.at;
      if (Math.abs(dl) > 60) continue;
      const along = 0.45 + 0.9 * fbm(0, y, 210, 3, 53 + f.at);
      w +=
        (f.line * Math.exp(-((dl / LINE_SIGMA) ** 2)) +
          f.shade * Math.exp(-((dl / SHADE_SIGMA) ** 2))) *
        along;
    }
    for (const f of foldsY) {
      const dl = y - f.at;
      if (Math.abs(dl) > 60) continue;
      const along = 0.45 + 0.9 * fbm(x, 0, 210, 3, 71 + f.at);
      w +=
        (f.line * Math.exp(-((dl / LINE_SIGMA) ** 2)) +
          f.shade * Math.exp(-((dl / SHADE_SIGMA) ** 2))) *
        along;
    }

    /* Damp stains: noise-distorted radius, faint wash inside, the classic
       darker tide line where the water stopped. */
    for (const s of stains) {
      const ddx = x - s.cx;
      const ddy = y - s.cy;
      if (Math.abs(ddx) > s.r * 1.6 || Math.abs(ddy) > s.r * 1.6) continue;
      const dist = Math.hypot(ddx, ddy);
      const wobble = 1 + (fbm(x, y, 130, 3, s.salt) - 0.5) * 0.9;
      const rr = (dist / s.r) * wobble;
      if (rr < 1) w += s.depth * (1 - rr);
      const ring = Math.exp(-(((rr - 0.95) / 0.055) ** 2));
      rust[i] += s.ring * ring;
    }

    warm[i] = w;
  }
}

/* Where creases cross, the paper wore through first: a soft rusty bruise
   at each crossing, strongest at the sheet's very centre. */
for (const fx of foldsX) {
  for (const fy of foldsY) {
    const r = 26 + rand() * 14;
    const depth = 0.1 + rand() * 0.08;
    const x0 = Math.max(0, Math.floor(fx.at - r * 2));
    const x1 = Math.min(W - 1, Math.ceil(fx.at + r * 2));
    const y0 = Math.max(0, Math.floor(fy.at - r * 2));
    const y1 = Math.min(H - 1, Math.ceil(fy.at + r * 2));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const g = Math.exp(
          -((px - fx.at) ** 2 + (py - fy.at) ** 2) / (r * r),
        );
        rust[py * W + px] += depth * g;
      }
    }
  }
}

/* Foxing: rusty specks, thicker near the rim. */
const SPECKS = 110;
for (let n = 0; n < SPECKS; n++) {
  let x = rand() * W;
  let y = rand() * H;
  if (rand() < 0.7) {
    if (rand() < 0.5) x = x < W / 2 ? x * 0.3 : W - (W - x) * 0.3;
    else y = y < H / 2 ? y * 0.3 : H - (H - y) * 0.3;
  }
  const r = 1.5 + rand() * 4;
  const depth = 0.1 + rand() * 0.16;
  const x0 = Math.max(0, Math.floor(x - r * 3));
  const x1 = Math.min(W - 1, Math.ceil(x + r * 3));
  const y0 = Math.max(0, Math.floor(y - r * 3));
  const y1 = Math.min(H - 1, Math.ceil(y + r * 3));
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const g = Math.exp(-((px - x) ** 2 + (py - y) ** 2) / (r * r));
      rust[py * W + px] += depth * g;
    }
  }
}

/* --- Compose to RGB ---------------------------------------------------- */

/* White is neutral under multiply; wear pulls channels down, blue fastest
   for the warm brown, green fastest after red for the rusty foxing. */
const img = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  const w = Math.min(warm[i], 0.7);
  const r = Math.min(rust[i], 0.6);
  const mr = (1 - 0.7 * w) * (1 - 0.45 * r);
  const mg = (1 - 0.88 * w) * (1 - 0.68 * r);
  const mb = (1 - 1.0 * w) * (1 - 0.82 * r);
  img[i * 3] = Math.max(0, Math.round(253 * mr));
  img[i * 3 + 1] = Math.max(0, Math.round(250 * mg));
  img[i * 3 + 2] = Math.max(0, Math.round(244 * mb));
}

fs.mkdirSync(OUT_DIR, { recursive: true });
await sharp(img, { raw: { width: W, height: H, channels: 3 } })
  .webp({ quality: 68 })
  .toFile(OUT);
console.log("wrote", OUT);

if (process.argv.includes("--preview")) {
  const preview = path.join(ROOT, "scripts", ".map-wear-preview.jpg");
  const pacific = path.join(ROOT, "public", "maps", "pacific-1448.webp");
  /* The real sheet under the wear where available, flat paper otherwise. */
  const base = fs.existsSync(pacific)
    ? await sharp(pacific).resize(W, H, { fit: "fill" }).jpeg().toBuffer()
    : await sharp({
        create: { width: W, height: H, channels: 3, background: "#e9dcbf" },
      })
        .jpeg()
        .toBuffer();
  await sharp(base)
    .composite([{ input: OUT, blend: "multiply" }])
    .jpeg({ quality: 82 })
    .toFile(preview);
  console.log("wrote", preview);
}
