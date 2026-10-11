# Build and check

The default. One builder makes the change; three fresh readers then try to find what is wrong with it. This is the first plan to reach for.

## When to use

Use it when the work changes files and something can tell us whether it is right: tests, a script check, a rubric, or the owner's try steps.

Do not use it for a question with no change to make (use Recon), for a choice that is the owner's taste (use Decide), or for many independent items (use Many hands).

## What will tell us the work is right

The workshop's own checks pass (the commands in its `verify.md` under `## checks`), the reviewer finds no gap against the brief, the adversary finds nothing it can reproduce, and the imposter can follow the try steps as the owner would. Each reader also answers the workshop's `## questions`, yes-is-pass.

## Phases

1. Brief: the lead runs the scope command for the workshop, writes the brief (files, checks, done line) and names the base branch and the new branch.
2. Build: one builder works in its own worktree on its own branch, writes only its files, runs its checks and commits by file name. It returns its branch name and commit; the lead merges that branch into its own before the Check phase, or tells each reader to read the files with `git show <branch>:<path>`.
3. Check: the reviewer, the adversary in cold mode and the imposter start together in fresh contexts with no shared notes. Each gets the work, the rubric (`<plugin root>/rubric.md`) and the workshop's `## questions`.
4. Triage: the lead accepts or rejects each finding and writes a reason for each.
5. Fix once: the builder fixes the accepted findings in one round and reruns the checks. What is still open after that is listed, not fixed again.
6. Deliver: a draft pull request into the base branch, with the try steps first. The owner merges.

## Seats

- pilot (flight:pilot): Captain, opus high; writes the brief, triages findings and opens the draft pull request.
- builder (flight:builder): Worker, sonnet high; builds the unit in its own worktree and fixes accepted findings once.
- reviewer (flight:reviewer): Worker, sonnet high; judges the work against the brief and the rubric.
- adversary (flight:adversary): Worker, opus high; attacks the finished work in cold mode and returns findings a second reader can reproduce.
- imposter (flight:imposter): Worker, sonnet high; plays the owner and follows the try steps literally.

## Owner's touch points

Nothing starts until the owner says go. The owner then sees one draft pull request with the try steps first, and merges it or sends it back.

## Size and cost

About 5 to 6 agents besides the lead. Cost class: medium. One Opus agent, the rest Sonnet.
