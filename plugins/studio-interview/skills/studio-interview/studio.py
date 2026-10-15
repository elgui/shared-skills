#!/usr/bin/env python3
"""studio.py: start, follow, fetch and delete Conversation Studio interviews from a repo.

Standard library only (Python 3.8+), so it runs from a plain Claude Code install on a Mac.

    studio.py init <name>                       write .interviews/profiles/<name>.json to fill in
    studio.py check <profile.json>              validate a profile locally
    studio.py new <profile.json> --name NAME [--email E] [--brief TEXT | --brief-file F]
                                [--language en] [--expires-days 14]
    studio.py list
    studio.py status <id>
    studio.py fetch <id> [--out PATH]           summary to a file outside any git tree by default
    studio.py delete <id> --yes                 deletes the interview and every stored answer

Server:  TELE_CLAUDE_STUDIO_URL (default https://tele-claude.gbconsult.me)
Token:   TELE_CLAUDE_STUDIO_TOKEN, else ~/.config/tele-claude/studio-token. Never put it in a repo.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import stat
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT_URL = "https://tele-claude.gbconsult.me"
TOKEN_FILE = Path.home() / ".config" / "tele-claude" / "studio-token"
RESULTS_ROOT = Path.home() / ".local" / "share" / "tele-claude" / "interviews"
PROFILE_DIR = Path(".interviews") / "profiles"
HERE = Path(__file__).resolve().parent
SCHEMA = HERE / "profile.schema.json"

PROFILE_KEYS = {"kind", "version", "name", "purpose", "language", "respondent_briefing", "tone",
                "soul_preset", "dimensions"}
DIMENSION_KEYS = {"name", "description", "depth"}
LIMITS = {"name": 120, "purpose": 1000, "respondent_briefing": 1000, "tone": 2000}
LANGUAGES = ("en", "fr", "de", "es", "it", "pt", "nl")
SOULS = ("demonstrator", "focused-consultant", "smart-colleague", "ticket-clarifier", "warm-psychologist")
DEPTHS = ("surface", "standard", "deep")
EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")

PRIVACY_NOTE = (
    "Reminder: the respondent's name and email go only in --name/--email. The brief and the profile "
    "must not name or contact anyone else."
)


class StudioError(Exception):
    """A refusal the user should read; the message says what to do."""


# ---------------------------------------------------------------- configuration

def base_url() -> str:
    url = os.environ.get("TELE_CLAUDE_STUDIO_URL", DEFAULT_URL).rstrip("/")
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != "https" and parts.hostname not in ("127.0.0.1", "localhost"):
        raise StudioError(f"refusing to send the studio token over {parts.scheme}://; use https")
    return url


def load_token() -> str:
    token = os.environ.get("TELE_CLAUDE_STUDIO_TOKEN", "").strip()
    if token:
        return token
    path = Path(os.environ.get("TELE_CLAUDE_STUDIO_TOKEN_FILE", str(TOKEN_FILE)))
    if path.is_file():
        mode = path.stat().st_mode
        if mode & (stat.S_IRWXG | stat.S_IRWXO):
            print(f"warning: {path} is readable by others; run: chmod 600 {path}", file=sys.stderr)
        return path.read_text(encoding="utf-8").strip()
    raise StudioError(
        "no studio token. Ask Gui for one, then save it with:\n"
        f"  mkdir -p {TOKEN_FILE.parent} && pbpaste > {TOKEN_FILE} && chmod 600 {TOKEN_FILE}\n"
        "(or set TELE_CLAUDE_STUDIO_TOKEN)."
    )


# ---------------------------------------------------------------- HTTP

def call(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(base_url() + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + load_token())
    req.add_header("Accept", "application/json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode("utf-8") or "{}")
        except ValueError:
            payload = {}
        if e.code == 401:
            raise StudioError("the studio token was refused (missing, wrong or revoked). Ask Gui for a new one.")
        if e.code == 404:
            raise StudioError("no such interview, or it is not yours.")
        if e.code == 429:
            raise StudioError(payload.get("message") or "daily limit reached.")
        if e.code == 422:
            raise StudioError("the server refused the request: " + json.dumps(payload.get("detail", payload))[:800])
        raise StudioError(f"server error {e.code}: {payload.get('error') or payload}")
    except urllib.error.URLError as e:
        raise StudioError(f"cannot reach {base_url()}: {e.reason}")


# ---------------------------------------------------------------- profiles

def validate_profile(p: object) -> list:
    """Problems with a profile, mirroring the server's StudioProfile. Empty means valid."""
    if not isinstance(p, dict):
        return ["a profile is a JSON object"]
    errs = []
    extra = set(p) - PROFILE_KEYS
    if extra:
        errs.append("unknown keys: " + ", ".join(sorted(extra)))
    if p.get("kind", "studio-profile") != "studio-profile":
        errs.append('kind must be "studio-profile"')
    if p.get("version", 1) != 1:
        errs.append("version must be 1")
    for key in ("name", "purpose"):
        if not isinstance(p.get(key), str) or not p.get(key, "").strip():
            errs.append(f"{key} is required")
    for key, limit in LIMITS.items():
        v = p.get(key, "")
        if not isinstance(v, str):
            errs.append(f"{key} must be text")
        elif len(v) > limit:
            errs.append(f"{key} is {len(v)} characters; the limit is {limit}")
    if p.get("language", "en") not in LANGUAGES:
        errs.append("language must be one of " + ", ".join(LANGUAGES))
    if p.get("soul_preset") not in (None,) + SOULS:
        errs.append("soul_preset must be one of " + ", ".join(SOULS))
    dims = p.get("dimensions", [])
    if not isinstance(dims, list) or len(dims) > 12:
        errs.append("dimensions is a list of at most 12")
    else:
        for i, d in enumerate(dims):
            if not isinstance(d, dict) or set(d) - DIMENSION_KEYS or not str(d.get("name", "")).strip():
                errs.append(f"dimension {i + 1} needs a name and only name, description, depth")
            elif d.get("depth", "standard") not in DEPTHS:
                errs.append(f"dimension {i + 1}: depth is one of " + ", ".join(DEPTHS))
            elif len(d.get("name", "")) > 120 or len(d.get("description", "")) > 600:
                errs.append(f"dimension {i + 1} is too long (name 120, description 600)")
    return errs


