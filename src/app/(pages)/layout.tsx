import { ViewTransition } from "react";
import { LeafTurn } from "@/shared/ui/leaf-turn";
import { SiteHeader } from "@/shared/ui/site-header";

/**
 * A leaf of the atlas: turning to another one slides this leaf out and the
 * next one in, in the direction the reader is going (LeafTurn).
 *
 * The outer boundary is the volume's quire — the whole block of printed
 * leaves. React only activates enter/exit on the outermost boundary of an
 * inserted or deleted tree, and when the reader crosses between the book
 * and the chart it is this layout that mounts or unmounts, not LeafTurn:
 * buried under the div, LeafTurn never fires there, and without the quire
 * the book simply blinked out around the chart. Between two leaves the
 * layout persists, the quire stays inactive, and LeafTurn does the turning.
 * The masthead carries its own name, so it is lifted out of the quire's
 * snapshot and holds still either way.
 */

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransition
      name="quire"
      share="auto"
      enter="auto"
      exit="auto"
      default="none"
    >
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <LeafTurn>
          <main className="flex flex-1 flex-col">{children}</main>
        </LeafTurn>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-3xl px-6 py-6 text-sm text-muted">
            Based on stories by H. P. Lovecraft published through 1929 — public
            domain in the US and the EU.
          </div>
        </footer>
      </div>
    </ViewTransition>
  );
}
