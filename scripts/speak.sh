#!/bin/sh
# Promote captured text to the speak queue when the agent turn ends (Cursor hook: stop).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="${ROOT}/dist/hook.js"
LOG="${HOME}/.cursor/coding-voice/hook.log"

if [ ! -f "$HOOK" ]; then
  mkdir -p "$(dirname "$LOG")"
  date -u "+[%Y-%m-%dT%H:%M:%SZ] speak: missing ${HOOK}" >> "$LOG" 2>/dev/null || true
  exit 0
fi

RUNTIME="${CURSOR_NODE:-}"
if [ -z "$RUNTIME" ] && [ -x "/Applications/Cursor.app/Contents/MacOS/Cursor" ]; then
  RUNTIME="/Applications/Cursor.app/Contents/MacOS/Cursor"
fi
if [ -z "$RUNTIME" ]; then
  RUNTIME="$(command -v cursor 2>/dev/null || command -v node 2>/dev/null || echo node)"
fi

export ELECTRON_RUN_AS_NODE=1
exec "$RUNTIME" "$HOOK" speak
