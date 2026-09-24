# Research Workflow

Gather the sourced facts the course will teach, before any lesson is planned. The plan is only as
good as what research could confirm, and the list of what it could NOT confirm becomes the red
flags on the pages.

## Step 0: Announce

```bash
[ -x ~/.claude/Tools/SkillWorkflowNotification ] && ~/.claude/Tools/SkillWorkflowNotification Research Lightboard  # optional hook
```
```
Running the **Research** workflow from the **Lightboard** skill...
```

## Step 1: Primary sources first

The maker's manual for the exact model and firmware (web edition and PDF), its panel diagrams, its
shortcut tables, its MIDI implementation chart. Then official community documentation. Forums and
press only for what the manual does not cover, and labelled **secondary** everywhere they are used.

## Step 2: One note per topic

`research/NN-topic.md`, with frontmatter (title, date, sources). The SP-404 course's notes were the
model: `01-sp404-features.md` (features with page references) and `04-sp404-shortcuts-raw.txt`
(the manual's shortcut table, verbatim). Each claim:

- the fact, in operational terms (which button, what happens);
- **where**: URL plus page or section;
- **confidence**: stated in the source / inferred / secondary / not found.

Verbatim extracts of tables (shortcuts, note maps, parameter lists) are worth their space: the
fact-check reads them word for word against the pages.

Parallelise across topics with subagents when the subject is large (one per area of the gear),
each writing its own note, each told that a wrong button combination is the worst defect class.

## Step 3: The unconfirmed list

End each note with **Could not verify**: every claim the course might want to make that no source
confirmed. These become `<span class="check">` flags if they reach a page.

## Step 4: Verify without false negatives

Prove an absence with Python, never `grep | cut` (ugrep skips git-ignored files and long lines are
cut before the match; `EngineNotes.md` §13 has the one-liner). Open every URL you cite.

## Step 5: Sources map

Every source a page will cite becomes an entry in `COURSE.sources`: `[what it is, as a reader
would name it, URL]`. Name it so the learner could find it without clicking ("Roland manual —
Shortcuts that use the SHIFT button"). Then Plan.
