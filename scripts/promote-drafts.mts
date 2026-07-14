import fs from "node:fs";
import path from "node:path";

/**
 * Closes the review: every file left in content/drafts/<story>/merged/ is
 * considered accepted — its `_draft` block is stripped and the entity lands in
 * content/<collection>/<slug>.json (overwriting is intentional: enriched
 * versions of existing entities replace the originals). Junked drafts must be
 * moved out of merged/ (e.g. to the drafts' junk/) before running.
 * Run `npm run check-drafts` first; `npm run validate` after.
 */

const DRAFTS = path.join(process.cwd(), "content", "drafts");
const kinds = ["locations", "characters", "creatures"] as const;

let promoted = 0;
for (const story of fs.readdirSync(DRAFTS, { withFileTypes: true })) {
  if (!story.isDirectory()) continue;
  for (const kind of kinds) {
    const dir = path.join(DRAFTS, story.name, "merged", kind);
    if (!fs.existsSync(dir)) continue;
    fs.mkdirSync(path.join(process.cwd(), "content", kind), { recursive: true });
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const { _draft, ...entity } = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      void _draft;
      const target = path.join(process.cwd(), "content", kind, f);
      fs.writeFileSync(target, JSON.stringify(entity, null, 2) + "\n");
      fs.rmSync(path.join(dir, f));
      promoted++;
      console.log(`content/${kind}/${f}`);
    }
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  }
  const mergedDir = path.join(DRAFTS, story.name, "merged");
  if (fs.existsSync(mergedDir) && fs.readdirSync(mergedDir).length === 0) fs.rmdirSync(mergedDir);
}
console.log(`\n${promoted} entities promoted`);
