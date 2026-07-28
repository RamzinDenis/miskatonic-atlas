import { ViewTransition } from "react";
import { SiteHeader } from "@/shared/ui/site-header";
import { TURN } from "@/shared/ui/transitions";

/**
 * A leaf of the atlas: turning to another one slides this leaf out and the
 * next one in, in the direction the reader is going (see TURN).
 */

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <ViewTransition enter={TURN} exit={TURN} default="none">
        <main className="flex flex-1 flex-col">{children}</main>
      </ViewTransition>
      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-3xl px-6 py-6 text-sm text-muted">
          Based on stories by H. P. Lovecraft published through 1929 — public
          domain in the US and the EU.
        </div>
      </footer>
    </div>
  );
}
