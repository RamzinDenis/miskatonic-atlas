"use client";

import Link from "next/link";
import { preload as preloadResource } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { BestiaryFigure } from "./figure";
import { LostPlate, LostPlateThumb } from "./lost-plate";
import type { BestiaryEntry } from "./registry";

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
 *
 * The order of printing is the point of usePressRun below: the sheet the
 * reader is looking at is worth every byte of the connection until it is
 * there, and nothing else is. See that hook for what waits for what.
 */

export function BestiaryShowcase({ entries }: { entries: BestiaryEntry[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLAnchorElement | null)[]>([]);
  const prefix = useId();
  const tabId = (i: number) => `${prefix}-tab-${i}`;
  const panelId = `${prefix}-panel`;

  const entry = entries[active];
  const { printed, ribbonInked, print } = usePressRun(entries);

  /* The plate on show is the page's one important image — asked for at high
     priority, and from the server for the opening plate, so the fetch starts
     with the document rather than with hydration. */
  if (entry.art) preloadResource(entry.art.mask, { as: "image", fetchPriority: "high" });

  function select(i: number, { focus = false } = {}) {
    print(i);
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
              {/* Every plate keeps its place in the stack from the first
                  render — the crossfade needs both sheets in the box — but
                  an engraving not yet printed is an empty mount, and an
                  empty mount fetches nothing. */}
              {item.art ? (
                printed.has(i) ? (
                  <BestiaryFigure {...item.art} />
                ) : null
              ) : (
                <LostPlate fig={item.fig} />
              )}
            </div>
          ))}
        </Link>

        <div className="bestiary-caption">
          <p className="bestiary-fig-no">Fig. {entry.fig} — Bestiarium</p>
          <h2 className="cap-first mt-2 font-display text-3xl">{entry.name}</h2>
          {/* An uncurated beast has no binomial yet — the caption holds its
              classification alone until the register names it. */}
          <p className="mt-1 font-serif italic text-muted">
            {entry.latin}
            <span
              className={`${entry.latin ? "ml-3 " : ""}text-xs uppercase not-italic tracking-widest`}
            >
              {entry.classification.replace(/-/g, " ")}
            </span>
          </p>
          {entry.epithet && <p className="mt-3 text-[17px]">{entry.epithet}</p>}
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
              /* The mark waits for the plate: until then the mount holds its
                 3 rem of the ribbon and the name is already there. Without
                 JavaScript the marks never come — the ribbon is then a row
                 of names, which is what it is for. */
              <span
                className="bestiary-thumb-ink mask-ink"
                style={
                  ribbonInked
                    ? ({ "--ink-mask": `url('${item.art.thumb}')` } as CSSProperties)
                    : undefined
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

/** However slow the plate, the ribbon takes ink within this. */
const RIBBON_WAIT = 2500;

/**
 * The order in which the folio takes ink. Full plates run to a quarter of a
 * megabyte apiece; printing all eleven at once — which is what a stack of
 * masks hidden by opacity alone does — spends some 2.5 MB before the reader
 * sees the one sheet that is open.
 *
 * So the press runs in three passes:
 *   1. the opening plate, and nothing else (it is in the server's HTML, so
 *      it is fetched with the document);
 *   2. the ribbon's marks, once that plate is down or the wait is up;
 *   3. the rest of the folio, one plate per idle moment, so that turning
 *      the sheet later is instant.
 *
 * A plate the reader asks for jumps the queue: `print` is called from
 * select() before anything else. Nothing is ever unprinted — a mask already
 * fetched costs nothing to keep, and the crossfade wants the sheet it is
 * leaving.
 */
function usePressRun(entries: BestiaryEntry[]) {
  /* The opening plate is printed from the first render, server included. */
  const [printed, setPrinted] = useState<ReadonlySet<number>>(() => new Set([0]));
  /* Should the folio ever open on a wanting plate, there is nothing for the
     ribbon to wait behind and its marks go out with the document. */
  const [ribbonInked, setRibbonInked] = useState(() => !entries[0]?.art);

  const print = useCallback((i: number) => {
    setPrinted((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  }, []);

  useEffect(() => {
    const opening = entries[0]?.art?.mask;
    if (!opening) return;
    /* The plate is already on its way through CSS; this only listens for it
       — and gives up waiting rather than leave the ribbon blank. */
    let done = false;
    const ink = () => {
      if (done) return;
      done = true;
      setRibbonInked(true);
    };
    const timer = window.setTimeout(ink, RIBBON_WAIT);
    void fetchMask(opening).then(ink);
    return () => {
      done = true;
      window.clearTimeout(timer);
    };
  }, [entries]);

  useEffect(() => {
    if (!ribbonInked) return;
    const queue = entries
      .map((entry, i) => (i > 0 && entry.art ? i : -1))
      .filter((i) => i >= 0);
    let cancelled = false;
    let idle: number | undefined;
    const step = () => {
      const i = queue.shift();
      if (i === undefined) return;
      void fetchMask(entries[i].art!.mask).then(() => {
        if (cancelled) return;
        print(i);
        idle = whenIdle(step);
      });
    };
    idle = whenIdle(step);
    return () => {
      cancelled = true;
      if (idle !== undefined) cancelIdle(idle);
    };
  }, [ribbonInked, entries, print]);

  return { printed, ribbonInked, print };
}

/** Resolves when the mask is in the browser's cache, or refuses to come. */
function fetchMask(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = image.onerror = () => resolve();
    image.src = url;
  });
}

/* Safari knew no idle callback until lately; there a plain gap will do. */
const hasIdle = () => typeof requestIdleCallback === "function";
const whenIdle = (run: () => void): number =>
  hasIdle() ? requestIdleCallback(run, { timeout: 2000 }) : window.setTimeout(run, 300);
const cancelIdle = (handle: number): void =>
  hasIdle() ? cancelIdleCallback(handle) : window.clearTimeout(handle);
