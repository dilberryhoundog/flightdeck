# PR 2: Flight board, build log

Build: FlightDeck build-1, pull request 2, attempt a1, branch build-1-pr2-board-a1. Date: 2026-10-11. The lead is the Captain; every stage below ran as a Worker reporting to the Captain.

## Stages

| stage | seat | rank | model | effort |
|---|---|---|---|---|
| gather | gatherer | Worker | Haiku | low |
| brief | briefer | Worker | Opus | high |
| build (units u1, u2) | builders | Worker | Sonnet | high |
| integrate | integrator | Worker | Sonnet | medium |
| review | review | Worker | Sonnet | high |
| adversary | adversary | Worker | Opus | high |
| imposter | imposter | Worker | Sonnet | high |
| checks | checks | Worker | Haiku | low |
| live | live | Worker | Sonnet | high |
| triage | triage | Worker | Opus | high |
| fix | fixer | Worker | Sonnet | high |
| land | lander | Worker | Sonnet | medium |

## Stage results

Units:
- u1: complete
- u2: complete

Integrate checks:

| command | exit |
|---|---|
| `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto` | 0 |
| `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr2.txt` | 0 |
| `claude plugin validate flightdeck` | 0 |
| `node --test 'flightdeck/tests/*.test.mjs'` | 0 |
| `node --test 'lab/checks/*.test.mjs'` | 0 |
| `node --test 'flightdeck/skills/board/tests/*.test.mjs'` | 0 |
| `node flightdeck/skills/board/render.mjs --root flightdeck/skills/board/tests/fixtures --no-gh --out <scratch>/pr-2/fixture-board.html` | 0 |
| `node flightdeck/skills/board/render.mjs --root . --no-gh; then git status --porcelain` | 0 |
| removal check in detached worktree: git rm board, page, `.flightdeck/.gitignore`, pr2 eval, `owned/pr2.txt`; `claude plugin validate flightdeck`; `node --test flightdeck/tests`; `node --test lab/checks`; then `git worktree remove --force` | 0 |
| `claude plugin eval flightdeck --eval-dir lab/evals --case 'pr2-*' --runs 3 ...` (non-blocking) | -1 |

Verification (against d6a19d7):
- review: PASS, 7 low findings.
- adversary: no high or medium, 4 low findings.
- imposter: works end to end; 2 medium, rest low.
- checks: 10 of 11 items run, all pass; eval not run.
- live: checks 1, 2, 3, 5 pass; check 4 fails on exact wording.

Triage: accepted high findings 0. Medium accepted: 2 (silent drop of a note with no question; fresh session adds a date when filing). Medium rejected: 1 (build-internal entries under "Waiting to start"). Low accepted and rejected as listed in report.md.

Fix: checks_green true, rounds 2.

Recheck: null (no accepted high finding).

Size: 21 files, 1782 insertions, 0 deletions against origin/build-1-pr1-basic-a1.

Draft: yes. Reason: try steps 2, 3 (browser part), 4, 5 and 7 were [stated], not run for real.
