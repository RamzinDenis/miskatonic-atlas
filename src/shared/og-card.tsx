import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The engraved title-card every route shares for link previews: dark binding,
 * a parchment panel in the palette of globals.css, Old Standard lettering.
 * Rendered by the opengraph-image routes at build time (the whole site is
 * static), so the fonts are read from assets/ — build inputs, like the map
 * sources, never deployed.
 *
 * Satori, not a browser, draws this JSX: flex layout only, explicit sizes,
 * no CSS variables — the colors are the literal values of the site's paper
 * theme (globals.css :root).
 */

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_CONTENT_TYPE = "image/png";

const INK = "#211906";
const MUTED = "#6b5e42";
const ACCENT = "#75371a";
const PAPER = "#e9dcbf";
const PAPER_LINE = "#b39d6e";
const BINDING = "#14100a";

function font(file: string) {
  return readFile(join(process.cwd(), "assets", "fonts", file));
}

export async function ogCard({
  overline,
  title,
  italic,
}: {
  /** Small caps above the title: the section the page belongs to. */
  overline: string;
  title: string;
  /** One italic line under the title: type, binomial, year — the caption. */
  italic?: string;
}): Promise<ImageResponse> {
  const [bold, italicData] = await Promise.all([
    font("OldStandard-Bold.ttf"),
    font("OldStandard-Italic.ttf"),
  ]);

  // A long name drops to a smaller cut so it still sits on two lines at most.
  const titleSize = title.length > 26 ? 64 : 88;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BINDING,
          padding: 28,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: PAPER,
            backgroundImage:
              "radial-gradient(ellipse at 18% -2%, rgba(255, 250, 230, 0.45), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(112, 82, 40, 0.16), transparent 55%)",
            border: `1px solid ${PAPER_LINE}`,
            padding: "48px 72px",
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: ACCENT,
            }}
          >
            {overline}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: titleSize,
              fontWeight: 700,
              color: INK,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          {italic && (
            <div
              style={{
                marginTop: 24,
                fontSize: 34,
                fontStyle: "italic",
                color: MUTED,
                textAlign: "center",
              }}
            >
              {italic}
            </div>
          )}
          <div
            style={{
              marginTop: 40,
              width: 140,
              borderTop: `1px solid ${PAPER_LINE}`,
            }}
          />
          <div
            style={{
              marginTop: 24,
              fontSize: 24,
              fontStyle: "italic",
              color: MUTED,
            }}
          >
            Every fact traced to its quote in the stories
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Old Standard", data: bold, weight: 700, style: "normal" },
        { name: "Old Standard", data: italicData, weight: 400, style: "italic" },
      ],
    },
  );
}

/** First letter up, as the site's `.cap-first` does for lowercase names. */
export function capFirst(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
