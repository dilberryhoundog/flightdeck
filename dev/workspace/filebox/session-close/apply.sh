#!/usr/bin/env bash
# Applies the session f6216b95 close to the archived cockpit. Run from the repo root:
#   bash dev/workspace/filebox/session-close/apply.sh
# Idempotent: each step checks before it writes. Delete this folder afterwards.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SRC="$ROOT/dev/workspace/filebox/session-close"
ARCH="$ROOT/flightdeck/.cockpit-archive"
LOG="$ARCH/records/logs/2026-09-22_f6216b95.md"
LOGS_MANIFEST="$ARCH/records/logs/MANIFEST-logs.json"
DOSSIER_DIR="$ARCH/records/pilot/dossiers"
DOSSIERS_MANIFEST="$DOSSIER_DIR/MANIFEST-dossiers.json"

# 1. Append the session-end entry to the log.
if ! grep -q 'Session end: the cockpit archived' "$LOG"; then
  cat "$SRC/log-append.md" >> "$LOG"
  echo "log: appended"
else
  echo "log: already appended"
fi

# 2. Copy the dossier.
cp "$SRC/Ds-010-session-concepts.md" "$DOSSIER_DIR/Ds-010-session-concepts.md"
echo "dossier: copied"

# 3. Update the two manifests.
python3 - "$LOGS_MANIFEST" "$DOSSIERS_MANIFEST" <<'EOF'
import json, sys
logs, dossiers = sys.argv[1], sys.argv[2]

d = json.load(open(logs))
for u in d["units"]:
    if u.get("session") == "f6216b95" and "Closed 2026-10-07" not in u["summary"]:
        u["summary"] = u["summary"].rstrip() + " Closed 2026-10-07 after the commander archived v1 and wrote a new founding note; Ds-010 carries the session's concepts and decisions forward."
d["updated"] = "2026-10-07"
json.dump(d, open(logs, "w"), indent=2, ensure_ascii=False); open(logs, "a").write("\n")
print("logs manifest: updated")

d = json.load(open(dossiers))
if not any(u.get("id") == "Ds-010" for u in d["units"]):
    d["units"].append({"id": "Ds-010", "name": "session concepts", "title": "What this session found: the concepts and decisions worth carrying into the next build", "path": "Ds-010-session-concepts.md", "written": "2026-10-07", "from": "records/logs/2026-09-22_f6216b95.md and the notepad", "mission": "M002"})
d["updated"] = "2026-10-07"
json.dump(d, open(dossiers, "w"), indent=2, ensure_ascii=False); open(dossiers, "a").write("\n")
print("dossiers manifest: updated")
EOF

echo "done. Review with: git -C \"$ROOT\" status --short flightdeck/.cockpit-archive"
