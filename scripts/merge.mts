import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  MergeWave1Output,
  MergeWave2Output,
  type Occurrence,
} from "../src/shared/draft-schemas.ts";

/**
 * LLM merge step over the Anthropic SDK (docs/plan-extract-sdk.md). Folds the
 * window occurrence records into per-entity drafts in two waves, as in M2:
 *   wave 1 — locations (context: registry of existing content/ slugs);
 *   wave 2 — characters + creatures (context: wave-1 slugs + existing content).
 * The playbook prompts/merge.md stays the source of truth — its Identity,
 * Output and Field rules sections are inserted verbatim. REVIEW.md is written
 * deterministically from the merged data, the LLM never writes it.
 *
 * Usage: npm run merge -- <storySlug> [--force]
 * Precondition: npm run verify-quotes is green over the window files.
 * Afterwards: npm run check-drafts, then human review in /admin/review.
 */

const MODEL = "claude-sonnet-5";
const USD_PER_MTOK = { input: 2, output: 10 }; // Sonnet 5 intro pricing through 2026-08-31
const MAX_TOKENS = 64000;

const ROOT = process.cwd();
const KINDS = ["locations", "characters", "creatures"] as const;
type Kind = (typeof KINDS)[number];

interface RegistryEntry {
  slug: string;
  name: string;
  json: Record<string, unknown>;
}

function playbookSections(): string {
  const playbook = fs.readFileSync(path.join(ROOT, "prompts", "merge.md"), "utf8");
  const start = playbook.indexOf("## Identity");
  const end = playbook.indexOf("## Review handoff");
  if (start === -1 || end === -1) throw new Error("prompts/merge.md: sections not found");
  return playbook.slice(start, end).trim();
}

function readRegistry(kind: Kind): RegistryEntry[] {
  const dir = path.join(ROOT, "content", kind);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const json = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      return { slug: f.replace(/\.json$/, ""), name: String(json.name ?? ""), json };
    });
}

/** Loose name folding for enrichment matching (mirrors the playbook's identity rule). */
function foldName(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the /, "");
}

function matchingExisting(occurrences: Occurrence[], registry: RegistryEntry[]): RegistryEntry[] {
  const seen = new Set<string>();
  for (const o of occurrences) {
    seen.add(foldName(o.name));
    for (const a of o.aliases) seen.add(foldName(a));
  }
  return registry.filter((e) => seen.has(foldName(e.name)) || seen.has(foldName(e.slug)));
}

function registryLines(kind: Kind, entries: { slug: string; name: string }[]): string {
  if (entries.length === 0) return `- ${kind}: (none)`;
  return `- ${kind}: ${entries.map((e) => `${e.slug} ("${e.name}")`).join(", ")}`;
}

function occurrenceBlocks(byWindow: Map<string, Occurrence[]>, kinds: string[]): string {
  const blocks: string[] = [];
  for (const [windowId, records] of byWindow) {
    const subset = records.filter((r) => kinds.includes(r.kind));
    if (subset.length === 0) continue;
    blocks.push(`### ${windowId}\n${JSON.stringify(subset, null, 2)}`);
  }
  return blocks.join("\n\n");
}

type DiskEntity = Record<string, unknown>;

