#!/bin/sh
# Invoke the pilot. Run from anywhere inside the flightdeck repo.
#
#   pilot.sh [start|resume] [--check] [--agents-json] [claude flags...]
#
#   pilot.sh                      start a new pilot session (refuses if one named "pilot" is running)
#   pilot.sh resume               resume the most recent session named "pilot"
#   pilot.sh --check              print the command that would run, without running it
#   pilot.sh --agents-json        print the --agents JSON and exit; never launches
#   pilot.sh start --model opus   any other flags pass through; a --model or --effort here wins
#
# team/officers/pilot/pilot.md is the agent definition and the single source for the pilot's model
# and effort. Its frontmatter and body become the --agents JSON, and --agent selects it, so the body
# replaces the default system prompt; identity.md and the commander's dossier are appended on top.
# The definition's own effort does not apply to a main session agent (measured, CLI 2.1.278), so the
# launcher passes --effort from pilot.md as well. Flags do not survive --resume, so all are re-passed.
set -e
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
COCKPIT="$ROOT/flightdeck/.cockpit"
NAME="pilot"
SETTINGS="$COCKPIT/base/settings/pilot.settings.json"
PILOT_MD="$COCKPIT/team/officers/pilot/pilot.md"
# Files joined into the appended system prompt, in order. Paths must not contain spaces.
APPEND_FILES="$COCKPIT/team/officers/pilot/identity.md $COCKPIT/team/officers/commander/commander.md"

[ -f "$SETTINGS" ] || { echo "pilot.sh: missing $SETTINGS" >&2; exit 1; }
for f in "$PILOT_MD" $APPEND_FILES; do
  [ -f "$f" ] || { echo "pilot.sh: missing $f" >&2; exit 1; }
done

# Pull mode, --check and --agents-json out of the arguments; keep everything else, in order, as pass-through.
MODE=start; CHECK=; SHOW_JSON=; HAS_MODEL=; HAS_EFFORT=; FIRST=1
n=$#
while [ "$n" -gt 0 ]; do
  a=$1; shift; n=$((n - 1))
  if [ -n "$FIRST" ] && { [ "$a" = start ] || [ "$a" = resume ]; }; then MODE=$a; FIRST=; continue; fi
  [ "$a" = --check ] && { CHECK=1; continue; }
  [ "$a" = --agents-json ] && { SHOW_JSON=1; continue; }
  FIRST=
  case "$a" in
    --model|--model=*) HAS_MODEL=1 ;;
    --effort|--effort=*) HAS_EFFORT=1 ;;
  esac
  set -- "$@" "$a"
done

# Read pilot.md: the frontmatter is the strict flat form, one `key: value` per line, the value a bare
# word or a string in quotes it does not itself contain; `prompt` is every byte after the closing
# `---` line. Emits the model, the effort and the --agents JSON, one per line.
FIELDS=$(python3 - "$PILOT_MD" <<'PY'
import json, sys
path = sys.argv[1]
text = open(path, encoding="utf-8").read()
if not text.startswith("---\n"):
    sys.exit("pilot.sh: %s has no frontmatter" % path)
head, _, body = text[4:].partition("\n---\n")
meta = {}
for line in head.splitlines():
    key, _, value = line.partition(":")
    value = value.strip()
    if value[:1] in "\"'" and value[-1:] == value[:1]:
        value = value[1:-1]
    meta[key.strip()] = value
name = meta.pop("name")
meta["prompt"] = body
print(meta.get("model", ""))
print(meta.get("effort", ""))
print(json.dumps({name: meta}))
PY
)
{ read -r MODEL; read -r EFFORT; read -r AGENTS_JSON; } <<EOF
$FIELDS
EOF

if [ -n "$SHOW_JSON" ]; then printf '%s\n' "$AGENTS_JSON"; exit 0; fi

# Effort is re-asserted on start as well as on resume: the agent definition's own effort does not apply.
ADD_EFFORT=
if [ -n "$EFFORT" ] && [ -z "$HAS_EFFORT" ]; then ADD_EFFORT=1; fi

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

PERSONA=
LABEL=
for f in $APPEND_FILES; do
  if [ -z "$PERSONA" ]; then PERSONA=$(cat "$f"); else PERSONA=$(printf '%s\n\n%s' "$PERSONA" "$(cat "$f")"); fi
  LABEL="${LABEL:+$LABEL+}$(basename "$f")"
done

run() {
  if [ -n "$CHECK" ]; then
    for a in "$@"; do
      if [ "$a" = "$PERSONA" ]; then printf '<append-system-prompt: %s> ' "$LABEL"
      elif [ "$a" = "$AGENTS_JSON" ]; then printf '<agents JSON built from team/officers/pilot/pilot.md> '
      else printf '%s ' "$a"; fi
    done
    echo
    echo "appended, in order: $LABEL"
    echo "agent definition: team/officers/pilot/pilot.md (print the JSON with: pilot.sh --agents-json)"
    exit 0
  fi
  cd "$ROOT"
  exec "$@"
}

run claude --settings "$SETTINGS" \
  --agents "$AGENTS_JSON" --agent "$NAME" \
  --append-system-prompt "$PERSONA" \
  --name "$NAME" --add-dir "$COCKPIT" \
  ${RESUME:+--resume} ${RESUME:+"$NAME"} \
  ${ADD_MODEL:+--model} ${ADD_MODEL:+"$MODEL"} \
  ${ADD_EFFORT:+--effort} ${ADD_EFFORT:+"$EFFORT"} \
  "$@"
