#!/bin/bash
# Deploys a build to Plesk (web-prod), see docs/deploy.md:
#
#   ./release.sh staging         HEAD -> branch deploy-staging -> https://staging.bonis.de
#   ./release.sh staging --yes   same, without the push question (for `! ./release.sh …` in Claude)
#   ./release.sh staging --dry-run   build and compose the deploy tree, list it, push nothing
#   ./release.sh live [--yes]    HEAD -> branch deploy-live -> https://www.bonis.de
#                                only a commit already on staging; tags it live-YYYY-MM-DD-HHMM
#
# Builds the committed HEAD in a temporary worktree (uncommitted changes are never shipped) and
# runs pnpm check there (staging: VITE_STAGING=1, no Matomo, robots.txt Disallow: /). The deploy
# branch gets client/ (docroot, with version.txt and .htaccess cache headers), server/ (Node entry and sources), package.json
# with runtime dependencies only, a matching trimmed package-lock.json, .nvmrc and
# tmp/restart.txt (new content every build: Passenger restarts the app on the next request).
# Right after the push, release.sh calls the Plesk Git webhook (URLs in .env, see .env.example),
# so Plesk deploys within seconds; without the URL, outside the admin network/VPN (port 8443),
# or when package-lock.json changed (npm install needed), the cron on web-prod (plesk-pull.sh,
# every 5 minutes) deploys it. A push of a deploy branch does not touch the source branches.
# Needs: node 26, pnpm, npm, git with push access to origin.

set -euo pipefail
cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

confirm() {
    [ -n "${YES:-}" ] && return 0
    [ -t 0 ] || fail "No terminal for the question \"$1\": run with --yes (e.g. in Claude's ! mode)."
    read -r -p "$1 (y/N): " reply
    [[ $reply =~ ^[Yy]$ ]]
}

# Clean worktree of HEAD, installed, checked and built; the site is in $WORK/src/dist.
build_head() {
    local log
    info "Building ${SHA:0:7} ($(git log -1 --format=%s)) in a clean worktree..."
    git worktree add --quiet --detach "$WORK/src" "$SHA"
    log="$WORK/check.log"
    if ! (cd "$WORK/src" &&
        pnpm install --frozen-lockfile --silent &&
        npm ci --prefix server --silent --no-audit --no-fund &&
        VITE_STAGING=$STAGING pnpm -s check) > "$log" 2>&1; then
        cat "$log"
        fail "Checks failed (log above)."
    fi
    grep -E 'svelte-check found|pages checked|^ℹ (pass|fail) ' "$log" | sed 's/^/  /'
    ok "Checks passed"
}

# Deploy branch tree from the build in $WORK/src
compose() {
    local out=$1 src="$WORK/src"
    cp -R "$src/dist" "$out/client"
    cp "$src/deploy/htaccess" "$out/client/.htaccess"
    if [ -n "$STAGING" ]; then
        printf 'User-agent: *\nDisallow: /\n' > "$out/client/robots.txt"
    fi
    {
        echo "Commit: ${SHA:0:7} ($(git log -1 --format=%s "$SHA"))"
        echo "Built: $(TZ=Europe/Berlin date '+%Y-%m-%d %H:%M %Z')"
        echo "Target: $TARGET"
    } > "$out/client/version.txt"
    mkdir -p "$out/server" "$out/tmp"
    cp "$src/server/entry.mjs" "$out/server/"
    cp -R "$src/server/src" "$out/server/src"
    node "$src/tools/deploy-package.mjs" "$src/server/package.json" > "$out/package.json"
    cp "$src/server/package-lock.json" "$out/package-lock.json"
    (cd "$out" && npm install --package-lock-only --silent --no-audit --no-fund)
    cp "$src/.nvmrc" "$out/.nvmrc"
    echo "${SHA:0:7} $(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$out/tmp/restart.txt"
}

