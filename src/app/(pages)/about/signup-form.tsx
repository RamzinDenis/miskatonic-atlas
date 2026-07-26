"use client";

import { useState, type FormEvent } from "react";
import { CONTACT_EMAIL } from "@/shared/site";

/**
 * The For-authors form as a small island: Formspree accepts a fetch with
 * `Accept: application/json` and then performs no redirect, so the reader
 * stays on the parchment and the thank-you prints in the atlas' own hand —
 * the free tier's hosted thank-you page would carry them off to Formspree's
 * branding at the exact moment the CTA landed. Failure falls back to the
 * editor's address, so the leaf never dead-ends.
 */
export function AuthorsSignup({ formId }: { formId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(event.currentTarget),
      });
      if (!res.ok) throw new Error(`Formspree ${res.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="mt-6 border border-line bg-surface px-5 py-4 italic leading-relaxed">
        Received. You will be the first to hear when the workshop opens.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6">
      {/* Formspree's honeypot: humans never see it, dumb bots fill it, and
          such submissions are dropped without spending the monthly quota. */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="flex flex-wrap gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          aria-label="Your email"
          disabled={status === "sending"}
          className="min-w-0 flex-1 border border-line bg-surface px-4 py-2 text-base outline-none transition-colors focus:border-accent disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="border border-line bg-surface px-5 py-2 text-xs uppercase tracking-widest transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Keep me posted"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-3 text-sm text-muted">
          The post would not go through — write to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent transition-colors hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          instead.
        </p>
      )}
    </form>
  );
}
