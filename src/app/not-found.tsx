import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/shared/ui/site-header";

export const metadata: Metadata = {
  title: "Uncharted",
};

/**
 * The 404 sheet. Lives at the app root, outside both route groups, so it
 * brings its own chrome: a regular masthead over a single parchment leaf.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="grid flex-1 place-items-center px-4 py-16">
        <div className="parchment w-full max-w-md rounded-sm px-8 py-10 text-center">
          <p className="text-xs uppercase tracking-widest text-muted">
            404 — Uncharted waters
          </p>
          <h1 className="mt-2 font-display text-3xl">Not on any chart</h1>
          <div className="parchment-rule mt-4" />
          <p className="mt-5 leading-relaxed">
            No entry of the atlas answers to this address. Whatever stood here
            has sunk beneath the waves, or was never dredged up at all.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block italic text-accent transition-colors hover:text-foreground"
          >
            ← Back to the chart
          </Link>
          <div className="fleuron" aria-hidden="true">
            ❦
          </div>
        </div>
      </main>
    </div>
  );
}
