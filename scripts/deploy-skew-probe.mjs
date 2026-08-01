/**
 * Deploy-skew probe: reproduces «unroll ceremony on every region click after
 * a deploy» (the reader merely switches regions; every click becomes a full
 * document load). Two production builds (different buildId), a Chrome tab
 * with a WARM HTTP cache primed against build A, then the server is swapped
 * to build B under the live tab — the mid-session deploy.
 *
 * The mechanism it guards: fetch-server-response.js compares the flight's
 * buildId with the client's and falls back to a full navigation (MPA) on any
 * mismatch, and a full load replays the unroll ceremony BY DESIGN (ADR-0008:
 * the ceremony is the honest indicator of a document load). So no page —
 * HTML or RSC — may ever be browser-cacheable across a deploy: when the
 * /maps/* headers rule matched the region PAGES, the browser resurrected
 * stale build-A documents for an hour and every navigation through them
 * hard-reloaded with the ceremony. next-config-headers.test.mts asserts the
 * pattern; this probe asserts the behaviour end to end.
 *
 * Detectors per click:
 *   fullLoad   window marker gone → the click became a full document load
 *   ceremony   .world-map--unrolling / .chart-unroll seen while waiting
 *   fromCache  navigation entry transferSize === 0 → the document came from
 *              the browser HTTP cache (a stale build-A HTML)
 *
 * Verdict — RED if the post-deploy reopen was served stale from the HTTP
 * cache, or any click full-loads / replays the ceremony.
 *
 * Usage:
 *   node scripts/deploy-skew-probe.mjs [--rebuild]
 *
 * Two build trees are stashed as .next-skew-a/.next-skew-b (gitignored) so
 * re-runs skip the builds; --rebuild forces fresh ones after code changes.
 * Chrome is looked for at CHROME_PATH, then the usual Windows locations.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const A = join(ROOT, ".next-skew-a");
const B = join(ROOT, ".next-skew-b");
const LIVE = join(ROOT, ".next");
const APP_PORT = 3788;
const BASE = `http://localhost:${APP_PORT}`;
const CDP_PORT = 9779;
const REBUILD = process.argv.includes("--rebuild");
const CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].find((p) => p && existsSync(p));
if (!CHROME) { console.error("Chrome not found; set CHROME_PATH"); process.exit(1); }

// ------------------------------------------------------------------- builds
function build(stash) {
  if (existsSync(stash)) {
    if (!REBUILD) { console.log(`# reusing ${stash}`); return; }
    rmSync(stash, { recursive: true, force: true });
  }
  console.log(`# building -> ${stash}`);
  const r = spawnSync("node", ["node_modules/next/dist/bin/next", "build"], {
    cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stdout?.slice(-2000), r.stderr?.slice(-2000));
    throw new Error("build failed");
  }
  stashLive(stash);
}

/* Windows: the freshly written .next is often still locked by AV/indexer —
   retry the rename, then fall back to copy+delete. */
function stashLive(stash) {
  for (let i = 0; i < 10; i++) {
    try { renameSync(LIVE, stash); return; } catch {}
    spawnSync("cmd", ["/c", "timeout", "/t", "1", "/nobreak"], { stdio: "ignore" });
  }
  spawnSync("cmd", ["/c", "xcopy", LIVE, stash, "/E", "/I", "/Q", "/Y"], { cwd: ROOT });
  rmSync(LIVE, { recursive: true, force: true });
}

let server = null;
async function serve(dir) {
  if (server) { server.kill(); await new Promise((r) => setTimeout(r, 1200)); }
  rmSync(LIVE, { recursive: true, force: true });
  // copy, not rename: keep the stash intact for re-runs
  spawnSync("cmd", ["/c", "xcopy", dir, LIVE, "/E", "/I", "/Q", "/Y"], { cwd: ROOT });
  server = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(APP_PORT)], {
    cwd: ROOT, stdio: "ignore",
  });
  for (let i = 0; i < 100; i++) {
    const ok = await fetch(BASE + "/").then((r) => r.ok).catch(() => false);
    if (ok) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("server did not come up");
}

// -------------------------------------------------------------- CDP client
let msgId = 0; const pending = new Map(); let ws;
function send(method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
function onMessage(data) {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject, method } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
    else resolve(msg.result);
  }
}
async function evalIn(sessionId, expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, userGesture: true }, sessionId);
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
}

const MAP_SETTLED = `!!document.querySelector('.world-map--printed')`;
const UNROLLING = `!!document.querySelector('.world-map--unrolling, .chart-unroll')`;

/** Wait for pathname + settled map, watching for the ceremony the whole way.
    Every poll is a standalone evaluate, so it survives full navigations. */
