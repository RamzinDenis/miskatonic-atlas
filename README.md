# Miskatonic Atlas

An atlas of H. P. Lovecraft's world — locations, characters and creatures extracted from the stories by an LLM pipeline with manual review, every fact traced to its quote in the text. A vertical-slice MVP built on a single story, *The Call of Cthulhu* (1928).

Working title. See `PLAN.md` for the MVP plan and `docs/tech-spec.md` for the full product spec.

## Stack

- Next.js (App Router, full SSG) + TypeScript strict + Tailwind
- Content as code: `content/*.json` validated with Zod at build time; broken slug references fail the build
- All data access goes through `src/shared/lib/content.ts`
- Extraction playbooks in `prompts/` executed in Claude Code sessions (see `docs/adr/0001`)

## Development

```bash
npm install
npm run dev
```

## Public domain status of the texts

The code in this repository is MIT-licensed (see `LICENSE`). The story texts this atlas is built from appear here only as short quotations in `content/`, and are in the public domain:

- **European Union:** H. P. Lovecraft died in 1937; the life + 70 years term expired in 2008. All his works are in the public domain in the EU.
- **United States:** works published before 1930 are in the public domain under the 95-year rule. This project deliberately uses only stories published through 1929:

| Story | First publication |
|---|---|
| Dagon | 1919 |
| The Nameless City | 1921 |
| The Festival | 1925 |
| The Colour Out of Space | 1927 |
| The Call of Cthulhu | 1928 |
| The Dunwich Horror | 1929 |

Later works (*At the Mountains of Madness*, *The Shadow over Innsmouth*, posthumous publications) are intentionally excluded.

Source texts: [Project Gutenberg](https://www.gutenberg.org/).

## Basemap

The world map (`public/maps/world.jpg`) is Colton's *Map of the World on Mercator's Projection* (1852 pocket-map issue), scanned by Geographicus and released into the public domain via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1852_Colton%27s_Map_of_the_World_on_Mercator%27s_Projection_(_Pocket_Map_)_-_Geographicus_-_World-colton-1852.jpg), downscaled to 4096 px. Location markers are stored as pixel coordinates of that image; the degree-grid calibration used to place them from coordinates given in the stories is documented in `src/widgets/world-map/geometry.ts`.
