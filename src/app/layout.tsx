import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-3xl items-baseline justify-between px-6 py-4">
            <Link href="/" className="font-serif text-lg tracking-wide text-accent">
              Miskatonic Atlas
            </Link>
            <span className="text-xs uppercase tracking-widest text-muted">MVP</span>
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
