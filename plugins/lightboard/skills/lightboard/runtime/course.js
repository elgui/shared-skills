/* Lightboard — course chrome: masthead, lesson rail, exercise meta, progress, tooltips,
 * sources, landing board, dare drawer, timer. No dependencies, no network.
 *
 * RUNTIME FILE: copied verbatim into <course>/site/assets/ by `Course.ts new|upgrade`.
 * Never edit it inside a course; everything subject-specific lives in window.COURSE
 * (assets/course-data.js), assets/identity.css and assets/figures.js. Contract: Anatomy.md.
 */
(function () {
  "use strict";
  var C = window.COURSE;
  if (!C) { console.error("course.js: window.COURSE is missing — load assets/course-data.js first"); return; }
  document.documentElement.classList.add("js");

  var W = Object.assign({
    unit: C.unit || "Lesson",
    encore: "Encore", min: "min", done: "done",
    home: "All lessons", backTo: "Back to", complete: "Course complete",
    sources: "Sources", sourceLink: "source", sourceMissing: "[source missing]",
    foot: "A dashed red flag means: not confirmed in a source. Check it yourself.",
    exercisesDone: "exercises done", reset: "reset progress",
    resetConfirm: "Clear every ticked exercise on this device?",
    lit: "{unit} {n} is lit.", onThisPage: "On this page",
    timerStart: "Start", timerStop: "Stop", timerNext: "Next round", timerAgain: "Again", timerDone: "Time.",
    round: "Round {i} of {n}", drawButton: "Draw", drawEmpty: "Press the button."
  }, C.words || {});
  var LESSONS = C.lessons || [], PHASES = C.phases || {}, G = C.glossary || {}, S = C.sources || {};
  var ROOMS = C.rooms || { lab: { name: "Lab" }, stage: { name: "Stage" } };
  var ROOM_KEYS = Object.keys(ROOMS);
  var KEY = C.key || "course.v1";

  var here = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
  var cur = LESSONS.filter(function (l) { return l.f === here; })[0] || null;
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* private mode: progress just won't persist */ } }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function roomOf(ex) { for (var i = 0; i < ROOM_KEYS.length; i++) if (ex.classList.contains(ROOM_KEYS[i])) return ROOM_KEYS[i]; return ROOM_KEYS[0]; }
  function phaseLabel(p) { var ph = PHASES[p]; return ph ? ph[0] + (ph[1] ? " — " + ph[1] : "") : ""; }

  /* ---------- masthead, pager, footer ---------- */
  function chrome() {
    var main = document.querySelector("main"); if (!main) return;
    var where = cur ? phaseLabel(cur.p) : here === "sources.html" ? W.sources : (C.landing || "");
    var mast = el("header", "mast", '<div class="wrap mast-in"><a href="index.html">' + esc(C.title || "Course") + '</a><span class="where">' + esc(where) + "</span></div>");
    document.body.insertBefore(mast, document.body.firstChild);
    if (cur) {
      var i = LESSONS.indexOf(cur), prev = LESSONS[i - 1], next = LESSONS[i + 1];
      var pager = el("nav", "pager"); pager.setAttribute("aria-label", W.unit + "s");
      pager.innerHTML = (prev ? '<a class="prev" href="' + prev.f + '"><small>' + esc(W.unit + " " + prev.n) + "</small>" + esc(prev.t) + "</a>"
                              : '<a class="prev" href="index.html"><small>' + esc(W.backTo) + "</small>" + esc(W.home) + "</a>") +
                        (next ? '<a class="next" href="' + next.f + '"><small>' + esc(W.unit + " " + next.n) + "</small>" + esc(next.t) + "</a>"
                              : '<a class="next" href="index.html"><small>' + esc(W.complete) + "</small>" + esc(W.home) + "</a>");
      main.appendChild(pager);
    }
    main.appendChild(el("footer", "foot", '<a href="index.html">' + esc(W.home) + '</a><a href="sources.html">' + esc(W.sources) + "</a><span>" + esc(W.foot) + "</span>"));
  }

  /* ---------- exercises: room tag, minutes, kind, encore badge, done box ---------- */
  function exercises() {
    var state = load();
    all(".ex").forEach(function (ex, idx) {
      var id = ex.getAttribute("data-id") || (cur ? cur.n : 0) + "-" + (idx + 1);
      ex.setAttribute("data-id", id);
      if (!ex.id) ex.id = "ex-" + id;
      var room = roomOf(ex), encore = ex.classList.contains("encore");
      var meta = el("div", "ex-meta",
        (encore ? '<span class="encore-tag">' + esc(W.encore) + "</span>" : "") +
        '<span class="frame">' + esc(ROOMS[room].name) + "</span><span>" + esc((ex.getAttribute("data-min") || 10) + " " + W.min) + "</span>" +
        (ex.getAttribute("data-kind") ? "<span>" + esc(ex.getAttribute("data-kind")) + "</span>" : "") +
        '<label><input type="checkbox"' + (state[id] ? " checked" : "") + "> " + esc(W.done) + "</label>");
      ex.insertBefore(meta, ex.firstChild);
      if (state[id]) ex.classList.add("done");
      meta.querySelector("input").addEventListener("change", function (e) {
        var st = load(); if (e.target.checked) st[id] = 1; else delete st[id]; save(st);
        ex.classList.toggle("done", e.target.checked);
        lessonState(true);
      });
    });
    if (cur) { var st = load(); st["_count" + cur.n] = all(".ex").length; save(st); }
  }

  /* ---------- the rail: where am I in this lesson, and what is done ---------- */
  var rail = null, railSec = null, railHeads = [];
  function railSetup() {
    if (!cur) return;
    var main = document.querySelector("main"); if (!main) return;
    rail = el("nav", "rail"); rail.setAttribute("aria-label", W.onThisPage);
    var marks = all(".ex").map(function (ex) {
      var h = ex.querySelector("h3"), room = roomOf(ex);
      return '<a class="mark ' + room + (ex.classList.contains("encore") ? " encore" : "") + '" href="#' + ex.id + '" title="' +
        esc(ROOMS[room].name + ": " + (h ? h.textContent : "")) + '"><span class="sr">' + esc(ROOMS[room].name + ": " + (h ? h.textContent : "")) + "</span></a>";
    }).join("");
    rail.innerHTML = '<div class="wrap rail-in"><a class="rail-num" href="#top" title="' + esc(W.unit + " " + cur.n + ", " + cur.t) + '">' + esc(cur.n) + '</a><span class="rail-sec"></span><span class="rail-marks">' + marks + "</span></div>";
    document.body.insertBefore(rail, main);
    if (!document.getElementById("top")) main.id = main.id || "top";
    railSec = rail.querySelector(".rail-sec");
    railHeads = all("main h2").filter(function (h) { return !h.closest(".ex, .frames"); });
    document.documentElement.style.setProperty("--rail-h", rail.offsetHeight + "px");
    railMarks();
    var ticking = 0;
    window.addEventListener("scroll", function () { if (!ticking) ticking = requestAnimationFrame(function () { ticking = 0; railSpy(); }); }, { passive: true });
    window.addEventListener("resize", function () { document.documentElement.style.setProperty("--rail-h", rail.offsetHeight + "px"); });
    railSpy();
  }
  function railSpy() {
    if (!railSec) return;
    var line = (rail.offsetHeight || 40) + window.innerHeight * 0.25, text = cur.t;
    for (var i = 0; i < railHeads.length; i++) if (railHeads[i].getBoundingClientRect().top < line) text = railHeads[i].textContent;
    if (railSec.textContent !== text) railSec.textContent = text;
  }
  function railMarks() {
    if (!rail) return;
    var exs = all(".ex"), ms = all(".mark", rail);
    ms.forEach(function (m, i) { if (exs[i]) m.classList.toggle("done", exs[i].classList.contains("done")); });
  }

  /* ---------- a lesson is lit when every exercise is ticked ---------- */
  function lessonState(fromUser) {
    if (!cur) return;
    railMarks();
    var exs = all(".ex"), lit = exs.length > 0 && exs.every(function (e) { return e.classList.contains("done"); });
    var root = document.documentElement, was = root.classList.contains("lesson-lit");
    root.classList.toggle("lesson-lit", lit);
    var cp = document.querySelector(".checkpoint"), line = cp && cp.querySelector(".lit-line");
    if (lit && cp && !line) { line = el("p", "lit-line", esc(fmt(W.lit, { unit: W.unit, n: cur.n, t: cur.t }))); cp.appendChild(line); }
    if (!lit && line) line.remove();
    if (lit && !was && fromUser) { root.classList.add("just-lit"); setTimeout(function () { root.classList.remove("just-lit"); }, 1400); }
  }

  /* ---------- tooltips: hover, focus, tap ---------- */
  function tips() {
    var box = el("div"); box.id = "tipbox"; box.hidden = true; box.setAttribute("role", "tooltip"); document.body.appendChild(box);
    var owner = null;
    function show(t) {
      var g = G[t.getAttribute("data-g")];
      var title = g ? g[0] : t.getAttribute("data-title") || t.textContent, body = g ? g[1] : t.getAttribute("data-tip");
      if (!body) return;
      box.innerHTML = "<b>" + esc(title) + "</b>" + esc(body); box.hidden = false; owner = t;
      var r = t.getBoundingClientRect(), bw = box.offsetWidth, bh = box.offsetHeight;
      var x = r.left + window.scrollX; x = Math.max(12, Math.min(x, window.scrollX + document.documentElement.clientWidth - bw - 12));
      var y = r.bottom + window.scrollY + 8; if (r.bottom + bh + 16 > window.innerHeight && r.top > bh + 16) y = r.top + window.scrollY - bh - 8;
      box.style.left = x + "px"; box.style.top = y + "px";
    }
    function hide() { if (owner) owner.removeAttribute("data-open"); box.hidden = true; owner = null; }
    all(".tip").forEach(function (t) {
      if (t.getAttribute("data-g") && !G[t.getAttribute("data-g")]) t.classList.add("tip-missing");
      t.tabIndex = 0; t.setAttribute("aria-describedby", "tipbox");
      t.addEventListener("mouseenter", function () { show(t); }); t.addEventListener("mouseleave", hide);
      t.addEventListener("focus", function () { show(t); }); t.addEventListener("blur", hide);
      t.addEventListener("click", function (e) {
        e.stopPropagation();
        if (owner === t && !box.hidden && e.detail !== 0 && t.getAttribute("data-open")) hide();
        else { t.setAttribute("data-open", "1"); show(t); }
      });
    });
    document.addEventListener("click", hide);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  }

  /* ---------- source markers and the sources page ---------- */
  function sources() {
    all("a.src").forEach(function (a) {
      var s = S[a.getAttribute("data-k")];
      if (!s) { a.textContent = W.sourceMissing; a.classList.add("src-missing"); return; }
      a.href = s[1]; a.title = s[0]; a.textContent = W.sourceLink; a.rel = "noopener";
    });
    var list = document.getElementById("source-list");
    if (list) list.innerHTML = Object.keys(S).map(function (k) {
      return '<li id="' + esc(k) + '"><a href="' + esc(S[k][1]) + '" rel="noopener">' + esc(S[k][0]) + "</a><br><small>" + esc(S[k][1]) + "</small></li>";
    }).join("");
  }

  /* ---------- landing board ---------- */
  function board() {
    var host = document.getElementById("board"); if (!host) return;
    var st = load(), total = 0, done = 0, counts = {};
    Object.keys(st).forEach(function (k) { if (k.charAt(0) !== "_") { var n = k.split("-")[0]; counts[n] = (counts[n] || 0) + 1; } });
    var rows = (C.board && C.board.rows) || Object.keys(PHASES).map(function (p) {
      return [p, LESSONS.filter(function (l) { return String(l.p) === String(p); }).map(function (l) { return l.n; })];
    });
    if (!rows.length) rows = [["", LESSONS.map(function (l) { return l.n; })]];
    host.style.setProperty("--cols", (C.board && C.board.cols) || 4);
    host.innerHTML = '<div class="board-rows">' + rows.map(function (row) {
      var p = row[0], ns = row[1];
      var range = ns.length ? W.unit.toLowerCase() + "s " + ns[0] + "–" + ns[ns.length - 1] : "";
      return '<div class="bank">' + (p !== "" ? '<div class="bank-label"><span>' + esc(phaseLabel(p)) + "</span><span>" + esc(range) + "</span></div>" : "") +
        '<div class="tiles">' + ns.map(function (n) {
          var l = LESSONS.filter(function (x) { return x.n === n; })[0]; if (!l) return "";
          var c = counts[n] || 0, of = st["_count" + n] || 0; total += of || 3; done += c;
          var cls = of && c >= of ? "full" : c ? "part" : "";
          return '<a class="tile ' + cls + '" href="' + l.f + '"><span class="n">' + esc(n) + '</span><span class="p">' + (of ? c + "/" + of : "") +
            '</span><span><span class="t">' + esc(l.t) + '</span><span class="d">' + esc(l.d || "") + "</span></span></a>";
        }).join("") + "</div></div>";
    }).join("") + "</div>";
    var m = document.getElementById("meter");
    if (m) {
      var pct = total ? Math.round((done / total) * 100) : 0;
      m.innerHTML = "<span>" + done + " " + esc(W.exercisesDone) + '</span><span class="meter-bar"><i style="width:' + Math.min(100, pct) + '%"></i></span><button class="plain" type="button">' + esc(W.reset) + "</button>";
      m.querySelector("button").addEventListener("click", function () {
        if (confirm(W.resetConfirm)) { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }
      });
    }
  }

  /* ---------- encore widgets: dare drawer and round timer ---------- */
  function dares() {
    all(".dare[data-list], #dare").forEach(function (d) {
      var list; try { list = JSON.parse(d.getAttribute("data-list")); } catch (e) { console.error("dare: data-list is not JSON", d); return; }
      var out = d.querySelector("output") || d.appendChild(el("output", null, esc(W.drawEmpty)));
      out.setAttribute("aria-live", "polite");
      var btn = d.querySelector("button") || d.appendChild(el("button", null, esc(W.drawButton)));
      btn.type = "button";
      var last = -1;
      btn.addEventListener("click", function () {
        var i; do { i = Math.floor(Math.random() * list.length); } while (i === last && list.length > 1);
        last = i; out.textContent = list[i];
      });
    });
  }
  /* <div class="timer" data-sec="120" data-rounds="3"></div>: a countdown the learner starts,
     in rounds. Nothing runs on its own; the display is the only thing that moves. */
  function timers() {
    all(".timer[data-sec]").forEach(function (t) {
      var sec = Math.max(1, parseInt(t.getAttribute("data-sec"), 10) || 60), rounds = Math.max(1, parseInt(t.getAttribute("data-rounds"), 10) || 1);
      var round = 1, left = sec, iv = 0, end = 0;
      t.innerHTML = '<output class="timer-face" aria-live="off"></output><span class="timer-round"></span><button type="button"></button>';
      var face = t.querySelector("output"), lab = t.querySelector(".timer-round"), btn = t.querySelector("button");
      function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
      function paint(state) {
        face.textContent = state === "rang" ? W.timerDone : mmss(left);
        lab.textContent = rounds > 1 ? fmt(W.round, { i: round, n: rounds }) : "";
        btn.textContent = state === "run" ? W.timerStop : state === "rang" ? (round < rounds ? W.timerNext : W.timerAgain) : W.timerStart;
        t.classList.toggle("running", state === "run"); t.classList.toggle("rang", state === "rang");
      }
      function tick() {
        left = (end - Date.now()) / 1000;
        if (left <= 0) { clearInterval(iv); iv = 0; left = 0; face.setAttribute("aria-live", "assertive"); paint("rang"); face.setAttribute("aria-live", "off"); return; }
        paint("run");
      }
      btn.addEventListener("click", function () {
        if (iv) { clearInterval(iv); iv = 0; paint("idle"); return; }
        if (t.classList.contains("rang")) { if (round < rounds) round++; else round = 1; left = sec; }
        end = Date.now() + left * 1000; iv = setInterval(tick, 200); tick();
      });
      paint("idle");
    });
  }

  function boot() { chrome(); exercises(); railSetup(); lessonState(false); tips(); sources(); board(); dares(); timers(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
