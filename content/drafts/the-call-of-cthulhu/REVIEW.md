# Review — The Call of Cthulhu, first extraction run

Generated 2026-07-13 from `merged/`. This is the M2 gate data:
mark a verdict for every entity, note start/end time of the review session.

**Verdicts:** `as-is` — accepted unchanged · `edited` — accepted after fixes · `junk` — discarded.
**Gate:** ≥70% of entities as-is or edited AND review time ≤ 3–4 h → scale the corpus; otherwise fix the playbooks first (PLAN.md).

**Flow per entity:** open `merged/<kind>s/<slug>.json` → check against quotes (all are pre-verified against the text: `npm run verify-quotes`) → fix fields if needed → delete the `_draft` block → move to `content/<kind>s/<slug>.json` → `npm run validate`. New locations get map coordinates via /admin/coords afterwards.

| Entity | Kind | Occurrences | needsReview | Verdict |
|---|---|---|---|---|
| Arabia | location | 1 |  | as-is |
| Auckland | location | 4 | 1 | as-is |
| the black haunted woods | location | 2 | 1 | as-is |
| Boston | location | 1 |  | as-is |
| California | location | 1 |  | as-is |
| Callao | location | 1 | 1 | edited |
| Cape Verde Islands | location | 1 |  | as-is |
| China | location | 1 | 1 | edited |
| Dunedin | location | 4 |  | as-is |
| Fleur-de-Lys Building | location | 3 |  | as-is |
| Gothenburg dock | location | 1 | 2 | junk |
| grassy island | location | 1 |  | as-is |
| Greenland | location | 1 | 1 | edited |
| Haiti | location | 1 |  | as-is |
| Iceland | location | 1 |  | as-is |
| India | location | 1 |  | as-is |
| Ireland | location | 1 |  | as-is |
| Irem | location | 1 |  | as-is |
| London | location | 3 |  | as-is |
| Louisiana | location | 2 |  | as-is |
| Museum at Hyde Park | location | 2 | 1 | edited |
| New England | location | 1 |  | as-is |
| New Orleans | location | 5 | 1 | as-is |
| New York | location | 1 |  | as-is |
| Norway | location | 1 | 1 | edited |
| Oslo | location | 6 | 1 | edited |
| the Pacific | location | 1 | 1 | edited |
| Paris | location | 1 |  | as-is |
| Paterson | location | 1 |  | as-is |
| the Philippines | location | 1 |  | as-is |
| Providence | location | 9 | 1 | as-is |
| R'lyeh | location | 11 | 2 | edited |
| San Francisco | location | 1 | 1 | edited |
| South America | location | 1 |  | as-is |
| St. Louis | location | 2 |  | as-is |
| swamp and lagoon country | location | 4 | 2 | as-is |
| Sydney | location | 10 | 1 | as-is |
| Tulane University | location | 1 | 1 | edited |
| Valparaiso | location | 2 |  | as-is |
| Abdul Alhazred | character | 1 |  | as-is |
| Angstrom | character | 1 | 1 | as-is |
| Ardois-Bonnot | character | 1 |  | as-is |
| Capt. Collins | character | 1 |  | as-is |
| Castro | character | 5 | 2 | as-is |
| Donovan | character | 1 | 1 | as-is |
| Dr. Tobey | character | 1 |  | as-is |
| First Mate Green | character | 1 |  | as-is |
| Francis Wayland Thurston | character | 11 | 2 | as-is |
| George Gammell Angell | character | 6 |  | as-is |
| Guerrera | character | 1 | 1 | as-is |
| Gustaf Johansen | character | 5 | 4 | edited |
| Hawkins | character | 1 | 2 | as-is |
| Henry Anthony Wilcox | character | 8 | 1 | as-is |
| John Raymond Legrasse | character | 8 | 1 | as-is |
| Joseph D. Galvez | character | 1 |  | as-is |
| Parker | character | 1 | 1 | as-is |
| Rodriguez | character | 1 | 1 | as-is |
| William Briden | character | 3 | 1 | as-is |
| William Channing Webb | character | 4 | 1 | as-is |
| bat-winged devils | creature | 1 | 1 | as-is |
| black spirits of earth | creature | 1 |  | as-is |
| Black-winged Ones | creature | 1 | 2 | as-is |
| Cthulhu | creature | 13 | 5 | edited |
| elder gods | creature | 1 | 1 | junk |
| Great Old Ones | creature | 4 | 2 | as-is |
| imps of Tartarus | creature | 1 | 1 | junk |
| tornasuk | creature | 1 | 1 | as-is |
| white polypous thing | creature | 1 |  | as-is |

