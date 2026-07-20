"use client";

import Link from "next/link";
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { BestiaryFigure } from "./figure";
import { LostPlate, LostPlateThumb } from "./lost-plate";
import { bestiaryThumbUrl, type BestiaryEntry } from "./registry";

/**
 * The showcase of the bestiary: one beast held up at plate size, the folio's
 * whole company along the bottom in the hand of the same engraver. Choosing
 * a beast turns the sheet; opening it goes to the beast's leaf.
 *
 * The WAI-ARIA tabs pattern with automatic activation, built on links rather
 * than buttons — deliberately. Four of these beasts are minor and never
 * enter the Index, so this ribbon is the only place in the atlas that links
 * to them from the server: without JavaScript (and to a crawler) every
 * thumbnail is an ordinary anchor to its leaf, and a pointer click is
 * intercepted only where the script is alive to turn the sheet instead.
 * Enter on a focused thumbnail always opens the leaf.
 *
 * Selection is component state and stays out of the URL: the page is
 * prerendered, so a hash would have to be reconciled after hydration, and
 * the thing worth sharing is the leaf itself.
 */

export function BestiaryShowcase({ entries }: { entries: BestiaryEntry[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLAnchorElement | null)[]>([]);
  const prefix = useId();
  const tabId = (i: number) => `${prefix}-tab-${i}`;
  const panelId = `${prefix}-panel`;

  const entry = entries[active];

  function select(i: number, { focus = false } = {}) {
    setActive(i);
    const tab = tabs.current[i];
    if (!tab) return;
    if (focus) tab.focus();
    tab.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  function onThumbClick(event: MouseEvent<HTMLAnchorElement>, i: number) {
    /* Enter on a focused thumbnail arrives here with detail 0 — that one is
       a navigation, as are the browser's own open-in-a-new-tab chords. */
    if (event.detail === 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    select(i);
  }

  function onRibbonKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = entries.length - 1;
    const to =
      event.key === "ArrowRight"
        ? active === last
          ? 0
          : active + 1
        : event.key === "ArrowLeft"
          ? active === 0
            ? last
            : active - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (to < 0) return;
    event.preventDefault();
    select(to, { focus: true });
  }

  return (
    <div className="bestiary-showcase">
      <div
        className="bestiary-scene"
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(active)}
      >
        {/* The engraving is a shortcut for the pointer; the keyboard and the
            screen reader are served by «Open the leaf» below. */}
        <Link
          href={`/creatures/${entry.slug}`}
          className="bestiary-stack"
          tabIndex={-1}
          aria-hidden="true"
        >
          {entries.map((item, i) => (
            <div
              key={item.slug}
              className={`bestiary-plate ${i === active ? "bestiary-plate--shown" : ""}`}
            >
              {item.art ? (
                <BestiaryFigure {...item.art} />
              ) : (
                <LostPlate fig={item.fig} />
              )}
            </div>
          ))}
        </Link>

        <div className="bestiary-caption">
          <p className="bestiary-fig-no">Fig. {entry.fig} — Bestiarium</p>
          <h2 className="mt-2 font-display text-3xl">{entry.name}</h2>
          <p className="mt-1 font-serif italic text-muted">
            {entry.latin}
            <span className="ml-3 text-xs uppercase not-italic tracking-widest">
              {entry.classification.replace(/-/g, " ")}
            </span>
          </p>
          <p className="mt-3 text-[17px]">{entry.epithet}</p>
          <p className="bestiary-summary mt-3 text-muted">{entry.summary}</p>
          <Link
            href={`/creatures/${entry.slug}`}
            className="mt-5 inline-block border border-line bg-surface px-5 py-2 text-xs uppercase tracking-widest transition-colors hover:border-accent hover:text-accent"
          >
            Open the leaf
          </Link>
        </div>
      </div>

      <div
        className="bestiary-ribbon"
        role="tablist"
        aria-label="The beasts of the folio"
        onKeyDown={onRibbonKeyDown}
      >
        {entries.map((item, i) => (
          <Link
            key={item.slug}
            href={`/creatures/${item.slug}`}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            id={tabId(i)}
            aria-controls={panelId}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            className={`bestiary-thumb ${i === active ? "bestiary-thumb--active" : ""}`}
            onClick={(event) => onThumbClick(event, i)}
          >
            {item.art ? (
              <span
                className="bestiary-thumb-ink mask-ink"
                style={
                  { "--ink-mask": `url('${bestiaryThumbUrl(item.slug)}')` } as CSSProperties
                }
              />
            ) : (
              <LostPlateThumb fig={item.fig} />
            )}
            <span className="bestiary-thumb-name">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
