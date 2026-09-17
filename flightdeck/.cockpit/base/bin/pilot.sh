#!/bin/sh
# Invoke the pilot. Run from anywhere inside the flightdeck repo.
#
#   pilot.sh            start a new pilot session (or tell you one is already up)
#   pilot.sh resume     resume the most recent session named "pilot"
#   pilot.sh --check    print the command that would run, without running it
#
# Everything the persona needs is passed by path from the cockpit each time,
# because command-line flags do not persist across --resume.
set -e
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
COCKPIT="$ROOT/flightdeck/.cockpit"
NAME="pilot"
SETTINGS="$COCKPIT/base/settings/pilot.settings.json"
PROMPT="$COCKPIT/CLAUDE.md"

[ -f "$SETTINGS" ] || { echo "pilot.sh: missing $SETTINGS" >&2; exit 1; }
[ -f "$PROMPT" ]   || { echo "pilot.sh: missing $PROMPT" >&2; exit 1; }

MODE="${1:-start}"
set -- claude --settings "$SETTINGS" --append-system-prompt-file "$PROMPT" --name "$NAME" --add-dir "$COCKPIT"

case "$MODE" in
  --check)
    printf '%s ' "$@"; echo; exit 0 ;;
  resume)
    set -- "$@" --resume "$NAME" ;;
  start)
    if claude agents --json 2>/dev/null | grep -q "\"name\":\"$NAME\""; then
      echo "pilot.sh: a session named '$NAME' is already running. Use 'pilot.sh resume' or message it." >&2
      exit 2
    fi ;;
  *) echo "pilot.sh: unknown mode '$MODE' (start|resume|--check)" >&2; exit 1 ;;
esac

cd "$ROOT"
exec "$@"
