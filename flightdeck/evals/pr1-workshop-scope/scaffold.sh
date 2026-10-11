#!/usr/bin/env bash
# Writes two probe workshops into the current folder (the run's empty workspace).
set -euo pipefail

mkdir -p .flightdeck/scope-a .flightdeck/scope-b

cat > .flightdeck/workshops.md <<'EOT'
# Workshops

- scope-a: probe workshop A (2026-10-11)
- scope-b: probe workshop B (2026-10-11)
EOT

for w in a b; do
  d=".flightdeck/scope-$w"
  if [ "$w" = a ]; then word="KESTREL-4"; upper="A"; else word="OSPREY-9"; upper="B"; fi
  cat > "$d/workshop.md" <<EOT
# Scope probe $upper

work: Probe workshop $upper, used only to check that its context stays with it.
done: The scout sent into this workshop reports this workshop's scope word.
EOT
  cat > "$d/context.md" <<EOT
# Context for workshop scope-$w

The scope word is $word.
EOT
  cat > "$d/verify.md" <<'EOT'
# Verification for this workshop

## checks

## questions
EOT
done
