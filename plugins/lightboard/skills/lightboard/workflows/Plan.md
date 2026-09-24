# Plan Workflow

Turn the settled intake and the research into `plan.md`: every lesson's idea, figures,
walkthroughs, exercises, encore and checkpoint, plus the components the course needs. The learner
(or the user on their behalf) reads it **before any lesson HTML exists**. A beat table is ten
times cheaper to fix than SVG coordinates, and a lesson order is a hundred times cheaper to fix
than sixteen pages.

## Step 0: Announce

```bash
[ -x ~/.claude/Tools/SkillWorkflowNotification ] && ~/.claude/Tools/SkillWorkflowNotification Plan Lightboard  # optional hook
```
```
Running the **Plan** workflow from the **Lightboard** skill...
```

## Step 1: The arc

Phases first (the SP-404 course: the SP alone, then the rig, then both machines as one instrument),
then lessons within them. **One idea per lesson.** A lesson title is one or two words (Capture,
Shape, Colour, Weight). Order by what the hands need first, not by the manual's chapters. Place the
learner's own material where it belongs (the SP-404 learner's usage note became lesson 8, "Home").

## Step 2: The components

List every visual that recurs: the instrument's panel, a signal path, a pattern grid, a waveform.
Each becomes one component (`figures.js`, or the kit's `cs-keys` / `cs-chain`), with the attributes
it needs, including those a walkthrough will step. Note which maker diagram each is traced from.

## Step 3: Per lesson

Fill the template in `plan.md`:

- **Idea**: the loud paragraph, drafted now.
- **Sections and figures**: which component, which attributes, static by default.
- **Walkthroughs**: at most two, only where the idea has an order (`Techniques.md` §1). For each,
  the beat table: beat, step headline, what changes in the figure. Check it here: one change per
  beat, each change named by its label, beat 0 defined, no step without a change.
- **Exercises**: room, minutes, title, **success condition first**. Both rooms appear across the
  course; most lessons have both.
- **Encore**: the game, its rule, its minutes, its observable result, and the widget if any
  (`Doctrine.md` §5). Vary the shapes across the course.
- **Checkpoint**: two or three capabilities.
- **Sources** each claim needs, and the **flags** expected from research's unconfirmed list.

## Step 4: Review

Show the plan (a Crossroads or Slate page if several decisions need the user; otherwise the file
path and a short summary in the terminal). Mark `status: agreed` only on an explicit yes. Then Build.
