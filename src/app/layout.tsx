import type { Metadata } from "next";
import { Old_Standard_TT, Playfair_Display } from "next/font/google";
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

/**
 * Chrome (header, footer) lives in the route groups: `(map)` is a full-bleed
 * chart with a floating masthead, `(pages)` a regular document flow.
 */
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
