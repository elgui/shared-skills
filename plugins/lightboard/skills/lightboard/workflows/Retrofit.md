# Retrofit Workflow

Move an existing HTML course onto the Lightboard runtime, and add walkthroughs where they earn
their place. Proved on the SP-404 course: a `scroll-proof/` copy holds all 16 lessons on
the runtime, with pad 4's plumbing and effect grab as walkthroughs.

**Always on a copy.** The live course is the learner's; it is replaced only on an explicit yes, and
redeployed only on another.

## Step 0: Announce

```bash
[ -x ~/.claude/Tools/SkillWorkflowNotification ] && ~/.claude/Tools/SkillWorkflowNotification Retrofit Lightboard  # optional hook
```
```
Running the **Retrofit** workflow from the **Lightboard** skill...
```

## Step 1: Copy

`cp -r <project>/site <project>/scroll-proof/site` (or another sibling folder). Read the course's
own chrome script end to end: its lesson list, glossary, sources, progress key, widgets.

## Step 2: Move the data out

Extract the lesson list, phases, glossary and sources **mechanically** (a script, not retyping)
into `assets/course-data.js` as `window.COURSE`. Keep the **progress key** exactly (the SP-404
course: `sp404course.v1`) so the learner's ticks survive. Count glossary and source entries before
and after; they must match.

## Step 3: Install the runtime

Copy `course.js`, `course.css`, `scroll.js`, `scroll.css`, `kit.js` from the skill's `runtime/`
into `assets/` (or `Course.ts upgrade <site>`), removing the course's old chrome script. Split the
old stylesheet: tokens and look into `identity.css` (`Identity.md` §3 maps the tokens), layout
dropped in favour of the runtime's. Rewrite every page's head to the block in `Anatomy.md` §2,
keeping the course's own drawing file (it must load before `course.js` and `scroll.js`).

## Step 4: Check before changing any lesson

`Course.ts check <copy>/site`, and compare snapshots with the original at 380 px and desktop. The
retrofit is faithful when every page reads the same before any walkthrough is added. The SP-404
port needed two runtime fixes at this stage (EngineNotes 10 and 11).

## Step 5: Walkthroughs, only where they earn it

Pick the figures whose idea has an order (`Techniques.md` §1). Convert each by giving the existing
component a `data-set` and turning the surrounding bullets into steps. Rules that bite in a
retrofit:

- **No new claims.** Every sentence in a step comes from the lesson with its source mark; any new
  connective sentence is a new claim and needs a source (Doctrine §6).
- **Flags travel with their claims**, including into the steps.
- A bullet that changes nothing in the figure stays prose, below the walkthrough.
- Name each change by its label, not its highlight state.
- A component that renders only in `connectedCallback` works as is (EngineNotes 5).

## Step 6: Check, look, report

`check` passes, snapshots looked at, then report what changed per lesson, the flag count before and
after (it may only grow), and ask whether to replace the live course. Do not deploy.
