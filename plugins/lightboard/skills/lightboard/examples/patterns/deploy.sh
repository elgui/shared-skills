#!/usr/bin/env bash
# Publish site/ to a static host. Optional: see the Lightboard skill, workflows/Publish.md.
#
# Fill in the two lines below (or put your own template at ~/.config/lightboard/deploy.sh and
# every new course will use that instead). DEST is anything rsync accepts; URL is where DEST is
# served, ending in /. Use single quotes so $slug (an unguessable name for this course, kept in
# .deploy-slug) is filled in when the script runs:
#   DEST='me@myhost:/var/www/courses/$slug/'
#   URL='https://myhost.example/courses/$slug/'
DEST=""
URL=""
# A course is private by default: an unauthenticated request must be refused (401/403).
# Set PUBLIC=1 only for a course meant to be public, with the learner's personal notes removed.
PUBLIC="${PUBLIC:-0}"

set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
slug_file="$here/.deploy-slug"
[ -f "$slug_file" ] || echo "patterns-$(python3 -c 'import secrets; print(secrets.token_urlsafe(6))')" > "$slug_file"
slug="$(cat "$slug_file")"
DEST="$(eval echo "$DEST")"; URL="$(eval echo "$URL")"
if [ -z "$DEST" ] || [ -z "$URL" ]; then
  echo "deploy.sh: set DEST and URL at the top of $0 first (see the comments there)." >&2
  exit 2
fi
rsync -a --delete "$here/site/" "$DEST"
code="$(curl -s -o /dev/null -w '%{http_code}' -m 10 "$URL" || true)"
echo "$URL"
echo "unauthenticated request -> HTTP $code"
if [ "$PUBLIC" != "1" ] && [ "$code" != "401" ] && [ "$code" != "403" ]; then
  echo "WARNING: expected 401 or 403 (behind a login). Do not share the link until this is understood." >&2
  exit 1
fi
