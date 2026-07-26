import type { Metadata } from "next";
import { Old_Standard_TT, Playfair_Display } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/shared/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

/** WebSite JSON-LD — the one structured-data node the whole site shares;
    stories add their own CreativeWork on their leaves. */
const WEBSITE_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
});

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
      <body className="min-h-full">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: WEBSITE_JSON_LD }}
        />
      </body>
    </html>
  );
}
