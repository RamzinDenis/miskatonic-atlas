/**
 * Hand-coded SVG version of the Cthulhu plate, superseded by the raster
 * engraving in index.tsx. Kept unwired for comparison; delete once the
 * raster plate is settled. Drawn after The Call of Cthulhu, ch. 2, ¶26.
 */

const INK = "var(--background)";
const PAPER = "var(--foreground)";
const FOX = "var(--accent)";

/** Undecipherable characters on the pedestal, ¶26. */
const GLYPHS = [
  "M0 0 L3 8 M3 0 L0 8",
  "M0 4 Q3 -2 6 4 Q3 10 0 4",
  "M2 0 L2 8 M0 3 L5 1",
  "M0 8 C1 2 5 2 6 8 M3 4 L3 8",
  "M0 0 L5 0 L1 8",
  "M0 6 L6 6 M3 0 L3 8 M1 2 L5 2",
];

/** Facial feelers: root x on the face, tip x/y brushing the forepaws. */
const FEELERS: Array<[number, number, number]> = [
  [178, 150, 282],
  [190, 170, 290],
  [202, 190, 296],
  [214, 206, 298],
  [226, 232, 298],
  [238, 252, 296],
  [250, 272, 290],
  [262, 290, 282],
];

function feelerPath([rootX, endX, endY]: [number, number, number]): string {
  return (
    `M${rootX - 3.5} 222 C${rootX - 7} 248 ${endX - 6} ${endY - 22} ${endX - 2} ${endY} ` +
    `Q${endX} ${endY + 3} ${endX + 2} ${endY} ` +
    `C${endX + 4} ${endY - 22} ${rootX + 5} 246 ${rootX + 3.5} 222 Z`
  );
}

