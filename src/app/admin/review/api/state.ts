import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  CharacterSchema,
  CreatureSchema,
  LocationSchema,
} from "@/shared/schemas";
import {
  buildSearchable,
  findQuote,
  type NormalizedStory,
  type SearchableStory,
} from "@/shared/lib/quote-search";

/**
 * Server side of /admin/review, shared by the page (initial render) and the
 * route handler (refresh + decisions): reads merged drafts, junk, the decision
 * log and content/ entities, checks quotes and validates drafts the same way
 * scripts/verify-quotes.mts and scripts/check-drafts.mts do.
 */

const ROOT = process.cwd();
export const DRAFTS = path.join(ROOT, "content", "drafts");

export const SCHEMAS = {
  locations: LocationSchema,
  characters: CharacterSchema,
  creatures: CreatureSchema,
} as const;
export type Kind = keyof typeof SCHEMAS;
export const KINDS = Object.keys(SCHEMAS) as Kind[];

export const SLUG_RE = /^[a-z0-9-]+$/;

interface SourceLike {
  storySlug?: string;
  quote?: string;
  paragraph?: number;
}

export interface QuoteCheck {
  index: number;
  status: "found" | "missing" | "no-text";
  /** Paragraph number the source claims, if any. */
  claims?: number;
  /** Paragraphs the quote was actually found in. */
  found: number[];
}

export interface Draft {
  kind: Kind;
  slug: string;
  raw: string;
  quotes: QuoteCheck[];
  /** Containment parent (ADR-0003) — lets the desk nest sub-locations. */
  parentSlug?: string;
  /** Same-kind drafts that look like the same entity — surfaced for the human
      to confirm a merge (the merge step under-coreferences title/nickname/
      appositive variants across windows). Computed at review time, not stored. */
  duplicateOf?: { slug: string; name: string }[];
}

export interface Junked {
  slug: string;
  raw: string;
}

export interface Decision {
  verdict?: "as-is" | "edited" | "junk";
  edited?: boolean;
  at: string;
}

export interface ReviewLog {
  decisions: Record<string, Decision>;
}

export interface StoryState {
  story: string;
  drafts: Draft[];
  junk: Junked[];
  log: ReviewLog;
}

export interface CurationEntity {
  kind: Kind;
  slug: string;
  name: string;
  prominence: "major" | "minor";
  appearsIn: string[];
}

export interface ReviewState {
  stories: StoryState[];
  curation: CurationEntity[];
  hasNormalized: boolean;
}

export function loadSearchables(): Map<string, SearchableStory> {
  const dir = path.join(ROOT, "corpus", "normalized");
  const stories = new Map<string, SearchableStory>();
  if (!fs.existsSync(dir)) return stories;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const story: NormalizedStory = JSON.parse(
      fs.readFileSync(path.join(dir, file), "utf8"),
    );
    stories.set(story.slug, buildSearchable(story));
  }
  return stories;
}

export function checkQuotes(
  entity: { sources?: SourceLike[] },
  texts: Map<string, SearchableStory>,
): QuoteCheck[] {
  const sources = Array.isArray(entity.sources) ? entity.sources : [];
  return sources.map((source, index) => {
    const check: QuoteCheck = { index, status: "no-text", found: [] };
    if (typeof source.paragraph === "number") check.claims = source.paragraph;
    if (typeof source.quote !== "string" || typeof source.storySlug !== "string")
      return check;
    const story = texts.get(source.storySlug);
    if (!story) return check;
    check.found = findQuote(story, source.quote);
    check.status = check.found.length > 0 ? "found" : "missing";
    return check;
  });
}

function knownSlugs(): {
  /** location slug → its parentSlug (undefined for a top-level location). */
  locations: Map<string, string | undefined>;
  stories: Set<string>;
} {
  const locations = new Map<string, string | undefined>();
  const addDir = (dir: string, isLocations: boolean) => {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      if (!isLocations) continue;
      const slug = f.replace(/\.json$/, "");
      let parent: string | undefined;
      try {
        const o = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        if (typeof o.parentSlug === "string") parent = o.parentSlug;
      } catch {
        // Broken JSON is reported by the per-draft schema check.
      }
      // content/ is scanned before drafts, so a merged draft overrides it.
      locations.set(slug, parent);
    }
  };
  const storyDirs = fs.existsSync(DRAFTS)
    ? fs.readdirSync(DRAFTS, { withFileTypes: true }).filter((e) => e.isDirectory())
    : [];
  for (const kind of KINDS) {
    addDir(path.join(ROOT, "content", kind), kind === "locations");
    for (const story of storyDirs) {
      addDir(path.join(DRAFTS, story.name, "merged", kind), kind === "locations");
    }
  }
  const stories = new Set(
    fs
      .readdirSync(path.join(ROOT, "content", "stories"))
      .map((f) => f.replace(/\.json$/, "")),
  );
  return { locations, stories };
}

