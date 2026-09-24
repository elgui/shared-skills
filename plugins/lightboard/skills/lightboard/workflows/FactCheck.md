# FactCheck Workflow

An independent, adversarial check of every operational claim against the research, by readers who
did not write the pages. The SP-404 course's review (its `research/05-review.md`) is
the model: mechanical checks done directly, lessons split in batches across parallel subagents,
wrong button combinations treated as the worst defect class.

## Step 0: Announce

```bash
[ -x ~/.claude/Tools/SkillWorkflowNotification ] && ~/.claude/Tools/SkillWorkflowNotification FactCheck Lightboard  # optional hook
```
```
Running the **FactCheck** workflow from the **Lightboard** skill...
```

## Step 1: Mechanical checks, directly

`Course.ts check` covers keys, links, offline, structure and the flag ledger. Add, by reading:
component arithmetic (a note map formula, a grid layout) against the research tables, and every
label a drawing prints against the manual's own wording.

## Step 2: Content checks, delegated

Split the lessons into batches of about four. One subagent per batch, in parallel, read-only, each
given: the full `research/` notes, its lesson files, and this brief:

- classify every operational claim: **supported** (with the research line), **contradicted**,
  **unsupported** (no research backs it), **weak** (research says inferred or unverified, the page
  states it as fact without a flag);
- wrong button combinations and wrong signal flow first;
- also check the contract: one idea, success conditions observable, the encore last, EXAMPLE bands
  on setups that are not the learner's, every highlighted element named in its caption or step, no
  basics lectured;
- report a findings table: file, claim, what research says, class, proposed fix.

## Step 3: Write the review

`research/99-review.md` (frontmatter: title, date, status): method, mechanical results, the
findings table worst first.

## Step 4: Fix

Contradicted: fix the page. Unsupported or weak: find a source, or add a `.check` flag. **Never
remove a flag to resolve a finding**; a flag goes only when a source confirms the claim, recorded
in research. Re-run `check`; a flag drop needs `--accept-flag-drop` and a research note naming the
source that confirmed it.
