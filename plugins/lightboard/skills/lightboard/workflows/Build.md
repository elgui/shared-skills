# Build Workflow

From an agreed plan to a checked course. Never start without `plan.md` agreed.

## Step 0: Announce

```bash
[ -x ~/.claude/Tools/SkillWorkflowNotification ] && ~/.claude/Tools/SkillWorkflowNotification Build Lightboard  # optional hook
```
```
Running the **Build** workflow from the **Lightboard** skill...
```

## Step 1: Identity

Replace `site/assets/identity.css` following `Identity.md`: materials, page, ink, panel, the one
signal, the two rooms, the face (self-hosted, licence in `fonts/`). Load the frontend-design skill
first if the subject gives no obvious materials. The `cs:default-identity` marker must be gone.

## Step 2: Data

`site/assets/course-data.js`: lessons, phases, board, rooms (the learner's names), words (translated
if the course is not in English), glossary (reminders only), sources (from Research step 5).

## Step 3: Drawings

`site/assets/figures.js`: one `CSKit.define` per component in the plan. Trace from the maker's
diagrams and say so in a comment. Every attribute a walkthrough steps goes in `attrs`. Build a
scratch page that shows each component in every state it will be used in, in both rooms, and look
at it at 380 px before writing lessons.

## Step 4: Pages

Landing, then lessons in order, then sources, from the templates. Per lesson: words first (idea,
steps, exercises, success lines, encore), then figures, then walkthroughs from the plan's beat
tables (`Techniques.md` §2). Every claim gets its `a.src`; every unconfirmed claim its `.check`.
Remove every `<!-- RULE … -->` comment and `[[placeholder]]`.

## Step 5: Check

```bash
bun <skill>/tools/Course.ts check <project>/site
```

It launches Chromium; on a box where memory is shared, bound it (`systemd-run --user --scope -p MemoryMax=3G bun … check …`).
Fix every FAIL. Read every WARN and fix it or be able to say why it stands.

## Step 6: Look at it

Open `<project>/.check/index.html` or the JPEGs in `.check/shots/`: every walkthrough beat at 380
px and 1280 px, every page full-length at both sizes, every page without JavaScript. Look for:

- at every beat, the change the step names is visible, above (phone) or beside (desktop) the step;
- labels readable at 380 px, nothing clipped, the pinned figure not eating the screen;
- the two rooms told apart at a glance; the signal used for one meaning only;
- every highlighted element named in its caption or step; EXAMPLE bands where the setup is not
  the learner's;
- flags visible and red in both rooms.

The checker proves the mechanics. Only looking proves the lesson teaches what you meant.

## Step 7: Fact-check, then report

Run `FactCheck.md`. Then report: the course path, check results, every intake answer that was
deduced rather than confirmed, the number of flags and where they cluster, what you would change
with hands-on time, and an offer to publish (never without an explicit yes).
