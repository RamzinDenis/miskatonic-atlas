/**
 * Engraved marks of the voyage tracks, shared by the live chart (leaflet
 * divIcons) and the story-page inset (plain SVG). The vessels are raster
 * engravings in the manner of the scan's own ships (sources:
 * public/plates/ship-*.png, alpha masks built by
 * scripts/build-monster-masks.mjs), bow to the right — the bow, smoke and
 * wake are what tell the direction of travel. The live chart paints a mask
 * via CSS mask-image in currentColor, so a vessel re-inks with its track
 * (and vermilion when chosen); the inset tints the same mask with an
 * feFlood filter. INK_ROUGH_FILTER stays: the pin vignettes still print
 * through it.
 */

/* Every consumer mounts these defs into its own svg: leaflet marks are html
   strings, so no single shared <defs> element is guaranteed to exist. */
export const INK_ROUGH_FILTER = `<filter id="atlas-ink-rough" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1"/></filter>`;

/**
 * The story tells the vessels apart at a glance: two-masted schooner under
 * sail, sleek steam yacht, the same yacht dead in the water with a list,
 * working freighter.
 */
export type ShipKind = "schooner" | "steam-yacht" | "derelict" | "freighter";

/**
 * Display size of a vessel on the live chart, screen px. Keep each aspect
 * in step with its mask's (the build script prints them on rebuild).
 */
export const SHIP_ART: Record<ShipKind, { w: number; h: number }> = {
  schooner: { w: 52, h: 28 },
  "steam-yacht": { w: 50, h: 21 },
  derelict: { w: 48, h: 22 },
  freighter: { w: 52, h: 18 },
};

/** The vessel's alpha mask, painted in its track's ink wherever it sails. */
export function shipMaskUrl(kind: ShipKind): string {
  return `/maps/ships/${kind}.png`;
}
