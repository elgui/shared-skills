#!/usr/bin/env bun
/* Lightboard tool: scaffold, upgrade and check a course. See Course.help.md.
 *
 *   bun Course.ts new     <project-dir> --title "…" [--lang en] [--unit Lesson] [--key slug.v1]
 *   bun Course.ts upgrade <site-dir>
 *   bun Course.ts check   <site-dir> [--quick] [--pages 04-colour.html,index.html] [--accept-flag-drop]
 *   bun Course.ts shot    <file.html> [--w 380] [--h 820] [--full] [--out x.jpg] [--y 1200]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, statSync, rmSync, chmodSync } from "fs";
import { join, resolve, dirname, basename, relative } from "path";
import { homedir } from "os";
import { createHash } from "crypto";

const SKILL = resolve(dirname(new URL(import.meta.url).pathname), "..");
const RUNTIME = join(SKILL, "runtime");
const TEMPLATES = join(SKILL, "templates");
const RUNTIME_FILES = ["course.js", "course.css", "scroll.js", "scroll.css", "kit.js"];

const argv = process.argv.slice(2);
const cmd = argv[0];
const positional: string[] = [];
const flags: Record<string, string | boolean> = {};
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) { const k = a.slice(2); const n = argv[i + 1]; if (n !== undefined && !n.startsWith("--")) { flags[k] = n; i++; } else flags[k] = true; }
  else positional.push(a);
}
function die(msg: string): never { console.error("course: " + msg); process.exit(2); }
const sha = (p: string) => createHash("sha1").update(readFileSync(p)).digest("hex");

/* ------------------------------------------------------------------ new */

