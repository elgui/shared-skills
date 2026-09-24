# Publish Workflow

Optional. Put a course's `site/` somewhere the learner can open it, through the project's own
`deploy.sh`. **Only on an explicit yes**: a link can be forwarded, and a course carries the
learner's gear, taste and notes.

## Step 0: Announce

```bash
[ -x ~/.claude/Tools/SkillWorkflowNotification ] && ~/.claude/Tools/SkillWorkflowNotification Publish Lightboard  # optional hook
```
```
Running the **Publish** workflow from the **Lightboard** skill...
```

## Step 1: Check first

`Course.ts check <project>/site` with no FAIL. Publishing a course that fails its check publishes
the failure.

## Step 2: Make sure deploy.sh knows where to go

A course is plain static files, so any static host works: a web server behind a login, a
password-protected static host, a private share. The skill does not pick one.

`Course.ts new` writes `<project>/deploy.sh` from one of two templates:

- **Your own**, if `~/.config/lightboard/deploy.sh` exists (or `$LIGHTBOARD_DEPLOY` names a file).
  Write it once for your host and every new course gets it. `{{SLUG}}`, `{{TITLE}}` and the other
  scaffold variables are filled in.
- **The skill's generic one** otherwise. It needs `DEST` (an `rsync` target) and `URL` (where that
  target is served) set at its top, and refuses to run until they are.

If the project's `deploy.sh` is still the unconfigured generic one, ask the user where it should
go before touching anything. Never invent a host.

## Step 3: Deploy

```bash
bash <project>/deploy.sh
```

Both templates keep an unguessable slug in `.deploy-slug` (`<slug>-<random>`), created once, so
republishing keeps the same URL.

## Step 4: Verify from outside

The script requests the URL without credentials and expects **HTTP 401 or 403**: the course is
behind a login. A 200 means anyone with the link can read it: stop, do not share the link, and
find out why. Set `PUBLIC=1` only when the user has said the course is meant to be public, and
then drop anything personal first (the learner's own notes, their setup).

## Step 5: Report

The URL, the verification result, and how the learner gets in.
