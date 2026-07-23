import fs from "node:fs";
import path from "node:path";
import {
  DRAFTS,
  KINDS,
  SLUG_RE,
  buildReviewState,
  checkQuotes,
  loadSearchables,
  updateLog,
  validateDraft,
  type Decision,
  type Kind,
} from "./state";

/**
 * Dev-only backend of /admin/review (the review UI, backlog item 1 — also the
 * prototype of the product's "author review UI", docs/tech-spec.md).
 *
 * GET returns the review state (see ./state.ts). POST applies one decision
 * and writes JSON on disk:
 *   save        — overwrite a merged draft with edited JSON (review edits in place)
 *   verdict     — as-is/edited: strip `_draft`, promote to content/<kind>/;
 *                 junk: move the draft to the story's junk/
 *   restore     — move a junked draft back into merged/
 *   prominence  — stamp major/minor on a content/ entity (Phase 3 curation)
 *
 * Verdicts are logged to content/drafts/<story>/review-log.json — the gate
 * counters (as-is / edited / junk) come from there.
 */

export const dynamic = "force-dynamic";

const ROOT = process.cwd();

function prod(): boolean {
  return process.env.NODE_ENV === "production";
}

function bad(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

function guardStory(story: unknown): string | null {
  if (typeof story !== "string" || !SLUG_RE.test(story)) return null;
  return fs.existsSync(path.join(DRAFTS, story)) ? story : null;
}

function guardKind(kind: unknown): Kind | null {
  return KINDS.includes(kind as Kind) ? (kind as Kind) : null;
}

function guardSlug(slug: unknown): string | null {
  return typeof slug === "string" && SLUG_RE.test(slug) ? slug : null;
}

export async function GET() {
  if (prod()) return new Response("Not found", { status: 404 });
  return Response.json(buildReviewState());
}

export async function POST(request: Request) {
  if (prod()) return new Response("Not found", { status: 404 });

  const body = (await request.json()) as Record<string, unknown>;

  switch (body.action) {
    case "save": {
      const story = guardStory(body.story);
      const kind = guardKind(body.kind);
      const slug = guardSlug(body.slug);
      if (!story || !kind || !slug) return bad("bad story/kind/slug");

      const file = path.join(DRAFTS, story, "merged", kind, `${slug}.json`);
      if (!fs.existsSync(file)) return bad("no such draft", 404);

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(body.raw as string);
      } catch (e) {
        return bad(`invalid JSON: ${(e as Error).message}`, 422);
      }
      fs.writeFileSync(file, JSON.stringify(parsed, null, 2) + "\n");
      updateLog(story, `${kind}/${slug}`, { edited: true });

      return Response.json({
        ok: true,
        errors: validateDraft(kind, slug, parsed),
        quotes: checkQuotes(parsed, loadSearchables()),
      });
    }

    case "verdict": {
      const story = guardStory(body.story);
      const kind = guardKind(body.kind);
      const slug = guardSlug(body.slug);
      const verdict = body.verdict as Decision["verdict"];
      if (!story || !kind || !slug) return bad("bad story/kind/slug");
      if (verdict !== "as-is" && verdict !== "edited" && verdict !== "junk") {
        return bad("bad verdict");
      }

      const file = path.join(DRAFTS, story, "merged", kind, `${slug}.json`);
      if (!fs.existsSync(file)) return bad("no such draft", 404);
      const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;

      if (verdict === "junk") {
        const junkDir = path.join(DRAFTS, story, "junk");
        fs.mkdirSync(junkDir, { recursive: true });
        const target = path.join(junkDir, `${slug}.json`);
        fs.rmSync(target, { force: true }); // renameSync won't overwrite on Windows
        fs.renameSync(file, target);
      } else {
        const errors = validateDraft(kind, slug, raw);
        if (errors.length > 0) return Response.json({ errors }, { status: 422 });
        // Same promotion as scripts/promote-drafts.mts: strip `_draft`, keep
        // the rest verbatim (`paragraph` keys survive; Zod strips them at read).
        const { _draft, ...entity } = raw;
        void _draft;
        const target = path.join(ROOT, "content", kind);
        fs.mkdirSync(target, { recursive: true });
        fs.writeFileSync(
          path.join(target, `${slug}.json`),
          JSON.stringify(entity, null, 2) + "\n",
        );
        fs.rmSync(file);
      }
      updateLog(story, `${kind}/${slug}`, { verdict });
      return Response.json({ ok: true });
    }

    case "restore": {
      const story = guardStory(body.story);
      const slug = guardSlug(body.slug);
      if (!story || !slug) return bad("bad story/slug");

      const file = path.join(DRAFTS, story, "junk", `${slug}.json`);
      if (!fs.existsSync(file)) return bad("no such junked draft", 404);
      const entity = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
      const kind: Kind =
        "classification" in entity
          ? "creatures"
          : "role" in entity
            ? "characters"
            : "locations";

      const dir = path.join(DRAFTS, story, "merged", kind);
      fs.mkdirSync(dir, { recursive: true });
      const target = path.join(dir, `${slug}.json`);
      fs.rmSync(target, { force: true }); // renameSync won't overwrite on Windows
      fs.renameSync(file, target);
      updateLog(story, `${kind}/${slug}`, null);
      return Response.json({ ok: true, kind });
    }

    case "prominence": {
      const kind = guardKind(body.kind);
      const slug = guardSlug(body.slug);
      const prominence = body.prominence;
      if (!kind || !slug) return bad("bad kind/slug");
      if (prominence !== "major" && prominence !== "minor") return bad("bad prominence");

      const file = path.join(ROOT, "content", kind, `${slug}.json`);
      if (!fs.existsSync(file)) return bad("no such entity", 404);
      const entity = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;

      // Majors carry no field (schema default) — matches scripts/set-prominence.mts:
      // minors get `prominence` right before `summary`, in schema order.
      const updated: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(entity)) {
        if (key === "prominence") continue;
        if (key === "summary" && prominence === "minor") updated.prominence = "minor";
        updated[key] = value;
      }
      fs.writeFileSync(file, JSON.stringify(updated, null, 2) + "\n");
      return Response.json({ ok: true });
    }

    default:
      return bad(`unknown action "${String(body.action)}"`);
  }
}
