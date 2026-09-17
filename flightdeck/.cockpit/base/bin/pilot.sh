#!/bin/sh
# Invoke the pilot. Run from anywhere inside the flightdeck repo.
#
#   pilot.sh [start|resume] [--check] [claude flags...]
#
#   pilot.sh                      start a new pilot session (refuses if one named "pilot" is running)
#   pilot.sh resume               resume the most recent session named "pilot"
#   pilot.sh --check              print the command that would run, without running it
#   pilot.sh start --model opus   any other flags pass through to claude
#
# Model and effort: the settings file pins Fable at medium effort for a fresh start.
# On resume the model saved in the transcript beats the settings file (effort does not;
# it still comes from settings), so resume adds --model fable unless the caller passed --model.
#
# Everything the persona needs is passed by path from the cockpit each time,
# because command-line flags do not persist across --resume.
set -e
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
COCKPIT="$ROOT/flightdeck/.cockpit"
NAME="pilot"
MODEL="fable"
SETTINGS="$COCKPIT/base/settings/pilot.settings.json"
PROMPT="$COCKPIT/CLAUDE.md"

[ -f "$SETTINGS" ] || { echo "pilot.sh: missing $SETTINGS" >&2; exit 1; }
[ -f "$PROMPT" ]   || { echo "pilot.sh: missing $PROMPT" >&2; exit 1; }

# Pull mode and --check out of the arguments; keep everything else, in order, as pass-through.
MODE=start; CHECK=; HAS_MODEL=; FIRST=1
n=$#
while [ "$n" -gt 0 ]; do
  a=$1; shift; n=$((n - 1))
  if [ -n "$FIRST" ] && { [ "$a" = start ] || [ "$a" = resume ]; }; then MODE=$a; FIRST=; continue; fi
  [ "$a" = --check ] && { CHECK=1; continue; }
  FIRST=
  case "$a" in
    --model|--model=*) HAS_MODEL=1 ;;
  esac
  set -- "$@" "$a"
done

RESUME=; ADD_MODEL=
case "$MODE" in
  resume)
    RESUME=1
    [ -n "$HAS_MODEL" ] || ADD_MODEL=1 ;;
  start)
    if [ -z "$CHECK" ] && claude agents --json 2>/dev/null | grep -q "\"name\":\"$NAME\""; then
      echo "pilot.sh: a session named '$NAME' is already running. Use 'pilot.sh resume' or message it." >&2
      exit 2
    fi ;;
esac

run() {
  if [ -n "$CHECK" ]; then printf '%s ' "$@"; echo; exit 0; fi
  cd "$ROOT"
  exec "$@"
}

run claude --settings "$SETTINGS" --append-system-prompt-file "$PROMPT" --name "$NAME" --add-dir "$COCKPIT" \
  ${RESUME:+--resume} ${RESUME:+"$NAME"} \
  ${ADD_MODEL:+--model} ${ADD_MODEL:+"$MODEL"} \
  "$@"
