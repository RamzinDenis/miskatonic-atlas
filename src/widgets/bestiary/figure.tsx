"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { BestiaryArt } from "./registry";

/**
 * A live engraving: the beast's alpha mask printed in the current ink and
 * given the faintest stirrings — breath, a shiver of the impression, a head
 * that follows the reader (CONTEXT.md: «Бестиарий»). The plate is a drawing
 * on paper first and foremost; every effect stays inside a pixel or two, so
 * that a reader who never moves the pointer sees an ordinary engraving.
 *
 * Each moving layer owns its transform — they compose by nesting, never by
 * overwriting one another. Which effects a beast gets is written in the
 * register; the CSS lives in globals.css under «Bestiarium».
 */

export interface BestiaryFigureProps extends BestiaryArt {
  /**
   * Accessible name of the engraving. Omit where the beast's name stands
   * next to the figure — a second reading of it only clutters the page.
   */
  label?: string;
  className?: string;
}

export function BestiaryFigure({
  mask,
  aspect,
  effects,
  label,
  className = "",
}: BestiaryFigureProps) {
  const root = useRef<HTMLDivElement>(null);
  const gazes = effects.includes("gaze-tilt");

  useEffect(() => {
    const el = root.current;
    if (!el || !gazes) return;
    /* A gaze needs a pointer to follow, and a reader who asked for stillness
       is not to be followed at all. */
    if (
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let frame = 0;
    let gx = 0;
    let gy = 0;
    const paint = () => {
      frame = 0;
      el.style.setProperty("--gx", gx.toFixed(3));
      el.style.setProperty("--gy", gy.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      gx = clamp(((event.clientX - box.left) / box.width) * 2 - 1);
      gy = clamp(((event.clientY - box.top) / box.height) * 2 - 1);
      el.classList.remove("bestiary-figure--resting");
      schedule();
    };
    const onLeave = () => {
      gx = 0;
      gy = 0;
      /* Straighten up slowly instead of snapping back. */
      el.classList.add("bestiary-figure--resting");
      schedule();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [gazes]);

  /* The drawing's own box inside the square mount: sized off the long side,
     so the ink fills it exactly and the gaze turns about the beast's centre
     rather than the mount's. */
  const drawing: CSSProperties =
    aspect >= 1
      ? { height: "100%", aspectRatio: 1 / aspect }
      : { width: "100%", aspectRatio: 1 / aspect };

  return (
    <div
      ref={root}
      className={`bestiary-figure ${className}`}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <div className="bestiary-tilt" style={drawing}>
        <div
          className={`bestiary-body ${effects.includes("breath") ? "bestiary-fx-breath" : ""}`}
        >
          <div
            className={`bestiary-layer mask-ink ${
              effects.includes("ink-shiver") ? "bestiary-fx-shiver" : ""
            }`}
            style={{ "--ink-mask": `url('${mask}')` } as CSSProperties}
          />
          {effects.includes("vermilion-pulse") && (
            <div
              className="bestiary-layer bestiary-layer--vermilion mask-ink bestiary-fx-vermilion"
              style={{ "--ink-mask": `url('${mask}')` } as CSSProperties}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}
