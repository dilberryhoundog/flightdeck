---
name: launch
description: "Launch an active workshop: pick the smallest team plan that fits, show a five-line launch card, and on your go run it and return a draft pull request. Owner only."
disable-model-invocation: true
argument-hint: <workshop> [dry run]
---

# Launch

`/flight:launch <workshop>` sends a team of agents at one active workshop. A workshop is a piece of work with its own folder in `.flightdeck/`. A launch is one flight from it, and the result is one attempt on its own branch. Follow the thirteen steps below in order. Plain words, one short paragraph per step. Steps 2 to 6 are done quietly: show none of their working. The answer to `/flight:launch` is: at most one line of open questions or uncommitted files, then the five card lines of step 7, then at most one line that explains a term or a caveat, ending "Say go to start."

## 1. Who is who

This session is the Captain: it reads, shows the launch card, waits for the owner's "go", runs the workflow and files what comes back. Every role inside a workflow (scope, brief, builder, checks, reviewer, adversary, imposter, triage, fixer, recheck, report) is a Worker. The owner is the Commander. Nothing here starts on its own: only the owner's "go" starts a run.

## 2. Read the workshop

Read `.flightdeck/<name>/workshop.md` (the card), then `constraints.md`, `context.md`, `verify.md` and `questions.md` in the same folder, whichever exist.

If there is no folder `.flightdeck/<name>/`, say exactly: "<name> is captured, not active. Activate it first with /flight:workshop <name>, or tell the pilot: activate <name>." Then stop. Only the owner activates a workshop.

If the card has a line starting `settled:`, say the workshop is settled and stop.

If `questions.md` has open questions (an `answer:` line that is empty), list them in one line and say the launch can go ahead without them.

## 3. What will tell us the work is right?

Answer this from `verify.md` in one line. It is one of: script checks (the commands under `## checks`), questions a reader can answer (under `## questions`), or only the owner's taste.

## 4. Pick the smallest team plan

Use the rule in `${CLAUDE_PLUGIN_ROOT}/skills/team-plans/SKILL.md`: the smallest plan whose answer to step 3 fits. Say which plan and why, in one line.

If one agent can do it, say "plain chat is enough" and stop. Do the work in chat if the owner asks.

Build and check runs `${CLAUDE_PLUGIN_ROOT}/workflows/build-and-check.js`. Recon runs `${CLAUDE_PLUGIN_ROOT}/workflows/recon.js`. Decide, Spec first, Many hands and Root cause have no workflow yet: say so, say the pilot runs them from their page in `${CLAUDE_PLUGIN_ROOT}/skills/team-plans/`, and stop.

## 5. Base branch and the workshop's files

The base branch is the one the owner is on: `git branch --show-current`. Run `git fetch origin <base>`, then compare `git rev-parse <base>` with `git rev-parse origin/<base>`. Note "pushed: yes" when they match, otherwise "pushed: no".

Run `git status --porcelain .flightdeck/<name>/`. Agents receive the workshop's files in their opening text, so uncommitted files still reach them; if any are uncommitted, say so in one line.

## 6. Attempt number

The attempt number k is one more than the highest `a<k>` found in two places: folders under `.flightdeck/<name>/attempts/`, and branches listed by `git branch -a --list '*<name>-a*'`. With none, k is 1. The new branch is `<name>-a<k>`.

## 7. Show the launch card

The launch card is exactly five lines, shown in chat. It is also passed to the workflow as `card`, and the workflow writes it at the top of `attempts/a<k>/brief.md` on the attempt branch. Nothing is written on the base branch before "go".

Line 1: `Workshop: <name>: <the card's work line, shortened>`

Line 2: `Team plan: <plan>: <one-line why>`

Line 3: `Roles, all Workers: <role (model effort)>, ...; you are the Captain.` For Build and check: `Roles, all Workers: scope (haiku low), brief (opus high), builder (sonnet high), checks (haiku low), reviewer (sonnet high), adversary (opus high), imposter (sonnet high), triage (opus high), fixer (sonnet high), recheck (haiku low), report (sonnet medium); you are the Captain.` For Recon: `Roles, all Workers: scouts 1 to 3 (haiku low), summary (sonnet medium), claim check (sonnet high); you are the Captain.`

Line 4: `Size: about <n> agents, <m> on Opus; a rough guess of <x> to <y> million tokens; the real use shows in /workflows`. Build and check: about 11 agents, 3 on Opus, 1 to 3 million tokens. Recon: about 5 agents, 0 on Opus, 0.2 to 0.6 million tokens.