export function CthulhuPlateSvg() {
  return (
    <figure className="mt-8">
      <div className="mx-auto max-w-md border border-line bg-surface p-3 sm:p-4">
        <svg
          viewBox="0 0 440 560"
          role="img"
          aria-label="Engraved plate of the Cthulhu idol: a winged anthropoid monster with a tentacled head, crouching on a hieroglyphed pedestal"
          className="block h-auto w-full"
        >
          <defs>
            {/* Engraving textures */}
            <pattern id="pl-hatch" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M0 5 L5 0" stroke={INK} strokeWidth="0.6" opacity="0.45" />
            </pattern>
            <pattern id="pl-cross" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M0 5 L5 0 M0 0 L5 5" stroke={INK} strokeWidth="0.6" opacity="0.5" />
            </pattern>
            <pattern id="pl-scale" width="14" height="9" patternUnits="userSpaceOnUse">
              <path
                d="M0 9 A7 6 0 0 1 14 9 M-7 4.5 A7 6 0 0 1 7 4.5 M7 4.5 A7 6 0 0 1 21 4.5"
                stroke={INK}
                strokeWidth="0.7"
                fill="none"
                opacity="0.55"
              />
            </pattern>
            <pattern id="pl-stipple" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="0.7" fill={INK} opacity="0.4" />
              <circle cx="4.5" cy="4.5" r="0.6" fill={INK} opacity="0.35" />
            </pattern>
            <radialGradient id="pl-vignette" cx="50%" cy="45%" r="72%">
              <stop offset="0%" stopColor={INK} stopOpacity="0" />
              <stop offset="78%" stopColor={INK} stopOpacity="0" />
              <stop offset="100%" stopColor={INK} stopOpacity="0.2" />
            </radialGradient>

            {/* Left wing: long and narrow, tip touching the back edge of the block */}
            <path
              id="pl-wing"
              d="M176 254
                 C142 218 106 180 90 144
                 L84 130 L96 142
                 C76 208 94 306 138 400
                 C144 336 150 292 168 262
                 Z"
            />
            {/* Left hind leg: doubled up, knee elevated, shin dropping to the front edge */}
            <path
              id="pl-thigh"
              d="M206 392 C168 386 140 348 146 300
                 C149 278 168 274 176 296
                 C180 332 192 362 210 386 Z"
            />
            <path id="pl-shin" d="M146 304 C134 344 134 378 142 408 L164 412 C156 382 156 346 164 308 Z" />
            <path id="pl-foot" d="M128 410 C136 402 170 402 178 412 L174 421 L132 421 Z" />
            {/* Long curved hind claws gripping the front edge of the pedestal */}
            <path
              id="pl-hindclaws"
              d="M134 418 C127 434 129 442 137 449 C133 440 134 430 141 419 Z
                 M148 420 C142 436 144 444 152 450 C148 441 149 431 155 421 Z
                 M163 420 C158 435 160 442 167 447 C164 439 164 430 170 421 Z"
            />
            {/* Left forearm and huge forepaw clasping the elevated knee */}
            <path id="pl-arm" d="M198 254 C170 254 152 262 144 280 L158 296 C165 280 180 270 202 270 Z" />
            <path id="pl-paw" d="M132 288 C136 278 168 278 172 290 C170 300 138 302 132 288 Z" />
            <path
              id="pl-fingers"
              d="M138 298 C133 310 135 318 142 322 C138 314 139 306 144 299 Z
                 M150 300 C146 312 148 320 155 324 C151 316 152 307 157 301 Z
                 M162 300 C159 311 161 318 167 321 C164 314 165 306 169 301 Z"
            />
          </defs>

          {/* Aged paper */}
          <rect x="0" y="0" width="440" height="560" fill={PAPER} />
          <ellipse cx="70" cy="90" rx="26" ry="14" fill={FOX} opacity="0.1" />
          <ellipse cx="372" cy="470" rx="30" ry="18" fill={FOX} opacity="0.09" />
          <ellipse cx="350" cy="70" rx="12" ry="8" fill={FOX} opacity="0.12" />
          <ellipse cx="90" cy="480" rx="14" ry="9" fill={FOX} opacity="0.08" />
          <ellipse cx="220" cy="530" rx="40" ry="8" fill={FOX} opacity="0.05" />

          {/* Ground shadow and pedestal */}
          <ellipse cx="220" cy="492" rx="148" ry="10" fill="url(#pl-hatch)" />
          <g stroke={INK} strokeWidth="1.2">
            <polygon points="138,402 302,402 318,424 122,424" fill="url(#pl-stipple)" />
            <rect x="122" y="424" width="196" height="62" fill={PAPER} />
            <rect x="122" y="424" width="196" height="62" fill="url(#pl-stipple)" />
            <rect x="272" y="424" width="46" height="62" fill="url(#pl-cross)" stroke="none" />
            <rect x="122" y="424" width="196" height="7" fill="url(#pl-cross)" stroke="none" />
          </g>
          {/* Undecipherable characters, two rows */}
          <g stroke={INK} strokeWidth="0.9" fill="none" opacity="0.75">
            {GLYPHS.map((d, i) => (
              <path key={`ga${i}`} d={d} transform={`translate(${140 + i * 28} 438)`} />
            ))}
            {GLYPHS.map((d, i) => (
              <path key={`gb${i}`} d={d} transform={`translate(${154 + i * 28} 460)`} />
            ))}
          </g>

          {/* Wings (behind the body) */}
          <g stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
            <use href="#pl-wing" fill={PAPER} />
            <use href="#pl-wing" fill="url(#pl-hatch)" />
            <g transform="matrix(-1 0 0 1 440 0)">
              <use href="#pl-wing" fill={PAPER} />
              <use href="#pl-wing" fill="url(#pl-hatch)" />
            </g>
          </g>
          {/* Membrane folds */}
          <g stroke={INK} strokeWidth="0.7" fill="none" opacity="0.6">
            <path d="M98 158 C90 224 104 306 134 388" />
            <path d="M112 172 C106 230 118 300 142 370" />
            <path d="M342 158 C350 224 336 306 306 388" />
            <path d="M328 172 C334 230 322 300 298 370" />
          </g>

          {/* Seat shadow on the block */}
          <ellipse cx="220" cy="408" rx="72" ry="9" fill="url(#pl-cross)" />

          {/* Torso: bloated, scaly */}
          <ellipse cx="220" cy="322" rx="64" ry="82" fill={PAPER} stroke={INK} strokeWidth="1.5" />
          <ellipse cx="220" cy="322" rx="64" ry="82" fill="url(#pl-scale)" />
          <path
            d="M262 264 C286 294 288 352 258 396 C276 352 276 296 262 264 Z"
            fill="url(#pl-cross)"
          />
          {/* Belly, plainer and corpulent */}
          <ellipse cx="220" cy="346" rx="38" ry="46" fill={PAPER} stroke={INK} strokeWidth="0.9" />
          <g stroke={INK} strokeWidth="0.7" fill="none" opacity="0.65">
            <path d="M188 322 C206 332 234 332 252 322" />
            <path d="M184 348 C206 360 234 360 256 348" />
            <path d="M188 374 C206 384 234 384 252 374" />
          </g>

          {/* Hind legs, feet, claws */}
          <g stroke={INK} strokeWidth="1.3" strokeLinejoin="round">
            {(["", "matrix(-1 0 0 1 440 0)"] as const).map((t) => (
              <g key={t || "l"} transform={t || undefined}>
                <use href="#pl-thigh" fill={PAPER} />
                <use href="#pl-thigh" fill="url(#pl-hatch)" />
                <use href="#pl-shin" fill={PAPER} />
                <use href="#pl-foot" fill={PAPER} />
                <use href="#pl-hindclaws" fill={PAPER} strokeWidth="1" />
              </g>
            ))}
          </g>

          {/* Forearms and paws on the knees */}
          <g stroke={INK} strokeWidth="1.3" strokeLinejoin="round">
            {(["", "matrix(-1 0 0 1 440 0)"] as const).map((t) => (
              <g key={t || "l"} transform={t || undefined}>
                <use href="#pl-arm" fill={PAPER} />
                <use href="#pl-arm" fill="url(#pl-hatch)" />
                <use href="#pl-paw" fill={PAPER} />
                <use href="#pl-fingers" fill={PAPER} strokeWidth="1" />
              </g>
            ))}
          </g>

          {/* Cephalopod head, bent forward, no eyes — the face is a mass of feelers */}
          <g transform="translate(0 6)">
            <path
              d="M164 206 C156 146 182 114 220 112 C258 114 284 146 276 206
                 C276 220 266 230 252 234 L188 234 C174 230 164 220 164 206 Z"
              fill={PAPER}
              stroke={INK}
              strokeWidth="1.5"
            />
            {/* Wrapping contour lines give the dome its volume */}
            <g stroke={INK} strokeWidth="0.7" fill="none" opacity="0.55">
              <path d="M170 172 C186 160 254 160 270 172" />
              <path d="M166 196 C188 184 252 184 274 196" />
              <path d="M172 220 C192 210 248 210 268 220" />
              <path d="M196 118 C188 138 182 168 182 200" />
              <path d="M244 118 C252 138 258 168 258 200" />
            </g>
            <path
              d="M250 126 C274 148 280 190 268 216 C286 188 282 148 250 126 Z"
              fill="url(#pl-cross)"
            />
            {/* Shadow of the bent head on the chest */}
            <path d="M178 240 C198 256 242 256 262 240 C242 252 198 252 178 240 Z" fill="url(#pl-cross)" />

            {/* Facial feelers brushing the backs of the forepaws */}
            <g stroke={INK} strokeWidth="1" strokeLinejoin="round">
              {FEELERS.map((f, i) => (
                <g key={i}>
                  <path d={feelerPath(f)} fill={PAPER} />
                  {i % 2 === 0 && <path d={feelerPath(f)} fill="url(#pl-hatch)" opacity="0.7" />}
                </g>
              ))}
            </g>
          </g>

          {/* Plate furniture */}
          <rect x="0" y="0" width="440" height="560" fill="url(#pl-vignette)" />
          <rect x="14" y="14" width="412" height="532" fill="none" stroke={INK} strokeWidth="1.5" />
          <rect x="21" y="21" width="398" height="518" fill="none" stroke={INK} strokeWidth="0.6" />
          <text
            x="398"
            y="40"
            textAnchor="end"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontSize="11"
            fill={INK}
            fillOpacity="0.7"
          >
            Pl. I.
          </text>
          <text
            x="220"
            y="516"
            textAnchor="middle"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="12"
            letterSpacing="3"
            fill={INK}
            fillOpacity="0.8"
          >
            GREAT CTHULHU · THE LEGRASSE IDOL
          </text>
          <text
            x="220"
            y="532"
            textAnchor="middle"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontSize="8.5"
            fill={INK}
            fillOpacity="0.65"
          >
            drawn from the original seized in the Louisiana swamps, 1907
          </text>
        </svg>
      </div>
      <figcaption className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-muted">
        <span className="text-xs uppercase tracking-widest">Plate I</span> — The Cthulhu idol
        seized by Inspector Legrasse at the Louisiana swamp worship, drawn after the text:
        <span className="mt-2 block font-serif italic text-foreground/80">
          “It represented a monster of vaguely anthropoid outline, but with an octopuslike head
          whose face was a mass of feelers, a scaly, rubbery-looking body, prodigious claws on
          hind and fore feet, and long, narrow wings behind.”
        </span>
        <span className="mt-1 block text-xs">
          The Call of Cthulhu (1928) — Chapter 2, The Tale of Inspector Legrasse
        </span>
      </figcaption>
    </figure>
  );
}
