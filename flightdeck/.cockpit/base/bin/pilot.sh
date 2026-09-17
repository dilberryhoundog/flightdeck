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
# The pilot's quarters (identity, job) and the commander's dossier are joined into one
# --append-system-prompt value. A repeated --append-system-prompt-file keeps only the last
# file, and an @ import inside an appended file does not expand (notepad tests T9, T12).
# Everything is passed by path each time, because flags do not persist across --resume.
set -e
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
COCKPIT="$ROOT/flightdeck/.cockpit"
NAME="pilot"
MODEL="fable"
SETTINGS="$COCKPIT/base/settings/pilot.settings.json"
IDENTITY="$COCKPIT/quarters/pilot/identity.md"
JOB="$COCKPIT/quarters/pilot/job.md"
COMMANDER="$COCKPIT/quarters/commander/commander.md"

[ -f "$SETTINGS" ] || { echo "pilot.sh: missing $SETTINGS" >&2; exit 1; }
for f in "$IDENTITY" "$JOB" "$COMMANDER"; do
  [ -f "$f" ] || { echo "pilot.sh: missing $f" >&2; exit 1; }
done

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
    if [ -z "$CHECK" ] && claude agents --json 2>/dev/null | python3 -c 'import json,sys; sys.exit(0 if any(a.get("name")==sys.argv[1] for a in json.load(sys.stdin)) else 1)' "$NAME"; then
      echo "pilot.sh: a session named '$NAME' is already running. Use 'pilot.sh resume' or message it." >&2
      exit 2
    fi ;;
esac

PERSONA=$(cat "$IDENTITY"; printf '\n\n'; cat "$JOB"; printf '\n\n'; cat "$COMMANDER")

run() {
  if [ -n "$CHECK" ]; then
    for a in "$@"; do
      if [ "$a" = "$PERSONA" ]; then printf '<identity.md+job.md+commander.md> '; else printf '%s ' "$a"; fi
    done
    echo; exit 0
  fi
  cd "$ROOT"
  exec "$@"
}

run claude --settings "$SETTINGS" \
  --append-system-prompt "$PERSONA" \
  --name "$NAME" --add-dir "$COCKPIT" \
  ${RESUME:+--resume} ${RESUME:+"$NAME"} \
  ${ADD_MODEL:+--model} ${ADD_MODEL:+"$MODEL"} \
  "$@"
