/**
 * Wear texture for the parchment pages: public/paper/page-wear.webp.
 *
 * Same idea as the map's sheet (generate-wear.mjs): the page itself stays
 * clean CSS, ageing is a separate texture composited in the browser with
 * mix-blend-mode: multiply, white meaning "leave the paper alone". But a
 * book leaf has a different biography than a pocket map: it was never
 * folded — instead the margins are grimed by a century of thumbs, foxing
 * gathers along the edges, a damp tide has crept in from a corner or two,
 * and one lower corner keeps the crease of an old dog-ear.
 *
 * Kept lighter than the map's wear throughout: running text sits on this
 * paper, and readability outranks atmosphere.
 *
 * The sheet is stretched (background-size: 100% 100%) over pages of very
 * different heights, so the middle carries only gentle grain that survives
 * stretching; everything shaped hugs the edges, which stay put.
 *
 * Usage: node scripts/generate-page-wear.mjs [--preview]
 *   --preview also writes a multiply-composite over flat paper for eyeballing.
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "paper");
const OUT = path.join(OUT_DIR, "page-wear.webp");

/* Portrait leaf: sheets are ≤768 CSS px wide, articles run a few times
   taller than wide. */
const W = 1536;
const H = 2560;
const SEED = 1931; // "The Whisperer in Darkness" in print

/* --- Seeded noise (as in generate-wear.mjs) ---------------------------- */

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
 *   warm — thumb grime, dog-ear crease, damp washes, grain: brown;
 *   rust — foxing and tide lines: redder, iron-gall coloured.
 */
const warm = new Float32Array(W * H);
const rust = new Float32Array(W * H);
const rand = mulberry32(SEED);

/* Damp stains: fewer and fainter than the map's, all creeping in from
   the borders — the middle of the leaf must stay printable. */
const stains = [];
for (let i = 0; i < 7; i++) {
  let cx = rand() * W;
  let cy = rand() * H;
  // push toward the nearest border
  if (rand() < 0.5) cx = cx < W / 2 ? cx * 0.25 : W - (W - cx) * 0.25;
  else cy = cy < H / 2 ? cy * 0.25 : H - (H - cy) * 0.25;
  stains.push({
    cx,
    cy,
    r: 80 + rand() * 150,
    depth: 0.035 + rand() * 0.035,
    ring: 0.07 + rand() * 0.08,
    salt: (SEED + i * 977) | 0,
  });
}

/* One dog-eared lower corner: a short diagonal crease across it. The
   crease runs perpendicular to the corner's diagonal, `EAR` px in. */
const EAR = 240;
const EAR_SIGMA = 5;
const EAR_SHADE = 26;

const GRIME_W = 130; // margin width over which the thumb grime fades in
const EDGE_DARK = 0.3; // warm darkening right at the paper's edge

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;

    /* Paper grain — barely-there mottling over the whole sheet. */
    let w = 0.02 * fbm(x, y, 90, 5, 11);

    /* Grimed margins: distance to edge, gnawed at by noise so the line
       of handling wanders instead of framing the leaf evenly. */
    const d = Math.min(x, W - 1 - x, y, H - 1 - y);
    if (d < GRIME_W * 1.6) {
      const wobble = (fbm(x, y, 190, 4, 23) - 0.5) * 80;
      const t = Math.min(1, Math.max(0, (d + wobble) / GRIME_W));
      const grime = (1 - smooth(t)) ** 1.7;
      // handling is uneven along the rim
      const touch = 0.7 + 0.5 * fbm(x, y, 60, 3, 37);
      w += EDGE_DARK * grime * touch;
    }

    /* The dog-ear: distance from the crease line x + y = const near the
       bottom-right corner, a sharp line in a soft shadow, fading along
       its run like the map's fold creases. */
    {
      const dc = (W - 1 - x) + (H - 1 - y); // taxicab distance to the corner
      const dl = (dc - EAR) / Math.SQRT2; // signed distance to the crease
      if (Math.abs(dl) < 70 && dc < EAR * 2.2) {
        const along = 0.4 + 0.9 * fbm(x, y, 200, 3, 53);
        w +=
          (0.16 * Math.exp(-((dl / EAR_SIGMA) ** 2)) +
            0.05 * Math.exp(-((dl / EAR_SHADE) ** 2))) *
          along;
      }
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

/* Foxing: rusty specks, thicker near the margins. */
const SPECKS = 130;
for (let n = 0; n < SPECKS; n++) {
  let x = rand() * W;
  let y = rand() * H;
  if (rand() < 0.7) {
    if (rand() < 0.5) x = x < W / 2 ? x * 0.3 : W - (W - x) * 0.3;
    else y = y < H / 2 ? y * 0.3 : H - (H - y) * 0.3;
  }
  const r = 1.5 + rand() * 4;
  const depth = 0.1 + rand() * 0.18;
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
  const preview = path.join(ROOT, "scripts", ".page-wear-preview.jpg");
  /* Flat paper in the site's --paper tone stands in for the page. */
  const paper = await sharp({
    create: { width: W, height: H, channels: 3, background: "#e9dcbf" },
  })
    .jpeg()
    .toBuffer();
  await sharp(paper)
    .composite([{ input: OUT, blend: "multiply" }])
    .jpeg({ quality: 82 })
    .toFile(preview);
  console.log("wrote", preview);
}
