#!/usr/bin/env bash
# Build the site locally and publish the compiled output to the `deploy`
# branch, which Render serves as-is (see render.yaml). The deploy branch is
# a build-artifact branch: each run force-replaces it with a single commit.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
REMOTE_URL="$(git -C "$ROOT" remote get-url origin)"
cd "$ROOT"

echo "==> Installing dependencies"
npm install

echo "==> Building"
npm run build

test -f dist/index.html || { echo "build produced no dist/index.html" >&2; exit 1; }

echo "==> Publishing dist/ to the 'deploy' branch"
# Stand up a throwaway repo inside dist so its root becomes the branch root.
git -C dist init -q
git -C dist add -A
git -C dist -c user.email=deploy@local -c user.name=deploy \
  commit -q -m "Deploy build"
git -C dist push -f "$REMOTE_URL" HEAD:deploy
rm -rf dist/.git

echo "==> Done. Render will redeploy from the 'deploy' branch."
