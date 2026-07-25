import fs from "node:fs";
import path from "node:path";
import {
  buildSearchable,
  findQuote,
  type NormalizedStory,
  type SearchableStory,
} from "../src/shared/lib/quote-search.ts";

/**
 * Closes the review: every file left in content/drafts/<story>/merged/ is
 * considered accepted — its `_draft` block is stripped and the entity lands in
 * content/<collection>/<slug>.json (overwriting is intentional: enriched
 * versions of existing entities replace the originals). Junked drafts must be
 * moved out of merged/ (e.g. to the drafts' junk/) before running.
 *
 * Quote gate: every quote of every entity about to be promoted must be an
 * exact substring of its normalized story text (same check as verify-quotes).
 * One broken quote aborts the whole run before anything is written — broken
 * quotes must never reach live content/. `--check` runs the gate only.
 *
 * Run `npm run check-drafts` first; `npm run validate` after.
 */

const ROOT = process.cwd();
const DRAFTS = path.join(ROOT, "content", "drafts");
const NORMALIZED_DIR = path.join(ROOT, "corpus", "normalized");
const kinds = ["locations", "characters", "creatures"] as const;
const checkOnly = process.argv.includes("--check");

const stories = new Map<string, SearchableStory>();
for (const f of fs.readdirSync(NORMALIZED_DIR).filter((x) => x.endsWith(".json"))) {
  const story: NormalizedStory = JSON.parse(fs.readFileSync(path.join(NORMALIZED_DIR, f), "utf8"));
  stories.set(story.slug, buildSearchable(story));
}

interface Job {
  src: string;
  target: string;
  entity: Record<string, unknown>;
  label: string;
}
const jobs: Job[] = [];
const broken: string[] = [];

for (const storyDir of fs.readdirSync(DRAFTS, { withFileTypes: true })) {
  if (!storyDir.isDirectory()) continue;
  for (const kind of kinds) {
    const dir = path.join(DRAFTS, storyDir.name, "merged", kind);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const src = path.join(dir, f);
      const { _draft, ...entity } = JSON.parse(fs.readFileSync(src, "utf8"));
      void _draft;
      const label = `content/${kind}/${f}`;
      const sources = (Array.isArray(entity.sources) ? entity.sources : []) as {
        storySlug?: string;
        quote?: string;
      }[];
      sources.forEach((s, i) => {
        if (typeof s?.quote !== "string" || typeof s?.storySlug !== "string") return;
        const story = stories.get(s.storySlug);
        if (!story) {
          broken.push(`${label} sources[${i}]: no normalized text for story "${s.storySlug}"`);
        } else if (findQuote(story, s.quote).length === 0) {
          broken.push(
            `${label} sources[${i}]: quote not found in "${story.title}"\n      "${s.quote.slice(0, 100)}${s.quote.length > 100 ? "…" : ""}"`,
          );
        }
      });
      jobs.push({ src, target: path.join(ROOT, "content", kind, f), entity, label });
    }
  }
}

if (broken.length > 0) {
  for (const b of broken) console.log(`FAIL  ${b}`);
  console.error(`\n${broken.length} broken quote(s) — nothing promoted; fix or junk those drafts first`);
  process.exit(1);
}
if (checkOnly) {
  console.log(`${jobs.length} entities ready to promote, all quotes verified (--check: nothing written)`);
  process.exit(0);
}

for (const job of jobs) {
  fs.mkdirSync(path.dirname(job.target), { recursive: true });
  fs.writeFileSync(job.target, JSON.stringify(job.entity, null, 2) + "\n");
  fs.rmSync(job.src);
  console.log(job.label);
}
for (const storyDir of fs.readdirSync(DRAFTS, { withFileTypes: true })) {
  if (!storyDir.isDirectory()) continue;
  const merged = path.join(DRAFTS, storyDir.name, "merged");
  if (!fs.existsSync(merged)) continue;
  for (const kind of kinds) {
    const dir = path.join(merged, kind);
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  }
  if (fs.readdirSync(merged).length === 0) fs.rmdirSync(merged);
}
console.log(`\n${jobs.length} entities promoted`);
