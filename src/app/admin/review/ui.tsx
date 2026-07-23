"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  CurationEntity,
  Draft,
  QuoteCheck,
  ReviewState,
} from "./api/state";

/**
 * Client of /admin/review — see ./api/route.ts for the state and actions.
 * The server page passes the initial state; every decision POSTs to the API
 * and refetches. Two modes: draft revision (verdicts over merged extraction
 * drafts) and prominence curation (major/minor over content/). Plain
 * utilitarian styling — a workbench, not part of the atlas presentation.
 */

interface NeedsReviewItem {
  field: string;
  reason: string;
  candidates?: string[];
}

interface DraftBlock {
  aliases?: string[];
  occurrences?: number;
  windows?: string[];
  facts?: string[];
  needsReview?: NeedsReviewItem[];
}

const API = "/admin/review/api";
const KIND_LABEL: Record<string, string> = {
  locations: "Locations",
  characters: "Characters",
  creatures: "Creatures",
};

function parseEntity(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function ReviewClient({ initial }: { initial: ReviewState }) {
  const [data, setData] = useState<ReviewState>(initial);
  const [tab, setTab] = useState<"drafts" | "curation">("drafts");
  const [storySlug, setStorySlug] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ kind: string; slug: string } | null>(null);
  const [editorText, setEditorText] = useState("");
  const [report, setReport] = useState<{ errors: string[]; quotes?: QuoteCheck[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(API);
    const next: ReviewState = await res.json();
    setData(next);
    return next;
  }, []);

  const story = useMemo(() => {
    return (
      data.stories.find((s) => s.story === storySlug) ?? data.stories[0] ?? null
    );
  }, [data, storySlug]);

  const draft = useMemo(() => {
    if (!story || !selected) return null;
    return (
      story.drafts.find((d) => d.kind === selected.kind && d.slug === selected.slug) ?? null
    );
  }, [story, selected]);

  const select = useCallback((d: Draft) => {
    setSelected({ kind: d.kind, slug: d.slug });
    setEditorText(d.raw);
    setReport(null);
  }, []);

  const post = useCallback(
    async (body: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
      setBusy(true);
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as Record<string, unknown>;
        if (!res.ok && !json.errors) {
          alert(`${res.status}: ${String(json.error ?? "request failed")}`);
          return null;
        }
        return json;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const saveDraft = useCallback(async () => {
    if (!story || !draft) return;
    const res = await post({
      action: "save",
      story: story.story,
      kind: draft.kind,
      slug: draft.slug,
      raw: editorText,
    });
    if (!res) return;
    if (res.error) {
      setReport({ errors: [String(res.error)] });
      return;
    }
    setReport({
      errors: (res.errors as string[]) ?? [],
      quotes: res.quotes as QuoteCheck[],
    });
    await load();
  }, [story, draft, editorText, post, load]);

  const giveVerdict = useCallback(
    async (verdict: "as-is" | "edited" | "junk") => {
      if (!story || !draft) return;
      const entity = parseEntity(draft.raw);
      const pending = ((entity?._draft as DraftBlock | undefined)?.needsReview ?? []).length;
      if (verdict !== "junk" && pending > 0) {
        const go = confirm(
          `${pending} unresolved needsReview item(s) — accept anyway? ` +
            `(they are dropped together with the _draft block)`,
        );
        if (!go) return;
      }
      const res = await post({
        action: "verdict",
        story: story.story,
        kind: draft.kind,
        slug: draft.slug,
        verdict,
      });
      if (!res) return;
      if (res.errors) {
        setReport({ errors: res.errors as string[] });
        return;
      }
      setSelected(null);
      setReport(null);
      await load();
    },
    [story, draft, post, load],
  );

  const restore = useCallback(
    async (slug: string) => {
      if (!story) return;
      const res = await post({ action: "restore", story: story.story, slug });
      if (res) await load();
    },
    [story, post, load],
  );

  const toggleProminence = useCallback(
    async (e: CurationEntity) => {
      const res = await post({
        action: "prominence",
        kind: e.kind,
        slug: e.slug,
        prominence: e.prominence === "major" ? "minor" : "major",
      });
      if (res) await load();
    },
    [post, load],
  );

  const counters = story
    ? Object.values(story.log.decisions).reduce(
        (acc, d) => {
          if (d.verdict) acc[d.verdict]++;
          return acc;
        },
        { "as-is": 0, edited: 0, junk: 0 },
      )
    : null;

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950 font-sans text-sm text-neutral-200">
      <header className="flex flex-wrap items-center gap-4 border-b border-neutral-800 px-4 py-2">
        <span className="font-semibold text-neutral-100">Review desk</span>
        <nav className="flex gap-1">
          {(["drafts", "curation"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-3 py-1 capitalize ${
                tab === t
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
        {tab === "drafts" && data.stories.length > 1 && (
          <select
            value={story?.story ?? ""}
            onChange={(e) => {
              setStorySlug(e.target.value);
              setSelected(null);
            }}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
          >
            {data.stories.map((s) => (
              <option key={s.story} value={s.story}>
                {s.story}
              </option>
            ))}
          </select>
        )}
        {tab === "drafts" && counters && (
          <span className="ml-auto text-neutral-400">
            <b className="text-green-400">{counters["as-is"]}</b> as-is ·{" "}
            <b className="text-sky-400">{counters.edited}</b> edited ·{" "}
            <b className="text-red-400">{counters.junk}</b> junk ·{" "}
            <b className="text-neutral-200">{story?.drafts.length ?? 0}</b> left
          </span>
        )}
        {!data.hasNormalized && (
          <span className="text-amber-400">
            no corpus/normalized texts — quote checks disabled
          </span>
        )}
      </header>

      {tab === "drafts" ? (
        !story ? (
          <div className="p-8 text-neutral-400">
            No drafts under <code>content/drafts/*/merged</code> — run the
            extraction pipeline first, then review here.
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr]">
            <aside className="overflow-y-auto border-r border-neutral-800">
              {["locations", "characters", "creatures"].map((kind) => {
                const items = story.drafts.filter((d) => d.kind === kind);
                if (items.length === 0) return null;
                return (
                  <section key={kind}>
                    <h2 className="sticky top-0 bg-neutral-950 px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      {KIND_LABEL[kind]} · {items.length}
                    </h2>
                    {items.map((d) => {
                      const entity = parseEntity(d.raw);
                      const block = entity?._draft as DraftBlock | undefined;
                      const pending = block?.needsReview?.length ?? 0;
                      const missing = d.quotes.filter((q) => q.status === "missing").length;
                      const active = selected?.kind === d.kind && selected?.slug === d.slug;
                      return (
                        <button
                          key={d.slug}
                          onClick={() => select(d)}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left ${
                            active ? "bg-neutral-800" : "hover:bg-neutral-900"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {(entity?.name as string) ?? d.slug}
                            {!entity && (
                              <span className="text-red-400"> (broken JSON)</span>
                            )}
                          </span>
                          {block?.occurrences != null && (
                            <span className="text-xs text-neutral-500">
                              ×{block.occurrences}
                            </span>
                          )}
                          {pending > 0 && (
                            <span className="rounded bg-amber-900/60 px-1.5 text-xs text-amber-300">
                              {pending}
                            </span>
                          )}
                          {missing > 0 && (
                            <span className="rounded bg-red-900/60 px-1.5 text-xs text-red-300">
                              ✕{missing}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </section>
                );
              })}
              {story.junk.length > 0 && (
                <section className="border-t border-neutral-800">
                  <h2 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Junk · {story.junk.length}
                  </h2>
                  {story.junk.map((j) => (
                    <div
                      key={j.slug}
                      className="flex items-center gap-2 px-3 py-1.5 text-neutral-500"
                    >
                      <span className="min-w-0 flex-1 truncate line-through">
                        {(parseEntity(j.raw)?.name as string) ?? j.slug}
                      </span>
                      <button
                        onClick={() => restore(j.slug)}
                        disabled={busy}
                        className="rounded border border-neutral-700 px-1.5 text-xs hover:bg-neutral-800"
                      >
                        restore
                      </button>
                    </div>
                  ))}
                </section>
              )}
            </aside>

            {draft ? (
              <DraftDetail
                draft={draft}
                busy={busy}
                editorText={editorText}
                setEditorText={setEditorText}
                report={report}
                onSave={saveDraft}
                onVerdict={giveVerdict}
              />
            ) : (
              <div className="p-8 text-neutral-500">
                Pick a draft on the left. Flow: resolve <i>needsReview</i> forks
                (edit the JSON, Save) → Accept or Junk. Accepted drafts land in{" "}
                <code>content/</code>, junked ones in the story&apos;s{" "}
                <code>junk/</code>.
              </div>
            )}
          </div>
        )
      ) : (
        <CurationTab
          entities={data.curation}
          filter={filter}
          setFilter={setFilter}
          busy={busy}
          onToggle={toggleProminence}
        />
      )}
    </div>
  );
}

function DraftDetail({
  draft,
  busy,
  editorText,
  setEditorText,
  report,
  onSave,
  onVerdict,
}: {
  draft: Draft;
  busy: boolean;
  editorText: string;
  setEditorText: (s: string) => void;
  report: { errors: string[]; quotes?: QuoteCheck[] } | null;
  onSave: () => void;
  onVerdict: (v: "as-is" | "edited" | "junk") => void;
}) {
  // Render from the editor state when it parses, so candidate clicks and
  // manual edits are reflected immediately; fall back to the file on disk.
  const editorEntity = parseEntity(editorText);
  const entity = editorEntity ?? parseEntity(draft.raw);
  const block = entity?._draft as DraftBlock | undefined;
  const quotes = report?.quotes ?? draft.quotes;
  const dirty = editorText !== draft.raw;

  /** Mutate the parsed editor JSON and write it back into the textarea. */
  const mutateEditor = (
    fn: (entity: Record<string, unknown>, block: DraftBlock) => void,
  ) => {
    if (!editorEntity) return;
    fn(editorEntity, (editorEntity._draft ?? {}) as DraftBlock);
    setEditorText(JSON.stringify(editorEntity, null, 2) + "\n");
  };

  // Scalar field: apply the candidate and resolve the item in one click.
  // Array field (slug lists): toggle membership, resolve via "keep current".
  const applyCandidate = (index: number, item: NeedsReviewItem, candidate: string) =>
    mutateEditor((entity, block) => {
      const current = entity[item.field];
      if (Array.isArray(current)) {
        entity[item.field] = current.includes(candidate)
          ? current.filter((v) => v !== candidate)
          : [...current, candidate];
      } else {
        entity[item.field] = candidate;
        block.needsReview?.splice(index, 1);
      }
    });

  const resolveItem = (index: number) =>
    mutateEditor((_entity, block) => {
      block.needsReview?.splice(index, 1);
    });

  return (
    <main className="overflow-y-auto p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold text-neutral-100">
          {(entity?.name as string) ?? draft.slug}
        </h1>
        <code className="text-neutral-500">
          {draft.kind}/{draft.slug}
        </code>
        {block?.occurrences != null && (
          <span className="text-neutral-400">
            {block.occurrences} occurrence(s) in {block.windows?.join(", ")}
          </span>
        )}
        {block?.aliases && block.aliases.length > 0 && (
          <span className="text-neutral-400">aka {block.aliases.join(" · ")}</span>
        )}
        <span className="ml-auto flex gap-2">
          <button
            onClick={() => onVerdict("as-is")}
            disabled={busy || dirty}
            title={dirty ? "Save or revert edits first" : "Promote unchanged to content/"}
            className="rounded bg-green-700 px-3 py-1 font-medium text-white hover:bg-green-600 disabled:opacity-40"
          >
            Accept as-is
          </button>
          <button
            onClick={() => onVerdict("edited")}
            disabled={busy || dirty}
            title={dirty ? "Save or revert edits first" : "Promote the fixed version to content/"}
            className="rounded bg-sky-700 px-3 py-1 font-medium text-white hover:bg-sky-600 disabled:opacity-40"
          >
            Accept edited
          </button>
          <button
            onClick={() => onVerdict("junk")}
            disabled={busy}
            className="rounded bg-red-800 px-3 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-40"
          >
            Junk
          </button>
        </span>
      </div>

      {block?.needsReview && block.needsReview.length > 0 && (
        <section className="mb-3 space-y-2">
          {block.needsReview.map((item, i) => {
            const current = entity?.[item.field];
            const isArray = Array.isArray(current);
            return (
              <div
                key={`${item.field}-${i}`}
                className="rounded border border-amber-900/70 bg-amber-950/30 px-3 py-2"
              >
                <div className="mb-1 flex items-baseline gap-3">
                  <span className="min-w-0 flex-1">
                    <code className="font-semibold text-amber-300">{item.field}</code>{" "}
                    <span className="text-neutral-300">{item.reason}</span>
                    {!isArray && current != null && (
                      <span className="text-neutral-500">
                        {" "}
                        — now <code className="text-neutral-400">{String(current)}</code>
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => resolveItem(i)}
                    disabled={busy || !editorEntity}
                    title="Keep the current value and mark this item resolved"
                    className="shrink-0 rounded border border-neutral-700 px-1.5 py-0.5 text-xs text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
                  >
                    ✓ keep current
                  </button>
                </div>
                {item.candidates && item.candidates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.candidates.map((c) => {
                      const active = isArray
                        ? (current as unknown[]).includes(c)
                        : current === c;
                      return (
                        <button
                          key={c}
                          onClick={() => applyCandidate(i, item, c)}
                          disabled={busy || !editorEntity}
                          title={
                            isArray
                              ? "Toggle this value in the list, then ✓ keep current to resolve"
                              : "Set the field to this value and resolve the item"
                          }
                          className={`rounded border px-1.5 py-0.5 font-mono text-xs disabled:opacity-40 ${
                            active
                              ? "border-amber-500 bg-amber-900/60 text-amber-200"
                              : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-amber-700 hover:text-amber-200"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-xs text-neutral-500">
            Click a candidate to apply it (list fields toggle; finish them with
            “✓ keep current”), or edit the JSON below for anything else — then
            Save. Accepting drops the whole _draft block.
            {!editorEntity && (
              <span className="text-red-400"> Buttons disabled: the JSON below does not parse.</span>
            )}
          </p>
        </section>
      )}

      {quotes.length > 0 && (
        <section className="mb-3 text-xs">
          {quotes.map((q) => (
            <div key={q.index} className="text-neutral-400">
              {q.status === "found" ? (
                <span className="text-green-400">✓</span>
              ) : q.status === "missing" ? (
                <span className="text-red-400">✕</span>
              ) : (
                <span className="text-neutral-600">?</span>
              )}{" "}
              sources[{q.index}]
              {q.status === "found" && <> — ¶{q.found.join(", ¶")}</>}
              {q.status === "missing" && <> — quote not found in the normalized text</>}
              {q.claims != null &&
                q.status === "found" &&
                !q.found.includes(q.claims) && (
                  <span className="text-amber-400"> (claims ¶{q.claims})</span>
                )}
            </div>
          ))}
        </section>
      )}

      {block?.facts && block.facts.length > 0 && (
        <details className="mb-3">
          <summary className="cursor-pointer text-neutral-400">
            {block.facts.length} extracted fact(s)
          </summary>
          <ul className="ml-5 mt-1 list-disc space-y-0.5 text-neutral-300">
            {block.facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </details>
      )}

      <textarea
        value={editorText}
        onChange={(e) => setEditorText(e.target.value)}
        spellCheck={false}
        className="h-96 w-full resize-y rounded border border-neutral-800 bg-neutral-900 p-3 font-mono text-xs text-neutral-200"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={busy || !dirty}
          className="rounded bg-neutral-100 px-3 py-1 font-medium text-neutral-900 hover:bg-white disabled:opacity-40"
        >
          Save
        </button>
        {dirty && <span className="text-amber-400">unsaved edits</span>}
        {report &&
          (report.errors.length === 0 ? (
            <span className="text-green-400">saved — schema and refs valid</span>
          ) : (
            <span className="text-red-400">saved with problems ↓</span>
          ))}
      </div>
      {report && report.errors.length > 0 && (
        <pre className="mt-2 overflow-x-auto rounded border border-red-900 bg-red-950/30 p-3 text-xs text-red-300">
          {report.errors.join("\n")}
        </pre>
      )}
    </main>
  );
}

function CurationTab({
  entities,
  filter,
  setFilter,
  busy,
  onToggle,
}: {
  entities: CurationEntity[];
  filter: string;
  setFilter: (s: string) => void;
  busy: boolean;
  onToggle: (e: CurationEntity) => void;
}) {
  const needle = filter.trim().toLowerCase();
  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-3 flex items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or slug…"
          className="w-64 rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
        />
        <span className="text-neutral-500">
          Minor entities keep their pages but stay off the map, Index and menus.
        </span>
      </div>
      {["locations", "characters", "creatures"].map((kind) => {
        const items = entities.filter(
          (e) =>
            e.kind === kind &&
            (needle === "" ||
              e.name.toLowerCase().includes(needle) ||
              e.slug.includes(needle)),
        );
        if (items.length === 0) return null;
        const minor = items.filter((e) => e.prominence === "minor").length;
        return (
          <section key={kind} className="mb-4">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {KIND_LABEL[kind]} · {items.length - minor} major / {minor} minor
            </h2>
            {items.map((e) => (
              <div
                key={e.slug}
                className="flex items-center gap-3 border-b border-neutral-900 py-1"
              >
                <span className="min-w-0 flex-1 truncate">
                  {e.name} <code className="text-xs text-neutral-600">{e.slug}</code>
                </span>
                <span className="text-xs text-neutral-600">
                  {e.appearsIn.join(", ")}
                </span>
                <button
                  onClick={() => onToggle(e)}
                  disabled={busy}
                  className={`w-16 rounded border px-2 py-0.5 text-xs ${
                    e.prominence === "major"
                      ? "border-green-800 bg-green-950/40 text-green-300"
                      : "border-neutral-700 bg-neutral-900 text-neutral-400"
                  }`}
                >
                  {e.prominence}
                </button>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
