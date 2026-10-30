---
name: release
description: Deploy bonis.de to Plesk with release.sh: staging (staging.bonis.de) whenever asked, live (www.bonis.de) only after an explicit yes from Wim. Use for "release", "deploy", "staging", "go live", "veröffentlichen", "online stellen".
---

# Release bonis.de

Targets (details: `docs/deploy.md`):
- **staging**: https://staging.bonis.de. Safe; do it whenever asked.
- **live**: https://www.bonis.de. Only the commit staging already shows, and only after an
  explicit "ja"/"yes" from Wim in this conversation.

## Hard rules

- Never `--no-verify`, never `--force`, never push `deploy-staging`/`deploy-live` by hand
  (only `release.sh`), never edit `release.sh`, hooks or `deploy/` to make a release pass.
- Server, Plesk, env vars, nginx/CSP on the server: `../web-prod` (message it), not here.
- A failing check that is not a simple fix: stop and explain.

## Staging

1. `git status --short` clean (commit with explicit paths first, if Wim wants the changes in).
2. Push the source branch (pre-push runs `pnpm check`).
3. `./release.sh staging --yes` (10 minute timeout). Needs `pnpm`, `npm`, Node 26.
4. `curl -s https://staging.bonis.de/version.txt`: `Commit:` = `git rev-parse --short HEAD`
   (a few seconds with the webhook, else within 5 minutes; a changed package-lock.json always
   waits for the cron).
5. Checks from `docs/deploy.md` "Check after a deploy".

## Live

1. Staging shows exactly HEAD (step 4 above), `git status` clean.
2. Ask: "Damit geht die Version von staging.bonis.de auf www.bonis.de. Soll ich das machen?"
3. `./release.sh live --yes`; it refuses a commit that is not on staging and tags `live-<date>`.
4. `curl -s https://www.bonis.de/version.txt`, then the checks on the live host.
