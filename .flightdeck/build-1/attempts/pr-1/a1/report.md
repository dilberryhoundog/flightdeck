# PR 1: Basic flight crew

Build-1 pull request 1, attempt 1, built 2026-10-11. Written by the Captain (the lead of the build run) from the stage records, because Claude Code does not let a subagent write a report file. Marks: [checked] a script ran; [reviewed] an agent judged it; [stated] an agent said so and nobody ran it.

## Try it in five minutes

1. In the repository: `git fetch origin && git switch build-1-pr1-basic-a1`, then `claude plugin marketplace add "$PWD" --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local`. [reviewed] The human imposter ran it in a scratch clone with a private home folder: about 1 second.
2. `claude --agent flight:pilot --model opus --effort high`. The pre-flight card shows "FlightDeck 0.2.0 pre-flight: Captain on deck", the branch, the build-1 workshop and its questions, and the captured work waiting to start. [reviewed] The card text matched the README in the real session-start hook output. [stated] Nobody could look at a real screen, and the imposter's pilot ran on Haiku, not Opus: please confirm both on first use.
3. `/flight:preflight`. [reviewed] It ended with "systems green" in about 40 seconds. The items about your own machine (GitHub sign-in, managed settings, branch protection on main) could not be exercised in the cloud sandbox.
4. Ask the pilot to push this branch to main with `--dry-run`. [reviewed] The guard refused with "pushing to main is not allowed (owner rule: never push to main)". Asked in plain words, the model often refuses on its own before the guard runs; the README now says so, and that Claude Code shows the guard's refusal as "PreToolUse:Bash hook error".
5. Plain `claude` in a second terminal: no card, no pilot. [reviewed]

Measured: the five steps took under 2 minutes of machine time; with reading, about 5 minutes. The optional recon, adversary attack and capture took about 4.5 more minutes. [reviewed]

## What it adds

- Seven agents named by their job: pilot, runner, scout, builder, reviewer, adversary, imposter. Each names its own model and effort (pilot and adversary on Opus high, scout on Haiku, the rest on Sonnet). None carries a rank in its name.
- The chain of command in `flightdeck/policies.md`: your four ranks (Commander, Captain, Officer, Worker), who decides what, who reports to whom, how ranks address each other (D2). Rank is given to a seat when work is handed out; each agent has one fallback rank line.
- All six team plans with opening text per seat: Recon, Build and check, Decide, Spec first, Many hands, Root cause, plus the ways-to-fly page.
- The pre-flight card (pilot sessions only) and one guard script: no push to main, no force push, no branch delete for agents; no model or effort above Opus at high; agents cannot write your `constraints.md`, `VISION.md` or `build.txt`.
- Workshops: `.flightdeck/workshops.md` (the list of captured work), six templates including `context.md` and `verify.md`, build-1 as the first active workshop with its own context and checks, and the `scope` command that prints a workshop's own context and checks for the agents sent into it.
- Rule files where the work happens (root `CLAUDE.md`, `.flightdeck/CLAUDE.md`), the review rubric, the profile of you the imposter plays, the optional radio voice (`/output-style flight:radio`), and the hard-rule check.

## Checks [checked]

All exit 0 on the branch tip after the fix round:

- `claude plugin validate flightdeck` and `claude plugin validate .`
- `node lab/checks/hard-rules.mjs --base origin/build-1 --owned lab/owned/pr1.txt` (9/9) and with `--owned auto` (9/9)
- `node --test 'flightdeck/tests/*.test.mjs'` (64/64) and `node --test 'lab/checks/*.test.mjs'` (33/33)
- `node flightdeck/lib/workshops.mjs scope build-1 --json`

## Verification [reviewed]

Five verifiers, each in a fresh context, none seeing the others' notes:

- Review (Sonnet high): no blocking defect; two medium findings (the git guard missed abbreviated options such as `--del`; the hard-rule check could pass when its git diff failed) and four low.
- Adversary (Opus high): ten findings, one medium (a page claimed subagents cannot send out agents, which the docs contradict), nine low (where the guards apply, promote wording, jargon, the runner's question rule, the radio voice instructions, ranks on the team-lead seat, worktree hand-off). It had no shell, so it judged by reading.
- Human imposter (Sonnet high): ran every try step and the optional ones in a scratch clone; twelve findings, the main ones being that the root `CLAUDE.md` made plain chat less plain than the README promised, that step 4 rarely reaches the guard when asked in plain words, and that the made-up `demo-attempt-age` task looked like your real work.
- Script checks (Haiku): all seven passed.
- Live checks (Sonnet high, 13 checks in a scratch clone with a private home): the card, the pilot's greeting, preflight, the push refusal, the scope probe (a scout sent into one workshop knew its scope word and followed its constraint; one sent elsewhere and plain chat did not), the fallback rank line, the radio voice and capture all passed. The truth-guard checks were refused by the model before the hook ran; fed directly, the hook told a subagent and a runner from your own session correctly.

Triage (Opus high) accepted 26 findings and rejected 6 with reasons; no high-severity finding was raised, so no recheck was needed. Every finding and decision is in `findings.md` next to this file. Fixes (one round, Sonnet high): the guard now refuses abbreviated long options, `--prune` and glob refspecs; the hard-rule check fails when it cannot diff; the root `CLAUDE.md` now says ranks apply only to FlightDeck agents and pilot sessions, and that a plain chat does only what is asked and leaves the workshop list alone unless asked; `demo-attempt-age` is marked as an example; the pages lost their jargon; and the agent and team-plan pages were made consistent.

Two capture lines from triage were added to `.flightdeck/workshops.md` (live checks that reach the hook; a runner report file), so the card shows three captured entries waiting to start.

## Size

49 files changed, 3,809 lines added, 10 removed (`git diff --stat origin/build-1...origin/build-1-pr1-basic-a1`). [checked] The plan estimated about 48 files and 2,300 lines; most of the extra lines are tests (97 tests in all).

## Models per stage

Gather Haiku low; brief Opus high; five builders Sonnet high; integrate Sonnet medium; review Sonnet high; adversary Opus high; imposter Sonnet high; script checks Haiku low; live checks Sonnet high; triage Opus high; fix Sonnet high; land Sonnet medium. The Captain is the lead session; every stage sat as a Worker. Nothing ran above Opus at high.

## Why this is a draft

Nobody could look at a real terminal screen or run the pilot on Opus in the sandbox, so step 2's "card visible on screen" and the pilot's behaviour at Opus are yours to confirm. Everything else above was run.

## Retry this pull request alone

Add lines starting `PR 1:` to `.flightdeck/build-1/constraints.md` (or tell the lead in chat) and say "retry PR 1". The next attempt is built on a new branch, `build-1-pr1-basic-a2`, into `.flightdeck/build-1/attempts/pr-1/a2/`; this branch and pull request stay until you close them. Pull requests 2 to 8 are built on this branch, so a late PR 1 retry reruns the ones that use what changed.
