# Deploy: Plesk (web-prod)

The site moves from Cloudflare Pages to Plesk on web-prod, like truenas-deutschland and
sty-blog. Server side (subscriptions, Git deploy key, Node.js, env vars, nginx plan): the
web-prod repo, `../web-prod/docs/new-site-plesk.md`. This file is the site side.

Status (2026-10-30):
- **staging.bonis.de**: Plesk, plan "App website", deploys branch `deploy-staging`.
- **www.bonis.de**: still Cloudflare Pages, built from `main`. Stays there until Wim says go.
- The migration lives on branch `plesk`. `main` must keep working on Cloudflare (its Pages
  Function `functions/api/contact.ts` still serves the live contact form with Turnstile), so
  `plesk` is merged into `main` only at go-live.

## Layout

```
pnpm build          -> dist/               static desktop app (Vite)
server/             Node server: /api/altcha, /api/contact, and dist/ (client/) as static files
deploy/             copy of the Plesk plan's nginx directives (CSP), read by tools/check-csp.mjs
tools/, tests/      CSP check, deploy package.json
release.sh          build + push deploy-staging / deploy-live
```

Request chain on Plesk: nginx -> Apache -> Passenger -> `node server/entry.mjs`. nginx serves
every existing file under `client/` itself ("smart static"); Node sees `/`, missing files and
`/api/*`. So the Node server also serves `client/` (`/` -> `index.html`) and sets cache
headers for what it serves (`/assets/*` immutable, everything else `no-cache`). Headers on
files nginx serves come only from the plan (`deploy/nginx-directives.conf`); `.htaccess` would
not apply to them.

Node 26 runs the TypeScript in `server/src/` directly (type stripping): no server build. Server
dependencies are managed with npm in `server/` (Plesk installs from `package-lock.json`); the
app uses pnpm.

## Commands

```bash
pnpm dev            # Vite dev server; proxies /api to :8788
pnpm dev:api        # contact server on :8788 in dev mode (json mail transport, socket IP), serves dist/
pnpm check          # the gate: typecheck (app + server), server tests, tool tests, build, CSP check
./release.sh staging [--dry-run|--yes]
./release.sh live [--yes]       # only a commit already on staging; tags live-<date>
```

First time: `pnpm install` (sets `core.hooksPath .githooks`: pre-push runs `pnpm check`) and
`npm ci --prefix server`.

## Deploy branches

`release.sh` builds the committed HEAD in a clean worktree (`VITE_STAGING=1` for staging: no
Matomo, `robots.txt` `Disallow: /`) and pushes `deploy-staging` / `deploy-live`:

```
client/                 dist/ + version.txt (commit, build time, target)
server/entry.mjs, server/src/
package.json            runtime dependencies only (tools/deploy-package.mjs)
package-lock.json       server/package-lock.json, trimmed to match
.nvmrc                  26
tmp/restart.txt         new content every build: Passenger restarts on the next request
```

Only `release.sh` writes these branches. Plesk follows the branch (cron every 5 minutes, or
at once through the webhook: `PLESK_WEBHOOK_STAGING` / `PLESK_WEBHOOK_LIVE` in the gitignored
`.env`, reachable only from the admin network). When `package-lock.json` changed, release.sh
skips the webhook; the cron deploys, runs `npm install` and restarts together.

Builds run locally, not in GitHub Actions (the Cloudflare branch model keeps `main` as is
until go-live; `gh workflow run` needs the workflow on the default branch).

## Contact form

Both forms (Mail app, bug report dialog) use `src/helpers/contact.ts`: GET `/api/altcha` ->
proof of work in the browser (`src/helpers/altcha.ts`, crypto.subtle, no worker) -> POST
`/api/contact` (urlencoded: `name`, `email`, `subject`, `message`, honeypot `website`,
`altcha`). Answer: JSON `{ success, error?, fields? }`, error codes `input`, `altcha`,
`too-many`, `too-large`, `server`. Both paths work with and without a trailing slash (no
redirect, so a POST stays a POST).

Server code: `server/src/`, ported from truenas-deutschland `src/lib/contact-form/` (see its
`docs/new-site.md` step 4 for the reasoning). Order: same origin (Sec-Fetch-Site, else Origin
host = Host header; no host list, so staging and live both work) -> config -> client IP ->
rate limit -> size and type -> honeypot -> fields -> ALTCHA -> global mail limit -> send.
SMTP requires STARTTLS (except loopback), port 465 is implicit TLS. Logs never contain form
contents, addresses or secrets.

Environment variables (Plesk, per domain; names in `.env.example`, never values: the repo is
public). Read at request time from `process.env`.

| Variable | Required | Meaning |
|---|---|---|
| `SMTP_HOST` | yes | relay host |
| `SMTP_PORT` | no (25) | 465 = implicit TLS |
| `SMTP_USER`, `SMTP_PASSWORD` | no | both or none |
| `SMTP_TLS_SERVERNAME` | no | certificate name if it does not match `SMTP_HOST` |
| `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS` | yes | sender |
| `MAIL_TO_ADDRESS` | yes | recipient |
| `ALTCHA_HMAC_KEY` | yes (secret) | ≥ 32 chars, `openssl rand -hex 32` |
| `CLIENT_IP_HEADER` | no (`x-real-ip`) | `x-real-ip`, `x-forwarded-for`, `socket` |
| `TRUSTED_PROXIES` | no (1) | only with `x-forwarded-for` |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS` | no (5, 600) | posts per IP and window |
| `CHALLENGE_LIMIT_MAX` | no (30) | challenges per IP and window |
| `MAIL_LIMIT_PER_HOUR` | no (30) | mails per hour from all visitors; 10 on Plesk |
| `MAIL_TRANSPORT` | no (smtp) | `json` only with `--dev` |

Limits and the ALTCHA replay store live in process memory (reset on restart, per Passenger
process): accepted risk, as on truenas.

## CSP

`deploy/nginx-directives.conf` copies the plan "App website" (master:
`../web-prod/plans/app-website.nginx.conf`). `pnpm test:csp` checks every built page against
it: no inline scripts (Matomo is a module, `src/helpers/matomo.ts`), no `<style>` elements
(Svelte CSS is emitted as files), `style=""` allowed through `style-src-attr`. Not covered:
`fetch()` targets (`connect-src`: self, matomo, api.github.com, blog.stylite.de; the blog
feed sends `Access-Control-Allow-Origin: *`), frames (`frame-src 'self' https:`), workers.

Need a new origin or header: change the copy, run `pnpm check`, send web-prod the diff and the
reason (`../web-prod/docs/headers.md`). Tightening needs no one.

## Check after a deploy

```bash
curl -s https://staging.bonis.de/version.txt
for u in / /sw.js /assets/<file>.js /does-not-exist; do
  echo "== $u"; curl -sI "https://staging.bonis.de$u" | grep -i -E '^HTTP|cache-control|content-security'
done
```

Then the browser: desktop loads, no CSP errors in the console, Mail app sends (watch the
Node.js log in Plesk: `client address headers (first request)` should show
`"source":"x-real-ip","xRealIp":"ip"`).

## Go-live (when Wim says go)

1. web-prod: subscription for www.bonis.de on "App website", Node.js, env vars.
2. `./release.sh live`, check as above on the live host.
3. DNS www.bonis.de / bonis.de to Plesk (Wim's OK).
4. Merge `plesk` into `main`; then delete `functions/`, `src/helpers/smtp.ts`, `wrangler.toml`,
   `vercel.json` and the Cloudflare env vars.