function copyTree(src: string, dst: string, subst: (s: string) => string) {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = join(src, name), d = join(dst, name);
    if (statSync(s).isDirectory()) copyTree(s, d, subst);
    else if (/\.(html|js|css|md|sh|txt)$/.test(name) && !name.startsWith("OFL")) writeFileSync(d, subst(readFileSync(s, "utf8")));
    else copyFileSync(s, d);
  }
}
function cmdNew() {
  const dir = positional[0]; if (!dir) die("new: give a project directory");
  const title = String(flags.title || ""); if (!title) die('new: --title "…" is required');
  if (existsSync(join(dir, "site"))) die(`new: ${dir}/site already exists; use upgrade for an existing course`);
  const slug = basename(resolve(dir)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "course";
  const vars: Record<string, string> = {
    TITLE: title, LANG: String(flags.lang || "en"), UNIT: String(flags.unit || "Lesson"),
    KEY: String(flags.key || slug + ".v1"), SLUG: slug, DATE: new Date().toISOString().slice(0, 10),
  };
  const subst = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
  copyTree(join(TEMPLATES, "project"), dir, subst);
  copyTree(join(TEMPLATES, "site"), join(dir, "site"), subst);
  for (const f of RUNTIME_FILES) copyFileSync(join(RUNTIME, f), join(dir, "site", "assets", f));
  mkdirSync(join(dir, "research"), { recursive: true });
  // The user's own publish template, written once for their host, beats the generic one.
  const userDeploy = process.env.LIGHTBOARD_DEPLOY || join(homedir(), ".config", "lightboard", "deploy.sh");
  const ownDeploy = existsSync(userDeploy);
  if (ownDeploy) writeFileSync(join(dir, "deploy.sh"), subst(readFileSync(userDeploy, "utf8")));
  if (existsSync(join(dir, "deploy.sh"))) chmodSync(join(dir, "deploy.sh"), 0o755);
  console.log(`created ${dir}
  site/          the course (open site/index.html; publish this folder)
  site/assets/   runtime files are copied, never edited: ${RUNTIME_FILES.join(", ")}
                 yours: course-data.js, identity.css, figures.js, fonts/
  research/      sourced notes, one file per topic
  intake.md, plan.md, deploy.sh${ownDeploy ? ` (from ${userDeploy})` : " (generic: set DEST and URL before publishing)"}
next: fill intake.md (workflows/Intake.md), then research, then plan.md.`);
}

/* ------------------------------------------------------------------ upgrade */

function cmdUpgrade() {
  const site = positional[0]; if (!site || !existsSync(join(site, "assets"))) die("upgrade: give a site directory (the one with assets/)");
  for (const f of RUNTIME_FILES) {
    const src = join(RUNTIME, f), dst = join(site, "assets", f);
    if (existsSync(dst) && sha(src) === sha(dst)) { console.log(`  same      ${f}`); continue; }
    const had = existsSync(dst);
    copyFileSync(src, dst); console.log(`  ${had ? "updated" : "added"}   ${f}`);
  }
  console.log("run check next: an upgrade can change layout.");
}

/* ------------------------------------------------------------------ report */

type Level = "PASS" | "WARN" | "FAIL";
class Report {
  rows: [Level, string, string][] = [];
  ok(c: string, d = "") { this.rows.push(["PASS", c, d]); }
  warn(c: string, d: string) { this.rows.push(["WARN", c, d]); }
  fail(c: string, d: string) { this.rows.push(["FAIL", c, d]); }
  get failed() { return this.rows.some((r) => r[0] === "FAIL"); }
  text() {
    const order = { FAIL: 0, WARN: 1, PASS: 2 };
    const rows = [...this.rows].sort((a, b) => order[a[0]] - order[b[0]]);
    const n = (l: Level) => this.rows.filter((r) => r[0] === l).length;
    return rows.map((r) => `${r[0]}  ${r[1]}${r[2] ? "  " + r[2] : ""}`).join("\n") + `\n\n${n("FAIL")} fail, ${n("WARN")} warn, ${n("PASS")} pass`;
  }
}

/* ------------------------------------------------------------------ static checks */

function loadCourse(site: string): any {
  const p = join(site, "assets", "course-data.js");
  if (!existsSync(p)) return null;
  const win: any = {};
  try { new Function("window", readFileSync(p, "utf8"))(win); } catch (e) { return { __error: String(e) }; }
  return win.COURSE || null;
}
function htmlFiles(site: string) { return readdirSync(site).filter((f) => f.endsWith(".html")).sort(); }

function staticChecks(site: string, C: any, rep: Report) {
  if (!C) { rep.fail("course-data", "assets/course-data.js missing or does not set window.COURSE"); return; }
  if (C.__error) { rep.fail("course-data", "throws: " + C.__error); return; }
  for (const k of ["title", "key", "lessons", "rooms"]) if (!C[k]) rep.fail("course-data", `COURSE.${k} is missing`);
  const missing = (C.lessons || []).filter((l: any) => !existsSync(join(site, l.f))).map((l: any) => l.f);
  missing.length ? rep.fail("lesson files", "listed but absent: " + missing.join(", ")) : rep.ok("lesson files", `${(C.lessons || []).length} lessons`);
  const roomKeys = Object.keys(C.rooms || {});
  if (roomKeys.length < 2) rep.warn("rooms", "fewer than two rooms: the learner's own two-room frame is part of the contract (Doctrine §3)");

  /* runtime drift */
  const drift = RUNTIME_FILES.filter((f) => !existsSync(join(site, "assets", f)) || sha(join(site, "assets", f)) !== sha(join(RUNTIME, f)));
  drift.length ? rep.warn("runtime", `differs from the skill: ${drift.join(", ")} (Course.ts upgrade; runtime files are never edited in a course)`) : rep.ok("runtime", "matches the skill");

  /* identity */
  const idp = join(site, "assets", "identity.css");
  if (!existsSync(idp)) rep.fail("identity", "assets/identity.css missing");
  else if (readFileSync(idp, "utf8").includes("cs:default-identity")) rep.warn("identity", "still the template's placeholder identity; derive one from the subject (Identity.md)");
  else rep.ok("identity", "derived");

  /* zero network: every file the site ships */
  const offenders: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!/\.(html|css|js)$/.test(f)) continue;
      const s = readFileSync(p, "utf8"), rel = relative(site, p);
      const pats: [RegExp, string][] = [
        [/<(script|img|iframe|source|video|audio|embed)\b[^>]*\bsrc\s*=\s*["']?(https?:)?\/\//gi, "remote src"],
        [/<link\b[^>]*\bhref\s*=\s*["']?(https?:)?\/\//gi, "remote <link>"],
        [/@import\s+(url\()?\s*["']?(https?:)?\/\//gi, "@import"],
        [/url\(\s*["']?(https?:)?\/\//gi, "remote url()"],
        [/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/g, "network call"],
      ];
      for (const [re, what] of pats) if (re.test(s)) offenders.push(`${rel} (${what})`);
    }
  };
  walk(site);
  offenders.length ? rep.fail("offline", offenders.join("; ")) : rep.ok("offline", "no remote resource or network call in any shipped file");

  /* keys used in pages resolve */
  const G = C.glossary || {}, S = C.sources || {};
  const badG = new Set<string>(), badS = new Set<string>(), usedS = new Set<string>();
  for (const f of htmlFiles(site)) {
    const s = readFileSync(join(site, f), "utf8");
    for (const m of s.matchAll(/data-g="([^"]+)"/g)) if (!G[m[1]]) badG.add(`${m[1]} (${f})`);
    for (const m of s.matchAll(/data-k="([^"]+)"/g)) { usedS.add(m[1]); if (!S[m[1]]) badS.add(`${m[1]} (${f})`); }
  }
  badG.size ? rep.fail("glossary keys", [...badG].join(", ")) : rep.ok("glossary keys", `${Object.keys(G).length} entries, all used keys resolve`);
  badS.size ? rep.fail("source keys", [...badS].join(", ")) : rep.ok("source keys", `${Object.keys(S).length} sources, all used keys resolve`);
  const unused = Object.keys(S).filter((k) => !usedS.has(k));
  if (unused.length) rep.warn("sources unused", `${unused.length} never cited on a page: ${unused.slice(0, 8).join(", ")}${unused.length > 8 ? "…" : ""}`);
  const badUrl = Object.entries(S).filter(([, v]: any) => !Array.isArray(v) || !v[1] || !/^(https?:\/\/|[\w./-]+\.(txt|html|pdf|md)$)/.test(v[1])).map(([k]) => k);
  if (badUrl.length) rep.fail("source urls", "not a link: " + badUrl.join(", "));

  /* leftovers from the templates */
  for (const f of htmlFiles(site)) {
    const s = readFileSync(join(site, f), "utf8");
    if (/\[\[[^\]]+\]\]/.test(s)) rep.fail("placeholders", `${f}: [[…]] left in the page`);
    if (/<!--\s*RULE/.test(s)) rep.warn("rule comments", `${f}: template RULE comments left in (readable with view-source)`);
  }
}

/* the flag ledger: a red "check" flag may never silently disappear */
function flagLedger(site: string, outDir: string, rep: Report) {
  const counts: Record<string, number> = {};
  for (const f of htmlFiles(site)) counts[f] = (readFileSync(join(site, f), "utf8").match(/class="[^"]*\bcheck\b[^"]*"/g) || []).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const p = join(outDir, "flags.json");
  const prev: Record<string, number> = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
  const dropped = Object.keys(prev).filter((f) => (counts[f] || 0) < prev[f]).map((f) => `${f} ${prev[f]}→${counts[f] || 0}`);
  if (dropped.length && !flags["accept-flag-drop"]) {
    rep.fail("flag ledger", `fewer "check" flags than last run: ${dropped.join(", ")}. A flag goes only when a source or a test at the machine confirms the claim; record it in research/, then re-run with --accept-flag-drop`);
    return;
  }
  writeFileSync(p, JSON.stringify(counts, null, 1));
  rep.ok("flag ledger", `${total} flags across ${Object.keys(counts).length} pages${dropped.length ? " (drop accepted: " + dropped.join(", ") + ")" : ""}`);
}

/* ------------------------------------------------------------------ browser */

function findChromium(): string | null {
  if (process.env.CS_CHROME && existsSync(process.env.CS_CHROME)) return process.env.CS_CHROME;
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), ".cache", "ms-playwright");
  if (!existsSync(cache)) return null;
  for (const d of readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse())
    for (const rel of ["chrome-linux64/chrome", "chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-win/chrome.exe"]) {
      const p = join(cache, d, rel); if (existsSync(p)) return p;
    }
  return null;
}
/* One browser per command (inherited from ProposalScroll's engine notes: a second launch in one Bun process
   lost its DevTools pipe). */
let browser: any = null;
async function openBrowser() {
  if (browser) return browser;
  let chromium: any;
  try { ({ chromium } = await import(join(SKILL, "tools", "node_modules", "playwright-core", "index.mjs"))); }
  catch { die(`playwright-core not installed: cd ${join(SKILL, "tools")} && bun install`); }
  const exe = findChromium(); if (!exe) die("no Chromium found (set CS_CHROME, or: npx playwright install chromium)");
  browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars", "--force-color-profile=srgb"] });
  return browser;
}

const VPS = [{ name: "phone", width: 380, height: 820 }, { name: "desktop", width: 1280, height: 860 }];

async function newPage(opts: { vp: any; js?: boolean; reduced?: boolean }, sink: string[]) {
  const ctx = await browser.newContext({ viewport: { width: opts.vp.width, height: opts.vp.height }, javaScriptEnabled: opts.js !== false, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  page.on("console", (m: any) => { if (m.type() === "error") sink.push("console: " + m.text()); });
  page.on("pageerror", (e: any) => sink.push("error: " + String(e)));
  page.on("request", (r: any) => { if (!r.url().startsWith("file:") && !r.url().startsWith("data:")) sink.push("network: " + r.url()); });
  page.on("requestfailed", (r: any) => { if (r.url().startsWith("file:")) sink.push("missing file: " + r.url().replace(/^file:\/\//, "")); });
  return { ctx, page };
}

/* evaluated in the page: structure of a lesson */
const LESSON_PROBE = `(() => {
  const C = window.COURSE || {}, rooms = Object.keys(C.rooms || {});
  const q = (s, r) => Array.from((r || document).querySelectorAll(s));
  const exs = q('.ex');
  const out = { ideas: q('.idea').length, h1: !!document.querySelector('.lesson-head h1, h1'), exs: exs.length, problems: [], walks: [], words: [] };
  exs.forEach((ex, i) => {
    const name = (ex.querySelector('h3') || {}).textContent || ('exercise ' + (i + 1));
    if (!rooms.some(r => ex.classList.contains(r))) out.problems.push(name + ': no room class (' + rooms.join('/') + ')');
    if (!ex.dataset.min) out.problems.push(name + ': no data-min');
    if (!ex.querySelector('.win')) out.problems.push(name + ': no .win success condition');
  });
  if (exs.length && !exs[exs.length - 1].classList.contains('encore')) out.problems.push('the last exercise is not the .encore');
  if (q('.ex.encore').length > 1) out.problems.push('more than one .encore');
  const cp = document.querySelector('.checkpoint');
  if (!cp) out.problems.push('no .checkpoint');
  else if (exs.length && (exs[exs.length - 1].compareDocumentPosition(cp) & Node.DOCUMENT_POSITION_FOLLOWING) === 0) out.problems.push('.checkpoint is not after the last exercise');
  q('.walk').forEach(w => {
    const steps = q('.walk-steps > li', w), keys = [];
    q('[data-set]', w).forEach(s => (s.getAttribute('data-set') || '').split(';').forEach(c => { const m = c.match(/^\\s*(\\d+)\\s*:/); if (m) keys.push(+m[1]); }));
    out.walks.push({ id: w.id, fig: !!w.querySelector('.walk-fig'), n: steps.length, maxKey: keys.length ? Math.max.apply(null, keys) : 0,
      raw: q('.walk-fig [data-in],.walk-fig [data-out],.walk-fig [data-at],.walk-fig [data-on]', w).length, setters: q('.walk-fig [data-set]', w).length });
    steps.forEach((li, i) => { const n = (li.textContent || '').trim().split(/\\s+/).length; if (n > 80) out.words.push(w.id + ' step ' + (i + 1) + ': ' + n + ' words'); });
  });
  out.missingTips = q('.tip-missing').map(t => t.textContent.trim()).slice(0, 6);
  out.missingSrc = q('a.src-missing').length;
  out.flags = q('.check').length;
  return out;
})()`;

const OVERFLOW_PROBE = `(() => {
  const W = document.documentElement.clientWidth, out = [];
  const over = document.documentElement.scrollWidth - W;
  if (over > 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > W + 1 && !el.closest('.scroll') && getComputedStyle(el).position !== 'fixed') {
        out.push((el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) + ' +' + Math.round(r.right - W) + 'px');
        if (out.length > 5) break;
      }
    }
  }
  const tiny = [];
  for (const el of document.querySelectorAll('main *:not(svg):not(svg *):not(a.src)')) {
    if (!el.childNodes.length || !Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (parseFloat(cs.fontSize) < 11) { tiny.push(el.tagName.toLowerCase() + ' ' + cs.fontSize); if (tiny.length > 4) break; }
  }
  return { over, out, tiny };
})()`;

async function checkPage(site: string, file: string, C: any, rep: Report, shotsDir: string, quick: boolean, shots: string[]) {
  const url = "file://" + resolve(site, file);
  const isLesson = (C.lessons || []).some((l: any) => l.f === file);
  const tag = file.replace(/\.html$/, "");
  const vps = quick ? [VPS[0]] : VPS;
  for (const vp of vps) {
    const sink: string[] = [];
    const { ctx, page } = await newPage({ vp }, sink);
    await page.goto(url);
    try { await page.waitForFunction("document.readyState === 'complete' && (!document.querySelector('.walk') || (window.CS && CS.ready))", null, { timeout: 5000 }); }
    catch { rep.fail(`${file} boot`, `${vp.name}: the scroll engine never became ready (scroll.js not loaded?)`); }
    await page.waitForTimeout(150);
    const ov: any = await page.evaluate(OVERFLOW_PROBE);
    if (vp.name === "phone") {
      ov.over > 1 ? rep.fail(`${file} 380px`, `horizontal scroll of ${ov.over}px: ${ov.out.join(", ")}`) : rep.ok(`${file} 380px`, "no horizontal scroll");
      if (ov.tiny.length) rep.warn(`${file} 380px`, "text under 11px: " + ov.tiny.join(", "));
    }
    if (vp.name === "desktop" || quick) {
      if (isLesson) {
        const L: any = await page.evaluate(LESSON_PROBE);
        const probs = [...L.problems];
        if (L.ideas !== 1) probs.push(`${L.ideas} .idea paragraphs (one per lesson)`);
        if (!L.exs) probs.push("no exercise");
        probs.length ? rep.fail(`${file} lesson`, probs.join("; ")) : rep.ok(`${file} lesson`, `${L.exs} exercises, encore last, checkpoint`);
        if (L.missingTips.length) rep.fail(`${file} glossary`, "tooltips with no entry: " + L.missingTips.join(", "));
        if (L.missingSrc) rep.fail(`${file} sources`, `${L.missingSrc} source marks with no entry`);
        if (L.words.length) rep.warn(`${file} step length`, L.words.join("; ") + " (a step is one change and one idea)");
        for (const w of L.walks) {
          if (!w.fig) rep.fail(`${file} #${w.id}`, "walkthrough without .walk-fig");
          if (w.n < 2) rep.fail(`${file} #${w.id}`, `${w.n} step: a single step is a static figure`);
          if (w.n > 8) rep.warn(`${file} #${w.id}`, `${w.n} steps: past eight the thread is lost, split it`);
          if (w.maxKey > w.n) rep.warn(`${file} #${w.id}`, `data-set names beat ${w.maxKey} but there are only ${w.n} steps`);
          if (!w.raw && !w.setters) rep.warn(`${file} #${w.id}`, "nothing in the figure changes: no data-set and no data-in/out/at/on");
        }
      }
      if (file === "index.html") {
        const tiles = await page.evaluate("document.querySelectorAll('#board .tile').length");
        tiles === (C.lessons || []).length ? rep.ok("index board", `${tiles} tiles`) : rep.fail("index board", `${tiles} tiles for ${(C.lessons || []).length} lessons`);
      }
      if (file === "sources.html") {
        const n = await page.evaluate("document.querySelectorAll('#source-list li').length");
        n === Object.keys(C.sources || {}).length ? rep.ok("sources page", `${n} listed`) : rep.fail("sources page", `${n} listed, ${Object.keys(C.sources || {}).length} in COURSE.sources`);
      }
    }
    /* every beat of every walkthrough: it switches, it holds, the figure is on screen */
    const walks: any[] = await page.evaluate("(window.CS && CS.walks || []).map(w => ({ id: w.id, n: w.n }))");
    for (const w of walks) {
      const bad: string[] = [];
      for (let k = 0; k <= w.n; k++) {
        const got = await page.evaluate(`CS.walks.find(x => x.id === ${JSON.stringify(w.id)}).goto(${k})`);
        await page.waitForTimeout(quick ? 250 : 420);
        const st: any = await page.evaluate(`(() => { const x = CS.walks.find(x => x.id === ${JSON.stringify(w.id)}); const r = x.fig.getBoundingClientRect();
          const on = x.el.querySelector('.walk-steps > li.is-on'); const ro = on ? on.getBoundingClientRect() : null;
          return { beat: x.beat, top: r.top, bottom: r.bottom, vh: innerHeight, stepTop: ro ? ro.top : null, figH: x.figH }; })()`);
        if (got !== k || st.beat !== k) bad.push(`beat ${k}: landed on ${got}, settled on ${st.beat}`);
        else {
          if (k > 0 && (st.top < -2 || st.bottom > st.vh + 2)) bad.push(`beat ${k}: figure not fully on screen (${Math.round(st.top)}..${Math.round(st.bottom)} of ${st.vh})`);
          if (k > 0 && st.stepTop !== null && (st.stepTop > st.vh - 40 || st.stepTop < 0)) bad.push(`beat ${k}: the active step is off screen`);
        }
        const shot = join(shotsDir, `${tag}-${w.id}-${vp.name}-b${k}.jpg`);
        await page.screenshot({ path: shot, type: "jpeg", quality: 62 }); shots.push(shot);
      }
      bad.length ? rep.fail(`${file} #${w.id} ${vp.name}`, bad.join("; ")) : rep.ok(`${file} #${w.id} ${vp.name}`, `beats 0-${w.n} switch and hold`);
    }
    if (!quick || vp.name === "phone") {
      await page.evaluate("scrollTo(0,0)"); await page.waitForTimeout(200);
      const shot = join(shotsDir, `${tag}-${vp.name}-full.jpg`);
      const h = await page.evaluate("document.documentElement.scrollHeight");
      await page.screenshot({ path: shot, type: "jpeg", quality: 55, fullPage: h < 16000, clip: h < 16000 ? undefined : { x: 0, y: 0, width: vp.width, height: 16000 } }); shots.push(shot);
    }
    sink.length ? rep.fail(`${file} runtime ${vp.name}`, [...new Set(sink)].slice(0, 6).join(" | ")) : rep.ok(`${file} runtime ${vp.name}`, "no error, no network request");
    await ctx.close();
  }
  if (quick) return;
  /* reduced motion: flat by default */
  {
    const sink: string[] = [];
    const { ctx, page } = await newPage({ vp: VPS[0], reduced: true }, sink);
    await page.goto(url); await page.waitForTimeout(300);
    const flat = await page.evaluate("!window.CS || CS.walks.every(w => w.flat)");
    flat ? rep.ok(`${file} reduced motion`, "walkthroughs start flat") : rep.fail(`${file} reduced motion`, "a walkthrough is stepping under prefers-reduced-motion");
    await ctx.close();
  }
  /* no JavaScript: the text is all there */
  {
    const sink: string[] = [];
    const { ctx, page } = await newPage({ vp: VPS[0], js: false }, sink);
    await page.goto(url); await page.waitForTimeout(150);
    const r: any = await page.evaluate("({ text: (document.querySelector('main') || document.body).innerText.length, steps: document.querySelectorAll('.walk-steps > li').length, hidden: Array.from(document.querySelectorAll('.walk-steps > li, .ex, .idea, .win')).filter(e => !e.getClientRects().length).length })").catch(() => null);
    if (!r) rep.warn(`${file} no-JS`, "could not evaluate");
    else r.text < 300 || r.hidden ? rep.fail(`${file} no-JS`, `${r.text} characters of text, ${r.hidden} teaching blocks hidden`) : rep.ok(`${file} no-JS`, `${r.text} characters readable, ${r.steps} steps as a plain list`);
    const shot = join(shotsDir, `${tag}-nojs-phone.jpg`);
    await page.screenshot({ path: shot, type: "jpeg", quality: 55 }); shots.push(shot);
    await ctx.close();
  }
}

function gallery(outDir: string, shots: string[], reportText: string) {
  const rel = (p: string) => relative(outDir, p);
  const html = `<!doctype html><meta charset="utf-8"><title>course check</title>
<style>body{font:14px system-ui;margin:16px;background:#eee}pre{background:#fff;padding:12px;white-space:pre-wrap}figure{display:inline-block;margin:6px;vertical-align:top;background:#fff;padding:6px}img{max-height:420px;display:block}figcaption{font-size:12px;max-width:260px;overflow-wrap:anywhere}</style>
<h1>Course check</h1><pre>${reportText.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
${shots.map((s) => `<figure><a href="${rel(s)}"><img src="${rel(s)}" loading="lazy"></a><figcaption>${basename(s)}</figcaption></figure>`).join("\n")}`;
  writeFileSync(join(outDir, "index.html"), html);
}

async function cmdCheck() {
  const site = resolve(positional[0] || ""); if (!positional[0] || !existsSync(join(site, "assets"))) die("check: give a site directory (the one with assets/)");
  const outDir = join(dirname(site), ".check"), shotsDir = join(outDir, "shots");
  rmSync(shotsDir, { recursive: true, force: true }); mkdirSync(shotsDir, { recursive: true });
  const rep = new Report(), C = loadCourse(site);
  staticChecks(site, C, rep);
  flagLedger(site, outDir, rep);
  const shots: string[] = [];
  if (C && !C.__error) {
    await openBrowser();
    const only = flags.pages ? String(flags.pages).split(",") : null;
    for (const f of htmlFiles(site)) if (!only || only.includes(f)) await checkPage(site, f, C, rep, shotsDir, !!flags.quick, shots);
    await browser.close();
  }
  const text = rep.text();
  writeFileSync(join(outDir, "report.txt"), text + "\n");
  gallery(outDir, shots, text);
  console.log(text);
  console.log(`\nsnapshots: ${shots.length} in ${relative(process.cwd(), shotsDir) || shotsDir}; gallery: ${join(outDir, "index.html")}`);
  process.exit(rep.failed ? 1 : 0);
}

/* ------------------------------------------------------------------ shot */

async function cmdShot() {
  const file = positional[0]; if (!file || !existsSync(file)) die("shot: give an html file");
  await openBrowser();
  const vp = { width: +(flags.w || 380), height: +(flags.h || 820) };
  const sink: string[] = [];
  const { page } = await newPage({ vp, reduced: !!flags.reduced, js: !flags.nojs }, sink);
  await page.goto("file://" + resolve(file)); await page.waitForTimeout(350);
  if (flags.y) { await page.evaluate(`scrollTo(0, ${+flags.y})`); await page.waitForTimeout(600); }
  const out = String(flags.out || file.replace(/\.html$/, `-${vp.width}.jpg`));
  await page.screenshot({ path: out, type: out.endsWith(".png") ? "png" : "jpeg", fullPage: !!flags.full });
  console.log(out + (sink.length ? "\n" + sink.join("\n") : ""));
  await browser.close();
}

switch (cmd) {
  case "new": cmdNew(); break;
  case "upgrade": cmdUpgrade(); break;
  case "check": await cmdCheck(); break;
  case "shot": await cmdShot(); break;
  default: console.log(readFileSync(join(SKILL, "tools", "Course.help.md"), "utf8")); process.exit(cmd ? 2 : 0);
}
