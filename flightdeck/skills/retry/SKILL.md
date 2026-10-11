---
name: retry
description: "Opens the next attempt folder for a workshop after you add truth: names the change at the top of its brief, carries the setup over and attaches the last attempt's findings. Only you start it: /flight:retry <workshop> [group]."
argument-hint: "<workshop> [group]"
disable-model-invocation: true
allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs *), Bash(node ${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs *), Bash(git log *), Bash(git diff *), Bash(git status*), Read
---

# Retry a workshop

This opens the next attempt for a workshop. An attempt is one try at the work, kept in its own folder (`attempts/a1/`, `attempts/a2/` and so on) so earlier tries stay as they were. Retry writes the new attempt's `brief.md`, names the change at its top and attaches the last attempt's findings. It does not run anything.

Only the owner starts this. You are the Captain of this session. You send no agents.

## Arguments

`$0` is the workshop name. `$1` is an optional attempt group, a folder name under `attempts/` such as `pr-3`. Give a group only when the workshop keeps attempts in more than one group.

When `$0` is empty, say "Say which workshop: /flight:retry <workshop> [group]" and stop.

## Step 1: check the workshop is active

Run `node ${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs list --json` and find `$0`. A workshop is active when its folder `.flightdeck/$0/` exists. If it has no folder, refuse in plain words: "$0 is not active, so there is nothing to retry. Activate it with /flight:workshop $0." Then stop. If it is settled, go on; the script prints a warning and retries anyway.

## Step 2: find what changed since the last attempt

The change is the owner's new truth since the last attempt was made. Find the latest attempt in the group from the `list --json` output (its folder under `.flightdeck/$0/attempts/`). Call that folder `<label>`.

- With an attempt: the cut-off is the commit that added the last attempt's brief. Find it with `git log --diff-filter=A --format=%H -- .flightdeck/$0/attempts/<label>/brief.md | tail -1`. When it prints a commit, the change is every line added since that commit to the workshop's `constraints.md`, `context.md`, `verify.md` and the answers in `questions.md`. Use `git diff <commit> -- <those files>` for what was committed since, and `git diff HEAD -- <those files>` for what is not committed yet. Leave out headings, comments and blank lines. When it prints nothing (the attempt or the workshop is not committed), the change is the dated lines in `constraints.md`, and the answers in `questions.md`, that do not appear in the previous attempt's `brief.md`. Compare against that brief, never against file times.
- With no attempt yet: the change is the dated lines in `constraints.md` only. `context.md`, `verify.md` and `questions.md` written by activation are setup, not change.

Never read a whole untracked file as the change.

Keep the owner's lines word for word. Do not reword, shorten, join or fix them.

When nothing changed: if a person is present, ask one plain question, "What changed since the last attempt?", and use their answer word for word as the change. If no person is present, stop and say exactly: "No change found since the last attempt: add a dated line to the workshop's constraints.md, a line to its context.md or verify.md, or answer one of its questions, then run /flight:retry $0 again."

## Step 3: open the attempt

Run `node ${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs retry $0 [--group <group>] --change '<line>'` once, with one `--change` for each changed line. Leave out `--group` when `$1` is empty. A single quote inside a line is written `'\''` inside the quotes; the words themselves stay unchanged. If the script refuses (it says `refused:`), pass its reason on in plain words. When it lists several groups, ask which one to use, or in a session without a person name them and stop.

## Step 4: report

Report in plain words, one paragraph per line:

- the new folder, for example `.flightdeck/$0/attempts/a2/`, and its `brief.md`
- the change named at the top of the brief, quoted
- whether the last attempt's findings were attached, or that there were none
- the attempt's branch name, as the script printed it
- "Nothing is committed and nothing runs yet: fly it with /flight:launch $0 once launches are installed (PR 4), or ask the pilot to send a team."
- that every earlier attempt is left as it was

If this repository is FlightDeck's own and the workshop is `build-1`, add one line: "build-1's pull requests are retried with the build workflow (say 'retry PR <n>'), not with this command."

## Never

Never write a `constraints.md`, never edit an earlier attempt, never commit, never push, never start a run.