def personal_data_warnings(*texts: str) -> list:
    found = sorted({m for t in texts for m in EMAIL.findall(t or "")})
    return [f"an email address appears in the brief or profile: {', '.join(found)}"] if found else []


def read_profile(path: str) -> dict:
    try:
        profile = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise StudioError(f"cannot read profile {path}: {e}")
    errs = validate_profile(profile)
    if errs:
        raise StudioError("profile " + path + " is not valid:\n  - " + "\n  - ".join(errs))
    return profile


# ---------------------------------------------------------------- results path

def git_toplevel(path: Path) -> Path | None:
    probe = path if path.is_dir() else path.parent
    while not probe.exists():
        probe = probe.parent
    try:
        out = subprocess.run(["git", "-C", str(probe), "rev-parse", "--show-toplevel"],
                             capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return None
    return Path(out.stdout.strip()) if out.returncode == 0 and out.stdout.strip() else None


def is_gitignored(path: Path, top: Path) -> bool:
    out = subprocess.run(["git", "-C", str(top), "check-ignore", "-q", str(path)],
                         capture_output=True, timeout=10)
    return out.returncode == 0


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s[:60] or "interview"


def default_result_path(interview: dict, cwd: Path) -> Path:
    top = git_toplevel(cwd)
    repo = slug((top or cwd).name)
    day = (interview.get("completed_at") or interview.get("created_at") or _dt.date.today().isoformat())[:10]
    topic = slug(interview.get("profile") or "interview")
    return RESULTS_ROOT / repo / f"{day}-{topic}-{interview['id']}.md"


def check_result_path(path: Path) -> None:
    """Refuse a path inside a git working tree unless git ignores it (answers never go into git)."""
    top = git_toplevel(path.parent)
    if top is not None and not is_gitignored(path, top):
        raise StudioError(
            f"{path} is inside the git repo {top} and is not gitignored. Interview answers are personal "
            "data and must not be committed. Drop --out to use the default folder, or gitignore the path."
        )


# ---------------------------------------------------------------- commands

def cmd_init(a) -> int:
    path = PROFILE_DIR / f"{slug(a.name)}.json"
    if path.exists():
        raise StudioError(f"{path} exists; edit it instead")
    path.parent.mkdir(parents=True, exist_ok=True)
    skeleton = {
        "kind": "studio-profile",
        "version": 1,
        "name": slug(a.name),
        "language": "en",
        "purpose": "What this interview is for, in one or two sentences.",
        "respondent_briefing": "What the respondent is told before starting: who asks, why, how long.",
        "tone": "How the interviewer speaks: register, length of questions, what to avoid.",
        "dimensions": [{"name": "First topic", "description": "What to learn about it", "depth": "standard"}],
    }
    path.write_text(json.dumps(skeleton, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path}: fill it in (questions and tone only, no personal data), then run check.")
    return 0


def cmd_check(a) -> int:
    profile = read_profile(a.profile)
    for w in personal_data_warnings(json.dumps(profile, ensure_ascii=False)):
        print("warning: " + w, file=sys.stderr)
    print(f"{a.profile}: valid ({len(profile.get('dimensions', []))} dimension(s)"
          f"{', discovery interview' if not profile.get('dimensions') else ''}).")
    return 0


def cmd_new(a) -> int:
    profile = read_profile(a.profile)
    brief = Path(a.brief_file).read_text(encoding="utf-8") if a.brief_file else (a.brief or "")
    print(PRIVACY_NOTE, file=sys.stderr)
    for w in personal_data_warnings(brief, json.dumps(profile, ensure_ascii=False)):
        print("warning: " + w, file=sys.stderr)
    body = {"profile": profile, "person": {"name": a.name, "email": a.email or ""}, "brief": brief,
            "expires_days": a.expires_days}
    if a.language:
        body["language"] = a.language
    r = call("POST", "/api/studio/interviews", body)
    print(f"Interview {r['id']} started for {r['person_name']} ({r['language']}), "
          f"expires {str(r.get('expires_at'))[:10]}. Started today: {r['starts_today']}/{r['daily_cap']}.")
    print(f"Link: {r['link']}")
    print("\nDraft message to send yourself:\n")
    print(f"Hello {a.name},\n\nCould you take a few minutes to answer a short interview? It runs in your "
          f"browser, by text or voice, and you can pause and come back.\n\n{r['link']}\n\nThank you!")
    return 0


def _line(i: dict) -> str:
    done = " summary ready" if i.get("has_summary") else ""
    who = f" by {i['created_by']}" if i.get("created_by") else ""
    return f"{i['id']:>5}  {i['status']:<10} {i['person_name']:<24} {i.get('profile') or '-':<28}{who}{done}"


def cmd_list(a) -> int:
    r = call("GET", "/api/studio/interviews")
    for i in r["interviews"]:
        print(_line(i))
    if not r["interviews"]:
        print("no interviews yet.")
    print(f"Started today: {r['starts_today']}/{r['daily_cap']}.")
    return 0


def cmd_status(a) -> int:
    i = call("GET", f"/api/studio/interviews/{int(a.id)}")
    print(_line(i))
    if i.get("link"):
        print(f"Link: {i['link']}")
    return 0


def cmd_fetch(a) -> int:
    i = call("GET", f"/api/studio/interviews/{int(a.id)}")
    if not i.get("summary_md"):
        print(f"Interview {i['id']} is {i['status']}; no summary yet.", file=sys.stderr)
        return 3
    path = Path(a.out).expanduser().resolve() if a.out else default_result_path(i, Path.cwd())
    check_result_path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    header = (f"---\ninterview: {i['id']}\nrespondent: {i['person_name']}\nprofile: {i.get('profile')}\n"
              f"completed_at: {i.get('completed_at')}\n---\n\n")
    fd = os.open(str(path), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(header + i["summary_md"].rstrip() + "\n")
    print(f"wrote {path}")
    return 0


def cmd_delete(a) -> int:
    if not a.yes:
        raise StudioError("delete removes the interview and every stored answer for good; rerun with --yes")
    r = call("DELETE", f"/api/studio/interviews/{int(a.id)}")
    print(f"Interview {a.id}: removed {', '.join(r.get('removed') or []) or 'nothing'}.")
    if r.get("left"):
        print("NOT removed (tell Gui): " + "; ".join(r["left"]))
        return 4
    return 0


def main(argv: list | None = None) -> int:
    ap = argparse.ArgumentParser(prog="studio.py", description="Conversation Studio interviews from a repo.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("init")
    s.add_argument("name")
    s = sub.add_parser("check")
    s.add_argument("profile")
    s = sub.add_parser("new")
    s.add_argument("profile")
    s.add_argument("--name", required=True)
    s.add_argument("--email", default="")
    g = s.add_mutually_exclusive_group()
    g.add_argument("--brief", default="")
    g.add_argument("--brief-file")
    s.add_argument("--language")
    s.add_argument("--expires-days", type=int, default=14)
    sub.add_parser("list")
    for name in ("status", "fetch", "delete"):
        s = sub.add_parser(name)
        s.add_argument("id")
        if name == "fetch":
            s.add_argument("--out")
        if name == "delete":
            s.add_argument("--yes", action="store_true")
    a = ap.parse_args(argv)
    try:
        return globals()["cmd_" + a.cmd](a)
    except StudioError as e:
        print("studio: " + str(e), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
