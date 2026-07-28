import { LeafTurn } from "@/shared/ui/leaf-turn";
import { SiteHeader } from "@/shared/ui/site-header";

/**
 * A leaf of the atlas: turning to another one slides this leaf out and the
 * next one in, in the direction the reader is going (LeafTurn).
 */

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
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
  );
}