Line 5: `Branches: from <base> (pushed: yes|no) to new branch <name>-a<k>, as a draft pull request into <base>. Say go to start.` For Recon, line 5 is: `Writes no files; no branch or pull request. Say go to start.`

Two terms may be new to the owner. A worktree is a separate copy of the repository on its own branch, so the builder never touches the owner's checkout. A draft pull request is a pull request marked not ready, and only the owner merges it. Explain them only if the owner asks, in one line after the card; the card itself stays five lines.

## 8. Wait for "go"

Wait for the owner's "go" or a clear yes. Anything else is a change to what was asked: change it and show the card again. Never start without a "go".

## 9. Run it

Use the Workflow tool with the script path `${CLAUDE_PLUGIN_ROOT}/workflows/build-and-check.js` (or `recon.js` for Recon) and these args: `{workshop: "<name>", attempt: k, base: "<base>", dryRun: false, today: <the output of date +%F>, pluginRoot: "${CLAUDE_PLUGIN_ROOT}", card: <the five lines>, task: <the owner's extra words, or "">}`. For Recon the args are `{question: <the workshop's work line and the owner's words>, workshop: "<name>", today, pluginRoot}`.

Then tell the owner: "Launched. Type /workflows to watch it."

If the Workflow tool refuses because the script is outside the folders it may read, say so and give the owner this line to run: `/add-dir ${CLAUDE_PLUGIN_ROOT}`. Then run it again.

## 10. When the result arrives

If `status` is `halted`: say which stage stopped and why, in two lines, and how to retry: run `/flight:launch <name>` again; the next attempt gets the next number.

If `status` is `done` (Recon): show `report_text` as it is, then file its captures if any; nothing was written.

If `status` is `delivered`: give the pull request link. If there is no link because `gh` (GitHub's command line tool) was not available, say the branch and `pr.md` are ready and give the `gh pr create` line from the end of `pr.md`.

If `record_saved` is false, say in one line: "The run finished, but its record files were not saved on the branch; I will save them now (this needs your OK once)." Then follow the repair path below.

Check that `brief.md`, `findings.md`, `report.md` and `log.md` exist on the branch, with `git show <branch>:.flightdeck/<name>/attempts/a<k>/<file>`. For any file that is missing, write it from the result's text (`brief_md`, `findings_md`, `report_md`, `log_md`, `pr_md`) through a temporary worktree: `git worktree add <tmp> <branch>`, write the file, commit it by file name, push the branch unless this was a dry run, then `git worktree remove <tmp>`. Never switch the owner's checkout.

File the result's `questions` into `.flightdeck/<name>/questions.md`, numbered on from the last `q<n>`, and its `captures` into `.flightdeck/workshops.md`, on the current branch. Say so in one sentence each.

List the result's `proposals` (lines starting `context:` or `verify:`) for the owner, without writing them. Never write `constraints.md`: only the owner does.

## 11. Dry run

When the owner adds "dry run", pass `dryRun: true`. Everything runs, but nothing is pushed and no pull request is opened. The files sit on the local branch `<name>-a<k>`, with `pr.md` holding the title and body.

## 12. Other workflows, by name and by path

`/flight:build-and-check <workshop>` runs Build and check directly. Args: `{workshop, attempt, base, dryRun, today, pluginRoot, card, task}`. By path: `${CLAUDE_PLUGIN_ROOT}/workflows/build-and-check.js`. `/flight:launch` is the safe way, because it shows the card and waits for go first.

`/flight:recon` runs Recon on a question. Args: `{question, workshop}` (the workshop is optional). By path: `${CLAUDE_PLUGIN_ROOT}/workflows/recon.js`. It writes no files and returns a report.

`/flight:second-opinion <file, diff or branch>` runs a review, an adversary and an imposter on what you name, then one short summary. Args: `{target, base, workshop, criteria}`. By path: `${CLAUDE_PLUGIN_ROOT}/workflows/second-opinion.js`. It writes nothing in the repository.

If `/flight:<name>` is not offered as a command, run the path with the Workflow tool, with `today` and `pluginRoot: "${CLAUDE_PLUGIN_ROOT}"` added to the args.

## 13. Limits, stated plainly

A workflow pauses when one of its agents needs a permission you have not given. Answer it in `/workflows`.

A launch needs `gh` signed in to open the pull request. Without it, the launch leaves the branch and `pr.md`.

A workflow cannot ask you anything while it runs. Its questions come back in the report, and you answer them in the workshop's `questions.md`.

The report format is in `${CLAUDE_PLUGIN_ROOT}/skills/launch/report-template.md`.
