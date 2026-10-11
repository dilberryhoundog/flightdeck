# Spec first

Write down what "done" means as checks before anything is built, let the owner glance at them, then build to them.

## When to use

Use it when nothing can yet tell us the work is right, but something could: a check or an eval that does not exist today. Building it first moves the work up to Build and check, and the checks stay for next time.

Do not use it when checks already exist (use Build and check) or when the result is a matter of taste (use Decide).

## What will tell us the work is right

The new checks themselves. A script can run each check, and each yes-is-pass question can be answered from the material. The plan is only right if the adversary cannot find work that passes the checks and is still wrong.

## Phases

1. Define: a builder writes "done" into a proposal file in the attempt folder as `verify:` lines. A check line is `verify: check \`<command>\`: <what passing looks like>`. A question line is `verify: question <a yes-is-pass question>`. Checks a script can run come first.
2. Attack the checks: the adversary, in cold mode, looks for work that would pass every check and still be wrong, and for checks that cannot fail.
3. Glance: the owner reads the short list of checks and strikes or changes any.
4. File: the lead writes the surviving lines into the workshop's `verify.md` on the base branch, as `## checks` and `## questions` lines. Only the lead writes there.
5. Build: a builder, in its own worktree, builds until the new checks pass for the right reason.
6. Review: a reviewer judges the work against the brief, the rubric and the new checks.

Opening text for each seat is in `entry-points.md`.

## Seats

- pilot (flight:pilot): Captain, opus high; files the agreed checks into `verify.md` and runs the plan.
- check writer (flight:builder): Worker, sonnet high; proposes the `verify:` lines.
- adversary (flight:adversary): Worker, opus high; attacks the checks in cold mode.
- builder (flight:builder): Worker, sonnet high; builds to the filed checks in its own worktree.
- reviewer (flight:reviewer): Worker, sonnet high; reviews the finished work against the checks and the rubric.

## Owner's touch points

Nothing starts until the owner says go. The owner glances at the proposed checks before they are filed, and merges the pull request at the end.

## Size and cost

About 4 agents besides the lead, over two stages. Cost class: medium.
