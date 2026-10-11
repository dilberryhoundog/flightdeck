# Log: PR 7 Manuals and library, attempt a1

Branch build-1-pr7-manuals-a1, built on build-1-pr1-basic-a1. Lead seat: Captain. Every stage below was run by a Worker reporting to the Captain. Verified head for the review, adversary, imposter and checks verdicts: a9d68e5. Head after the fix round: c24cf55.

## Stages

1. gather. Seat: Worker (gatherer), reports to the Captain. Model: Haiku, effort low.
2. brief. Seat: Worker (briefer), reports to the Captain. Model: Opus, effort high. Output: `.flightdeck/build-1/attempts/pr-7/a1/brief.md`.
3. builders. Seat: Worker (builders u1, u2, u3), report to the Captain. Model: Sonnet, effort high. Results: u1 complete, u2 complete, u3 complete.
4. integrate. Seat: Worker, reports to the Captain. Model: Sonnet, effort medium. Checks listed below.
5. review. Seat: Worker (reviewer), reports to the Captain. Model: Sonnet, effort high.
6. adversary. Seat: Worker (adversary), reports to the Captain. Model: Opus, effort high. No shell; read-only.
7. imposter. Seat: Worker (imposter), reports to the Captain. Model: Sonnet, effort high. Headless runs on haiku for the pilot.
8. checks. Seat: Worker (checks), reports to the Captain. Model: Haiku, effort low.
9. live. Seat: Worker (live), reports to the Captain. Model: Sonnet, effort high. Scratch clone with a private HOME and a throwaway bare remote.
10. triage. Seat: Worker (triage), reports to the Captain. Model: Opus, effort high. Accepted 1 high finding.
11. fix. Seat: Worker (fixer), reports to the Captain. Model: Sonnet, effort high. checks_green: true, rounds: 1.
12. recheck. Seat: Worker (rechecker), reports to the Captain. Model: Opus, effort high. Ran because triage accepted a high finding.
13. land. Seat: Worker (lander), reports to the Captain. Model: Sonnet, effort medium. Wrote report.md and log.md.

## Unit results

- u1: complete
- u2: complete
- u3: complete

## Integrate checks

| command | exit |
|---|---|
| `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto` | 0 |
| `claude plugin validate flightdeck` | 0 |
| `node --test 'flightdeck/tests/*.test.mjs'` | 1 |
| `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr7.txt` | 0 |
| `node lab/checks/manuals.mjs` | 0 |
| `node --test 'lab/checks/*.test.mjs'` | 0 |
| `node --test 'flightdeck/tests/library.test.mjs'` | 0 |
| `node flightdeck/skills/library-check/stale.mjs --today 2026-10-11` | 0 |
| `claude plugin eval flightdeck --eval-dir lab/evals --case 'pr7-*' --runs 3 --no-publish --trust-plugin --max-cost-usd 3 --json <scratch>/pr-7/eval.json` | -1 |

The exit 1 is PR 1's `core.test.mjs:775` (exactly seven agents) failing once `librarian.md` is added. The exit -1 means the eval did not run.

## Fix and recheck

fix: checks_green true, rounds 1 (as reported by the fix stage; the green claim is contradicted by the recheck for the flightdeck test suite, see below).

recheck, one item. Finding F1 (adversary, also checks and live): the flightdeck test command exits 1 on build-1-pr7-manuals-a1 because `core.test.mjs:775` expects exactly seven agent files. Answer: fixed false. Evidence: in a detached scratch worktree of origin/build-1-pr7-manuals-a1 (removed afterwards), the test printed "# tests 83 / # pass 82 / # fail 1" and "not ok 56 - content: exactly seven agent files ...", exit 1. `flightdeck/agents/` on the branch lists 8 files including `librarian.md`. `core.test.mjs` was last changed on this branch in 53e4a4f (a PR 1 commit); the fix commit c24cf55 does not touch it. No pull request existed yet for the head, so no description or draft state could be quoted. The capture `pr1-test-roster-grows` on PR 1's branch was not checked.

## Draft decision

Draft: yes. Reasons: a script check is still red (flightdeck test suite exit 1; eval exit -1); an accepted high finding is not fixed per the recheck (F1); a try step is [stated] (step 3, and editor, restart and interactive typing were not run). All verifiers ran. Triage raised no owner questions.

## Capture lines

- pr1-test-roster-grows: PR 1's `core.test.mjs:775` hard-codes seven agents. Outside this branch; belongs on PR 1's branch.
- The imposter's scratch clone still holds an extra `board-offline` line in `.flightdeck/workshops.md` (scratch only; its sandbox refused the checkout).
