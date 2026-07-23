# Merge playbook

LLM step of the pipeline (ADR-0001): folds window occurrence records
(`content/drafts/<storySlug>/windows/*.json`, produced by `prompts/extract.md`)
into one draft entity per referent, ready for human review. Unlike extraction,
the merger sees **all** windows at once — but still no outside mythos knowledge.

## Identity — when are two occurrences the same entity?

Group by name + aliases, case-insensitively, ignoring articles and honorifics
("the Alert" = "Alert", "Professor Angell" = "Angell" = "George Gammell Angell").
Merge two groups only when the **records themselves** link them — a shared
alias, a fact or quote equating the names. Never merge on world knowledge: if
no window says X is Y, X and Y stay separate entities and the doubt goes to
`needsReview`.

**Generic titles are not names.** An unnamed narrator, captain, professor and
the like is a different person in every story: a generic title matches an
existing entity or another group only within the same story, never across
stories. Slug and name carry the story as disambiguation:
`the-narrator-of-<storySlug>`, `"The Narrator (<Story Title>)"`.

Occurrences whose names match an **existing** `content/` entity's name or slug
enrich that entity: the merged draft starts from the existing JSON and adds new
facts and sources (this is how the M0 hand-made locations get enriched).

## Parts & allusions — when a location folds into its parent

Identity is not the only gate: a referent that IS its own place may still not
deserve its own article. A location stays a **separate entity** only if at
least one holds:

- it matches an existing `content/` entity (enrichment case above);
- the records place it in more than one story of the corpus;
- it is a destination in its own right — a set-piece that could carry a map
  pin or an engraving (the Cyclopean Monolith, not the valley around it).

Everything else **folds into its nearest parent** — the location that contains
it (a temple inside a city) or, for passing allusions, the place the text
anchors them to (a city inside a named land). Folding means:

- the part's facts join the parent's `_draft.facts`; its strongest 1–2 quotes
  join the parent's `sources`;
- if the part has enough substance (2+ facts of its own), it becomes a titled
  section inside the parent's `description`: a paragraph `## <Part name>`
  followed by its synthesized prose (the site renders `## ` as a subheading);
  thinner allusions are woven into the parent's prose without a heading;
- the part gets no file of its own and no slug — links in `connectedTo` /
  `locations` point to the parent.

## Output

One file per entity:
`content/drafts/<storySlug>/merged/{locations,characters,creatures}/<slug>.json`.

Shape: the **final schema** of the corresponding collection
(`src/shared/schemas.ts` — LocationSchema / CharacterSchema / CreatureSchema),
plus a `_draft` block with the merge metadata. Review edits the file in place,
then moves it into `content/<collection>/<slug>.json` after deleting `_draft`
(schema fields only; `paragraph` keys inside `sources` may stay — Zod strips
unknown keys at read time).

```json
{
  "slug": "kebab-case of the canonical name",
  "name": "canonical name — the fullest form any window saw",
  "...": "all fields the schema requires, filled per the rules below",
  "sources": [{ "storySlug": "…", "quote": "…", "context": "…", "paragraph": 42 }],
  "_draft": {
    "aliases": ["every variant seen across windows"],
    "occurrences": 4,
    "windows": ["w001-012", "w031-042"],
    "facts": ["union of all facts, deduplicated, each still atomic"],
    "needsReview": [
      { "field": "type", "reason": "windows disagree: ruin vs city", "candidates": ["ruin", "city"] }
    ]
  }
}
```

## Field rules

- **slug** — kebab-case, apostrophes dropped (`R'lyeh` → `rlyeh`); must equal
  the file name.
- **type / role / classification** — majority of non-null `typeGuess`es; any
  disagreement or all-null → best guess + `needsReview` entry.
- **summary** (1–2 sentences) and **description** (2–3 paragraphs, `\n\n`
  separated; a parent that absorbed parts may run longer, one `## ` section
  per absorbed part) — synthesized **only from the merged facts**, every claim
  traceable to a source quote. Match the register of the existing M0 files in
  `content/locations/` — encyclopedic, in-world, no editorializing.
- **sources** — the 2–3 strongest quotes covering the main claims, keep
  `paragraph`; drop duplicates covering the same claim. Quotes must already
  have passed `npm run verify-quotes`.
- **locations / connectedTo / appearsIn** — slugs only from this merged set or
  existing `content/`; anything else fails `npm run validate` integrity. A
  link belongs here only if some window's `relatedNames` or facts assert it.
- **fate / realWorld** — only if some occurrence stated it; conflicting
  statements → `needsReview`.
- **nameRu** — never filled (MVP is English-only).

## Review handoff

Also write `content/drafts/<storySlug>/REVIEW.md`: a checklist table — one row
per merged entity — with columns *entity (kind)*, *needsReview count*, and an
empty verdict column for the reviewer to mark `as-is` / `edited` / `junk`.
These verdicts are the M2 gate counters (target: ≥70% as-is + edited, review
time ≤ 3–4 h).

## Run

1. Precondition: `npm run verify-quotes` is green over the window files.
2. Merge, write per-entity drafts + `REVIEW.md`.
3. `npm run verify-quotes` again (merged files are also scanned).
4. Hand off to review; after review & move: `npm run validate`, then build.
