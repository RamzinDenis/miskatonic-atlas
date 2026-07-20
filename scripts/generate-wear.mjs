/**
 * Wear texture for the world map: public/maps/world-wear.webp.
 *
 * The scan itself stays pristine (see geometry.ts); ageing is a separate
 * sheet composited in the browser with mix-blend-mode: multiply, so white
 * here means "leave the paper alone". The texture tells the biography of
 * one folding pocket-map copy: scorched and darkened margins, fold creases
 * from being folded in eighths, tide-marked damp stains, foxing specks.
 *
 * Half the scan's resolution is plenty for stains: 2048×1475, ~few hundred
 * KB of WebP. Deterministic (seeded PRNG) — rerun to regenerate the same
 * sheet, tweak SEED for a different copy.
 *
 * Usage: node scripts/generate-wear.mjs [--preview]
 *   --preview also writes a multiply-composite over the scan for eyeballing.
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "maps", "world-wear.webp");
const SCAN = path.join(ROOT, "public", "maps", "world.jpg");

const W = 2048;
const H = 1475;
const SEED = 1928; // the year of "The Call of Cthulhu" in print, why not

/* --- Seeded noise ----------------------------------------------------- */

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

/* --- Wear maps -------------------------------------------------------- */

/*
 * Two darkening fields, combined per channel at the end:
 *   warm — scorch, creases, damp stains, grain: brown, blue drops fastest;
 *   rust — foxing and tide lines: redder, iron-gall coloured.
 */
const warm = new Float32Array(W * H);
const rust = new Float32Array(W * H);
const rand = mulberry32(SEED);

/* Damp stains: a few big blotches, biased to margins and corners. */
const stains = [];
for (let i = 0; i < 11; i++) {
  const edge = rand() < 0.75;
  let cx = rand() * W;
  let cy = rand() * H;
  if (edge) {
    // push toward the nearest border
    if (rand() < 0.5) cx = cx < W / 2 ? cx * 0.35 : W - (W - cx) * 0.35;
    else cy = cy < H / 2 ? cy * 0.35 : H - (H - cy) * 0.35;
  }
  stains.push({
    cx,
    cy,
    r: 90 + rand() * 180,
    depth: 0.05 + rand() * 0.05,
    ring: 0.1 + rand() * 0.1,
    salt: (SEED + i * 977) | 0,
  });
}

/* Folded in eighths: three vertical creases and one horizontal. */
const foldsX = [W * 0.25, W * 0.5, W * 0.75];
const foldsY = [H * 0.5];
const CREASE_SIGMA = 6;
const SHADE_SIGMA = 30;

const BURN_W = 185; // margin width over which the scorch fades in
const EDGE_DARK = 0.6; // warm darkening right at the paper's edge

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;

    /* Paper grain — barely-there mottling over the whole sheet. */
    let w = 0.022 * fbm(x, y, 90, 5, 11);

    /* Scorched margins: distance to edge, gnawed at by noise so the
       burn line wanders instead of framing the sheet evenly. */
    const d = Math.min(x, W - 1 - x, y, H - 1 - y);
    if (d < BURN_W * 1.6) {
      const wobble = (fbm(x, y, 210, 4, 23) - 0.5) * 110;
      const t = Math.min(1, Math.max(0, (d + wobble) / BURN_W));
      const burn = (1 - smooth(t)) ** 1.6;
      // uneven charring along the very rim
      const char = 0.75 + 0.5 * fbm(x, y, 60, 3, 37);
      w += EDGE_DARK * burn * char;
    }

    /* Creases: a sharp dark line inside a wide soft shadow, both fading
       in and out along their run — folds wear unevenly. */
    for (const fx of foldsX) {
      const dx = x - fx;
      if (Math.abs(dx) < 90) {
        const along = 0.4 + 0.9 * fbm(fx, y, 240, 3, 53);
        w +=
          (0.22 * Math.exp(-((dx / CREASE_SIGMA) ** 2)) +
            0.07 * Math.exp(-((dx / SHADE_SIGMA) ** 2))) *
          along;
      }
    }
    for (const fy of foldsY) {
      const dy = y - fy;
      if (Math.abs(dy) < 90) {
        const along = 0.4 + 0.9 * fbm(x, fy, 240, 3, 67);
        w +=
          (0.22 * Math.exp(-((dy / CREASE_SIGMA) ** 2)) +
            0.07 * Math.exp(-((dy / SHADE_SIGMA) ** 2))) *
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
const SPECKS = 175;
for (let n = 0; n < SPECKS; n++) {
  let x = rand() * W;
  let y = rand() * H;
  if (rand() < 0.6) {
    if (rand() < 0.5) x = x < W / 2 ? x * 0.3 : W - (W - x) * 0.3;
    else y = y < H / 2 ? y * 0.3 : H - (H - y) * 0.3;
  }
  const r = 1.5 + rand() * 4.5;
  const depth = 0.12 + rand() * 0.22;
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

/* --- Compose to RGB --------------------------------------------------- */

/* White is neutral under multiply; wear pulls channels down, blue fastest
   for the warm brown, green fastest after red for the rusty foxing. */
const img = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  const w = Math.min(warm[i], 0.85);
  const r = Math.min(rust[i], 0.7);
  const mr = (1 - 0.7 * w) * (1 - 0.45 * r);
  const mg = (1 - 0.88 * w) * (1 - 0.68 * r);
  const mb = (1 - 1.0 * w) * (1 - 0.82 * r);
  img[i * 3] = Math.max(0, Math.round(253 * mr));
  img[i * 3 + 1] = Math.max(0, Math.round(250 * mg));
  img[i * 3 + 2] = Math.max(0, Math.round(244 * mb));
}

await sharp(img, { raw: { width: W, height: H, channels: 3 } })
  .webp({ quality: 68 })
  .toFile(OUT);
console.log("wrote", OUT);

if (process.argv.includes("--preview")) {
  const preview = path.join(
    ROOT,
    "scripts",
    ".wear-preview.jpg",
  );
  const scan = await sharp(SCAN).resize(W, H).toBuffer();
  await sharp(scan)
    .composite([{ input: OUT, blend: "multiply" }])
    .jpeg({ quality: 82 })
    .toFile(preview);
  console.log("wrote", preview);
}
