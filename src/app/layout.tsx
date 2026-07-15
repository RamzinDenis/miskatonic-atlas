import type { Metadata } from "next";
import { Old_Standard_TT, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Period faces: Old Standard follows the "modern" text types of XIX-century
// book printing; Playfair covers title pages and headings.
const oldStandard = Old_Standard_TT({
  variable: "--font-old-standard",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Miskatonic Atlas",
    template: "%s — Miskatonic Atlas",
  },
  description:
    "An atlas of H. P. Lovecraft's world — locations, characters and creatures, every fact traced to its quote in the public-domain stories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oldStandard.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-3xl items-baseline justify-between px-6 py-4">
            <Link
              href="/"
              className="font-display text-lg tracking-wide text-accent"
            >
              Miskatonic Atlas
            </Link>
            <nav className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-muted transition-colors hover:text-accent">
                Map
              </Link>
              <Link
                href="/index"
                className="text-muted transition-colors hover:text-accent"
              >
                Index
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-3xl px-6 py-6 text-sm text-muted">
            Based on stories by H. P. Lovecraft published through 1929 — public
            domain in the US and the EU.
          </div>
        </footer>
      </body>
    </html>
  );
}
