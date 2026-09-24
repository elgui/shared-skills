/* Lightboard — drawing kit. RUNTIME FILE: copied verbatim into a course's assets/.
 *
 * The pattern the SP-404 course proved: every recurring visual of a subject is ONE custom
 * element that renders inline SVG from attributes, so a panel, a fretboard or a pipeline is
 * drawn once and looks the same on every page. Never hand-draw it per page.
 *
 * CSKit.define(name, spec) registers a component:
 *   spec.attrs   attributes that re-render it when they change (a walkthrough steps these)
 *   spec.render  function (el, K) -> { vb: "x y w h", svg: "...", label: "aria label",
 *                                      legend?: [[swatchSvg, text], ...], after?: "html under it" }
 * The kit adds, from the element's own attributes, so no component has to remember them:
 *   example="text"  a band above the drawing: this is one possible setup, not the learner's own
 *   a legend band under the drawing, built only from the `legend` items the render returned
 *   (return an item only when the drawing actually uses it)
 * Colours come from --f-* tokens (identity.css), so a figure adapts inside each room.
 */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* text: T(x, y, "label", { size, anchor, weight, fill, cls }) */
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 8) + '" text-anchor="' + (o.anchor || "middle") + '" font-weight="' + (o.weight || 650) +
      '" fill="' + (o.fill || "var(--f-ink)") + '"' + (o.cls ? ' class="' + o.cls + '"' : "") + ">" + esc(s) + "</text>";
  }
  function set(el, attr) { return new Set((el.getAttribute(attr) || "").split(/[\s,]+/).filter(Boolean)); }
  function list(el, attr, sep) { return (el.getAttribute(attr) || "").split(sep || "|").map(function (s) { return s.trim(); }).filter(Boolean); }
  /* "1:kick|2:snare" -> {1:"kick", 2:"snare"} */
  function pairs(el, attr) {
    var o = {};
    list(el, attr).forEach(function (p) { var i = p.indexOf(":"); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
    return o;
  }

  function frame(el, out) {
    var vb = String(out.vb).split(/\s+/).map(Number), x = vb[0], y = vb[1], w = vb[2], h = vb[3], s = out.svg;
    var ex = el.getAttribute("example");
    if (ex !== null) {
      y -= 26; h += 26;
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="26" fill="var(--f-bg)"/>' +
        '<rect x="' + (x + 3) + '" y="' + (y + 5) + '" width="58" height="16" rx="3" fill="var(--f-ink)"/>' +
        T(x + 32, y + 16.5, K.words.example, { size: 8.5, fill: "var(--f-bg)", weight: 800 }) +
        T(x + 67, y + 17, ex || K.words.exampleDefault, { size: 9.5, anchor: "start", weight: 600 }) +
        '<rect x="' + (x + 1) + '" y="' + (y + 27) + '" width="' + (w - 2) + '" height="' + (h - 28) + '" rx="6" fill="none" stroke="var(--f-ink)" stroke-width="1.5" stroke-dasharray="5 4"/>';
    }
    var leg = out.legend || [];
    if (leg.length) {
      var lx = x + 9, ly = y + h + 15;
      s += '<rect x="' + x + '" y="' + (y + h) + '" width="' + w + '" height="29" fill="var(--f-bg)"/>';
      leg.forEach(function (it) {
        s += '<g transform="translate(' + lx + " " + (ly - 6) + ')">' + it[0] + "</g>" + T(lx + 18, ly + 3.6, it[1], { size: 10.5, anchor: "start" });
        lx += 30 + String(it[1]).length * 5.6;
      });
      h += 29;
    }
    var label = (out.label || el.tagName.toLowerCase()) + (ex !== null ? " (" + K.words.example.toLowerCase() + ")" : "");
    return '<svg xmlns="' + NS + '" viewBox="' + [x, y, w, h].join(" ") + '" role="img" aria-label="' + esc(label) + '">' + s + "</svg>" + (out.after || "");
  }

  var K = window.CSKit = {
    esc: esc, T: T, set: set, list: list, pairs: pairs,
    words: Object.assign({ example: "EXAMPLE", exampleDefault: "one possible setup, not yours", hold: "hold down", press: "press", order: "in this order" }, (window.COURSE && window.COURSE.words && window.COURSE.words.kit) || {}),
    swatch: function (fill, o) { o = o || {}; return '<rect width="12" height="12" rx="' + (o.rx == null ? 3 : o.rx) + '" fill="' + fill + '"' + (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="1"' : "") + "/>"; },
    define: function (name, spec) {
      if (customElements.get(name)) return;
      customElements.define(name, class extends HTMLElement {
        static get observedAttributes() { return (spec.attrs || []).concat(["example"]); }
        connectedCallback() { this.__csKit = true; this.render(); }
        attributeChangedCallback() { if (this.isConnected && this.__csKit) this.render(); }
        render() {
          try { this.innerHTML = frame(this, spec.render(this, K)); }
          catch (e) { console.error(name + ": render failed", e); this.innerHTML = '<p class="check">' + esc(name) + " could not draw: " + esc(e.message) + "</p>"; }
        }
      });
    }
  };

  /* ------------------------------------------------------------ generic components
     Subject drawings live in the course's figures.js. These two recur in almost any subject. */

  /* <cs-chain items="Mic|Preamp|Compressor|Tape" cols="3" lit="3" alt="1" note="3:the one that colours"></cs-chain>
     Stages with arrows, left to right, wrapping every `cols` stages (keep a row to 3 for phones).
     lit = the stage the caption is about; alt = a second group the caption names. */
  K.define("cs-chain", {
    attrs: ["items", "cols", "lit", "alt", "note"],
    render: function (el, K) {
      var items = K.list(el, "items"), lit = K.set(el, "lit"), alt = K.set(el, "alt"), note = K.pairs(el, "note");
      var n = Math.max(1, items.length), cols = Math.max(1, Math.min(n, +(el.getAttribute("cols") || n)));
      var rows = Math.ceil(n / cols), bw = 92, bh = 36, gap = 26, rowH = Object.keys(note).length ? 78 : 58;
      var w = cols * bw + (cols - 1) * gap + 16, h = rows * rowH + 8, s = "";
      s += '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="6" fill="var(--f-bg)"/>';
      var arrow = function (x, y) { return '<path d="M' + (x - 5) + " " + (y - 4) + " L" + x + " " + y + " L" + (x - 5) + " " + (y + 4) + '" stroke="var(--f-ink)" stroke-width="1.6" fill="none"/>'; };
      items.forEach(function (it, i) {
        var col = i % cols, row = Math.floor(i / cols), x = 8 + col * (bw + gap), y = 12 + row * rowH, k = String(i + 1), on = lit.has(k), on2 = alt.has(k);
        s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="' + (on ? "var(--f-lit)" : on2 ? "var(--f-alt)" : "var(--f-ctl)") +
          '" stroke="' + (on || on2 ? "var(--f-ink)" : "var(--f-ctl-line)") + '" stroke-width="1.4"/>';
        var words = it.split(" "), mid = words.length > 2 ? Math.ceil(words.length / 2) : words.length;
        var l1 = words.slice(0, mid).join(" "), l2 = words.slice(mid).join(" ");
        var tc = on ? "var(--f-lit-text)" : on2 ? "var(--f-alt-text)" : "var(--f-text)";
        s += K.T(x + bw / 2, y + (l2 ? 16 : 22), l1, { size: 10, fill: tc }) + (l2 ? K.T(x + bw / 2, y + 28, l2, { size: 10, fill: tc }) : "");
        if (note[k]) s += K.T(x + bw / 2, y + bh + 17, note[k], { size: 9, weight: 500, fill: "var(--f-ink)" });
        if (i === n - 1) return;
        if (col < cols - 1) s += '<path d="M' + (x + bw + 3) + " " + (y + 18) + " H" + (x + bw + gap - 4) + '" stroke="var(--f-ink)" stroke-width="1.6" fill="none"/>' + arrow(x + bw + gap - 4, y + 18);
        else { /* wrap: down from this stage, back along the gap between rows, into the next row's first stage */
          var yMid = y + bh + (rowH - bh) / 2 + (note[k] ? 8 : 0), x0 = 8 + bw / 2;
          s += '<path d="M' + (x + bw / 2) + " " + (y + bh + 2) + " V" + yMid + " H" + x0 + " V" + (y + rowH - 4) + '" stroke="var(--f-ink)" stroke-width="1.6" fill="none"/>' +
            '<path d="M' + (x0 - 4) + " " + (y + rowH - 9) + " L" + x0 + " " + (y + rowH - 4) + " L" + (x0 + 4) + " " + (y + rowH - 9) + '" stroke="var(--f-ink)" stroke-width="1.6" fill="none"/>';
        }
      });
      var legend = [];
      if (lit.size && alt.size) legend.push([K.swatch("var(--f-lit)"), el.getAttribute("lit-label") || "this step"], [K.swatch("var(--f-alt)"), el.getAttribute("alt-label") || "also involved"]);
      return { vb: "0 0 " + w + " " + h, svg: s, legend: legend, label: "Chain: " + items.join(", then ") + (lit.size ? ". Highlighted: " + Array.from(lit).map(function (k) { return items[k - 1]; }).join(", ") : "") };
    }
  });

  /* <cs-keys keys="SHIFT|REC|PLAY|STOP" cols="4" hold="1" lit="2" order="1 2" alt="4"></cs-keys>
     A row (or grid) of labelled controls with the gesture vocabulary the SP-404 course settled on:
       lit    pressed (the signal colour)        hold   held down while the rest happens (a ring)
       order  numbered badges in press order     alt    a second group the caption names (violet)
     Indices are 1-based positions in `keys`. The legend lists only the gestures the drawing uses. */
  K.define("cs-keys", {
    attrs: ["keys", "cols", "lit", "hold", "order", "alt"],
    render: function (el, K) {
      var keys = K.list(el, "keys"), cols = Math.max(1, +(el.getAttribute("cols") || keys.length || 1));
      var lit = K.set(el, "lit"), hold = K.set(el, "hold"), alt = K.set(el, "alt");
      var order = (el.getAttribute("order") || "").split(/[\s,]+/).filter(Boolean), badge = {};
      order.forEach(function (k, i) { badge[k] = badge[k] ? badge[k] + "·" + (i + 1) : String(i + 1); });
      var bw = 64, bh = 34, gx = 12, gy = 16, pad = 14, rows = Math.ceil(keys.length / cols);
      var w = pad * 2 + cols * bw + (cols - 1) * gx, h = pad * 2 + rows * bh + (rows - 1) * gy, s = "", over = "";
      s += '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="6" fill="var(--f-bg)"/>';
      keys.forEach(function (label, i) {
        var k = String(i + 1), x = pad + (i % cols) * (bw + gx), y = pad + Math.floor(i / cols) * (bh + gy);
        var on = lit.has(k) || hold.has(k) || !!badge[k], on2 = !on && alt.has(k);
        s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="' + (on ? "var(--f-lit)" : on2 ? "var(--f-alt)" : "var(--f-ctl)") +
          '" stroke="' + (on || on2 ? "var(--f-ink)" : "var(--f-ctl-line)") + '" stroke-width="1.3"/>';
        s += K.T(x + bw / 2, y + bh / 2 + 3.5, label, { size: label.length > 8 ? 8 : 9.5, weight: 750, fill: on ? "var(--f-lit-text)" : on2 ? "var(--f-alt-text)" : "var(--f-text)" });
        if (hold.has(k)) over += '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="' + (bw + 8) + '" height="' + (bh + 8) + '" rx="7" fill="none" stroke="var(--f-lit)" stroke-width="2.6"/>';
        if (badge[k]) { var bwid = 14 + (badge[k].length - 1) * 5;
          over += '<rect x="' + (x + 2 - bwid / 2) + '" y="' + (y - 5) + '" width="' + bwid + '" height="14" rx="7" fill="var(--f-ink)" stroke="var(--f-lit)" stroke-width="1.4"/>' +
            K.T(x + 2, y + 5.5, badge[k], { size: 9, weight: 800, fill: "var(--f-bg)" }); }
      });
      var legend = [];
      if (hold.size) legend.push(['<rect width="12" height="12" rx="3" fill="var(--f-lit)"/><rect x="-3" y="-3" width="18" height="18" rx="5" fill="none" stroke="var(--f-lit)" stroke-width="2"/>', K.words.hold || "hold down"]);
      if (hold.size && (lit.size || order.length)) legend.push([K.swatch("var(--f-lit)"), K.words.press || "press"]);
      if (order.length) legend.push(['<rect width="13" height="13" rx="6.5" fill="var(--f-ink)"/>' + K.T(6.5, 10, "1", { size: 9, weight: 800, fill: "var(--f-bg)" }), K.words.order || "in this order"]);
      var name = function (k) { return keys[+k - 1] || k; };
      return { vb: "0 0 " + w + " " + h, svg: s + over, legend: legend,
        label: "Controls: " + keys.join(", ") + (hold.size ? ". Hold " + Array.from(hold).map(name).join(" and ") : "") +
          (order.length ? ". Press in order: " + order.map(name).join(", ") : lit.size ? ". Press " + Array.from(lit).map(name).join(", ") : "") };
    }
  });
})();
