import fs from "node:fs/promises";
import path from "node:path";

/**
 * Dev-only companion of /admin/coords: receives pin drags and writes the
 * new `map` coordinates back into content/locations/*.json. Only the `map`
 * field is touched — the file is parsed and re-printed as-is otherwise.
 */

interface Move {
  slug: string;
  x: number;
  y: number;
}

const SLUG_RE = /^[a-z0-9-]+$/;

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { moves } = (await request.json()) as { moves: Move[] };
  if (!Array.isArray(moves) || moves.length === 0) {
    return new Response("No moves given", { status: 400 });
  }

  const dir = path.join(process.cwd(), "content", "locations");
  for (const move of moves) {
    if (!SLUG_RE.test(move.slug)) {
      return new Response(`Bad slug "${move.slug}"`, { status: 400 });
    }
    if (!Number.isFinite(move.x) || !Number.isFinite(move.y)) {
      return new Response(`Bad coordinates for "${move.slug}"`, { status: 400 });
    }

    const file = path.join(dir, `${move.slug}.json`);
    let location: Record<string, unknown>;
    try {
      location = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return new Response(`No location file for "${move.slug}"`, { status: 404 });
    }

    location.map = { x: Math.round(move.x), y: Math.round(move.y) };
    await fs.writeFile(file, JSON.stringify(location, null, 2) + "\n");
  }

  return Response.json({ saved: moves.length });
}