/** Schema + slug-reference check of one draft, mirroring scripts/check-drafts.mts. */
export function validateDraft(
  kind: Kind,
  slug: string,
  raw: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  const { _draft, ...entity } = raw;
  void _draft;

  const result = SCHEMAS[kind].safeParse(entity);
  if (!result.success) {
    errors.push(...z.prettifyError(result.error).split("\n"));
    return errors;
  }
  if (result.data.slug !== slug) {
    errors.push(`slug "${result.data.slug}" does not match file name "${slug}"`);
  }

  const known = knownSlugs();
  for (const s of (entity.appearsIn as string[]) ?? []) {
    if (!known.stories.has(s)) errors.push(`appearsIn → unknown slug "${s}"`);
  }

  // A location reference is the target's own bare slug, mirroring
  // src/shared/lib/content.ts: the composite `parentSlug/slug` id is retired
  // (ADR-0007), and a leftover one is named rather than quietly accepted.
  const locationRefError = (ref: string): string | null => {
    if (ref.includes("/")) {
      const slug = ref.slice(ref.lastIndexOf("/") + 1);
      return `"${ref}" is a retired composite id — use "${slug}" (ADR-0007)`;
    }
    return known.locations.has(ref) ? null : `unknown location "${ref}"`;
  };
  for (const field of ["connectedTo", "locations"] as const) {
    for (const ref of (entity[field] as string[]) ?? []) {
      const msg = locationRefError(ref);
      if (msg) errors.push(`${field} → ${msg}`);
    }
  }

  // Containment invariants: parent resolves, no self-parent, depth ≤ 2.
  if (kind === "locations" && typeof entity.parentSlug === "string") {
    const p = entity.parentSlug;
    if (p === result.data.slug) errors.push("parentSlug points at itself");
    else if (!known.locations.has(p)) errors.push(`parentSlug → unknown location "${p}"`);
    else if (known.locations.get(p))
      errors.push(`parentSlug "${p}" is itself a sub-location — nesting is two levels only`);
  }
  return errors;
}

function logPath(story: string): string {
  return path.join(DRAFTS, story, "review-log.json");
}

export function readLog(story: string): ReviewLog {
  try {
    return JSON.parse(fs.readFileSync(logPath(story), "utf8"));
  } catch {
    return { decisions: {} };
  }
}

export function updateLog(
  story: string,
  key: string,
  patch: Partial<Decision> | null,
) {
  const log = readLog(story);
  if (patch === null) {
    delete log.decisions[key];
  } else {
    log.decisions[key] = {
      ...log.decisions[key],
      ...patch,
      at: new Date().toISOString(),
    };
  }
  fs.writeFileSync(logPath(story), JSON.stringify(log, null, 2) + "\n");
}

interface DupRec {
  slug: string;
  name: string;
  nameKey: string;
  givens: string[];
  surname: string;
  paras: Set<number>;
  nSources: number;
}

// Honorifics/titles are not given names — dropping them keeps "Old Whateley"
// and "Old Zebulon Whateley" from matching on the shared word "Old", and marks
// a title-only reference ("Mrs. Frye") by leaving it with no given token.
const TITLES = new Set([
  "mr", "mrs", "ms", "miss", "mister", "dr", "doctor", "old", "ol", "young",
  "poor", "sir", "professor", "prof", "captain", "capt", "rev", "reverend",
  "squire", "aunt", "uncle", "goodwife", "goodman", "widow",
]);

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
}

/** How many given-name tokens (surname and honorifics excluded) a name carries
    — a proxy for name completeness when picking a merge survivor. */
export function givenNameCount(name: string): number {
  const toks = nameTokens(name);
  return toks.slice(0, -1).filter((t) => !TITLES.has(t)).length;
}

function dupRec(slug: string, raw: string): DupRec | null {
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(raw);
  } catch {
    return null;
  }
  const name = typeof o.name === "string" ? o.name : slug;
  const toks = nameTokens(name);
  const sources = Array.isArray(o.sources) ? (o.sources as SourceLike[]) : [];
  const paras = new Set<number>();
  for (const s of sources) if (typeof s.paragraph === "number") paras.add(s.paragraph);
  return {
    slug,
    name,
    nameKey: toks.join(" "),
    surname: toks.length ? toks[toks.length - 1] : "",
    // Given names = tokens before the surname, minus honorifics.
    givens: toks.slice(0, -1).filter((t) => !TITLES.has(t)),
    paras,
    nSources: sources.length,
  };
}

