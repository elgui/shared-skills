# Intake Workflow

**Always first for a new course, and blocking.** No research, no plan and no HTML before every
line of `intake.md` is either deduced (and marked so) or answered by the learner.

The failure it prevents: a course written for a guessed learner. It explains the Deluge to someone
who knows it better than the author, uses the wrong firmware's combos, or calls the practice rooms
by names that are not the learner's. Each looks finished and each is found at the machine.

## Step 0: Announce

```bash
[ -x ~/.claude/Tools/SkillWorkflowNotification ] && ~/.claude/Tools/SkillWorkflowNotification Intake Lightboard  # optional hook
```
```
Running the **Intake** workflow from the **Lightboard** skill...
```

## Step 1: Create the project, so the intake has somewhere to live

```bash
bun <skill>/tools/Course.ts new <where>/<course-slug> --title "…" [--lang fr] [--unit Pad]
```

Where it lives: the learner's own project folder if one exists (the SP-404 course lives in its
own `sp-404/` project); otherwise a new folder such as `~/Projects/<course-slug>/`. **Never inside
the skill** (it is published, and a course carries the learner's gear, taste and notes). Notes about
the learner that outlive the course belong in the user's own notes system, not in the skill.

## Step 2: Deduce everything you can

Read what the user pointed at, and what the conversation and memory already say: the gear and its
exact model and firmware, the rest of the setup, the learner's expertise and gaps, their taste,
their own notes (a usage file, a setlist, a patch list), the language. Every deduction goes into
`intake.md` marked **D**, with where it came from.

## Step 3: Ask the rest in one round

Use `AskUserQuestion` for closed choices, with the deduced answer first and marked (Recommended),
at most four questions. The ones that are almost always needed:

1. **Who exactly is the learner, and what do they already know cold?** (what never to explain)
2. **Their two rooms**: the names they use for their own split of practice, and how an exercise in
   each ends. Offer a pair to rename if they have none (prepare / play; *Lab* ends with something
   saved, *Stage* with something heard, was the SP-404 learner's own). Never default silently.
3. **Model and firmware** of the gear, if not certain.
4. **Shape and publishing**: number of lessons and phases; local only or behind the login.

Also ask, as free text in the same message if relevant: their own material to fold in, and the
sources they trust (a manual edition, a community wiki).

## Step 4: The advisory pass

Run `Doctrine.md` §7 against the settled intake. Raise what fires, with a recommendation.

## Step 5: Settle

`intake.md` has no `[[…]]` left, every line is **D** or **A**, status `settled`. Then Research.
