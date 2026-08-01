import { describe, expect, it } from "vitest";
// Next's own source-pattern matcher, so the test matches what the server does.
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "../next.config";

/**
 * The art cache headers must never reach the PAGES that share the /maps
 * namespace. When `/maps/:path*` matched the region routes, every region's
 * HTML and RSC payload sat in the browser for an hour (ART_CACHE) — after a
 * deploy the router met a stale build on every navigation through them,
 * fell back to a full document load (fetch-server-response.js compares the
 * flight's buildId), and each full load replays the unroll ceremony by
 * design. The reader saw the chart unroll on every region click.
 * Repro loop: scripts/deploy-skew-probe.mjs.
 */
describe("art cache headers stay off the app routes", () => {
  it("covers the art files and nothing routable", async () => {
    const rules = await nextConfig.headers!();
    const matchers = rules.map((rule) => getPathMatch(rule.source));
    const anyMatch = (path: string) => matchers.some((m) => m(path));

    // the art itself keeps its long cache
    expect(anyMatch("/maps/new-england-1448.webp")).toBe(true);
    expect(anyMatch("/maps/desert-lqip.webp")).toBe(true);
    expect(anyMatch("/maps/monsters/cthulhu.webp")).toBe(true);
    expect(anyMatch("/bestiary/cthulhu.webp")).toBe(true);
    expect(anyMatch("/paper/any.webp")).toBe(true);

    // pages and their flight payloads must fall through to Next's
    // default max-age=0, must-revalidate
    expect(anyMatch("/maps/pacific")).toBe(false);
    expect(anyMatch("/maps/desert")).toBe(false);
    expect(anyMatch("/maps/pacific.rsc")).toBe(false);
    expect(anyMatch("/maps/pacific.txt")).toBe(false);
  });
});
