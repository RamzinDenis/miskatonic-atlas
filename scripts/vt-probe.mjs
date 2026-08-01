/**
 * Measures the phases of the atlas's view transitions on a production build,
 * per navigation edge — the feedback loop for «the turn hangs / the old page
 * won't leave» bugs, which no unit seam can catch (the vitest environment
 * runs the npm react, which has no ViewTransition; the app runs Next's
 * vendored canary).
 *
 * Drives a headless Chrome over raw CDP — no dependencies beyond Node 22's
 * global fetch/WebSocket. Emulates a phone (390x844 @3x), throttles CPU and
 * network, patches document.startViewTransition and reports, per edge:
 *
 *   clickToStart  router work before the transition (RSC fetch, render)
 *   commit        the update callback — React swapping the pages; the old
 *                 frame is FROZEN on screen for all of it
 *   toReady       freeze incl. snapshot capture (≈ commit here)
 *   animMs        the animation window (globals.css budgets ~470ms)
 *   maxAnimGap    worst rAF stall inside the window — main-thread jank that
 *                 WebKit shows as the turn hanging mid-flight
 *   longtasks     ≥50ms tasks, charged to the phase they start in:
 *                 pre | freeze | ANIM | after. ANIM must stay empty: WebKit
 *                 freezes even accelerated animations while the render tree
 *                 is rebuilt, so a leaflet burst there is the visible hang.
 *
 * Usage:
 *   npm run build && npx next start -p 3777
 *   node scripts/vt-probe.mjs [--cpu=20] [--base=http://localhost:3777]
 *   node scripts/vt-probe.mjs --switch=10 [--only=switch]
 *
 * --switch=N adds the region-switching loop: one tab, N cycles of
 * / → pacific → desert → /, clicked through the Regions cartouche the way a
 * phone reader does it. Per edge it reports the usual phases plus whether the
 * unroll ceremony replayed (a greeting on a mere switch is a regression);
 * per edge after settle it garbage-collects and samples Performance metrics.
 * The verdict line goes red — exit 1 — on a rising heap/node/listener slope
 * (the memory leak that ends in a WebKit jetsam on a real iPhone), on a
 * replaced leaflet container (a switch tearing the map down in the commit —
 * the burst and double-map peak behind the phone crashes), or on a
 * freeze/ANIM longtask clear of the app's own navigation floor.
 * Chrome is looked for at CHROME_PATH, then the usual Windows locations.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CPU = Number((process.argv.find((a) => a.startsWith("--cpu=")) ?? "--cpu=20").split("=")[1]);
const BASE = (process.argv.find((a) => a.startsWith("--base=")) ?? "--base=http://localhost:3777").split("=")[1];
const SWITCH = Number((process.argv.find((a) => a.startsWith("--switch=")) ?? "--switch=0").split("=")[1]);
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "--only=").split("=")[1];
const PORT = 9777;
const CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].find((p) => p && existsSync(p));
if (!CHROME) {
  console.error("Chrome not found; set CHROME_PATH");
  process.exit(1);
}

const INSTRUMENT = `(() => {
  if (window.__vtPatched) return; window.__vtPatched = true;
  const runs = []; window.__vtRuns = runs;
  window.__lastClick = null;
  addEventListener('click', () => { window.__lastClick = performance.now(); }, true);
  const lt = []; window.__longtasks = lt;
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => lt.push({ s: e.startTime, d: e.duration })))
      .observe({ entryTypes: ['longtask'] });
  } catch {}
  const orig = document.startViewTransition;
  if (!orig) { window.__vtUnsupported = true; return; }
  document.startViewTransition = function (...args) {
    const run = { idx: runs.length, click: window.__lastClick, start: performance.now(),
      updateDone: null, ready: null, finished: null, raf: [], err: null };
    runs.push(run);
    let stop = false;
    const tick = () => { run.raf.push(performance.now()); if (!stop && run.raf.length < 600) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    let vt;
    try { vt = orig.apply(this, args); } catch (e) { run.err = String(e); stop = true; throw e; }
    vt.updateCallbackDone.then(() => { run.updateDone = performance.now(); }, (e) => { run.err = 'update:' + e; });
    vt.ready.then(() => { run.ready = performance.now(); }, (e) => { run.err = (run.err || '') + '|ready:' + e; });
    vt.finished.then(() => { run.finished = performance.now();
      run.printedAtFinish = !!document.querySelector('.world-map--printed');
      setTimeout(() => { stop = true; }, 250); },
      () => { stop = true; });
    return vt;
  };
  window.__vtWait = (idx, timeoutMs) => new Promise((resolve) => {
    const t0 = Date.now();
    const poll = () => {
      const r = runs[idx];
      if (r && (r.finished !== null || r.err)) return setTimeout(() => resolve(JSON.stringify(r)), 1200);
      if (Date.now() - t0 > timeoutMs) return resolve(JSON.stringify(r ?? { timeout: true }));
      setTimeout(poll, 50);
    };
    poll();
  });
})();`;

// ---------------------------------------------------------------- CDP client
let msgId = 0;
const pending = new Map();
const eventWaiters = [];
let ws;

function send(method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

function waitEvent(method, sessionId, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const i = eventWaiters.indexOf(w);
      if (i >= 0) eventWaiters.splice(i, 1);
      reject(new Error(`timeout waiting ${method}`));
    }, timeoutMs);
    const w = { method, sessionId, resolve: (p) => { clearTimeout(timer); resolve(p); } };
    eventWaiters.push(w);
  });
}

function onMessage(data) {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject, method } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
    else resolve(msg.result);
    return;
  }
  for (let i = 0; i < eventWaiters.length; i++) {
    const w = eventWaiters[i];
    if (w.method === msg.method && (!w.sessionId || w.sessionId === msg.sessionId)) {
      eventWaiters.splice(i, 1);
      w.resolve(msg.params);
      return;
    }
  }
}

async function evalIn(sessionId, expression, { awaitPromise = false } = {}) {
  const r = await send("Runtime.evaluate", {
    expression, awaitPromise, returnByValue: true, userGesture: true,
  }, sessionId);
  if (r.exceptionDetails) throw new Error("page eval failed: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
  return r.result.value;
}

// ------------------------------------------------------------------ scenario
async function newSession() {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Network.enable", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 844, deviceScaleFactor: 3, mobile: true,
  }, sessionId);
  await send("Network.emulateNetworkConditions", {
    offline: false, latency: 60,
    downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (2 * 1024 * 1024) / 8,
  }, sessionId);
  await send("Emulation.setCPUThrottlingRate", { rate: CPU }, sessionId);
  await send("Page.addScriptToEvaluateOnNewDocument", { source: INSTRUMENT }, sessionId);
  await send("Performance.enable", {}, sessionId);
  await send("HeapProfiler.enable", {}, sessionId);
  return { targetId, sessionId };
}

async function sampleMetrics(sessionId, { gc = false } = {}) {
  if (gc) await send("HeapProfiler.collectGarbage", {}, sessionId).catch(() => {});
  const { metrics } = await send("Performance.getMetrics", {}, sessionId);
  const of = (name) => metrics.find((m) => m.name === name)?.value ?? null;
  return {
    heap: of("JSHeapUsedSize"),
    nodes: of("Nodes"),
    listeners: of("JSEventListeners"),
    documents: of("Documents"),
    layouts: of("LayoutCount"),
  };
}

async function settle(sessionId, readyExpr, extraMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < 25000) {
    const ok = await evalIn(sessionId, readyExpr).catch(() => false);
    if (ok) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, extraMs));
}

async function runScenario({ name, startUrl, readyExpr, extraMs, pre = [], clickSel, expectPath }) {
  const { targetId, sessionId } = await newSession();
  try {
    await send("Page.navigate", { url: BASE + startUrl }, sessionId);
    await waitEvent("Page.loadEventFired", sessionId, 30000).catch(() => {});
    await settle(sessionId, readyExpr, extraMs);

    // Unmeasured hops before the measured one — a return to the chart is a
    // different mount than a first coming, and only a same-tab journey can
    // say so (the widget's evaluated-flag lives in the tab's module registry).
    for (const hop of pre) {
      await evalIn(sessionId, `document.querySelector(${JSON.stringify(hop.clickSel)})?.click()`);
      await settle(sessionId, hop.readyExpr, hop.extraMs);
    }

    const result = await evalIn(sessionId, `(async () => {
      const pre = window.__vtRuns ? window.__vtRuns.length : -1;
      if (window.__vtUnsupported) return JSON.stringify({ unsupported: true });
      if (pre < 0) return JSON.stringify({ notPatched: true });
      const el = document.querySelector(${JSON.stringify(clickSel)});
      if (!el) return JSON.stringify({ noEl: true });
      el.click();
      const raw = await window.__vtWait(pre, 20000);
      const r = JSON.parse(raw);
      r.path = location.pathname;
      r.longtasks = (window.__longtasks || [])
        .filter((t) => t.s >= (r.click ?? r.start ?? 0) - 100 && t.s <= (r.finished ?? Infinity) + 1100);
      return JSON.stringify(r);
    })()`, { awaitPromise: true });

    const r = JSON.parse(result);
    return { name, expectPath, ...analyze(r) };
  } finally {
    await send("Target.closeTarget", { targetId }).catch(() => {});
  }
}

function analyze(r) {
  if (r.timeout || r.noEl || r.unsupported || r.notPatched) return { raw: r };
  const gaps = [];
  for (let i = 1; i < (r.raf?.length ?? 0); i++) gaps.push([r.raf[i - 1], r.raf[i] - r.raf[i - 1]]);
  const inWindow = (t, a, b) => t >= (a ?? -Infinity) && t <= (b ?? Infinity);
  const animGaps = gaps.filter(([t]) => inWindow(t, r.ready, r.finished)).map(([, g]) => g);
  const round = (x) => (x == null ? null : Math.round(x));
  // Which phase of the transition each longtask overlaps (a task can span
  // phases; it is charged to the phase it starts in).
  const phaseOf = (t) => {
    if (r.start != null && t.s < r.start) return "pre";
    if (r.ready != null && t.s < r.ready) return "freeze";
    if (r.finished != null && t.s < r.finished) return "ANIM";
    return "after";
  };
  return {
    path: r.path,
    err: r.err ?? null,
    // Arrivals at a chart only: was the paper already printed when the turn
    // ended? A warm return must say true — false there is the loader flash.
    printedAtFinish: r.printedAtFinish ?? null,
    clickToStart: round(r.start - (r.click ?? r.start)),
    commit: round(r.updateDone - r.start),
    toReady: round(r.ready - r.start),
    animMs: round(r.finished - r.ready),
    total: round(r.finished - (r.click ?? r.start)),
    firstFrameAfterStart: round((r.raf?.[0] ?? r.start) - r.start),
    maxAnimGap: round(animGaps.length ? Math.max(...animGaps) : null),
    frames: r.raf?.length ?? 0,
    longtasks: (r.longtasks ?? []).map((t) => ({
      phase: phaseOf(t),
      offset: round(t.s - r.start),
      ms: Math.round(t.d),
    })),
  };
}

// ------------------------------------------------------------- switch loop
/* The region-switch loop lives in ONE tab: leaks only show up when the same
   document survives many switches, and the widget's warm/evaluated flags
   live in the tab's module registry. */

