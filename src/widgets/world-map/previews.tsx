import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { getPlateThumb } from "@/widgets/plates";
import type { MapLocation } from "./geometry";
import type { RouteLeg } from "./routes";

/**
 * The parchment preview panels a selection opens: a charted place, or a
 * voyage track with its vouching quotes. Pure presentation — selection
 * state lives in world-map-client.
 */

export function LocationPreview({
  location,
  onClose,
}: {
  location: MapLocation;
  onClose: () => void;
}) {
  const thumb = getPlateThumb("locations", location.slug);
  return (
    <aside className="parchment absolute bottom-6 left-4 right-4 z-[1000] max-h-[55%] max-w-sm overflow-y-auto rounded-sm p-5 sm:right-auto">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-widest text-muted">
          {location.type}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 px-1 text-muted transition-colors hover:text-foreground"
          aria-label="Close preview"
        >
          ✕
        </button>
      </div>
      <h2 className="cap-first mt-1 font-display text-2xl">{location.name}</h2>
      <div className="parchment-rule mt-2" />
      <div className="mt-3 flex items-start gap-3">
        <p className="min-w-0 flex-1 text-sm leading-relaxed">
          {location.summary}
        </p>
        {thumb && (
          <Image
            src={thumb.image}
            alt={thumb.alt}
            width={80}
            className="mt-1 h-auto w-20 shrink-0 border border-line"
          />
        )}
      </div>
      {location.figures.length > 0 && (
        <p className="mt-3 text-sm leading-relaxed">
          <span className="text-xs uppercase tracking-widest text-muted">
            Encountered here —{" "}
          </span>
          {location.figures.map((figure, i) => (
            <Fragment key={`${figure.kind}/${figure.slug}`}>
              {i > 0 && ", "}
              <Link
                href={`/${figure.kind}/${figure.slug}`}
                className="italic transition-colors hover:text-accent"
              >
                {figure.name}
              </Link>
            </Fragment>
          ))}
        </p>
      )}
      <Link
        href={location.href}
        className="mt-4 inline-block text-sm italic text-accent transition-colors hover:text-foreground"
      >
        Open location →
      </Link>
    </aside>
  );
}

export function TrackPreview({
  leg,
  onClose,
}: {
  leg: RouteLeg;
  onClose: () => void;
}) {
  return (
    <aside className="parchment absolute bottom-6 left-4 right-4 z-[1000] max-h-[55%] max-w-md overflow-y-auto rounded-sm p-5 sm:right-auto">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-widest text-muted">
          Voyage track
        </span>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 px-1 text-muted transition-colors hover:text-foreground"
          aria-label="Close track preview"
        >
          ✕
        </button>
      </div>
      <h2 className="mt-1 font-display text-2xl italic">{leg.vessel}</h2>
      <div className="parchment-rule mt-2" />
      <p className="mt-3 text-sm leading-relaxed">{leg.course}</p>
      {leg.quotes.map((quote) => (
        <blockquote
          key={quote.slice(0, 40)}
          className="mt-3 border-l-2 border-accent pl-3 font-serif text-sm italic leading-relaxed"
        >
          “{quote}”
        </blockquote>
      ))}
      <p className="mt-2 text-xs uppercase tracking-widest text-muted">
        {leg.attribution}
      </p>
    </aside>
  );
}
