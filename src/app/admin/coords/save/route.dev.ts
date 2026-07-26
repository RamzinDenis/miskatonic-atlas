import fs from "node:fs/promises";
import path from "node:path";
import { getSeedPlacements } from "@/shared/lib/content";
import { MAPS } from "@/shared/maps";

/**
 * Dev-only companion of /admin/coords. Four operations on
 * content/locations/*.json, each touching only the fields it owns; the file is
 * otherwise parsed and re-printed as-is:
 *   moves       — write new `map` coordinates (pin drags / queue placement),
 *                 on the chart the move names
 *   seed        — first-pass provisional `map` for every unplaced location,
 *                 the unanchored ones landing on the chart the picker is open on
 *   unplace     — remove `map` (send a pin back to the placement queue)
 *   prominence  — set major/minor (major carries no field, per the schema default)
 */

interface Move {
  slug: string;
  mapId: string;
  x: number;
  y: number;
}

const SLUG_RE = /^[a-z0-9-]+$/;

function locationsDir() {
  return path.join(process.cwd(), "content", "locations");
}

async function readLocation(slug: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(locationsDir(), `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}

async function writeLocation(slug: string, data: Record<string, unknown>) {
  await fs.writeFile(
    path.join(locationsDir(), `${slug}.json`),
    JSON.stringify(data, null, 2) + "\n",
  );
}

async function applyMoves(moves: Move[]): Promise<Response> {
  for (const move of moves) {
    if (!SLUG_RE.test(move.slug)) return new Response(`Bad slug "${move.slug}"`, { status: 400 });
    if (!Number.isFinite(move.x) || !Number.isFinite(move.y)) {
      return new Response(`Bad coordinates for "${move.slug}"`, { status: 400 });
    }
    const mapId = move.mapId;
    if (!mapId || !MAPS[mapId]) return new Response(`Unknown mapId "${mapId}"`, { status: 400 });
    const location = await readLocation(move.slug);
    if (!location) return new Response(`No location file for "${move.slug}"`, { status: 404 });
    location.map = { mapId, x: Math.round(move.x), y: Math.round(move.y) };
    await writeLocation(move.slug, location);
  }
  return Response.json({ saved: moves.length });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const body = (await request.json()) as {
    moves?: Move[];
    seed?: boolean;
    mapId?: string;
    unplace?: string[];
    prominence?: { slug: string; value: "major" | "minor" }[];
  };

  // Seed: provisional first-pass coordinates for the whole placement queue,
  // on the chart the picker is open on.
  if (body.seed === true) {
    const mapId = body.mapId ?? "";
    if (!MAPS[mapId]) return new Response(`Unknown mapId "${mapId}"`, { status: 400 });
    return applyMoves(getSeedPlacements(mapId));
  }

  // Unplace: drop `map` so the pin returns to the queue.
  if (Array.isArray(body.unplace)) {
    for (const slug of body.unplace) {
      if (!SLUG_RE.test(slug)) return new Response(`Bad slug "${slug}"`, { status: 400 });
      const location = await readLocation(slug);
      if (!location) return new Response(`No location file for "${slug}"`, { status: 404 });
      delete location.map;
      await writeLocation(slug, location);
    }
    return Response.json({ unplaced: body.unplace.length });
  }

  // Prominence: minor gets the field (before `summary`, in schema order); major
  // drops it — matching scripts/set-prominence.mts and the review route.
  if (Array.isArray(body.prominence)) {
    for (const { slug, value } of body.prominence) {
      if (!SLUG_RE.test(slug)) return new Response(`Bad slug "${slug}"`, { status: 400 });
      if (value !== "major" && value !== "minor") {
        return new Response(`Bad prominence for "${slug}"`, { status: 400 });
      }
      const location = await readLocation(slug);
      if (!location) return new Response(`No location file for "${slug}"`, { status: 404 });
      const updated: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(location)) {
        if (key === "prominence") continue;
        if (key === "summary" && value === "minor") updated.prominence = "minor";
        updated[key] = val;
      }
      await writeLocation(slug, updated);
    }
    return Response.json({ ok: true });
  }

  // Default: pin moves.
  if (Array.isArray(body.moves) && body.moves.length > 0) {
    return applyMoves(body.moves);
  }

  return new Response("No operation given", { status: 400 });
}