const MAP_SETTLED = `!!document.querySelector('.world-map--printed') && !document.querySelector('.world-map--unrolling')`;

// The cartouche starts closed at 390px, and (before the persistent-map fix)
// every remount closes it again — reopen whenever the nav is gone, like a
// reader's extra tap.
const OPEN_REGIONS = `(async () => {
  const NAV = 'nav[aria-label="Regions of the atlas"]';
  if (!document.querySelector(NAV)) {
    [...document.querySelectorAll('button')]
      .find((b) => b.textContent.trim().startsWith('Regions'))?.click();
  }
  const t0 = Date.now();
  while (!document.querySelector(NAV) && Date.now() - t0 < 3000)
    await new Promise((r) => setTimeout(r, 100));
  return !!document.querySelector(NAV);
})()`;

function leastSquaresSlope(ys) {
  const n = ys.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (ys[i] - yMean); den += (i - xMean) ** 2; }
  return num / den;
}

async function runSwitchLoop(cycles) {
  const { targetId, sessionId } = await newSession();
  const WARMUP_CYCLES = 2;
  const edges = [];
  try {
    await send("Page.navigate", { url: BASE + "/" }, sessionId);
    await waitEvent("Page.loadEventFired", sessionId, 30000).catch(() => {});
    await settle(sessionId, MAP_SETTLED, 2500);

    const targets = ["/maps/pacific", "/maps/desert", "/"];
    for (let cycle = 0; cycle < cycles; cycle++) {
      for (const target of targets) {
        const name = `switch ${cycle + 1}.${targets.indexOf(target) + 1} -> ${target}`;
        const navOpen = await evalIn(sessionId, OPEN_REGIONS, { awaitPromise: true });
        if (!navOpen) { edges.push({ name, raw: { noNav: true } }); continue; }
        const sel = `nav[aria-label="Regions of the atlas"] a[href="${target}"]`;
        const result = await evalIn(sessionId, `(async () => {
          const pre = window.__vtRuns ? window.__vtRuns.length : -1;
          if (window.__vtUnsupported) return JSON.stringify({ unsupported: true });
          if (pre < 0) return JSON.stringify({ notPatched: true });
          const el = document.querySelector(${JSON.stringify(sel)});
          if (!el) return JSON.stringify({ noEl: true });
          // The cure is a map that survives the switch: remember the live
          // container and ask afterwards whether it is still the same node.
          window.__probeContainer = document.querySelector('.leaflet-container');
          el.click();
          const raw = await window.__vtWait(pre, 20000);
          const r = JSON.parse(raw);
          r.path = location.pathname;
          // A greeting on a mere switch is a regression: the ceremony
          // belongs to full document loads only.
          r.unrollAfter = !!document.querySelector('.chart-unroll, .world-map--unrolling');
          r.longtasks = (window.__longtasks || [])
            .filter((t) => t.s >= (r.click ?? r.start ?? 0) - 100 && t.s <= (r.finished ?? Infinity) + 1100);
          return JSON.stringify(r);
        })()`, { awaitPromise: true });
        const r = JSON.parse(result);
        await settle(sessionId, MAP_SETTLED, 800);
        const mapReused = await evalIn(sessionId,
          `document.querySelector('.leaflet-container') === window.__probeContainer`);
        const peak = await sampleMetrics(sessionId);
        const settled = await sampleMetrics(sessionId, { gc: true });
        edges.push({ name, warmup: cycle < WARMUP_CYCLES, ...analyze(r),
          unrollAfter: r.unrollAfter ?? null, mapReused, peak, settled });
      }
    }
  } finally {
    await send("Target.closeTarget", { targetId }).catch(() => {});
  }

  for (const e of edges) console.log(JSON.stringify(e));

  // ---- verdict: red on a rising slope or a burst inside the transition.
  const measured = edges.filter((e) => !e.warmup && e.settled);
  const series = (pick) => measured.map((e) => pick(e.settled)).filter((v) => v != null);
  const slopes = {
    heapPerEdge: Math.round(leastSquaresSlope(series((s) => s.heap))),
    nodesPerEdge: Math.round(leastSquaresSlope(series((s) => s.nodes)) * 10) / 10,
    listenersPerEdge: Math.round(leastSquaresSlope(series((s) => s.listeners)) * 10) / 10,
  };
  const documentsSeries = series((s) => s.documents);
  const reasons = [];
  if (slopes.heapPerEdge > 150 * 1024) reasons.push(`heap climbs ${slopes.heapPerEdge} B/edge`);
  if (slopes.nodesPerEdge > 10) reasons.push(`DOM nodes climb ${slopes.nodesPerEdge}/edge`);
  if (slopes.listenersPerEdge > 2) reasons.push(`listeners climb ${slopes.listenersPerEdge}/edge`);
  if (documentsSeries.length && Math.max(...documentsSeries) > documentsSeries[0])
    reasons.push(`detached documents: ${documentsSeries[0]} -> ${Math.max(...documentsSeries)}`);
  for (const e of measured) {
    /* The defect itself: a switch that rebuilds leaflet instead of swapping
       the sheet under the live map. Longtasks can't separate it from the
       floor — at --cpu=20 even a text→text turn runs 350-700ms of freeze
       (route commit + VT snapshot capture), and the teardown burst sat in
       the same band — so the container's identity is the assertion, and the
       longtask gate only catches regressions clear of that floor. */
    if (e.mapReused === false) reasons.push(`${e.name}: leaflet rebuilt (container replaced)`);
    const bursts = (e.longtasks ?? []).filter((t) => (t.phase === "freeze" || t.phase === "ANIM") && t.ms >= 800);
    if (bursts.length) reasons.push(`${e.name}: ${bursts.map((b) => `${b.phase} ${b.ms}ms`).join(", ")}`);
    if (e.printedAtFinish === false) reasons.push(`${e.name}: loader flash (printedAtFinish=false)`);
    if (e.unrollAfter) reasons.push(`${e.name}: unroll ceremony replayed`);
  }
  const verdict = { verdict: reasons.length ? "RED" : "green", slopes,
    documents: documentsSeries.length ? [documentsSeries[0], Math.max(...documentsSeries)] : null,
    edgesMeasured: measured.length, reasons };
  console.log(JSON.stringify(verdict));
  if (reasons.length) process.exitCode = 1;
}

