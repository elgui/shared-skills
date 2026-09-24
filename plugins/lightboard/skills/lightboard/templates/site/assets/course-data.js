/* {{TITLE}} — course data. Everything subject-specific that the runtime reads.
   Contract: Anatomy.md in the Lightboard skill. Replace every [[…]]; `Course.ts check` fails on any left. */
(function () {
  "use strict";

  /* One entry per lesson, in order. f = file, t = title, d = one line for the board, p = phase. */
  var LESSONS = [
    { n: 1, f: "01-first.html", t: "[[Lesson title]]", d: "[[What it covers, in six words]]", p: 1 },
  ];

  /* Phases group lessons on the board: [label, what the phase is]. */
  var PHASES = { 1: ["Phase 1", "[[what this phase is]]"] };

  /* Glossary: REMINDERS for an expert in adjacent things, never lessons. One or two sentences.
     Used by <span class="tip" data-g="key">word</span>. */
  var G = {
    example: ["[[Term]]", "[[One-sentence reminder the learner can check against the source]]"],
  };

  /* Sources: every operational claim links one. [what it is, as a reader would name it, URL].
     Used by <a class="src" data-k="key"></a>. Prefer the maker's manual; mark secondary sources. */
  var S = {
    manual: ["[[Maker — manual, section]]", "https://[[…]]"],
  };

  window.COURSE = {
    title: "{{TITLE}}",
    landing: "[[board subtitle, e.g. 'Twelve lessons']]",
    key: "{{KEY}}",                 /* localStorage key: never change it once a learner has started */
    unit: "{{UNIT}}",               /* what a lesson is called on the page: Lesson, Pad, Fret, Chapter */
    lessons: LESSONS,
    phases: PHASES,
    /* board: { rows: [[1, [1, 2, 3, 4]], [2, [5, 6]]], cols: 4 },   optional; default: one row per phase */

    /* The learner's own two rooms, named BY THE LEARNER at intake (Doctrine §3). The key is the
       class exercises carry (<section class="ex lab">); name is the tag shown on each exercise.
       Each room's success lead-in (--win-label) and look live in identity.css. */
    rooms: { lab: { name: "[[Room one]]" }, stage: { name: "[[Room two]]" } },

    /* Interface words. Translate them all for a course in another language. */
    words: {
      encore: "Encore", min: "min", done: "done",
      home: "All lessons", backTo: "Back to", complete: "Course complete",
      sources: "Sources", sourceLink: "source", sourceMissing: "[source missing]",
      foot: "A dashed red flag means: not confirmed in a source. Check it yourself.",
      exercisesDone: "exercises done", reset: "reset progress",
      resetConfirm: "Clear every ticked exercise on this device?",
      lit: "{unit} {n} is lit.", onThisPage: "On this page",
      stepAll: "Show all steps", stepThrough: "Step through",
      timerStart: "Start", timerStop: "Stop", timerNext: "Next round", timerAgain: "Again", timerDone: "Time.",
      round: "Round {i} of {n}", drawButton: "Draw", drawEmpty: "Press the button.",
      kit: { example: "EXAMPLE", exampleDefault: "one possible setup, not yours", hold: "hold down", press: "press", order: "in this order" }
    },
    glossary: G,
    sources: S
  };
})();
