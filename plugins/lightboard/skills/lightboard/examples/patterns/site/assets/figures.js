/* Course patterns — the subject's drawings. One custom element per recurring visual (Anatomy.md §5).
 *
 * The kit (kit.js, loaded first) already gives every course:
 *   <cs-keys>   a row or grid of controls, with lit / hold / order / alt and an automatic legend
 *   <cs-chain>  stages in a row with arrows (a signal path, a recipe, a pipeline)
 * Add here what the subject draws again and again: the instrument's panel, a fretboard, a
 * screen, a joint. Trace layouts from the maker's own diagrams and say so in a comment.
 *
 * Rules the SP-404 course paid for (Doctrine §6):
 *   - every highlighted element is named in the figure's caption;
 *   - a drawing of a setup that is not the learner's own carries example="…" (the kit draws the band);
 *   - the legend lists only what this drawing uses (return legend items conditionally);
 *   - colours come from --f-* tokens so the figure adapts inside each room;
 *   - a walkthrough steps a component by changing its attributes (data-set), so every attribute
 *     it reads must be listed in `attrs`, and render must be a pure function of the attributes.
 */
(function () {
  "use strict";
  var K = window.CSKit;
  if (!K) { console.error("figures.js: load assets/kit.js first"); return; }

  /* Example skeleton: delete it, or rename and fill it.
     <demo-dial value="3" max="10" lit="1"></demo-dial> */
  K.define("demo-dial", {
    attrs: ["value", "max", "lit"],
    render: function (el, K) {
      var v = +(el.getAttribute("value") || 0), max = +(el.getAttribute("max") || 10), on = el.hasAttribute("lit") && el.getAttribute("lit") !== "";
      var a = -135 + 270 * Math.max(0, Math.min(1, v / max)), r = 28, cx = 44, cy = 44, rad = (a - 90) * Math.PI / 180;
      var s = '<rect width="88" height="96" rx="6" fill="var(--f-bg)"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (on ? "var(--f-lit)" : "var(--f-ctl)") + '" stroke="var(--f-ctl-line)" stroke-width="1.5"/>' +
        '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(rad) * (r - 5)).toFixed(1) + '" y2="' + (cy + Math.sin(rad) * (r - 5)).toFixed(1) + '" stroke="var(--f-ink)" stroke-width="3" stroke-linecap="round"/>' +
        K.T(cx, 88, v + " / " + max, { size: 10 });
      return { vb: "0 0 88 96", svg: s, label: "Dial at " + v + " of " + max };
    }
  });
})();
