# Review — The Nameless City, extraction run

Generated 2026-07-23 by `npm run merge -- the-nameless-city` from `merged/`.
Mark a verdict for every entity in /admin/review (or by hand below); the verdicts are the gate counters.

**Verdicts:** `as-is` — accepted unchanged · `edited` — accepted after fixes · `junk` — discarded.
**Gate (as in M2):** ≥70% of entities as-is or edited → run the remaining stories; otherwise fix the prompts/scripts first (docs/plan-extract-sdk.md).

| Entity | Kind | Occurrences | needsReview | Verdict |
|---|---|---|---|---|
| the nameless city | location | 4 |  | edited in draft — absorbed the temple & the abyss as `##` sections; awaiting final verdict |
| Sarnath the Doomed | location | 1 |  | edited in draft — absorbed Mnar & Ib; awaiting final verdict |
| Ib | location | 1 |  | junk — folded into Sarnath the Doomed |
| Mnar | location | 1 |  | junk — folded into Sarnath the Doomed |
| Araby | location | 1 | 1 | |
| the temple | location | 2 |  | junk — folded into the nameless city (§ The Great Temple) |
| the abyss | location | 1 |  | junk — folded into the nameless city (§ The Abyss) |
| Irem | location | 1 |  | |

Folding follows the «Parts & allusions» rule added to `prompts/merge.md` (2026-07-23):
a location without cross-story presence or pin-worthy substance becomes a titled
section (or a woven-in mention) inside its parent article instead of a page of its own.
| The Narrator (The Nameless City) | character | 4 |  | split from the Dagon narrator (was merged by generic title; both needsReview resolved) — awaiting verdict |
| Abdul Alhazred | character | 2 |  | |
| The Crawling Reptiles of the Nameless City | creature | 3 | 1 | |