Total: 68 entities.

## needsReview details

- **Auckland** (location) · `scope`: Folded West Street (Johansen's cottage — a single address fact; containment in Auckland implied by par. 90) into this city's description. — candidates: ["West Street"]
- **the black haunted woods** (location) · `type`: typeGuesses split evenly: region (w031-042) vs other (w041-052); kept region. — candidates: ["region","other"]
- **Callao** (location) · `description`: Second paragraph ('The Emma never made port...') is context from the chapter, not from this occurrence's facts; trim if too inferential. — candidates: []
- **China** (location) · `description`: Second paragraph's 'deeper lore... doctrine of the Great Old Ones' leans on the surrounding Castro narrative (relatedNames: 'the deathless Chinamen'), not on a China-specific fact; trim if too inferential. — candidates: []
- **Gothenburg dock** (location) · `connectedTo`: Likely lies within Oslo (the walk belongs to Johansen's residence there), but no occurrence places it; left unlinked and not folded. — candidates: ["oslo"]
- **Gothenburg dock** (location) · `description`: 'recounted by his widow... among the circumstances of the mate's sudden death' draws on the surrounding paragraph's context, not on this record's fact; trim if too inferential. — candidates: []
- **Greenland** (location) · `description`: The closing clause 'the counterpart of the idol taken in the Louisiana swamps' rests on the shared-chant fact recorded on the Louisiana occurrence (par. 30), not on a Greenland fact; trim if too inferential. — candidates: []
- **Museum at Hyde Park** (location) · `identity`: The Sydney Bulletin clipping (par. 74) names a 'Museum in College Street' professing bafflement over the same idol (folded into sydney); no occurrence says whether it is this museum. — candidates: ["Museum in College Street"]
- **New Orleans** (location) · `scope`: Folded Bienville St. into this city's description (only an address-containment fact). — candidates: ["Bienville St."]
- **Norway** (location) · `description`: 'points ahead to the Norwegian capital' and 'before the narrator had ever heard Johansen's name' are narrative framing beyond this record's single fact; trim if too inferential. The oslo link rests on Oslo's own fact 'Oslo is the Norwegian capital'. — candidates: []
- **Oslo** (location) · `scope`: Folded into this city's description: the Egeberg (wharves in its shadow; Johansen's old house by it — 3 occurrences) and the Old Town of King Harold Haardrada (Johansen's address; kept the name of Oslo alive) — both single-scene sub-locations. — candidates: ["Egeberg","Old Town of King Harold Haardrada"]
- **the Pacific** (location) · `connectedTo`: Possible link to rlyeh: Castro's Cyclopean island-stones of the Great Old Ones echo R'lyeh's Cyclopean masonry, and the existing R'lyeh entry places the risen city in the Pacific — but no occurrence asserts the connection. — candidates: ["rlyeh"]
- **Providence** (location) · `scope`: Folded into this city's description (each record carried only address/containment facts): Brown University, Williams Street, Thomas St., Rhode Island School of Design, Waterman Street, Thayer Street. The Fleur-de-Lys Building was kept as a separate entity. — candidates: ["Brown University","Williams Street","Thomas St.","Rhode Island School of Design","Waterman Street","Thayer Street"]
- **R'lyeh** (location) · `type`: Existing file says 'ruin'; the majority of window typeGuesses is 'city'. Kept the existing 'ruin'. — candidates: ["ruin","city"]
- **R'lyeh** (location) · `identity`: Merged on textual links rather than a flat statement of identity: Wilcox's dream 'Cyclopean city' (R'lyeh named in the same dreams, w011-022; 'As Wilcox would have said, the geometry of the place was all wrong', par. 104) and the vice-admiralty's 'small island' / 'unknown island' where six of the Emma's crew died (Johansen's landfall narrative, pars. 99-102). — candidates: ["Cyclopean city (Wilcox's dream city)","small island / unknown island (vice-admiralty account)"]
- **San Francisco** (location) · `description`: Second paragraph ('within a month he was in Dunedin') comes from the adjacent Dunedin occurrence (par. 89), not from this record's facts; trim if too inferential. — candidates: []
- **swamp and lagoon country** (location) · `scope`: Folded the 'squatter settlement' (single scene, containment-only facts) into this region's description. The w041-052 record named 'the swamp' was grouped here by name; its facts all describe the ritual site kept separately as grassy-island. — candidates: ["squatter settlement","the swamp (w041-052)"]
- **swamp and lagoon country** (location) · `name`: Windows saw 'swamp and lagoon country', 'wooded swamps south of New Orleans' and 'the swamp'; picked the form that names the whole region. — candidates: ["swamp and lagoon country","wooded swamps south of New Orleans"]
- **Sydney** (location) · `scope`: Folded into this city's description (containment-level facts already covered by the existing text): Darling Harbour, Sydney University, Museum in College Street, Circular Quay, Sydney Cove. The Museum at Hyde Park was kept as a separate entity — the records never say whether it is the same institution as the clipping's 'Museum in College Street'. — candidates: ["Darling Harbour","Sydney University","Museum in College Street","Circular Quay","Sydney Cove"]
- **Tulane University** (location) · `type`: Single window guessed 'other'; 'building' would match how the other universities were typed. No occurrence places it in New Orleans, so it was not folded there. — candidates: ["other","building"]
- **Angstrom** (character) · `locations`: His record places him at the flight from the risen island without naming it; rlyeh is taken from the same window's account of the city. — candidates: ["rlyeh","omit"]
- **Castro** (character) · `scope`: Folded "the deathless Chinamen" (w041-052, 1 occurrence): undying cult leaders in the mountains of China who appear in the records only through Castro's claims of having talked with them; no independent narrative role. — candidates: ["fold into castro","separate entity"]
- **Castro** (character) · `locations`: Castro places the cult's center at Irem in Arabia, but the records never place Castro himself there, so irem/arabia are not linked; china rests on his own claim of having talked with the cult's leaders in the mountains of China. — candidates: ["swamp-and-lagoon-country, china","add irem/arabia"]
- **Donovan** (character) · `locations`: His record places him at the carved door of the risen island without naming it; rlyeh is taken from the same window's account of the city. — candidates: ["rlyeh","omit"]
- **Francis Wayland Thurston** (character) · `identity`: Merged "The Narrator" (10 occurrences) with Francis Wayland Thurston: the records link them — the account is headed as found among the papers of the late Francis Wayland Thurston (paragraph 2), and that same record's sources are the narrator's first-person words claiming George Gammell Angell as "my grand-uncle" (paragraph 5), the relationship both name-groups share. — candidates: ["francis-wayland-thurston (merged)","keep The Narrator separate"]
- **Francis Wayland Thurston** (character) · `facts`: w031-042 records "He was present when Inspector Legrasse related his experience with the swamp worshipers", but elsewhere the records have him learn of the 1908 meeting only through his grand-uncle's manuscript; "telling a story to which I could see my uncle attached profound significance" reads as manuscript study, not attendance. — candidates: ["read the narrative in Professor Angell's manuscript","was present at the 1908 meeting"]
- **Guerrera** (character) · `locations`: His record places him at the flight from the risen island without naming it; rlyeh is taken from the same window's account of the city. — candidates: ["rlyeh","omit"]
- **Gustaf Johansen** (character) · `scope`: Folded "the widow" (w091-102, 1 occurrence): Johansen's wife, the sad-faced woman in black who reported his death and handed over the manuscript; the records give her no role outside the Johansen thread. — candidates: ["fold into gustaf-johansen","separate entity"]
- **Gustaf Johansen** (character) · `scope`: Folded "two Lascar sailors" (w091-102, 1 occurrence): they helped Johansen to his feet after the falling papers knocked him down — a single detail of his death scene. — candidates: ["fold into gustaf-johansen","separate entity"]
- **Gustaf Johansen** (character) · `scope`: Folded "swarthy cult-fiends" (w091-102, 1 occurrence): the Alert's crew, described only through Johansen's account; their attack, destruction, and the resulting ruthlessness charge are already covered by his own facts. — candidates: ["fold into gustaf-johansen","separate entity"]
- **Gustaf Johansen** (character) · `fate`: w071-082 records "Survived; found half-delirious aboard the derelict Alert and rescued on the 12th" while w091-102 and w111-117 record his death in Oslo after the return; read as successive stages of one account, so the final state is used. — candidates: ["dead (after return to Oslo)","survived (rescue-time snapshot)"]
- **Hawkins** (character) · `fate`: No fate is stated in his record; the same windows say six of the shore party never reached the ship and only Briden and Johansen regained the boat, which would place Hawkins among the lost, but no record states his death individually. — candidates: ["unstated","lost on the island (implied)"]
- **Hawkins** (character) · `locations`: His record places him at the opened depths of the risen island without naming it; rlyeh is taken from the same window's account of the city. — candidates: ["rlyeh","omit"]
- **Henry Anthony Wilcox** (character) · `scope`: Folded "a widely known architect" (w011-022, 1 occurrence) into this description: an unnamed dream case who went violently insane on the date of Wilcox's seizure and expired several months later; the records give him no narrative role beyond paralleling Wilcox's fever. — candidates: ["fold into henry-anthony-wilcox","separate entity"]
- **John Raymond Legrasse** (character) · `role`: typeGuesses split evenly across windows: witness (w001-012, w031-042, w051-062) vs other (w021-032, w041-052, w061-072), null elsewhere. Best guess witness — the records cast him as the teller of the 1908 narrative and a source the narrator later questions in person. — candidates: ["witness","other"]
- **Parker** (character) · `locations`: His record places him at the flight from the risen island without naming it; rlyeh is taken from the same window's account of the city. — candidates: ["rlyeh","omit"]
- **Rodriguez** (character) · `fate`: No fate is stated in his record; the same windows say six of the shore party never reached the ship and only Briden and Johansen regained the boat, which would place Rodriguez among the lost, but no record states his death individually. — candidates: ["unstated","lost on the island (implied)"]
- **William Briden** (character) · `locations`: His records place him at the stone door and the shore of the risen island without naming it; rlyeh is taken from the same windows' account of the city (w091-102/w101-112). — candidates: ["rlyeh","omit"]
- **William Channing Webb** (character) · `locations`: His chair was at Princeton University, but no princeton slug exists in the location registry; only st-louis, greenland, and iceland are linked. — candidates: ["omit princeton","add princeton to the registry"]
- **bat-winged devils** (creature) · `identity`: Possibly the same beings as the 'Black-winged Ones' the captured cultists blamed for the ritual killings (w041-052) — winged creatures of the same haunted region — but no record equates the two names; kept separate. — candidates: ["separate entity (current)","merge with black-winged-ones"]
- **Black-winged Ones** (creature) · `identity`: Possibly the same beings as the 'bat-winged devils' of the squatter legend (w031-042) — winged creatures of the same haunted region — but no record equates the two names; kept separate. — candidates: ["separate entity (current)","merge with bat-winged-devils"]
- **Black-winged Ones** (creature) · `locations`: The record says only 'the haunted wood' (their immemorial meeting-place); mapped to the registry slug black-haunted-woods. — candidates: ["black-haunted-woods"]
- **Cthulhu** (creature) · `classification`: typeGuesses disagree across windows: entity x5, great-old-one x3, deity x2 (3 null). Chose great-old-one: the carven idol of the Great Old Ones' cult 'was great Cthulhu', and the secret priests would take him from his tomb 'to revive His subjects'. — candidates: ["great-old-one","entity","deity"]
- **Cthulhu** (creature) · `identity`: Folded 'monster' (w001-012, the bas-relief figure) and 'the nameless monstrosity' (w011-022) in via a records chain, not a direct equation: Angell judged the delirium-thing 'identical with the nameless monstrosity Wilcox had sought to depict in his dream-sculpture' (para 15); character records state Wilcox made the bas-relief in a dream (paras 11-12); and 'a young sculptor had molded in his sleep the form of the dreaded Cthulhu' (para 87). No single record equates the bas-relief monster with Cthulhu by name. — candidates: ["fold into cthulhu (current)","separate entity nameless-monstrosity"]
- **Cthulhu** (creature) · `identity`: 'the Thing' (w091-102) folded in via the alias 'the Thing' carried by the w101-112 and w111-117 records and the shared Johansen/corpse-city context; that window alone never names it Cthulhu. — candidates: ["fold into cthulhu (current)","separate entity the-thing"]
- **Cthulhu** (creature) · `fate`: Records state both 'dead Cthulhu waits dreaming' and, after the sinking, 'Cthulhu still lives'; fate records the end-state of the narrative and treats the two as one condition, as the story's close does. — candidates: ["dead — waits dreaming in his house at R'lyeh","still lives — sunken once more in his chasm of stone, presumed trapped in his black abyss"]
- **Cthulhu** (creature) · `locations`: louisiana included on the strength of w021-032 relatedNames (his name in the Louisiana swamp-priests' chant) — a worship-site association, not an abode. — candidates: ["rlyeh","rlyeh + louisiana"]
- **elder gods** (creature) · `identity`: Figures of the dream-delirium after the storm of April 2nd; possibly a rhetorical flourish rather than distinct beings, and possibly the Great Old Ones under another epithet — no record links them to anything else. — candidates: ["separate entity (current)","fold into great-old-ones","junk (figurative)"]
- **Great Old Ones** (creature) · `classification`: typeGuesses split race x3 / great-old-one x1; kept race for the collective plural beings, reserving great-old-one for the individual (cthulhu). — candidates: ["race","great-old-one"]
- **Great Old Ones** (creature) · `identity`: The w041-052 alias 'Things' is near-identical to the singular 'the Thing' (folded into cthulhu); kept apart — the records use the plural for the race in Castro's account and the singular for the being Johansen met. — candidates: ["keep apart (current)","review overlap with cthulhu"]
- **imps of Tartarus** (creature) · `identity`: Figures of the dream-delirium after the storm of April 2nd; the epithet 'bat-winged' echoes the bat-winged devils of the swamp legend (w031-042), but no record connects them — possibly figurative rather than distinct beings. — candidates: ["separate entity (current)","junk (figurative)"]
- **tornasuk** (creature) · `identity`: Possibly the Eskimos' name for the being the chant names: per w021-032, the phrase chanted by the Eskimo wizards to their idol was the same chanted by the Louisiana swamp-priests — 'Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn' — and the idols are called 'kindred'. No record equates the tornasuk with Cthulhu, so kept separate. — candidates: ["separate entity (current)","fold into cthulhu"]

## Counters (fill after review)

- as-is: 53
- edited: 12
- junk: 3
- review time: ~1 h (hybrid: 52 needsReview items resolved in chat with assistant recommendations, applied in bulk; 2026-07-14 09:20–10:20)

## Later revisions

The counters above are the M2 gate record of 2026-07-14 and stay as they were.
Verdicts revised afterwards are listed here.

- **2026-07-20 — bat-winged devils (creature): as-is → junk.** The gate had kept
  them apart from the Black-winged Ones on the `identity` item above (no record
  equates the two names). Revisited while drawing the bestiary: the editor
  judged the two names one and the same being, and the atlas keeps the one the
  cultists testified to. Draft moved to `junk/`; 6 creatures remain.