push_deploy_branch() {
    local branch=$1 out="$WORK/out" lock_changed=
    if git ls-remote --exit-code --heads origin "$branch" > /dev/null; then
        git fetch --quiet --depth 1 origin "$branch"
        git worktree add --quiet -B "$branch" "$out" FETCH_HEAD
    else
        # first deploy: a local branch of that name can only be a leftover of an aborted run
        git branch -D "$branch" > /dev/null 2>&1 || true
        git worktree add --quiet --orphan -b "$branch" "$out"
    fi
    find "$out" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
    compose "$out"
    git -C "$out" add -A
    # version.txt and restart.txt change on every build: alone they are no new deploy
    if git -C "$out" rev-parse -q --verify HEAD > /dev/null &&
        git -C "$out" diff --cached --quiet HEAD -- . ':!client/version.txt' ':!tmp/restart.txt'; then
        ok "Build unchanged, nothing to deploy."
        return
    fi
    if ! git -C "$out" rev-parse -q --verify HEAD > /dev/null ||
        ! git -C "$out" diff --cached --quiet HEAD -- package-lock.json; then
        lock_changed=1
    fi
    if [ -n "${DRY:-}" ]; then
        git -C "$out" diff --cached --stat HEAD 2> /dev/null | tail -1 || true
        (cd "$out" && find . -path ./.git -prune -o -maxdepth 2 -print | sort | grep -v '^\.$' | head -40)
        du -sh "$out/client" | sed 's/^/  client: /'
        ok "Dry run: nothing pushed."
        return
    fi
    # Built files, not sources: commit with plumbing, no hooks in a branch without package.json
    local tree parent commit
    tree=$(git -C "$out" write-tree)
    parent=$(git -C "$out" rev-parse -q --verify HEAD || true)
    commit=$(git -C "$out" commit-tree "$tree" ${parent:+-p "$parent"} -m "deploy $TARGET ${SHA:0:7}")
    git -C "$out" update-ref "refs/heads/$branch" "$commit"
    confirm "Push $branch to origin?" || exit 1
    git -C "$out" push --quiet origin "$branch"
    ok "Pushed $branch."
    trigger_plesk "$lock_changed"
}

# Plesk Git webhook: POST makes Plesk fetch and deploy the branch at once. The URL's uuid is a
# secret, so it lives in .env (gitignored). A failure is no error: the cron deploys within 5 minutes.
# Changed package-lock.json: no webhook, the cron deploys, runs npm install and restarts together.
trigger_plesk() {
    local var url
    var=PLESK_WEBHOOK_$(echo "$TARGET" | tr '[:lower:]' '[:upper:]')
    # only this one line of .env: never export the file into the build (npm scripts, tests)
    url=$( [ -f .env ] && sed -n "s/^${var}=//p" .env | tail -1 | tr -d '\r"' || true)
    if [ -n "$1" ]; then
        info "package-lock.json changed: the Plesk cron deploys and installs within 5 minutes."
    elif [ -z "$url" ]; then
        info "No $var in .env: Plesk deploys within 5 minutes."
    elif curl -fsS -X POST --max-time 20 "$url" > /dev/null; then
        ok "Plesk webhook called, deployed in a few seconds."
    else
        info "Plesk webhook not reachable (admin network/VPN only): Plesk deploys within 5 minutes."
    fi
    echo "  $SITE/version.txt"
}

# live ships only what was checked on staging: HEAD must be the commit deployed there
require_on_staging() {
    local staged
    git fetch --quiet --depth 1 origin deploy-staging || fail "No deploy-staging branch: release staging first."
    staged=$(git show FETCH_HEAD:client/version.txt | sed -n 's/^Commit: \([0-9a-f]*\).*/\1/p')
    [ "$staged" = "${SHA:0:7}" ] ||
        fail "HEAD ${SHA:0:7} is not on staging (staging has ${staged:-nothing}). Run ./release.sh staging first."
    ok "${SHA:0:7} is on staging."
}

tag_live() {
    local tag
    tag="live-$(TZ=Europe/Berlin date '+%Y-%m-%d-%H%M')"
    git tag "$tag" "$SHA"
    git push --quiet origin "$tag"
    ok "Tagged $tag."
}

cleanup() {
    git worktree remove --force "$WORK/src" 2> /dev/null || true
    git worktree remove --force "$WORK/out" 2> /dev/null || true
    rm -rf "$WORK"
}

main() {
    TARGET=${1:-}
    case ${2:-} in
        -y | --yes) YES=1 ;;
        --dry-run) DRY=1 ;;
        "") ;;
        *) fail "Unknown option ${2}. Usage: ./release.sh staging|live [--yes|--dry-run]" ;;
    esac
    case $TARGET in
        -h | --help) sed -n '2,20p' "$0"; exit 0 ;;
        staging) SITE=https://staging.bonis.de STAGING=1 ;;
        live) SITE=https://www.bonis.de STAGING= ;;
        *) fail "Usage: ./release.sh staging|live [--yes]" ;;
    esac
    SHA=$(git rev-parse HEAD)
    WORK=$(mktemp -d -t bonis-release)
    [ "$TARGET" = live ] && require_on_staging
    trap cleanup EXIT
    build_head
    push_deploy_branch "deploy-$TARGET"
    [ "$TARGET" = live ] && [ -z "${DRY:-}" ] && tag_live
    return 0
}

main "$@"
