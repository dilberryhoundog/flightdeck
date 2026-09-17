#!/bin/sh
# Cockpit SessionStart hook. Stdin: hook JSON {session_id, transcript_path, cwd, hook_event_name, source}.
# Stdout is added to the pilot's context before the first turn.
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
COCKPIT="$ROOT/flightdeck/.cockpit"
PAYLOAD=$(cat)
SOURCE=$(printf "%s" "$PAYLOAD" | sed -n 's/.*"source": *"\([a-z]*\)".*/\1/p')
echo "[cockpit] source=${SOURCE:-unknown}"
echo "[cockpit] branch=$(git -C "$ROOT" branch --show-current 2>/dev/null)"
if [ -f "$COCKPIT/missions/missions.json" ]; then
  CUR=$(sed -n 's/.*"current": *"\([^"]*\)".*/\1/p' "$COCKPIT/missions/missions.json")
  echo "[cockpit] current_mission=${CUR:-none}"
fi
LATEST=$(ls "$COCKPIT/logs"/20*.md 2>/dev/null | sort | tail -1)
[ -n "$LATEST" ] && echo "[cockpit] latest_log=${LATEST#$ROOT/}"
AWAITING=$(grep -c '"status": "awaiting"' "$COCKPIT/base/proposals.json" 2>/dev/null)
echo "[cockpit] proposals_awaiting=${AWAITING:-0}"
echo "[cockpit] Follow the session start procedure in flightdeck/.cockpit/CLAUDE.md before acting."
