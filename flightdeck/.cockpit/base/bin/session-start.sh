#!/bin/sh
# Cockpit SessionStart hook. Stdin: hook JSON {session_id, transcript_path, cwd, hook_event_name, source}.
# Stdout is added to the pilot's context before the first turn.
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
COCKPIT="$ROOT/flightdeck/.cockpit"
PAYLOAD=$(cat)
python3 - "$PAYLOAD" "$ROOT" "$COCKPIT" "$(claude --version 2>/dev/null | cut -d' ' -f1)" "$(git -C "$ROOT" branch --show-current 2>/dev/null)" "$(date +%F)" <<'EOF'
import json, sys
raw, root, cockpit, cli, branch, today = sys.argv[1:7]
def load(path):
    try:
        return json.load(open(path))
    except Exception:
        return {}
try:
    payload = json.loads(raw)
except Exception:
    payload = {}
sid = payload.get("session_id") or "unknown"
short = sid[:8]
logs = load(cockpit + "/logs/index.json").get("logs", [])
mine = [l for l in logs if l.get("session_id") == sid or l.get("session") == short]
# A resumed session keeps its log, even on a later day.
log_name = mine[-1]["file"] if mine else "%s_%s.md" % (today, short)
print("[cockpit] source=%s cli=%s" % (payload.get("source", "unknown"), cli or "unknown"))
print("[cockpit] session=%s log_name=%s indexed=%s" % (sid, log_name, "yes" if mine else "no"))
print("[cockpit] branch=%s" % branch)
print("[cockpit] current_mission=%s" % (load(cockpit + "/missions/missions.json").get("current") or "none"))
others = [l for l in logs if l not in mine]
if others:
    print("[cockpit] latest_log=flightdeck/.cockpit/logs/%s" % others[-1]["file"])
awaiting = [p["id"] for p in load(cockpit + "/base/proposals.json").get("proposals", []) if p.get("status") == "awaiting"]
print("[cockpit] proposals_awaiting=%d %s" % (len(awaiting), " ".join(awaiting)))
print("[cockpit] Follow the session start procedure in flightdeck/.cockpit/quarters/pilot/job.md before acting.")
EOF