type DupKind = "name" | "nickname" | "title" | null;

/**
 * How, if at all, do two same-kind drafts look like the same entity? A
 * deliberately loose suspicion for the human to confirm, not an auto-merge —
 * tuned to catch the common fragmentation without flagging distinct
 * same-surname locals:
 *  - "name": identical name ("Curtis Whateley" twice);
 *  - "nickname": shared surname + a nickname/prefix given ("Zeb" ⊂ "Zebulon");
 *  - "title": a title-only reference ("Mrs. Frye") sharing a surname and one
 *    scene with a named person ("Selina Frye", ¶74).
 */
function duplicateKind(a: DupRec, b: DupRec): DupKind {
  if (a.slug === b.slug) return null;
  if (a.nameKey && a.nameKey === b.nameKey) return "name";
  const sharedSurname = a.surname.length >= 3 && a.surname === b.surname;
  if (!sharedSurname) return null;
  for (const ga of a.givens) {
    for (const gb of b.givens) {
      if (ga.length >= 3 && gb.length >= 3 && (ga.startsWith(gb) || gb.startsWith(ga)))
        return "nickname";
    }
  }
  if (
    a.nSources <= 2 &&
    b.nSources <= 2 &&
    (a.givens.length === 0 || b.givens.length === 0)
  ) {
    for (const p of a.paras) if (b.paras.has(p)) return "title";
  }
  return null;
}

/** Attach duplicate suspects to each draft, comparing within the same kind. */
function tagDuplicates(drafts: Draft[]): void {
  const recs = drafts.map((d) => ({ d, rec: dupRec(d.slug, d.raw) }));
  for (const { d, rec } of recs) {
    if (!rec) continue;
    const dups: { slug: string; name: string }[] = [];
    for (const o of recs) {
      if (!o.rec || o.d.kind !== d.kind || o.d.slug === d.slug) continue;
      const k = duplicateKind(rec, o.rec);
      if (!k) continue;
      // "title" is one-directional: only the title-only reference itself
      // ("Mrs. Frye") lists its named candidates, so a distinct named person in
      // the same scene ("Elmer Frye") is never flagged as a duplicate itself.
      if (k === "title" && rec.givens.length > 0) continue;
      dups.push({ slug: o.d.slug, name: o.rec.name });
    }
    if (dups.length) d.duplicateOf = dups;
  }
}

export function buildReviewState(): ReviewState {
  const texts = loadSearchables();

  const stories: StoryState[] = [];
  if (fs.existsSync(DRAFTS)) {
    for (const entry of fs.readdirSync(DRAFTS, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const story = entry.name;

      const drafts: Draft[] = [];
      for (const kind of KINDS) {
        const dir = path.join(DRAFTS, story, "merged", kind);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
          const raw = fs.readFileSync(path.join(dir, f), "utf8");
          let quotes: QuoteCheck[] = [];
          let parentSlug: string | undefined;
          try {
            const parsed = JSON.parse(raw);
            quotes = checkQuotes(parsed, texts);
            if (typeof parsed.parentSlug === "string") parentSlug = parsed.parentSlug;
          } catch {
            // Broken JSON still gets listed — the UI shows the parse failure.
          }
          drafts.push({ kind, slug: f.replace(/\.json$/, ""), raw, quotes, parentSlug });
        }
      }

      const junk: Junked[] = [];
      const junkDir = path.join(DRAFTS, story, "junk");
      if (fs.existsSync(junkDir)) {
        for (const f of fs.readdirSync(junkDir).filter((x) => x.endsWith(".json")).sort()) {
          junk.push({
            slug: f.replace(/\.json$/, ""),
            raw: fs.readFileSync(path.join(junkDir, f), "utf8"),
          });
        }
      }

      if (drafts.length > 0 || junk.length > 0) {
        tagDuplicates(drafts);
        stories.push({ story, drafts, junk, log: readLog(story) });
      }
    }
  }

  const curation: CurationEntity[] = [];
  for (const kind of KINDS) {
    const dir = path.join(ROOT, "content", kind);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const entity = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      curation.push({
        kind,
        slug: entity.slug as string,
        name: entity.name as string,
        prominence: (entity.prominence ?? "major") as "major" | "minor",
        appearsIn: (entity.appearsIn ?? []) as string[],
      });
    }
  }

  return { stories, curation, hasNormalized: texts.size > 0 };
}
