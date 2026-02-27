#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ENV_FILE="$(dirname "$(dirname "$0")")/.env"

# Restore git remote credentials if .env exists
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"

  # Configure git user
  git config user.name "$GITHUB_USER"
  git config user.email "264134029+${GITHUB_USER}@users.noreply.github.com"

  # Restore remote URL with PAT (in case container was reset)
  REMOTE_URL="https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
  git remote set-url origin "$REMOTE_URL" 2>/dev/null || git remote add origin "$REMOTE_URL"

  echo "Git credentials restored from .claude/.env"
else
  echo "Warning: .claude/.env not found. Git push may require manual credential setup."
fi
