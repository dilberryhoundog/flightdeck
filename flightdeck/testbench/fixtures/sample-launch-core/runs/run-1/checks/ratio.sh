#!/bin/sh
# A ratio check: deterministic across a fresh copy of this fixture — trial 2 of every four fails, the rest pass.
counter="$(dirname "$0")/.ratio-count"
n=0
[ -f "$counter" ] && n=$(cat "$counter")
n=$((n + 1))
echo "$n" > "$counter"
case $(( (n - 1) % 4 )) in
  1) echo "trial $n: below the bar"; exit 2 ;;
  *) echo "trial $n: above the bar"; exit 0 ;;
esac