// ---------------------------------------------------------------------- main
const profile = mkdtempSync(join(tmpdir(), "vt-probe-chrome-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
  "--disable-backgrounding-occluded-windows",
  "about:blank",
], { stdio: "ignore" });

try {
  let version;
  for (let i = 0; i < 50; i++) {
    version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null);
    if (version) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!version) throw new Error("chrome did not open the debugging port");
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (e) => onMessage(e.data);

  const TEXT_READY = `document.readyState === 'complete' && !!document.querySelector('header a[href="/"]')`;
  const MAP_READY = `!!document.querySelector('.world-map--printed') && !document.querySelector('.world-map--unrolling')`;

  const scenarios = [
    { name: "control text->text (/creatures -> /contents)", startUrl: "/creatures",
      readyExpr: TEXT_READY, extraMs: 1500, clickSel: 'a[href="/contents"]', expectPath: "/contents" },
    { name: "control text->text (/about -> /creatures)", startUrl: "/about",
      readyExpr: TEXT_READY, extraMs: 1500, clickSel: 'a[href="/creatures"]', expectPath: "/creatures" },
    { name: "control text->text (/locations/arkham -> /creatures)", startUrl: "/locations/arkham",
      readyExpr: TEXT_READY, extraMs: 1500, clickSel: 'a[href="/creatures"]', expectPath: "/creatures" },
    { name: "COLD text->map (/locations/arkham -> /)", startUrl: "/locations/arkham",
      readyExpr: TEXT_READY, extraMs: 1500, clickSel: 'header a[href="/"]', expectPath: "/" },
    { name: "map->LIGHT text (/ -> /about)", startUrl: "/",
      readyExpr: MAP_READY, extraMs: 2500, clickSel: 'a[href="/about"]', expectPath: "/about" },
    { name: "map->HEAVY text (/ -> /creatures)", startUrl: "/",
      readyExpr: MAP_READY, extraMs: 2500, clickSel: 'a[href="/creatures"]', expectPath: "/creatures" },
    { name: "WARM text->map (/locations/arkham -> /)", startUrl: "/locations/arkham",
      readyExpr: TEXT_READY, extraMs: 1500, clickSel: 'header a[href="/"]', expectPath: "/" },
    { name: "RETURN same-tab (/ -> /creatures -> /)", startUrl: "/",
      readyExpr: MAP_READY, extraMs: 2500,
      pre: [{ clickSel: 'a[href="/creatures"]', readyExpr: TEXT_READY, extraMs: 2000 }],
      clickSel: 'header a[href="/"]', expectPath: "/" },
    /* Past DORMANT_AFTER_MS (3s) the keeper display:none's the parked map;
       this return crosses that line and must still print on arrival —
       printedAtFinish=false here is the wake path (invalidateSize) broken. */
    { name: "RETURN after DORMANCY (/ -> /creatures 4s -> /)", startUrl: "/",
      readyExpr: MAP_READY, extraMs: 2500,
      pre: [{ clickSel: 'a[href="/creatures"]', readyExpr: TEXT_READY, extraMs: 4200 }],
      clickSel: 'header a[href="/"]', expectPath: "/" },
  ];

  console.log(JSON.stringify({ cpuThrottle: CPU, base: BASE, chrome: version.Browser }));
  if (ONLY !== "switch") {
    for (const s of scenarios) {
      const out = await runScenario(s).catch((e) => ({ name: s.name, error: String(e) }));
      console.log(JSON.stringify(out));
    }
  }
  if (SWITCH > 0) await runSwitchLoop(SWITCH);
} finally {
  chrome.kill();
  setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500);
}
