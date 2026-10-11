# Many hands

A team lead splits a big change into independent items, one builder and one reviewer per item, then joins the item branches into one.

## When to use

Use it when the work splits into many pieces that do not touch the same files, for example one fix at each of forty call sites, or one page for each of ten topics.

Do not use it when the pieces depend on each other or share files (use Build and check), or when there are only two or three (a single builder is cheaper).

## What will tell us the work is right

Each item passes its own check, a fresh reviewer finds no gap in each item, and the joined branch passes the workshop's checks as a whole. If the joined branch fails a check that every item passed, the split was wrong and the team lead says so.

## Phases

1. Split: the team lead reads the brief and lists the items in the attempt folder. Each item has its own files, and no two items share a file. If they do, the lead merges those items into one.
2. Build: one builder per item, each in its own worktree on its own branch, all started together. The team lead gives each the workshop block after its `Rank:` line.
3. Review: one reviewer per item in a fresh context, with the rubric and the workshop's `## questions`. The team lead accepts or rejects each finding with a reason.
4. Fix once: each builder fixes its accepted findings in one round.
5. Join: the team lead merges the item branches into one branch (never main, never a pull request merge), runs the workshop checks on the joined branch and reports.
6. Deliver: the lead opens one draft pull request with the try steps first. The owner merges.

The team lead runs as a runner in a background session (see `ways-to-fly.md`) or as the lead of an agent team.

## Seats

- pilot (flight:pilot): Captain, opus high; picks the team lead, starts it and reads its report.
- team lead (flight:runner): Officer, sonnet high (opus high for a hard team); splits the work, sends the builders and reviewers, joins the branches.
- builder per item (flight:builder): Worker, sonnet high; builds one item in its own worktree.
- reviewer per item (flight:reviewer): Worker, sonnet high; reviews one item.

## Owner's touch points

Nothing starts until the owner says go. The owner may attach to the team lead's background session and answer its questions, and merges the pull request at the end.

## Size and cost

Scales with the items: 2 agents per item plus the team lead. Cost class: high. Do a Recon first if the item list is not clear.
