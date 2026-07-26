import { MAPS, type AtlasMap, type MapLocation, type PixelPoint, type UnplacedLocation } from "./geometry";

/**
 * The dev-only coordinate picker's control panel (/admin/coords): chart
 * switcher, selected-pin ops, the placement queue, the copyable JSON
 * snippet and the pending-moves save list. Pure presentation — picker
 * state and the /admin/coords/save calls live in world-map-client.
 */
interface Props {
  chart: AtlasMap;
  selected: MapLocation | null;
  unplaced: UnplacedLocation[];
  placing: string | null;
  saving: boolean;
  saveError: string | null;
  picked: PixelPoint | null;
  snippet: string;
  copied: boolean;
  moves: Record<string, PixelPoint>;
  onToggleProminence: (location: MapLocation) => void;
  onUnplace: (slug: string) => void;
  onTogglePlacing: (slug: string) => void;
  onSeedQueue: () => void;
  onCopySnippet: () => void;
  onSaveMoves: () => void;
  onResetMoves: () => void;
}

export function PickerPanel({
  chart,
  selected,
  unplaced,
  placing,
  saving,
  saveError,
  picked,
  snippet,
  copied,
  moves,
  onToggleProminence,
  onUnplace,
  onTogglePlacing,
  onSeedQueue,
  onCopySnippet,
  onSaveMoves,
  onResetMoves,
}: Props) {
  return (
    <aside className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md rounded-lg border border-line bg-surface/95 p-5 shadow-xl shadow-black/40 backdrop-blur sm:right-auto">
      <span className="text-xs uppercase tracking-widest text-muted">
        Coordinate picker · dev only
      </span>
      {Object.keys(MAPS).length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {/* Plain anchors: the picker page reads ?map= server-side, so
              switching charts is a full reload with fresh picker data. */}
          {Object.values(MAPS).map((m) => (
            <a
              key={m.id}
              href={`/admin/coords?map=${m.id}`}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                m.id === chart.id
                  ? "border-accent text-accent"
                  : "border-line text-muted hover:border-accent"
              }`}
            >
              {m.title}
            </a>
          ))}
        </div>
      )}
      {selected && (
        <div className="mt-3 border-b border-line pb-3">
          <p className="text-sm font-medium">
            {selected.name}
            <span className="ml-2 text-xs uppercase tracking-widest text-muted">
              {selected.prominence ?? "major"}
            </span>
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => onToggleProminence(selected)}
              className="rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent disabled:opacity-50"
            >
              → {selected.prominence === "minor" ? "major" : "minor"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onUnplace(selected.slug)}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent disabled:opacity-50"
            >
              ⌫ off map
            </button>
          </div>
        </div>
      )}
      {unplaced.length > 0 && (
        <div className="mt-3 border-b border-line pb-3">
          <p className="text-xs uppercase tracking-widest text-muted">
            Placement queue
          </p>
          <ul className="mt-1.5 max-h-32 space-y-1 overflow-y-auto">
            {unplaced.map((location) => (
              <li key={location.slug}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onTogglePlacing(location.slug)}
                  className={`w-full rounded-md border px-2 py-1 text-left text-sm transition-colors disabled:opacity-50 ${
                    placing === location.slug
                      ? "border-accent text-accent"
                      : "border-line hover:border-accent"
                  }`}
                >
                  {location.name}
                  <span className="ml-2 text-xs uppercase tracking-widest text-muted">
                    {location.type}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            {placing
              ? saving
                ? "Saving…"
                : "Click the chart to place it (Esc to cancel)."
              : "Pick a location, then click the chart — or seed them all at once."}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={onSeedQueue}
            title="Provisional pins near each location's parent / connection / New England — then drag to refine"
            className="mt-2 w-full rounded-md border border-accent px-3 py-1.5 text-sm text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
          >
            {saving ? "Seeding…" : `Seed queue (${unplaced.length}) near anchors`}
          </button>
          {saveError && Object.keys(moves).length === 0 && (
            <p className="mt-1 text-xs text-red-400">{saveError}</p>
          )}
        </div>
      )}
      {picked ? (
        <>
          <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-background px-3 py-2 font-mono text-sm">
            {snippet}
          </pre>
          <button
            type="button"
            onClick={onCopySnippet}
            className="mt-3 rounded-md border border-line px-3 py-1.5 text-sm text-accent transition-colors hover:border-accent"
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Drag a pin to move a location, or click the map to get pixel
          coordinates for a new one.
        </p>
      )}
      {Object.keys(moves).length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <ul className="max-h-32 space-y-1 overflow-y-auto font-mono text-xs text-muted">
            {Object.entries(moves).map(([slug, p]) => (
              <li key={slug}>
                {slug} → {p.x}, {p.y}
              </li>
            ))}
          </ul>
          {saveError && (
            <p className="mt-2 text-xs text-red-400">{saveError}</p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onSaveMoves}
              disabled={saving}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-accent transition-colors hover:border-accent disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : `Save ${Object.keys(moves).length} to content/`}
            </button>
            <button
              type="button"
              onClick={onResetMoves}
              disabled={saving}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
