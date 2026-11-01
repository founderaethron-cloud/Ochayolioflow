#!/usr/bin/env bash
# Publishes ./dist to the `deploy` branch as a normal fast-forward commit.
# Hostinger watches that branch and copies it into public_html.
#
# Used by the GitHub Actions workflow and by `npm run release`.
# DEPLOY_REMOTE_URL overrides the remote (the workflow injects a token URL).
set -euo pipefail

if [ ! -f dist/index.html ]; then
  echo "dist/ is missing. Run 'npm run build' first." >&2
  exit 1
fi

REMOTE_URL="${DEPLOY_REMOTE_URL:-$(git remote get-url origin)}"
SOURCE_SHA="$(git rev-parse --short HEAD)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if git ls-remote --exit-code --heads "$REMOTE_URL" deploy >/dev/null 2>&1; then
  git clone --quiet --depth 1 --branch deploy "$REMOTE_URL" "$WORK"
else
  git init --quiet -b deploy "$WORK"
  git -C "$WORK" remote add origin "$REMOTE_URL"
fi

# Replace the working tree with dist/ (dotfiles included, .git kept).
find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a dist/. "$WORK"/

cd "$WORK"
git config user.name "${DEPLOY_GIT_NAME:-ochayoli-deploy}"
git config user.email "${DEPLOY_GIT_EMAIL:-noreply@users.noreply.github.com}"
git add -A
if git diff --cached --quiet; then
  echo "deploy branch already matches dist/; nothing to publish."
  exit 0
fi
git commit --quiet -m "Deploy from ${SOURCE_SHA}"
git push --quiet origin deploy
echo "Published dist/ to branch 'deploy' (source ${SOURCE_SHA})."
