/**
 * Engraved marks of the voyage tracks, shared by the live chart (leaflet
 * divIcons) and the story-page inset (plain SVG): vessel silhouettes by kind
 * and the ✕ of an observed fix. Everything is drawn in currentColor so the
 * widget re-inks a mark in its track's ink (or the vermilion reprint), and
 * roughened by the same turbulence filter the pin vignettes use, so the
 * vector edge sits in the etched scan instead of floating over it.
 */

/* Every consumer mounts these defs into its own svg: leaflet marks are html
   strings, so no single shared <defs> element is guaranteed to exist. */
export const INK_ROUGH_FILTER = `<filter id="atlas-ink-rough" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1"/></filter>`;

/**
 * The vessels of the voyage, drawn the way this scan draws its own ships:
 * bold little engravings, bow to the right, waterline near y=16. The bow
 * itself tells the direction of travel — a raked clipper stem and bowsprit
 * reach forward, smoke and the wake stream astern — so the tracks need no
 * arrows. The story tells the vessels apart at a glance: two-masted
 * schooner, sleek steam yacht, the same yacht dead in the water, working
 * freighter.
 */
export type ShipKind = "schooner" | "steam-yacht" | "derelict" | "freighter";

export const SHIP_VIEWBOX = "0 0 40 24";

export const SHIP_GLYPHS: Record<ShipKind, string> = {
  schooner: `<g filter="url(#atlas-ink-rough)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16 L33 16 L29 20.5 L8.5 20.5 Q6 18.5 6 16 Z" fill="currentColor" stroke="none"/><path d="M33 16 L39 13.5" fill="none"/><path d="M13 16 L12.2 3.5 M24 16 L23.4 5" fill="none"/><path d="M12.2 4.5 L12.7 14.5 L4.5 14.5 L6.8 7 Z" fill="currentColor" stroke="none"/><path d="M23.4 6 L23.9 14.5 L16 14.5 L17.8 8.5 Z" fill="currentColor" stroke="none"/><path d="M23.8 6 L38 13.8 L25.5 14.5 Z" fill="currentColor" stroke="none"/><path d="M1 17.5 h3.5 M2 19.5 h2.5" fill="none" stroke-width="1.2" opacity="0.8"/></g>`,
  "steam-yacht": `<g filter="url(#atlas-ink-rough)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16 L34 15 L30.5 20 L8.5 20.5 Q5.5 18.5 4 16 Z" fill="currentColor" stroke="none"/><path d="M34 15 L38.5 13" fill="none"/><path d="M20 9 L23 9 L22.4 15 L19.4 15 Z" fill="currentColor" stroke="none"/><path d="M20.5 8 Q17.5 5.5 13.5 5.8 Q11.5 6 10 5.2" fill="none" opacity="0.75"/><path d="M28 15 L27 6.5 M11.5 16 L10.8 8" fill="none"/><path d="M1 17.5 h3 M1.8 19.5 h2.2" fill="none" stroke-width="1.2" opacity="0.8"/></g>`,
  derelict: `<g filter="url(#atlas-ink-rough)"><g transform="rotate(9 20 17)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17 L35 16 L31.5 21 L9.5 21.5 Q6.5 19.5 5 17 Z" fill="currentColor" stroke="none"/><path d="M21 11 L24 11 L23.4 16 L20.4 16 Z" fill="currentColor" stroke="none"/><path d="M12.5 17 L11.5 9" fill="none"/><path d="M29 16 L29.8 10.5 M29.8 10.5 L33 12.5" fill="none"/></g><path d="M3 18.5 q3 -2.5 6 0 M29.5 19 q3 -2.5 6 0" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></g>`,
  freighter: `<g filter="url(#atlas-ink-rough)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15.5 L35 15.5 L31 20.5 L5.5 20.5 Z" fill="currentColor" stroke="none"/><path d="M35 15.5 L37.5 12.5" fill="none" stroke-width="1.3"/><path d="M12 11 L19.5 11 L19.5 15.5 L12 15.5 Z" fill="currentColor" stroke="none"/><path d="M14.5 7 L17.3 7 L16.9 11 L14.1 11 Z" fill="currentColor" stroke="none"/><path d="M15 6 Q12 3.5 8.5 4 Q7 4.2 5.5 3.5" fill="none" opacity="0.75"/><path d="M26 15.5 L25.6 5.5 M8.5 15.5 L8.1 7" fill="none"/><path d="M25.8 8 L30.5 13 M8.3 9.5 L12 13" fill="none" stroke-width="1.1"/><path d="M0.5 17 h3 M1.2 19 h2.3" fill="none" stroke-width="1.2" opacity="0.8"/></g>`,
};