async function awaitArrival(sessionId, path, timeoutMs = 20000) {
  const t0 = Date.now();
  let ceremony = false, settled = false;
  while (Date.now() - t0 < timeoutMs) {
    const s = await evalIn(sessionId, `JSON.stringify({
      path: location.pathname,
      unroll: ${UNROLLING},
      settled: ${MAP_SETTLED},
    })`).then(JSON.parse).catch(() => null);
    if (s) {
      if (s.unroll) ceremony = true;
      if (s.path === path && s.settled && !s.unroll) { settled = true; break; }
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  // a beat more: the ceremony mounts a frame after paperReady on cold loads
  for (let i = 0; i < 8 && !ceremony; i++) {
    await new Promise((r) => setTimeout(r, 150));
    ceremony = await evalIn(sessionId, UNROLLING).catch(() => false) || ceremony;
  }
  return { ceremony, settled };
}

async function docState(sessionId) {
  return evalIn(sessionId, `JSON.stringify({
    marked: window.__skewMark === 1,
    fromCache: (performance.getEntriesByType('navigation')[0]?.transferSize ?? -1) === 0,
  })`).then(JSON.parse);
}

// ---------------------------------------------------------------- scenario
build(A);
build(B);

const profile = mkdtempSync(join(tmpdir(), "skew-probe-chrome-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "about:blank",
], { stdio: "ignore" });

try {
  let version;
  for (let i = 0; i < 50; i++) {
    version = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`).then((r) => r.json()).catch(() => null);
    if (version) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!version) throw new Error("chrome did not open the debugging port");
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (e) => onMessage(e.data);

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  // desktop viewport: the regions cartouche starts open, no extra taps
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);

  // ---- phase A: the reader's week with build A — every region visited as a
  // full load, so its HTML and the neighbours' RSC prefetches are all in the
  // HTTP cache.
  await serve(A);
  console.log("# phase A: priming the HTTP cache against build A");
  for (const p of ["/maps/pacific", "/maps/desert", "/", "/maps/pacific"]) {
    await send("Page.navigate", { url: BASE + p }, sessionId);
    await awaitArrival(sessionId, p);
    await new Promise((r) => setTimeout(r, 2500)); // let Link prefetches land
  }

  // ---- the deploy: build B goes live under the open tab
  console.log("# deploy: swapping server to build B");
  await serve(B);

  // The iOS reality this models: the tab was jettisoned/reopened, so the
  // document comes back through the HTTP cache with an empty in-memory
  // router cache. A plain navigate (not reload) keeps cache semantics
  // honest — a reload would force revalidation and hide the defect.
  await send("Page.navigate", { url: BASE + "/maps/pacific" }, sessionId);
  await awaitArrival(sessionId, "/maps/pacific");
  const reopened = await docState(sessionId);
  console.log(JSON.stringify({ step: "reopen after deploy", ...reopened }));

  // ---- phase B: the reader switches regions
  const clicks = ["/", "/maps/pacific", "/maps/desert", "/", "/maps/pacific", "/"];
  const edges = [];
  for (const target of clicks) {
    await evalIn(sessionId, "window.__skewMark = 1");
    const clicked = await evalIn(sessionId, `(() => {
      const el = document.querySelector('nav[aria-label="Regions of the atlas"] a[href="${target}"]');
      if (!el) return false; el.click(); return true;
    })()`).catch(() => false);
    if (!clicked) { edges.push({ target, error: "link not found" }); continue; }
    const { ceremony, settled } = await awaitArrival(sessionId, target);
    const state = await docState(sessionId).catch(() => ({}));
    edges.push({ target, fullLoad: !state.marked, ceremony, fromCache: state.fromCache, settled });
    console.log(JSON.stringify(edges[edges.length - 1]));
    await new Promise((r) => setTimeout(r, 1500));
  }

  const reasons = [];
  if (reopened.fromCache) reasons.push("reopen after deploy served STALE from HTTP cache");
  for (const e of edges) {
    if (e.error) reasons.push(`${e.target}: ${e.error}`);
    else if (e.ceremony) reasons.push(`${e.target}: unroll ceremony replayed`);
    else if (e.fullLoad) reasons.push(`${e.target}: full document load`);
  }
  console.log(JSON.stringify({
    verdict: reasons.length ? "RED" : "green",
    fullLoads: edges.filter((e) => e.fullLoad).length,
    ceremonies: edges.filter((e) => e.ceremony).length,
    of: edges.length,
    reasons,
  }));
  if (reasons.length) process.exitCode = 1;
} finally {
  chrome.kill();
  if (server) server.kill();
  setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500);
}