/** Field order of the content/ files; nulls dropped, existing-only fields preserved. */
function toDiskEntity(
  draft: Record<string, unknown>,
  kind: Kind,
  existing: RegistryEntry | undefined,
): DiskEntity {
  const keep = (existing?.json ?? {}) as Record<string, unknown>;
  const val = (k: string) => (draft[k] === null ? undefined : draft[k]);
  const entity: DiskEntity = {
    slug: draft.slug,
    name: draft.name,
    ...(keep.nameRu !== undefined && { nameRu: keep.nameRu }),
    ...(kind === "locations" && { type: draft.type }),
    ...(kind === "characters" && { role: draft.role }),
    ...(kind === "creatures" && { classification: draft.classification }),
    ...(keep.prominence !== undefined && { prominence: keep.prominence }),
    summary: draft.summary,
    description: draft.description,
    ...(kind === "locations" && keep.map !== undefined && { map: keep.map }),
    ...(kind === "locations" && val("realWorld") !== undefined && { realWorld: val("realWorld") }),
    ...(kind !== "locations" && { locations: draft.locations }),
    appearsIn: draft.appearsIn,
    ...(kind === "locations" && { connectedTo: draft.connectedTo }),
    ...(kind !== "locations" && val("fate") !== undefined && { fate: val("fate") }),
    sources: (draft.sources as { context: string | null }[]).map((s) => ({
      ...s,
      ...(s.context === null ? { context: undefined } : {}),
    })),
    ...(keep.image !== undefined && { image: keep.image }),
    _draft: draft._draft,
  };
  return JSON.parse(JSON.stringify(entity)); // strip undefined
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const slug = args.find((a) => !a.startsWith("--"));
  if (!slug) {
    console.error("usage: npm run merge -- <storySlug> [--force]");
    process.exit(1);
  }

  const windowsDir = path.join(ROOT, "content", "drafts", slug, "windows");
  if (!fs.existsSync(windowsDir)) {
    console.error(`no ${windowsDir} — run npm run extract -- ${slug} first`);
    process.exit(1);
  }
  const mergedDir = path.join(ROOT, "content", "drafts", slug, "merged");
  if (fs.existsSync(mergedDir) && fs.readdirSync(mergedDir).length > 0 && !force) {
    console.error(`${mergedDir} is not empty — use --force to re-merge`);
    process.exit(1);
  }

  const byWindow = new Map<string, Occurrence[]>();
  for (const f of fs.readdirSync(windowsDir).filter((x) => x.endsWith(".json")).sort()) {
    byWindow.set(
      f.replace(/\.json$/, ""),
      JSON.parse(fs.readFileSync(path.join(windowsDir, f), "utf8")),
    );
  }
  const all = [...byWindow.values()].flat();
  console.log(`${slug}: ${byWindow.size} windows, ${all.length} occurrences (assumes verify-quotes is green)\n`);

  const sections = playbookSections();
  const registries = {
    locations: readRegistry("locations"),
    characters: readRegistry("characters"),
    creatures: readRegistry("creatures"),
  };
  const storySlugs = fs
    .readdirSync(path.join(ROOT, "content", "stories"))
    .map((f) => f.replace(/\.json$/, ""));

  const client = new Anthropic();
  const usage = { input: 0, output: 0 };

  async function runWave(label: string, prompt: string): Promise<unknown> {
    console.log(`merging ${label}…`);
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { format: zodOutputFormat(label === "wave 1 (locations)" ? MergeWave1Output : MergeWave2Output) },
      messages: [{ role: "user", content: prompt }],
    });
    const message = await stream.finalMessage();
    usage.input += message.usage.input_tokens;
    usage.output += message.usage.output_tokens;
    if (message.stop_reason !== "end_turn") {
      throw new Error(`${label}: stop_reason ${message.stop_reason}`);
    }
    const text = message.content.find((b) => b.type === "text");
    if (!text) throw new Error(`${label}: no text block in response`);
    return JSON.parse(text.text);
  }

  function writeEntities(kind: Kind, drafts: Record<string, unknown>[]): string[] {
    const dir = path.join(mergedDir, kind);
    fs.mkdirSync(dir, { recursive: true });
    const written: string[] = [];
    for (const draft of drafts) {
      const existing = registries[kind].find((e) => e.slug === draft.slug);
      const entity = toDiskEntity(draft, kind, existing);
      const file = path.join(dir, `${draft.slug}.json`);
      fs.writeFileSync(file, JSON.stringify(entity, null, 2) + "\n");
      written.push(String(draft.slug));
      console.log(`  ${kind}/${draft.slug}.json${existing ? " (enriched existing)" : ""}`);
    }
    return written;
  }

  const preamble = (wave: string) =>
    [
      `You are the merge step of a literary-atlas pipeline. Follow the playbook sections below exactly. ${wave}`,
      sections,
      `Story being merged: storySlug "${slug}". Every merged entity's appearsIn must include "${slug}"; an enriched existing entity keeps its previous appearsIn values too.`,
      `Existing story slugs (valid in appearsIn): ${storySlugs.join(", ")}`,
    ].join("\n\n");

  // Wave 1 — locations.
  const w1Matches = matchingExisting(all.filter((o) => o.kind === "location"), registries.locations);
  const w1Prompt = [
    preamble("This wave merges LOCATION occurrences only."),
    `Registry of existing content slugs (the only pre-existing slugs valid in connectedTo):\n${registryLines("locations", registries.locations)}`,
    w1Matches.length > 0
      ? `Existing entities matching occurrence names — enrich these: start from the JSON, keep its fields, add new facts and sources:\n${JSON.stringify(w1Matches.map((e) => e.json), null, 2)}`
      : "No occurrence matches an existing entity — all merged locations are new.",
    `Location occurrences by window:\n\n${occurrenceBlocks(byWindow, ["location"])}`,
  ].join("\n\n");

  const wave1 = MergeWave1Output.parse(await runWave("wave 1 (locations)", w1Prompt));
  writeEntities("locations", wave1.locations);

  // Wave 2 — characters + creatures, with wave-1 slugs in context.
  const peopleOccurrences = all.filter((o) => o.kind !== "location");
  const w2Matches = [
    ...matchingExisting(peopleOccurrences, registries.characters),
    ...matchingExisting(peopleOccurrences, registries.creatures),
  ];
  const w2Prompt = [
    preamble("This wave merges CHARACTER and CREATURE occurrences (locations are already merged)."),
    `Location slugs valid in the "locations" field:\n${registryLines("locations", [
      ...registries.locations,
      ...wave1.locations.map((l) => ({ slug: l.slug, name: l.name })),
    ])}`,
    `Registry of existing content slugs:\n${registryLines("characters", registries.characters)}\n${registryLines("creatures", registries.creatures)}`,
    w2Matches.length > 0
      ? `Existing entities matching occurrence names — enrich these: start from the JSON, keep its fields, add new facts and sources:\n${JSON.stringify(w2Matches.map((e) => e.json), null, 2)}`
      : "No occurrence matches an existing entity — all merged characters/creatures are new.",
    `Character and creature occurrences by window:\n\n${occurrenceBlocks(byWindow, ["character", "creature"])}`,
  ].join("\n\n");

  const wave2 = MergeWave2Output.parse(await runWave("wave 2 (characters + creatures)", w2Prompt));
  writeEntities("characters", wave2.characters);
  writeEntities("creatures", wave2.creatures);

  // Deterministic REVIEW.md — the gate checklist, generated from data.
  const rows: string[] = [];
  const collect = (kind: string, drafts: Record<string, unknown>[]) => {
    for (const d of drafts) {
      const meta = d._draft as { occurrences: number; needsReview: unknown[] };
      rows.push(
        `| ${d.name} | ${kind} | ${meta.occurrences} | ${meta.needsReview.length || ""} | |`,
      );
    }
  };
  collect("location", wave1.locations);
  collect("character", wave2.characters);
  collect("creature", wave2.creatures);

  const storyTitle = (JSON.parse(
    fs.readFileSync(path.join(ROOT, "corpus", "normalized", `${slug}.json`), "utf8"),
  ) as { title: string }).title;
  const review = `# Review — ${storyTitle}, extraction run

Generated ${new Date().toISOString().slice(0, 10)} by \`npm run merge -- ${slug}\` from \`merged/\`.
Mark a verdict for every entity in /admin/review (or by hand below); the verdicts are the gate counters.

**Verdicts:** \`as-is\` — accepted unchanged · \`edited\` — accepted after fixes · \`junk\` — discarded.
**Gate (as in M2):** ≥70% of entities as-is or edited → run the remaining stories; otherwise fix the prompts/scripts first (docs/plan-extract-sdk.md).

| Entity | Kind | Occurrences | needsReview | Verdict |
|---|---|---|---|---|
${rows.join("\n")}
`;
  fs.writeFileSync(path.join(ROOT, "content", "drafts", slug, "REVIEW.md"), review);
  console.log(`  REVIEW.md (${rows.length} entities)`);

  const cost = (usage.input / 1e6) * USD_PER_MTOK.input + (usage.output / 1e6) * USD_PER_MTOK.output;
  console.log(
    `\ntokens: ${usage.input} in / ${usage.output} out — $${cost.toFixed(3)} (${MODEL})`,
  );
  console.log(`next: npm run check-drafts, then review in /admin/review`);
}

main();
