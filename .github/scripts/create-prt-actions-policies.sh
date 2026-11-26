#!/usr/bin/env bash
# Create a scoped repository Actions event policy that allows pull_request_target
# only for Fullsend after GitHub's 2026-12-02 default block.
#
# Team-owned PR CI (title check, E2E) uses pull_request + workflow_run and does not
# need pull_request_target.
#
# Requires: gh auth with admin on konflux-ci/konflux-ui (or repo admin PAT in GH_TOKEN).
# Usage: ./.github/scripts/create-prt-actions-policies.sh
#
# See: https://github.blog/changelog/2026-11-02-pull_request_target-blocked-by-default-december-2/
set -euo pipefail

REPO="${REPO:-konflux-ci/konflux-ui}"
API_VERSION="${GITHUB_API_VERSION:-2026-03-10}"

create_policy() {
  local name="$1"
  local workflow_path="$2"
  shift 2
  local events_json
  events_json="$(printf '%s\n' "$@" | jq -R . | jq -s .)"

  echo "Creating policy: ${name}"
  echo "  workflow: ${workflow_path}"
  echo "  events: $*"

  gh api -X POST "repos/${REPO}/actions/policies" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: ${API_VERSION}" \
    --input - <<EOF
{
  "name": "${name}",
  "enforcement": "active",
  "conditions": {
    "workflow_path": {
      "include": ["${workflow_path}"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "restrict_action_events",
      "parameters": {
        "allowed_events": ${events_json}
      }
    }
  ]
}
EOF
  echo
}

echo "Listing existing Actions policies for ${REPO}..."
gh api "repos/${REPO}/actions/policies" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: ${API_VERSION}" \
  --jq '.policies[]? | {id, name, enforcement, conditions}' \
  || true
echo

# Event rules are allowlists: include every event the workflow declares, not only PRT.
# Fullsend shim is upstream-managed and still uses pull_request_target.
create_policy \
  "Allow pull_request_target for fullsend" \
  ".github/workflows/fullsend.yaml" \
  issues issue_comment pull_request_target pull_request_review

echo "Done. Verify under Settings → Actions → Policies and Policy insights."
echo "If older policies still allow PRT for pr-check or pr-title-check, delete them."
