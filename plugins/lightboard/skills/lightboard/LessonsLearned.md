# Lessons learned

The ledger: one entry per course a real learner used, plus the skill's own builds. The doctrine
carries the rules; this carries the evidence of which ones worked, for whom, and what had to change.

## When to write an entry

After the learner has worked through part of a course and said something about it, before the next
task. "Worked, no changes" is data too.

## Format

```markdown
### YYYY-MM-DD · <Learner / subject> · <what happened>
- **Asked for:** the original request
- **Built:** what the advisory pass changed, and why - or "as asked"
- **Motion used:** walkthroughs per lesson, compares, flows
- **Landed:** the lesson, figure or encore that visibly worked
- **Fell flat:** what did not, and the learner's own words if they gave them
- **Changed after:** edits made because of the learner
- **Fold back:** the concrete edit to Doctrine, Techniques, Anatomy, the runtime - or "none"
```

`Fold back` is the field that matters. The same "fell flat" twice is a rule to fix.

---

## Entries

<!-- newest first -->

### 2026-09-23 · (skill build) · Lightboard, and a retrofit of SP-404 pad 4
- **Asked for:** a skill that builds courses of the SP-404 course's quality and feel for any
  subject, gear and learner, borrowing ProposalScroll's scroll craft for teaching; proved on a
  retrofit of one real lesson, in a copy.
- **Built:** a no-build runtime (`course.js` chrome, `scroll.js` walkthrough / compare / flow,
  `kit.js` drawing kit), templates, `Course.ts new|check|upgrade|shot`, and two proofs: the full
  SP-404 site moved onto the runtime (a `scroll-proof/` copy in its own project) with pad 4's plumbing
  and effect grab as walkthroughs over the existing `bus-flow` and `sp-panel` drawings, and
  `examples/patterns/`, a two-lesson course about the blocks themselves.
- **Motion used:** pad 4: two walkthroughs (5 and 3 steps), a timer in the encore. Patterns: two
  walkthroughs, one compare with a flow.
- **Landed (by the builder's own review of the snapshots, not yet by the learner):** stepping an
  existing component through `data-set` needed no redrawing; all 16 SP-404 lessons ran on the new
  runtime with head changes only; the check caught a false positive in itself and the phone
  flip-flop before any human saw them.
- **Fell flat during the build:** a connective sentence written into a step was a new, false claim
  (Doctrine §6, "rewriting never adds a claim"); "lit in the drawing" was false in flat mode
  (steps name changes by label); the figure-height feedback loop (EngineNotes 1).
- **Fold back (applied):** all three are rules now. Not yet shown to the learner; the live course
  is untouched.

### Inherited: 2026-09-21 → 09-23 · SP-404 × Deluge (the course this skill generalizes)
- **Built before the skill**, by hand: 16 lessons, `course.js` / `course.css` / `gear.js`,
  research → build → adversarial fact-check (`research/05-review.md`: no contradicted claim, no
  wrong combo; some unflagged inferences, fixed with flags).
- **Fell flat:** lesson 4's figures confused the learner: a figure showed a bus routing that did
  not match their own pads, and presses, holds and order were not distinguishable.
- **Changed after:** `sp-panel` got `hold` (ring), `order` (numbered badges), `example` (the EXAMPLE
  band) and an automatic legend; every lesson got an encore; the learner's own usage note was
  folded into lesson 8.
- **Fold back (applied here):** the EXAMPLE band and the legend-from-what-is-used are kit features;
  `cs-keys` carries the hold / press / order vocabulary; the encore and the learner's two rooms are
  contract; the fact-check is a workflow.
