import Link from "next/link";

/**
 * The atlas masthead. Inner pages render it as a normal document header;
 * the map page floats it as a thin strip over the full-bleed chart.
 */
export function SiteHeader({ floating = false }: { floating?: boolean }) {
  return (
    <header
      className={
        floating
          ? "site-header-floating absolute inset-x-0 top-0 z-[1100]"
          : "border-b border-line"
      }
    >
      <div
        className={`flex w-full items-baseline justify-between gap-4 px-4 sm:px-6 ${
          floating ? "py-3" : "py-4"
        }`}
      >
        <Link
          href="/"
          className="whitespace-nowrap font-display text-base tracking-wide text-accent sm:text-lg"
        >
          Miskatonic Atlas
        </Link>
        <nav className="flex gap-4 text-xs uppercase tracking-widest sm:gap-6">
          <Link href="/" className="text-muted transition-colors hover:text-accent">
            Map
          </Link>
          <Link
            href="/creatures"
            className="text-muted transition-colors hover:text-accent"
          >
            Bestiary
          </Link>
          <Link
            href="/contents"
            className="text-muted transition-colors hover:text-accent"
          >
            Index
          </Link>
        </nav>
      </div>
    </header>
  );
}
