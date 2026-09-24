# Doctrine

What a Lightboard course is for, who it is written for, what every lesson must contain, and why.
`Techniques.md` is the how of the moving parts; `Anatomy.md` is the markup. This file is the what
and the why, so a rule can be broken on purpose rather than by accident.

Most of it was not invented here. It was paid for by the SP-404 × Deluge course
(built 2026-09-21, revised 2026-09-23; it lives in its learner's project, not here): the learner's own frame, the
encore, the EXAMPLE band, the flag rule and the research, build, fact-check order all came from
that build or from its learner's feedback. `LessonsLearned.md` keeps the record.

---

## 1. The job

A course is a folder of static pages that teaches **one learner** a subject on **their own gear or
tool**: a landing board of lessons, the lessons, a sources page. It is read at the machine, with
hands busy, over weeks. It has one job: **the learner's hands can do something they could not do
before, and they know it worked.**

It is not a reference manual (the maker already wrote one, and the course links it on every
claim), not a textbook (the learner is not a beginner), and not a pitch.

### Where it stops and a neighbour starts

The neighbours are other skills and tools; not all of them are published with this one.

| | **Lightboard** | Neighbour |
|---|---|---|
| **ProposalScroll** | teaches one learner a practice, over many pages | persuades a client to buy, on one page |
| **PedagogiaLesson** | a practice on real gear, hands-on exercises | language-lesson slides and mini-games with AI illustrations |
| **NotebookLM** | a course written for one person's setup and taste | study material generated from a pile of sources |
| **Crossroads / Slate** | the learner practises | the user decides |

If there is nothing to **do** (a subject that is only read about), the exercises and the rooms have
nothing to hold, and this is the wrong tool. Say so.

---

## 2. Why scroll, and why this little motion

The research base is the one ProposalScroll's doctrine quotes (Mayer's cognitive theory of
multimedia learning). Four principles decide what moves:

- **Segmenting**: learning improves when material is segmented and **the learner controls the
  pace**. A walkthrough advances one step per scroll, and holds as long as the reader needs.
  Nothing plays on its own clock: no autoplay, no play button, no timed reveal.
- **Signaling**: cues that highlight the organisation help. The active step is marked, the step
  number in the list is the badge in the drawing, the rail says which section you are in.
- **Spatial contiguity**: words next to the part of the picture they describe. The active step
  sits beside the pinned figure on a wide screen and directly under it on a phone.
- **Coherence**: extraneous material costs comprehension. **Most of a lesson is static.** Motion
  is spent only where the idea has an order.

