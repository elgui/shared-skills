/* Course patterns — course data. The skill's own demo: a two-lesson course whose subject is the
   Lightboard blocks themselves, so every claim on it describes the runtime it runs on. */
(function () {
  "use strict";
  var LESSONS = [
    { n: 1, f: "01-figures.html", t: "Figures that move", d: "Walkthrough, compare, flow", p: 1 },
    { n: 2, f: "02-rooms.html", t: "Rooms and encores", d: "Exercises, flags, the closing game", p: 1 },
  ];
  var PHASES = { 1: ["The blocks", "what a lesson is made of"] };
  var G = {
    beat: ["Beat", "The state a walkthrough figure is in. Beat 0 is before the first step; beat k is while step k is the active one."],
    flat: ["Flat mode", "A walkthrough with no pinning: the figure at rest, every step a plain list item. One click away, remembered on this device, the default under reduced motion."],
    rest: ["Rest state", "A drawing's authored attributes: what a reader sees in flat mode, in print, and before any step changes it."],
    room: ["Room", "One of the learner's two named frames for practice. Every exercise belongs to one, and each room ends its exercises differently."],
    encore: ["Encore", "The last exercise of every lesson: short, a game, played rather than prepared."],
  };
  var S = {
    "mayer-seg": ["Mayer's principles of multimedia learning, summarised (segmenting, signaling)", "https://www.devlinpeck.com/content/mayers-principles-of-multimedia-learning"],
    "mayer-coh": ["Mayer & Fiorella, Principles for reducing extraneous processing (coherence, signaling, spatial contiguity), Cambridge Handbook of Multimedia Learning, ch. 12", "https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-for-reducing-extraneous-processing-in-multimedia-learning-coherence-signaling-redundancy-spatial-contiguity-and-temporal-contiguity-principles/CD5B7AE1279A9AB81F8EEBB53DBEC86E"],
    "cs-tech": ["Lightboard skill — Techniques.md (the scroll grammar)", "../../../Techniques.md"],
    "cs-doctrine": ["Lightboard skill — Doctrine.md (the lesson contract)", "../../../Doctrine.md"],
  };
  window.COURSE = {
    title: "Course patterns",
    landing: "Two lessons about lessons",
    key: "coursescroll-patterns.v1",
    unit: "Lesson",
    lessons: LESSONS,
    phases: PHASES,
    rooms: { draft: { name: "Draft" }, try: { name: "Try" } },
    words: { home: "Both lessons", foot: "A dashed red flag means: not confirmed in a source. Check it yourself." },
    glossary: G,
    sources: S
  };
})();
