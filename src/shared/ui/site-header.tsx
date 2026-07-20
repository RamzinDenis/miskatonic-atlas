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
        className={`mx-auto flex w-full items-baseline justify-between px-6 py-4 ${
          floating ? "max-w-none py-3" : "max-w-3xl"
        }`}
      >
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
