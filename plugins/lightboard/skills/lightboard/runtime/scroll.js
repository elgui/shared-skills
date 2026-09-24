/* Lightboard — scroll engine for teaching pages. No dependencies, no network.
 *
 * RUNTIME FILE: copied verbatim into <course>/site/assets/. Edit it in the skill, never in a
 * course. Grammar: Techniques.md. Bugs that cost time: EngineNotes.md.
 *
 * Three blocks, all optional on a page:
 *   .walk     a figure pinned beside a numbered list of steps; each step changes the figure
 *   .compare  buttons that flip one figure between named states (A/B), clicked by the reader
 *   [data-flow] tokens moving along an SVG path while it is on screen
 *
 * Invariant (inherited from ProposalScroll's engine, keep it): the picture at beat k is a pure
 * function of k. Arriving at step 4 by scrolling down, up, or by a jump gives the same figure.
 * Nothing accumulates per scroll event; flows are positioned from the clock alone.
 *
 * Teaching-specific rules the engine enforces:
 *   - Nothing is ever hidden from a reader who does not scroll smoothly. Steps are a real <ol>;
 *     the active one is marked, the others stay at full legibility.
 *   - "Flat" mode (no pinning, the figure at rest, every step plain) is one click away on every
 *     walkthrough, remembered per device, and the default under prefers-reduced-motion.
 */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, W = window;
  root.classList.add("js");
  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduced = !!(mq && mq.matches);
  var CS = W.CS = { version: "1.0.0", ready: false, reduced: reduced, walks: [], compares: [], flows: [] };
  var FLAT_KEY = "coursescroll.flat";
  var L = Object.assign({ stepAll: "Show all steps", stepThrough: "Step through" }, (W.COURSE && W.COURSE.words) || {});

  function all(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function vh() { return W.innerHeight || root.clientHeight; }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }
  function getFlatPref() { try { var v = localStorage.getItem(FLAT_KEY); return v === null ? null : v === "1"; } catch (e) { return null; } }
  function setFlatPref(b) { try { localStorage.setItem(FLAT_KEY, b ? "1" : "0"); } catch (e) { /* private mode */ } }

  /* ---------------------------------------------------------------- parsing */

  function ranges(s) {   /* "3" | "2-4" | "2,5-6" | "3-" */
    return String(s).split(",").map(function (p) {
      var m = p.trim().match(/^(\d+)\s*(-)?\s*(\d+)?$/); if (!m) return null;
      return [+m[1], m[2] ? (m[3] ? +m[3] : Infinity) : +m[1]];
    }).filter(Boolean);
  }
  function inRanges(k, rs) { for (var i = 0; i < rs.length; i++) if (k >= rs[i][0] && k <= rs[i][1]) return true; return false; }
  function steps(s) {    /* "3:is-warn 7:is-ok+is-big" */
    return String(s).trim().split(/\s+/).map(function (p) {
      var i = p.indexOf(":"); if (i < 1) return null;
      return [+p.slice(0, i), p.slice(i + 1).split("+").filter(Boolean)];
    }).filter(function (x) { return x && !isNaN(x[0]); }).sort(function (a, b) { return a[0] - b[0]; });
  }
  function opts(s) {
    var o = {};
    String(s || "").split(";").forEach(function (kv) { var i = kv.indexOf(":"); if (i >= 0) o[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); });
    return o;
  }
  /* data-set="1: hold=value; 2: hold=value, lit=delay; wet: lit=bus2"
     -> { "1": {hold:"value"}, "2": {hold:"value", lit:"delay"}, wet: {lit:"bus2"} }
     Keys are beat numbers (walkthrough) or state names (compare). Values run to the next "," or ";".
     An empty value removes the attribute. */
  function parseSet(s) {
    var out = {};
    String(s || "").split(";").forEach(function (chunk) {
      var m = chunk.match(/^\s*([\w-]+)\s*:(.*)$/); if (!m) return;
      var o = out[m[1]] = out[m[1]] || {};
      m[2].split(",").forEach(function (kv) {
        var i = kv.indexOf("="); if (i < 1) return;
        o[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
      });
    });
    return out;
  }

  /* ---------------------------------------------------------------- raw SVG actors (ProposalScroll grammar) */

  function Actor(el) {
    this.el = el;
    this.inAt = el.hasAttribute("data-in") ? num(el.getAttribute("data-in"), 0) : null;
    this.outAt = el.hasAttribute("data-out") ? num(el.getAttribute("data-out"), Infinity) : null;
    this.ghost = el.hasAttribute("data-ghost");
    this.at = el.hasAttribute("data-at") ? steps(el.getAttribute("data-at")) : null;
    this.on = el.hasAttribute("data-on") ? ranges(el.getAttribute("data-on")) : null;
    this.draw = el.hasAttribute("data-draw");
    this.atClasses = [];
    if (this.at) this.at.forEach(function (s) { this.atClasses = this.atClasses.concat(s[1]); }, this);
    if (this.draw) prepDraw(el);
  }
  Actor.prototype.visibleAt = function (k) { return (this.inAt === null || k >= this.inAt) && (this.outAt === null || k < this.outAt); };
  Actor.prototype.apply = function (k) {
    var cl = this.el.classList, vis = this.visibleAt(k);
    cl.toggle("cs-hidden", !vis && !this.ghost);
    cl.toggle("cs-ghosted", !vis && this.ghost);
    if (this.draw) cl.toggle("cs-drawn", vis);
    if (this.at) {
      var cur = null;
      for (var i = 0; i < this.at.length; i++) if (k >= this.at[i][0]) cur = this.at[i][1];
      for (var j = 0; j < this.atClasses.length; j++) cl.remove(this.atClasses[j]);
      if (cur) for (var c = 0; c < cur.length; c++) cl.add(cur[c]);
    }
    if (this.on) cl.toggle("is-on", inRanges(k, this.on));
  };
  function prepDraw(el) {
    if (/^(path|line|polyline|polygon|circle|rect|ellipse)$/i.test(el.tagName) && !el.hasAttribute("pathLength")) el.setAttribute("pathLength", "1");
  }

  /* ---------------------------------------------------------------- component setters (data-set) */

  /* A drawing component (a custom element that renders its SVG from attributes, see kit.js) is
     stepped by changing its attributes. Its AUTHORED attributes are the figure at rest: what a
     reader in flat mode, without scrolling, or printing sees. Each key's attributes apply on top.
     For beats, the latest numbered key <= k wins per attribute; beat 0 is the authored state
     unless a key "0" says otherwise. */
  function Setter(el) {
    this.el = el;
    this.map = parseSet(el.getAttribute("data-set"));
    this.orig = {};
    var self = this;
    Object.keys(this.map).forEach(function (k) {
      Object.keys(self.map[k]).forEach(function (a) { if (!(a in self.orig)) self.orig[a] = el.hasAttribute(a) ? el.getAttribute(a) : null; });
    });
    this.beats = Object.keys(this.map).filter(function (k) { return /^\d+$/.test(k); }).map(Number).sort(function (a, b) { return a - b; });
  }
  Setter.prototype.attrsFor = function (key) {
    var want = {}, a;
    for (a in this.orig) want[a] = this.orig[a];
    if (key === "rest") return want;
    if (typeof key === "number") {
      for (var i = 0; i < this.beats.length; i++) if (this.beats[i] <= key) { var m = this.map[this.beats[i]]; for (a in m) want[a] = m[a]; }
    } else if (this.map[key]) { for (a in this.map[key]) want[a] = this.map[key][a]; }
    return want;
  };
  Setter.prototype.apply = function (key) {
    var el = this.el, want = this.attrsFor(key), changed = false;
    for (var a in want) {
      var v = want[a], has = el.hasAttribute(a);
      if (v === null || v === "") { if (has) { el.removeAttribute(a); changed = true; } }
      else if (!has || el.getAttribute(a) !== v) { el.setAttribute(a, v); changed = true; }
    }
    if (!changed) return false;
    /* kit.js components re-render through attributeChangedCallback. Older components that only
       render in connectedCallback (a retrofit's own drawings) are re-rendered here. */
    if (!el.__csKit) { if (typeof el.render === "function") el.render(); else if (typeof el.connectedCallback === "function") el.connectedCallback(); }
    return true;
  };

  /* ---------------------------------------------------------------- walkthrough */

  function Walk(el, i) {
    var self = this;
    this.el = el; this.id = el.id || ("walk-" + (i + 1)); if (!el.id) el.id = this.id;
    this.fig = el.querySelector(".walk-fig");
    this.steps = all(".walk-steps > li", el);
    this.n = this.steps.length;
    this.actors = this.fig ? all("[data-in],[data-out],[data-at],[data-on],[data-draw]", this.fig).map(function (a) { return new Actor(a); }) : [];
    this.setters = this.fig ? all("[data-set]", this.fig).map(function (s) { return new Setter(s); }) : [];
    this.beat = -1; this.near = true; this.flat = false;
    this.steps.forEach(function (li, k) { li.setAttribute("data-step", k + 1); });
    /* the mode switch sits at the top of the block */
    var bar = doc.createElement("div"); bar.className = "walk-bar";
    this.btn = doc.createElement("button"); this.btn.type = "button"; this.btn.className = "walk-mode";
    this.btn.addEventListener("click", function () { var f = !self.flat; setFlatPref(f); CS.walks.forEach(function (w) { w.setFlat(f); }); schedule(); });
    bar.appendChild(this.btn); el.insertBefore(bar, el.firstChild);
    if ("IntersectionObserver" in W) {
      new IntersectionObserver(function (es) { self.near = es[es.length - 1].isIntersecting; if (self.near) schedule(); }, { rootMargin: "30% 0px" }).observe(el);
    }
  }
  Walk.prototype.wide = function () { return W.innerWidth >= 860; };
  function railH() { return parseFloat(getComputedStyle(root).getPropertyValue("--rail-h")) || 0; }
  /* The figure can change height between beats (a drawing that lists what it highlights under
     itself). If the switch line followed the live figure, a taller figure could move the line
     back over the step that caused it and the beat would flip-flop, and on a phone the text
     below would jump. So every beat is rendered once, the tallest height is reserved, and the
     switch line is computed from where the figure sits once PINNED, never from where it is. */
  Walk.prototype.measure = function () {
    if (!this.fig) return;
    var wasFlat = this.flat;
    this.el.classList.remove("flat");            /* heights that matter are the stepping layout's */
    this.fig.style.minHeight = "";
    var max = 0, keys = [];
    for (var k = 0; k <= this.n; k++) keys.push(k);
    keys.push("rest");
    for (var i = 0; i < keys.length; i++) { this.paint(keys[i]); max = Math.max(max, this.fig.offsetHeight); }
    this.figH = max;
    this.el.classList.toggle("flat", wasFlat);
    this.fig.style.minHeight = wasFlat ? "" : max + "px";
    this.paint(wasFlat ? "rest" : Math.max(0, this.beat));
  };
  /* where a step "takes over". Wide screen: level with the lower middle of the pinned figure,
     so the text that caused a change sits beside it (spatial contiguity), clamped to 30-60% of
     the viewport. Phone: the figure is pinned on top, so the line sits a third of the way into
     the space left under it; the change is visible above the text that caused it. */
  Walk.prototype.threshold = function () {
    if (!this.fig) return vh() * 0.55;
    var h = this.figH || this.fig.offsetHeight;
    if (this.wide()) return clamp(railH() + 16 + h * 0.6, vh() * 0.3, vh() * 0.6);
    var fb = clamp(railH() + h, 0, vh() * 0.6);
    return fb + (vh() - fb) * 0.3;
  };
  Walk.prototype.computeBeat = function () {
    var th = this.threshold(), k = 0;
    for (var i = 0; i < this.n; i++) if (this.steps[i].getBoundingClientRect().top < th) k = i + 1;
    return k;
  };
  /* the figure and the step marks for a key: a beat number, or "rest" (flat mode). No events. */
  Walk.prototype.paint = function (key) {
    var swapped = false, rest = key === "rest", k = rest ? this.n : key;
    for (var i = 0; i < this.actors.length; i++) this.actors[i].apply(k);
    for (var j = 0; j < this.setters.length; j++) if (this.setters[j].apply(rest ? "rest" : k)) swapped = true;
    for (var s = 0; s < this.n; s++) {
      this.steps[s].classList.toggle("is-on", !rest && s === k - 1);
      this.steps[s].classList.toggle("is-past", !rest && s < k - 1);
    }
    return swapped;
  };
  Walk.prototype.set = function (k, force) {
    if (k === this.beat && !force) return;
    var swapped = this.paint(this.flat ? "rest" : k);
    this.el.setAttribute("data-beat", this.flat ? "rest" : k);
    if (swapped && this.fig && !reduced && this.beat !== -1) {   /* a re-rendered drawing cannot transition; a short settle marks the change */
      this.fig.classList.remove("cs-swap"); void this.fig.offsetWidth; this.fig.classList.add("cs-swap");
    }
    this.beat = k;
    var ev; try { ev = new CustomEvent("cs:beat", { detail: { beat: k, id: this.id, flat: this.flat } }); } catch (e) { ev = null; }
    if (ev) this.el.dispatchEvent(ev);
  };
  Walk.prototype.setFlat = function (f) {
    this.flat = !!f;
    this.el.classList.toggle("flat", this.flat);
    this.btn.textContent = this.flat ? L.stepThrough : L.stepAll;
    this.btn.setAttribute("aria-pressed", this.flat ? "true" : "false");
    if (this.fig && this.flat) this.fig.style.minHeight = "";
    else if (this.fig && this.figH) this.fig.style.minHeight = this.figH + "px";
    this.set(this.flat ? this.n : this.computeBeat(), true);
  };
  Walk.prototype.update = function () { if (this.near && !this.flat) this.set(this.computeBeat()); };
  /* scroll position at which step k (1-based) has just taken over; 0 = before the first step */
  Walk.prototype.yFor = function (k) {
    var r = this.steps[clamp(k, 1, this.n) - 1].getBoundingClientRect();
    if (k <= 0) return Math.max(0, W.scrollY + r.top - this.threshold() - 40);
    return W.scrollY + r.top - this.threshold() + 12;
  };
  Walk.prototype.goto = function (k) {
    if (this.flat) this.setFlat(false);
    W.scrollTo(0, this.yFor(k));
    /* the target line depends on where the pinned figure ended up: settle once more */
    W.scrollTo(0, this.yFor(k));
    this.near = true; this.set(this.computeBeat(), true);
    return this.beat;
  };

  /* ---------------------------------------------------------------- compare (A/B, reader-driven) */

  function Compare(box) {
    var target = doc.getElementById(box.getAttribute("data-for")); if (!target) return;
    var buttons = all("button[data-state]", box), items = all("[data-when]", target), setters = all("[data-set]", target).map(function (s) { return new Setter(s); });
    function set(state) {
      target.setAttribute("data-state", state);
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-state") === state ? "true" : "false"); });
      items.forEach(function (it) {
        var ok = it.getAttribute("data-when").split(/\s+/).indexOf(state) >= 0;
        it.classList.toggle("cs-hidden", !ok && !it.hasAttribute("data-ghost"));
        it.classList.toggle("cs-ghosted", !ok && it.hasAttribute("data-ghost"));
      });
      setters.forEach(function (s) { s.apply(state); });
    }
    buttons.forEach(function (b) { b.type = "button"; b.addEventListener("click", function () { set(b.getAttribute("data-state")); }); });
    var start = buttons.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0] || buttons[0];
    if (start) set(start.getAttribute("data-state"));
    this.set = set; this.target = target;
  }

  /* ---------------------------------------------------------------- flows (ProposalScroll, clock-driven) */

  var SVGNS = "http://www.w3.org/2000/svg";
  function Flow(path) {
    var o = opts(path.getAttribute("data-flow"));
    this.path = path;
    this.n = Math.max(1, Math.round(num(o.n, 5)));
    this.speed = num(o.speed, 60);
    this.size = num(o.size, 5);
    this.shape = o.shape || "chevron";
    this.stop = o.stop !== undefined ? clamp(num(o.stop, 1), 0.05, 1) : 1;
    this.offset = num(o.offset, 0);
    this.len = path.getTotalLength ? path.getTotalLength() : 0;
    var color = o.color || getComputedStyle(path).stroke;
    if (!color || color === "none") color = "currentColor";
    var g = doc.createElementNS(SVGNS, "g");
    g.setAttribute("class", "cs-tokens"); g.setAttribute("aria-hidden", "true");
    if (path.getAttribute("transform")) g.setAttribute("transform", path.getAttribute("transform"));
    ["data-in", "data-out", "data-ghost", "data-when"].forEach(function (a) { if (path.hasAttribute(a)) g.setAttribute(a, path.getAttribute(a)); });
    this.tokens = [];
    for (var i = 0; i < this.n; i++) {
      var t, s = this.size;
      if (this.shape === "dot") { t = doc.createElementNS(SVGNS, "circle"); t.setAttribute("r", s / 2); t.setAttribute("fill", color); }
      else {
        t = doc.createElementNS(SVGNS, "path");
        t.setAttribute("d", "M" + (-s * .7) + "," + (-s) + " L" + (s * .55) + ",0 L" + (-s * .7) + "," + s);
        t.setAttribute("fill", "none"); t.setAttribute("stroke", color); t.setAttribute("stroke-width", Math.max(1.4, s * .42));
        t.setAttribute("stroke-linecap", "round"); t.setAttribute("stroke-linejoin", "round");
      }
      g.appendChild(t); this.tokens.push(t);
    }
    path.parentNode.insertBefore(g, path.nextSibling);
    this.g = g; this.svg = path.ownerSVGElement;
  }
  Flow.prototype.place = function (t, d, alpha) {
    var P = this.path.getPointAtLength(d), Q = this.path.getPointAtLength(Math.min(this.len, d + 0.8));
    var a = Math.atan2(Q.y - P.y, Q.x - P.x) * 180 / Math.PI;
    if (d + 0.8 > this.len) { var R = this.path.getPointAtLength(Math.max(0, d - 0.8)); a = Math.atan2(P.y - R.y, P.x - R.x) * 180 / Math.PI; }
    t.setAttribute("transform", "translate(" + P.x.toFixed(2) + " " + P.y.toFixed(2) + ") rotate(" + a.toFixed(1) + ")");
    t.setAttribute("opacity", alpha.toFixed(3));
  };
  Flow.prototype.frame = function (ms) {
    if (!this.len) return;
    var Ln = this.len, end = Ln * this.stop, spacing = Ln / this.n, fade = Math.min(Ln * 0.06, 18);
    for (var i = 0; i < this.n; i++) {
      var d = (((ms / 1000) * this.speed + i * spacing + this.offset * Ln) % Ln + Ln) % Ln, alpha = 1;
      if (d < fade) alpha = d / fade;
      if (this.stop < 1) { if (d > end) { alpha = 0; d = end; } else if (d > end - fade * 1.6) alpha = Math.min(alpha, (end - d) / (fade * 1.6)); }
      else if (d > Ln - fade) alpha = Math.min(alpha, (Ln - d) / fade);
      this.place(this.tokens[i], d, clamp(alpha, 0, 1));
    }
  };
  Flow.prototype.still = function () {
    if (!this.len) return;
    var end = this.len * this.stop, gap = end / this.n;
    for (var i = 0; i < this.n; i++) this.place(this.tokens[i], clamp((i + 0.5) * gap, 0, end), 1);
  };
  var flowLoop = 0, liveSvgs = new Set();
  function flowTick(ms) {
    var any = false;
    CS.flows.forEach(function (f) { if (liveSvgs.has(f.svg)) { f.frame(ms); any = true; } });
    flowLoop = any && !doc.hidden && !reduced ? requestAnimationFrame(flowTick) : 0;
  }
  function flowKick() {
    if (reduced) { CS.flows.forEach(function (f) { f.still(); }); return; }
    if (!flowLoop && liveSvgs.size && !doc.hidden) flowLoop = requestAnimationFrame(flowTick);
  }

  /* ---------------------------------------------------------------- scheduling & boot */

  var ticking = 0;
  function frame() { ticking = 0; for (var i = 0; i < CS.walks.length; i++) CS.walks[i].update(); }
  function schedule() { if (!ticking) ticking = requestAnimationFrame(frame); }

  var booted = false;
  function boot() {
    if (booted) return; booted = true;
    CS.walks = all(".walk").map(function (el, i) { return new Walk(el, i); });
    var pref = getFlatPref(), flat = pref === null ? (reduced || !("IntersectionObserver" in W)) : pref;
    CS.walks.forEach(function (w) { w.setFlat(flat); w.measure(); });
    CS.compares = all(".compare[data-for]").map(function (b) { return new Compare(b); });
    CS.flows = all("[data-flow]").map(function (p) { return new Flow(p); });
    /* tokens inside a walkthrough follow their path's data-in / data-out */
    CS.walks.forEach(function (w) {
      if (!w.fig) return;
      all(".cs-tokens", w.fig).forEach(function (g) { var a = new Actor(g); w.actors.push(a); a.apply(w.flat ? w.n : Math.max(0, w.beat)); });
    });
    CS.compares.forEach(function (c) { if (c.target && c.target.getAttribute("data-state")) c.set(c.target.getAttribute("data-state")); });
    var svgs = new Set(CS.flows.map(function (f) { return f.svg; }).filter(Boolean));
    if ("IntersectionObserver" in W) {
      var fio = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) liveSvgs.add(en.target); else liveSvgs.delete(en.target); });
        flowKick();
      }, { rootMargin: "10% 0px" });
      svgs.forEach(function (s) { fio.observe(s); });
    } else svgs.forEach(function (s) { liveSvgs.add(s); });
    if (reduced) CS.flows.forEach(function (f) { f.still(); });

    W.addEventListener("scroll", schedule, { passive: true });
    var lastW = W.innerWidth;
    W.addEventListener("resize", function () {
      CS.flows.forEach(function (f) { f.len = f.path.getTotalLength(); });
      if (W.innerWidth !== lastW) { lastW = W.innerWidth; CS.walks.forEach(function (w) { w.measure(); }); }   /* not on a phone's toolbar show/hide */
      schedule();
    });
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) flowKick(); });
    W.addEventListener("beforeprint", function () { CS.walks.forEach(function (w) { w.__wasFlat = w.flat; w.setFlat(true); }); });
    W.addEventListener("afterprint", function () { CS.walks.forEach(function (w) { w.setFlat(w.__wasFlat); }); });
    if (mq && mq.addEventListener) mq.addEventListener("change", function (e) {
      reduced = CS.reduced = e.matches;
      if (reduced) CS.flows.forEach(function (f) { f.still(); }); else flowKick();
    });
    frame();
    CS.ready = true; root.setAttribute("data-cs-ready", "1");
  }
  /* Drawing components must be defined before the walkthroughs read them: figures.js and kit.js
     load (deferred) before this file. DOMContentLoaded fires after every deferred script. */
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})();
