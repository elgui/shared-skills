---
name: studio-interview
description: Start a Conversation Studio interview from the repo you work in, send the respondent's link, follow it, bring the results back and delete them. Interview profiles (questions and tone, never personal data) live in the repo under .interviews/profiles/ and carry the tone from one interview to the next. USE WHEN the user wants to interview someone, send an interview link, set up or adapt an interview profile, check whether an interview is done, fetch or read interview results, OR delete an interview and its answers.
---

# studio-interview

Runs interviews on a tele-claude Conversation Studio server. The respondent gets a link, answers in their
browser by text or voice, and an AI interviewer leads the conversation. You get a written summary back.

Everything goes through `studio.py` in this folder (Python 3, standard library):

```bash
S="${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/studio-interview}/skills/studio-interview/studio.py"
python3 "$S" --help
```

If `CLAUDE_PLUGIN_ROOT` is unset, find the file with `find ~/.claude -name studio.py -path '*studio-interview*'`.

## Before the first interview: the token

Every call needs the user's personal studio token, which the server's owner issues. It lives in
`~/.config/tele-claude/studio-token` (mode 600) or in `TELE_CLAUDE_STUDIO_TOKEN`. It never goes in a repo,
a commit, a message or a profile. If `studio.py` says there is no token, tell the user to ask for one and
show the one line it prints to save it. Never ask the user to paste the token into the chat.

## Personal data rules (read them to the user once)

- The respondent's name and email go only in `--name` and `--email`.
- The brief and the profile carry **no other person's** name, email or contact details. `studio.py` warns
  when it sees an email address there; stop and remove it.
- Results are personal data. `fetch` writes them **outside any git repo** by default
  (`~/.local/share/tele-claude/interviews/<repo>/`), and refuses a path inside a repo unless it is gitignored.
  Never copy a summary into a tracked file, a commit or an issue.
- When the answers are no longer needed, delete the interview (below).

## Workflows

### 1. Set up a profile (once per kind of interview)

```bash
python3 "$S" init <name>        # writes .interviews/profiles/<name>.json
```

Fill it in with the user: `purpose` (what the interview is for), `respondent_briefing` (what the respondent
reads first: who asks, why, how long), `tone` (how the interviewer speaks), and `dimensions` (the topics,
each with a short description and a depth: surface, standard or deep). No dimensions means an open
discovery interview led by the purpose. `language` is the default language (`en`, `fr`, ...).
Instead of `tone`, `soul_preset` may name a built-in interviewer: demonstrator, focused-consultant,
smart-colleague, ticket-clarifier, warm-psychologist. Then `python3 "$S" check <file>`.

The profile may be committed: it holds no personal data.

### 2. Start an interview

```bash
python3 "$S" new .interviews/profiles/<name>.json --name "Respondent Name" --email them@example.org \
  --brief "What is specific to this interview" --language en
```

It prints the interview id, the link, and a draft message. The user sends the link themselves (their own
mail or chat). Each user can start a limited number of interviews a day; the error says when it resets.

### 3. Follow it

```bash
python3 "$S" list               # your interviews, newest first
python3 "$S" status <id>
```

### 4. Bring the results back

```bash
python3 "$S" fetch <id>         # prints where it wrote the summary
```

Read the file and work from it in the conversation. Do not move it into the repo.

### 5. Adapt the profile for next time

After reading a summary, propose concrete edits to the profile: a tone that worked or did not, a topic
to add, drop or deepen. Show the diff and let the user decide; then `check` it.

### 6. Delete

```bash
python3 "$S" delete <id> --yes
```

Ask the user to confirm first: it removes the interview, the transcript and the summary on the server for
good. If it reports anything "NOT removed", tell the user to pass that line to the server's owner. Delete
the local summary file too if the user no longer needs it.

## Server

`TELE_CLAUDE_STUDIO_URL` overrides the default server (`https://tele-claude.gbconsult.me`). The profile
schema is at `<server>/api/studio/profile-schema` and in `profile.schema.json` here.
