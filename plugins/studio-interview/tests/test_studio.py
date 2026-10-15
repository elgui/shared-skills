"""Tests for studio.py: profile check, the results path rule, token lookup, and every command
against a fake server. Standard library only: python3 -m unittest discover -s tests"""
import io
import json
import os
import subprocess
import sys
import tempfile
import threading
import unittest
from contextlib import redirect_stderr, redirect_stdout
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "skills" / "studio-interview"))
import studio  # noqa: E402

PROFILE = {"kind": "studio-profile", "version": 1, "name": "check-in", "language": "en",
           "purpose": "Learn how the week runs.", "tone": "Short questions.",
           "dimensions": [{"name": "Linen", "description": "Turnover", "depth": "standard"}]}

INTERVIEW = {"id": 7, "person_name": "Beulah", "status": "completed", "language": "en", "profile": "check-in",
             "created_by": "helena", "created_at": "2026-10-15T09:00:00", "completed_at": "2026-10-16T10:00:00",
             "expires_at": "2026-10-29T09:00:00", "has_summary": True, "summary_md": "## Findings\nAll good."}


class Fake(BaseHTTPRequestHandler):
    calls = []
    status_for_post = 201

    def log_message(self, *a):
        pass

    def _send(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _auth(self):
        if self.headers.get("Authorization") != "Bearer tcs_good":
            self._send(401, {"detail": "Invalid or revoked studio token"})
            return False
        return True

    def do_GET(self):
        Fake.calls.append(("GET", self.path, None))
        if not self._auth():
            return
        if self.path == "/api/studio/interviews":
            self._send(200, {"interviews": [INTERVIEW], "starts_today": 1, "daily_cap": 5})
        elif self.path == "/api/studio/interviews/7":
            self._send(200, INTERVIEW)
        elif self.path == "/api/studio/interviews/8":
            self._send(200, {**INTERVIEW, "id": 8, "status": "active", "summary_md": None, "has_summary": False,
                             "link": "https://x/guided/?exchange=abc"})
        else:
            self._send(404, {"error": "No such interview"})

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        Fake.calls.append(("POST", self.path, body))
        if not self._auth():
            return
        if Fake.status_for_post == 429:
            self._send(429, {"error": "daily_cap_reached", "message": "You have started 5 interviews today."})
            return
        self._send(201, {"id": 9, "person_name": body["person"]["name"], "language": body.get("language", "en"),
                         "status": "created", "link": "https://x/guided/?exchange=zz",
                         "expires_at": "2026-10-29T09:00:00", "starts_today": 2, "daily_cap": 5})

    def do_DELETE(self):
        Fake.calls.append(("DELETE", self.path, None))
        if not self._auth():
            return
        self._send(200, {"id": 7, "deleted": True, "removed": ["session directory", "agent transcript"], "left": []})


def run(*argv):
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = studio.main(list(argv))
    return code, out.getvalue(), err.getvalue()


class ServerCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(("127.0.0.1", 0), Fake)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        Fake.calls.clear()
        Fake.status_for_post = 201
        self.tmp = tempfile.TemporaryDirectory()
        self.home = Path(self.tmp.name)
        self.env = mock.patch.dict(os.environ, {"TELE_CLAUDE_STUDIO_URL": self.url,
                                                "TELE_CLAUDE_STUDIO_TOKEN": "tcs_good"})
        self.env.start()
        self.results = mock.patch.object(studio, "RESULTS_ROOT", self.home / "results")
        self.results.start()
        self.cwd = os.getcwd()
        os.chdir(self.home)

    def tearDown(self):
        os.chdir(self.cwd)
        self.results.stop()
        self.env.stop()
        self.tmp.cleanup()


class TestProfile(unittest.TestCase):
    def test_valid_profile(self):
        self.assertEqual(studio.validate_profile(PROFILE), [])

    def test_bad_profiles(self):
        for bad in ({**PROFILE, "project_context": {}}, {**PROFILE, "purpose": ""}, {**PROFILE, "tone": "x" * 2001},
                    {**PROFILE, "language": "xx"}, {**PROFILE, "soul_preset": "party-facilitator"},
                    {**PROFILE, "dimensions": [{"name": "A", "depth": "abyssal"}]}, {**PROFILE, "kind": "x"}):
            self.assertTrue(studio.validate_profile(bad), bad)

    def test_keys_match_the_bundled_schema(self):
        schema = json.loads(studio.SCHEMA.read_text())
        self.assertEqual(set(schema["properties"]), studio.PROFILE_KEYS)
        self.assertEqual(set(schema["$defs"]["ProfileDimension"]["properties"]), studio.DIMENSION_KEYS)

    def test_email_in_brief_warns(self):
        self.assertTrue(studio.personal_data_warnings("ask jane@example.org too"))
        self.assertFalse(studio.personal_data_warnings("no contacts here"))


class TestToken(unittest.TestCase):
    def test_env_then_file_then_refusal(self):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "tok"
            with mock.patch.dict(os.environ, {"TELE_CLAUDE_STUDIO_TOKEN": "tcs_env"}):
                self.assertEqual(studio.load_token(), "tcs_env")
            f.write_text("tcs_file\n")
            os.chmod(f, 0o600)
            with mock.patch.dict(os.environ, {"TELE_CLAUDE_STUDIO_TOKEN": "", "TELE_CLAUDE_STUDIO_TOKEN_FILE": str(f)}):
                self.assertEqual(studio.load_token(), "tcs_file")
            with mock.patch.dict(os.environ, {"TELE_CLAUDE_STUDIO_TOKEN": "",
                                              "TELE_CLAUDE_STUDIO_TOKEN_FILE": str(Path(d) / "none")}):
                with self.assertRaises(studio.StudioError):
                    studio.load_token()

    def test_plain_http_to_a_remote_host_is_refused(self):
        with mock.patch.dict(os.environ, {"TELE_CLAUDE_STUDIO_URL": "http://example.org"}):
            with self.assertRaises(studio.StudioError):
                studio.base_url()


class TestResultPath(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name) / "client-repo"
        self.repo.mkdir()
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        (self.repo / ".gitignore").write_text("private/\n")

    def tearDown(self):
        self.tmp.cleanup()

    def test_inside_a_repo_is_refused(self):
        with self.assertRaises(studio.StudioError):
            studio.check_result_path(self.repo / "results" / "x.md")

    def test_gitignored_path_inside_a_repo_is_allowed(self):
        studio.check_result_path(self.repo / "private" / "x.md")

    def test_outside_a_repo_is_allowed(self):
        studio.check_result_path(Path(self.tmp.name) / "elsewhere" / "x.md")

    def test_default_path_is_outside_the_repo_and_named_by_repo_date_topic(self):
        with mock.patch.object(studio, "RESULTS_ROOT", Path(self.tmp.name) / "share"):
            p = studio.default_result_path(INTERVIEW, self.repo)
        self.assertEqual(p, Path(self.tmp.name) / "share" / "client-repo" / "2026-10-16-check-in-7.md")


class TestCommands(ServerCase):
    def test_init_then_check(self):
        code, out, _ = run("init", "Check In")
        self.assertEqual(code, 0)
        path = Path(".interviews/profiles/check-in.json")
        self.assertTrue(path.exists())
        self.assertEqual(run("check", str(path))[0], 0)
        self.assertEqual(run("init", "Check In")[0], 2)  # never overwrites

    def test_new_sends_profile_person_and_language_and_prints_link(self):
        p = self.home / "p.json"
        p.write_text(json.dumps(PROFILE))
        code, out, err = run("new", str(p), "--name", "Beulah", "--email", "b@example.org",
                             "--brief", "First week", "--language", "en")
        self.assertEqual(code, 0, err)
        _, path, body = Fake.calls[-1]
        self.assertEqual(path, "/api/studio/interviews")
        self.assertEqual(body["person"], {"name": "Beulah", "email": "b@example.org"})
        self.assertEqual(body["language"], "en")
        self.assertIn("https://x/guided/?exchange=zz", out)
        self.assertIn("no", err.lower())  # the privacy reminder

    def test_new_refuses_an_invalid_profile_before_calling(self):
        p = self.home / "p.json"
        p.write_text(json.dumps({**PROFILE, "fog_agenda": "x"}))
        self.assertEqual(run("new", str(p), "--name", "B")[0], 2)
        self.assertEqual(Fake.calls, [])

    def test_cap_message_is_shown(self):
        Fake.status_for_post = 429
        p = self.home / "p.json"
        p.write_text(json.dumps(PROFILE))
        code, _, err = run("new", str(p), "--name", "B")
        self.assertEqual(code, 2)
        self.assertIn("5 interviews today", err)

    def test_bad_token_says_ask_for_a_new_one(self):
        with mock.patch.dict(os.environ, {"TELE_CLAUDE_STUDIO_TOKEN": "tcs_bad"}):
            code, _, err = run("list")
        self.assertEqual(code, 2)
        self.assertIn("refused", err)

    def test_list_and_status(self):
        self.assertIn("Beulah", run("list")[1])
        self.assertIn("Link: https://x/guided/?exchange=abc", run("status", "8")[1])

    def test_fetch_writes_outside_git_with_private_mode(self):
        code, out, _ = run("fetch", "7")
        self.assertEqual(code, 0)
        written = Path(out.strip().split("wrote ", 1)[1])
        self.assertTrue(str(written).startswith(str(self.home / "results")))
        self.assertIn("All good.", written.read_text())
        self.assertEqual(written.stat().st_mode & 0o777, 0o600)

    def test_fetch_without_summary_exits_3(self):
        self.assertEqual(run("fetch", "8")[0], 3)

    def test_fetch_refuses_a_tracked_path(self):
        repo = self.home / "repo"
        repo.mkdir()
        subprocess.run(["git", "init", "-q", str(repo)], check=True)
        code, _, err = run("fetch", "7", "--out", str(repo / "notes.md"))
        self.assertEqual(code, 2)
        self.assertIn("not gitignored", err)

    def test_delete_needs_yes(self):
        self.assertEqual(run("delete", "7")[0], 2)
        self.assertEqual(Fake.calls, [])
        code, out, _ = run("delete", "7", "--yes")
        self.assertEqual(code, 0)
        self.assertEqual(Fake.calls[-1][:2], ("DELETE", "/api/studio/interviews/7"))
        self.assertIn("agent transcript", out)


if __name__ == "__main__":
    unittest.main()
