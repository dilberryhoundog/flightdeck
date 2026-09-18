#!/bin/sh
# Print the git terrain that logs/branch-manifest.json deliberately omits: tip, remote lag, containment.
# Read-only. Run from anywhere in the repo.
cd "$(git rev-parse --show-toplevel)" || exit 1
printf '%-58s %-8s %-28s %s\n' BRANCH TIP REMOTE CONTAINED_IN
for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
  tip=$(git rev-parse --short "$b")
  if git rev-parse -q --verify "origin/$b" >/dev/null 2>&1; then
    ahead=$(git rev-list --count "origin/$b..$b"); behind=$(git rev-list --count "$b..origin/$b")
    remote="origin +$ahead/-$behind"
  else remote="none"; fi
  cont=""
  for o in $(git for-each-ref --format='%(refname:short)' refs/heads | grep -v "^$b$"); do
    git merge-base --is-ancestor "$b" "$o" 2>/dev/null && cont="$o" && break
  done
  printf '%-58s %-8s %-28s %s\n' "$b" "$tip" "$remote" "${cont:-—}"
done
