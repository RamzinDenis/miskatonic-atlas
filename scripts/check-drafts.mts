import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { CharacterSchema, CreatureSchema, LocationSchema } from "../src/shared/schemas.ts";

/**
 * Dry-run schema check of merged drafts (content/drafts/<story>/merged/):
 * strips the `_draft` block, validates the rest against the final Zod schema,
 * and checks slug references against the merged set plus existing content/.
 * Catches shape/enum/ref errors before human review — the review loop is
 * `fix file → npm run check-drafts` without moving anything into content/.
 */

const ROOT = process.cwd();
const DRAFTS = path.join(ROOT, "content", "drafts");
const schemas = {
  locations: LocationSchema,
  characters: CharacterSchema,
  creatures: CreatureSchema,
} as const;

const storyDirs = fs.existsSync(DRAFTS)
  ? fs
      .readdirSync(DRAFTS, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(DRAFTS, e.name, "merged")))
      .map((e) => e.name)
  : [];

if (storyDirs.length === 0) {
  console.error("no merged drafts found under content/drafts/*/merged");
  process.exit(1);
}

// Known slugs: everything merged across all stories + everything already in content/.
const known = new Set<string>();
const locationSlugs = new Set<string>();
function addDir(dir: string, isLocations: boolean) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const slug = f.replace(/\.json$/, "");
    known.add(slug);
    if (isLocations) locationSlugs.add(slug);
  }
}
for (const kind of Object.keys(schemas)) {
  addDir(path.join(ROOT, "content", kind), kind === "locations");
  for (const story of storyDirs) addDir(path.join(DRAFTS, story, "merged", kind), kind === "locations");
}
const storySlugs = new Set(
  fs.readdirSync(path.join(ROOT, "content", "stories")).map((f) => f.replace(/\.json$/, "")),
);

let files = 0;
let errors = 0;
for (const story of storyDirs) {
  for (const [kind, schema] of Object.entries(schemas)) {
    const dir = path.join(DRAFTS, story, "merged", kind);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      files++;
      const rel = `${story}/merged/${kind}/${f}`;
      let raw: Record<string, unknown>;
      try {
        raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      } catch (e) {
        errors++;
        console.log(`FAIL  ${rel}: invalid JSON — ${(e as Error).message}`);
        continue;
      }
      const { _draft, ...entity } = raw;
      if (!_draft) console.log(`WARN  ${rel}: no _draft block`);

      const result = schema.safeParse(entity);
      if (!result.success) {
        errors++;
        const detail = z
          .prettifyError(result.error)
          .split("\n")
          .map((l) => "      " + l)
          .join("\n");
        console.log(`FAIL  ${rel}:\n${detail}`);
        continue;
      }
      if (result.data.slug !== f.replace(/\.json$/, "")) {
        errors++;
        console.log(`FAIL  ${rel}: slug "${result.data.slug}" != file name`);
      }

      const refChecks: [string, readonly string[], ReadonlySet<string>][] = [
        ["appearsIn", (entity.appearsIn as string[]) ?? [], storySlugs],
        ["connectedTo", (entity.connectedTo as string[]) ?? [], locationSlugs],
        ["locations", (entity.locations as string[]) ?? [], locationSlugs],
      ];
      for (const [field, slugs, set] of refChecks) {
        for (const s of slugs) {
          if (!set.has(s)) {
            errors++;
            console.log(`FAIL  ${rel}: ${field} → unknown slug "${s}"`);
          }
        }
      }
    }
  }
}

console.log(`\n${files} draft files checked, ${errors} error(s)`);
if (errors > 0) process.exit(1);
