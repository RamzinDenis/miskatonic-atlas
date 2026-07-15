import { SiteHeader } from "@/shared/ui/site-header";

export default function PagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-3xl px-6 py-6 text-sm text-muted">
          Based on stories by H. P. Lovecraft published through 1929 — public
          domain in the US and the EU.
        </div>
      </footer>
    </div>
  );
}
