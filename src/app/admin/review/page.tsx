import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildReviewState } from "./api/state";
import { ReviewClient } from "./ui";

export const metadata: Metadata = {
  title: "Review",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * Dev-only review desk (backlog item 1): draft revision — verdicts over
 * merged extraction drafts (as-is / edited / junk, needsReview forks) — and
 * prominence curation over content/. Compiled out of production entirely.
 * Also the prototype of the product's author review UI (docs/tech-spec.md).
 */
export default function ReviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <ReviewClient initial={buildReviewState()} />;
}
