import type { Metadata } from "next";
import Link from "next/link";
import { getStories } from "@/shared/lib/content";
import {
  CONTACT_EMAIL,
  FORMSPREE_FORM_ID,
  GITHUB_URL,
  SITE_NAME,
} from "@/shared/site";
import { AuthorsSignup } from "./signup-form";

export const metadata: Metadata = {
  title: "About",
  description:
    "What the Miskatonic Atlas is, how it is drawn from the stories, and the coming product that turns a manuscript into a world of its own.",
};

/**
 * The colophon of the atlas: what it is, how it is made, and the one call
 * to action the site carries — an author leaving an email for the coming
 * «manuscript → world» product. The form posts straight to Formspree (the
 * site is static, there is no backend); until the form id is set it falls
 * back to a mailto link, so the page never ships a dead form.
 */
export default function AboutPage() {
  const stories = getStories().sort((a, b) => a.year - b.year);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent">
        ← Map
      </Link>

      <article className="parchment mt-4 px-6 py-10 sm:px-12 sm:py-12">
        <header>
          <h1 className="font-display text-4xl">About the Atlas</h1>
          <div className="parchment-rule mt-5" />
        </header>

        <p className="mt-6 text-lg leading-relaxed">
          The {SITE_NAME} is a reader&apos;s companion to H.&nbsp;P.&nbsp;Lovecraft&apos;s
          world: the charts, the gazetteer, the dramatis personae and the
          bestiary of six early stories, drawn as an atlas from a XIX-century
          publisher&apos;s shelf.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-2xl">How it is made</h2>
          <p className="mt-4 leading-relaxed">
            The entities of the atlas are extracted from the stories by a
            language-model pipeline and reviewed by hand. The discipline is
            strict: <em>every fact must carry a verbatim quote</em>{" "}
            from the text that states it, and every quote is verified mechanically —
            by exact search against the story — before the site will build.
            What the pipeline cannot source, the atlas does not claim. The
            engravings, the routes and the marginalia beasts are the
            editor&apos;s interpretation, and say so on their captions.
          </p>
          <p className="mt-4 leading-relaxed">
            The stories themselves are in the public domain in the US and the
            EU; the atlas quotes them and nothing else. The code is MIT — the
            whole workshop is open at{" "}
            <a
              href={GITHUB_URL}
              className="text-accent transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">The corpus</h2>
          <ul className="mt-4 space-y-1">
            {stories.map((story) => (
              <li key={story.slug}>
                <Link
                  href={`/stories/${story.slug}`}
                  className="text-muted transition-colors hover:text-accent"
                >
                  {story.title} ({story.year})
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 border-t border-line pt-8">
          <h2 className="font-display text-2xl">For authors</h2>
          <p className="mt-4 leading-relaxed">
            This atlas is a working demo of a coming product: you upload{" "}
            <em>your own manuscript</em> and receive a world of its own —
            the map, the people, the beasts and the places of your book,
            every fact traced to your text, ready to share with your
            readers. If you would want this for your book, leave an email
            and be the first to hear when it opens.
          </p>

          {FORMSPREE_FORM_ID ? (
            <AuthorsSignup formId={FORMSPREE_FORM_ID} />
          ) : (
            <p className="mt-6">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                  "Manuscript → world",
                )}`}
                className="inline-block border border-line bg-surface px-5 py-2 text-xs uppercase tracking-widest transition-colors hover:border-accent hover:text-accent"
              >
                Write to the editor
              </a>
            </p>
          )}
        </section>

        <div className="fleuron" aria-hidden="true">
          ❦
        </div>
      </article>
    </div>
  );
}
