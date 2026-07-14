# Extraction playbook

LLM step of the pipeline (ADR-0001): pulls entity *occurrences* out of one story,
window by window. Executor-agnostic — today the windows are run by agents in a
Claude Code session, post-MVP by `scripts/extract.ts` over the Anthropic SDK with
this same prompt. Merging occurrences into entities is a separate step
(`prompts/merge.md`); this step never deduplicates across windows.

## Input

`corpus/normalized/<storySlug>.json` — numbered paragraphs with chapter map
(produced by `npm run normalize`).

## Windowing

- Window size **12 paragraphs**, overlap **2** (window k covers paragraphs
  `1+10(k-1) … 12+10(k-1)`, last window clipped to the end).
- Each window is processed in an **isolated context**: the executor sees only
  the window's paragraphs, never the rest of the story, never other windows'
  output. This keeps "only what is in the passage" honest and windows
  independently re-runnable.

## Output

One file per window: `content/drafts/<storySlug>/windows/w<START>-<END>.json`
(three-digit numbers, e.g. `w001-012.json`) containing an **array of occurrence
records**:

```json
{
  "kind": "location | character | creature",
  "name": "name exactly as written in the passage",
  "aliases": ["other spellings/titles used for the same referent in THIS passage"],
  "facts": [
    "one atomic factual claim per entry, stated in the passage",
    "each fact must be traceable to one of the quotes below"
  ],
  "typeGuess": "location: city|town|building|region|ruin|sea|other · character: protagonist|witness|cultist|scholar|other · creature: great-old-one|deity|race|entity — or null if the passage gives no basis",
  "realWorld": "real-world identification if the passage itself makes it (locations only), else omit",
  "fate": "the entity's fate if stated in the passage (characters/creatures), else omit",
  "relatedNames": ["names of other extracted entities this one is explicitly linked to in the passage"],
  "sources": [
    {
      "storySlug": "<storySlug>",
      "paragraph": 42,
      "quote": "verbatim substring of the paragraph, ≤600 characters",
      "context": "Chapter 2, The Tale of Inspector Legrasse"
    }
  ]
}
```

## Rules

1. **Extract only what is explicitly in the passage. No outside mythos
   knowledge.** If the passage doesn't say it, it doesn't exist — no filling in
   from other Lovecraft stories, criticism, games, or general lore.
2. Entity kinds: **locations, characters, creatures** only. Events are out of
   scope (post-MVP). Objects, books, ships, organizations are not extracted as
   entities (they may appear inside `facts` of a related entity).
3. Every occurrence needs **at least one source**: `quote` copied **verbatim**
   from the window text (it is checked by exact search — `npm run
   verify-quotes`), plus the **paragraph number** and a `context` of the form
   `"Chapter <n>, <chapter title>"` (omit chapter for front-matter paragraphs).
   Prefer 1–3 sentences, hard limit 600 characters.
4. **Names as written** in the passage, with original spelling and diacritics;
   variants used in the same passage go to `aliases`, not into the name.
5. `facts` are atomic, neutral restatements — no interpretation, no synthesis
   across paragraphs of what the text keeps separate.
6. A location mentioned only as an address or in passing still counts if it is
   a *place in the story world* (a city, a building…). Purely rhetorical or
   generic places ("the sea", "cities of men") do not.
7. The first-person **narrator** is extracted only from passages that state
   facts about him (identity, relatives, actions, movements) — not merely
   because first-person voice is present. Use `"name": "The Narrator"` unless
   the passage itself names him.
8. Authors of quoted epigraphs and cited real-world writers are **not** story
   entities.
9. When the passage genuinely contains no extractable entity, the window file
   is an empty array `[]` — that is a valid result, not a failure.

## Run

1. `npm run normalize` (refresh corpus).
2. For each window: executor gets this playbook's Rules + Output sections and
   the window paragraphs rendered as `¶<n> [Chapter <c>]: <text>`; it writes
   the window file.
3. After all windows: `npm run verify-quotes` — every quote must be found;
   fix or drop occurrences whose quotes fail, then proceed to
   `prompts/merge.md`.