Sources: [Mayer & Fiorella, Cambridge Handbook ch. 12](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-for-reducing-extraneous-processing-in-multimedia-learning-coherence-signaling-redundancy-spatial-contiguity-and-temporal-contiguity-principles/CD5B7AE1279A9AB81F8EEBB53DBEC86E);
[Mayer's principles, summarised](https://www.devlinpeck.com/content/mayers-principles-of-multimedia-learning)
(both verified for ProposalScroll, 2026-09-03).

### What teaching adds to ProposalScroll's rules

A proposal is read once, top to bottom, with the seller driving. A course is **re-read at the
machine**, out of order, by someone looking for one move they half remember. So:

- **Re-findable beats dramatic.** Steps are a real `<ol>`; the active one is marked, the others
  stay fully legible. Nothing is hidden until scrolled to.
- **Flat mode is one click away** on every walkthrough ("Show all steps"), remembered on the
  device, and the default under `prefers-reduced-motion`. In flat mode the figure is at rest and
  the steps are a plain list, which is also what print gets.
- **Budget: one or two walkthroughs per lesson.** Three is a slideshow. A lesson with none is fine.
- **The rail** (sticky, one line) says which lesson, which section, and which exercises are done;
  its marks jump to the exercises. It is navigation first, progress second.

---

## 3. The learner

**Write for one person.** The SP-404 course was written for someone who knows sound design and
the Deluge deeply and finds the Deluge thin and velocity-less. Every choice followed from that:
no Deluge basics, dub techno examples, the SP framed as "hands for the brain".

- **An expert in adjacent things.** Never lecture what they know. Glossary tooltips (`data-g`)
  are one- or two-sentence **reminders**, never lessons.
- **Their taste picks the examples.** A dub throw for a dub techno player; a tone for a bassist.
- **Their two rooms, in their words.** Every exercise is tagged with the learner's own split of
  practice. The SP-404 learner named it: *the Lab* (lights on, preparing ingredients; an exercise
  ends with something **saved**) and *the Stage* (lights off, playing; it ends with something
  **heard**). The frame is the learner's, not the skill's: **ask for it at intake**, with how each
  room's exercises end, and never default to Lab/Stage. If the learner has no such split, offer
  two and let them rename.
- **Fold in their own material.** The SP-404 learner's own usage note became lesson 8 and is cited
  as a source ("your own note"). Notes, setlists, past attempts, a patch they love: ask for them.
- **Their setup, exactly.** Model, firmware, the rest of the rig. A course that assumes a
  different setup draws routings that do not match the learner's machine, which is exactly how the
  SP-404 course's lesson 4 confused its learner (§6, EXAMPLE band).

---

## 4. The lesson contract

Every lesson, in this order. `Course.ts check` enforces the structure.

1. **Head**: the lesson number, a title of one or two words, one sentence of what it gives the hands.
2. **The idea** (`.idea`, exactly one): the mental model in two or three sentences, loud. "Effects
   on the SP are not a rack you configure. They are a second set of pads." Not a summary, not an
   agenda.
3. **Sections**, each an `h2`, with prose, tables and figures. Figures are components (§6 and
   `Techniques.md` §7), mostly static; a walkthrough where the idea has an order.
4. **Exercises** (`.ex`), each:
   - tagged with **one room** (its class is a key of `COURSE.rooms`);
   - **honest minutes** (`data-min`), and optionally a name for the move (`data-kind`);
   - numbered steps, imperative, with button names as printed on the gear;
   - a **success condition** (`.win`) the learner can observe: "the delay touches only the green
     pads, the filter only the orange ones, and the kick walks through both untouched." If you
     cannot write the success line, the exercise is not designed yet. Write it **first**.
5. **The encore** (§5): the last exercise, and only one per lesson.
6. **The checkpoint** (`.checkpoint`): two or three capabilities stated as things the learner can
   now do. Ticking every exercise lights the lesson (rail, head, board tile, "Pad 4 is lit.").

The landing page carries: a hero in the subject's own terms, the board, the progress meter, the
**two rooms** explained in the learner's words, the course's shape (phases), and **house rules**
(how to read the drawings, what a flag means, the versions written against). The sources page says
honestly what was and was not verified.

---

## 5. The encore

Every lesson ends on a short game, **played rather than prepared**. The SP-404 learner asked for
it, and that course's house rules tell the reader to play it even on a day the rest is skipped.

- **5 to 10 minutes.** In the "play" room when the learner has one.
- **It uses this lesson's move**, under a constraint, a chance element or a clock.
- **A result you can observe**, like any exercise.
- **Always the last exercise**, class `encore`; the runtime adds the badge and a ring.

Shapes that worked, or were designed to (widgets in `Techniques.md` §6):

| Shape | Example (SP-404 course unless noted) | Widget |
|---|---|---|
| Roulette | eyes closed, hold MFX, tap any pad: that is the effect now; three spins | `.timer` rounds |
| Dare drawer | draw a dare and obey it for ten minutes; break it and draw a second | `.dare` |
| Timed rounds | two minutes to find the one knob position that works, then spin again | `.timer` |
| One thing only | one pad, sixteen velocities, nothing else, for two minutes | none |
| Blind A/B | eyes closed, bypass on or off: call it | none |
| Sort fast | draw a case, decide the block in five seconds (the patterns course) | `.dare` |
| Constraint ladder | each round removes one resource | `.timer` rounds |

Never a quiz. A quiz tests recall; an encore makes the hands do the move one more time, differently.

---

## 6. Accuracy

The course is used at the machine; a wrong button combo costs the learner real time and trust. The
SP-404 course's fact-check treated **a wrong combo as the worst defect class**.

- **Every operational claim links a source** (`<a class="src" data-k="…">`): the maker's manual,
  page or section, first; community docs next; forums and press labelled as secondary where used.
- **Anything unconfirmed carries a visible flag**: `<span class="check">what to check: check at
  the machine</span>`. Red, dashed, inline, next to the claim.
- **A flag follows its claim.** Rewording, moving the claim into a walkthrough step or splitting a
  paragraph never drops it (the retrofit of pad 4 carried its effect-grab flag into the step that
  makes the claim). A flag goes **only** when a source or a test on the real gear confirms the
  claim, and that confirmation is written into `research/`. Never to make a page cleaner.
  `Course.ts check` keeps a per-page ledger and fails when the count drops, until the drop is
  accepted explicitly.
- **Rewriting never adds a claim.** Turning prose into steps invites connective sentences; each one
  is a new claim that needs a source. (The pad 4 retrofit first wrote "nothing else decides which
  effect can touch a sound", which is false: BUS 3 and 4 touch everything. Caught in review.)
- **Examples are marked.** A drawing of a routing or setup that is not the learner's own carries an
  `example="…"` band. The SP-404 learner was confused by a figure showing a routing that did not
  match their own pads; that is why the attribute exists.
- **Every highlighted element in a figure is named in its caption**, and in a walkthrough, by its
  step. Name it by its **label**, never only by its state ("the three boxes in the middle column",
  not "the lit ones"): flat mode shows the figure at rest, where nothing is lit.
- **Drawings are traced from the maker's own diagrams**, and the component says so in a comment.
- **The sources page is honest**: what was checked against what, and in bold if nothing was tested
  on the real gear.
- **The order is research → plan → build → independent fact-check → fix** (`workflows/`). The
  fact-check is done by readers who did not write the pages.

---

## 7. The advisory pass

The skill is expected to improve on the request. Before planning, run these checks; raise what
fires in a sentence or two with a recommendation, then keep going. Stop only if the answer changes
what gets built.

| If the request… | Say this | Because |
|---|---|---|
| names no learner, or "for beginners" | ask who exactly, and what they already know | a course for everyone lectures the expert and loses the novice |
| has no practice frame | ask for their two rooms; offer a pair to rename | the frame is how exercises end, and it has to be theirs |
| wants every lesson animated | one or two walkthroughs per lesson, only where there is an order | coherence (§2) |
| covers more than the lesson count can hold | propose the cut, with what goes in a later course | sixteen lessons of one idea each beat thirty of three |
| gives no model or firmware | ask; a course against the wrong version teaches wrong combos | §6 |
| ignores the learner's own material | ask for their notes and fold them in | the SP-404 course's lesson 8 |
| is only reading, nothing to do | say this is the wrong tool | rooms and exercises need a practice |
| wants a quiz at the end | propose an encore instead | §5 |

---

## 8. Words

- **Second person, present tense, imperative steps.** "Hold REMAIN and press a pad."
- **The learner's nouns and the maker's labels.** Buttons as printed, in the course's `kbd` style;
  a shifted function framed differently (`kbd.sh` in the SP-404 identity). One convention, stated
  in the house rules.
- **Short sentences.** One idea each. A walkthrough step is one change and one idea, under about 60
  words (`check` warns past 80).
- **Name a real number once, plainly.** "Up to 48 dB of drive."
- **Prefer a colon, a comma or a full stop to a dash.** A page full of dashes reads machine-written.
- **No superlatives, no "simply", no "just".** They tell an expert the author has not done it.
- **Language**: the learner's. Translate `COURSE.words` for a course in another language.
