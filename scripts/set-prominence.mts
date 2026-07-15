import fs from "node:fs";
import path from "node:path";

/**
 * Applies the curation decisions of Phase 3 (see PLAN.md): stamps
 * `prominence: "minor"` into the entities listed below. Everything else stays
 * major via the schema default, so majors get no extra field and no diff.
 * Idempotent; run `npm run validate` after.
 *
 * The list is the editorial decision made in chat on 2026-07-15 — extraction
 * never sets prominence (see CONTEXT.md).
 */

const MINOR: Record<string, string[]> = {
  locations: [
    "arabia",
    "black-haunted-woods",
    "california",
    "callao",
    "cape-verde-islands",
    "china",
    "fleur-de-lys-building",
    "grassy-island",
    "haiti",
    "iceland",
    "india",
    "ireland",
    "london",
    "louisiana",
    "museum-at-hyde-park",
    "new-england",
    "new-york",
    "norway",
    "pacific",
    "paris",
    "paterson",
    "philippines",
    "san-francisco",
    "south-america",
    "tulane-university",
    "valparaiso",
  ],
  characters: [
    "angstrom",
    "ardois-bonnot",
    "capt-collins",
    "donovan",
    "dr-tobey",
    "first-mate-green",
    "guerrera",
    "hawkins",
    "joseph-d-galvez",
    "parker",
    "rodriguez",
    "william-briden",
  ],
  creatures: [
    "bat-winged-devils",
    "black-spirits-of-earth",
    "black-winged-ones",
    "tornasuk",
    "white-polypous-thing",
  ],
};

let stamped = 0;
for (const [kind, slugs] of Object.entries(MINOR)) {
  const dir = path.join(process.cwd(), "content", kind);
  for (const slug of slugs) {
    const file = path.join(dir, `${slug}.json`);
    if (!fs.existsSync(file)) {
      console.error(`MISSING: content/${kind}/${slug}.json`);
      process.exitCode = 1;
      continue;
    }
    const entity = JSON.parse(fs.readFileSync(file, "utf8"));
    // Rebuild with prominence right before `summary`, matching schema order.
    const updated: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entity)) {
      if (key === "prominence") continue;
      if (key === "summary") updated.prominence = "minor";
      updated[key] = value;
    }
    fs.writeFileSync(file, JSON.stringify(updated, null, 2) + "\n");
    stamped++;
    console.log(`content/${kind}/${slug}.json → minor`);
  }
}
console.log(`\n${stamped} entities marked minor`);
