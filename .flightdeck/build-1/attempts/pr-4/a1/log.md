# PR 4: Launches, log

Branch build-1-pr4-launches-a1, attempt a1. The lead is the Captain; every stage below is a Worker. Marks: [checked] a script ran, [reviewed] an agent judged it, [stated] an agent said so.

## Stages

| stage | seat | rank | model | effort |
|---|---|---|---|---|
| gather | gather | Worker | Haiku | low |
| brief | brief | Worker | Opus | high |
| builders (u1, u2, u3) | builder | Worker | Sonnet | high |
| integrate | integrate | Worker | Sonnet | medium |
| review | review | Worker | Sonnet | high |
| adversary | adversary | Worker | Opus | high |
| imposter | imposter | Worker | Sonnet | high |
| checks | checks | Worker | Haiku | low |
| live | live | Worker | Sonnet | high |
| triage | triage | Worker | Opus | high |
| fix | fix | Worker | Sonnet | high |
| recheck | recheck | Worker | Opus | high |
| land | land | Worker | Sonnet | medium |

Seat names follow the stage names. [stated]

## Stage results

Units: u1 complete, u2 complete, u3 complete. [stated]

Integrate checks: [checked]
- node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto: exit 0
- claude plugin validate flightdeck: exit 0
- node --test 'flightdeck/tests/*.test.mjs': exit 0
- node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr4.txt: exit 0
- node --test 'flightdeck/skills/launch/tests/*.test.mjs': exit 1
- node --test 'lab/checks/*.test.mjs': exit 0
- node flightdeck/lib/workshops.mjs scope ws-a --json --root flightdeck/skills/launch/tests/fixtures: exit 0
- (non-blocking) claude plugin eval flightdeck --case 'pr4-*' --runs 3 --no-publish --trust-plugin --ablation none --max-cost-usd 3 --json <scratch>/pr-4/eval.json --output-dir <scratch>/pr-4/eval-results: exit -1 (not run)

Verifiers: review, adversary, imposter, checks and live all ran. Verdicts are in report.md. [reviewed]

Triage: findings accepted, rejected or raised as a question are listed in report.md; one question for the owner; 2 accepted high findings, so the recheck ran. [reviewed]

Fix: checks_green true, rounds 1. [checked]

Recheck: 2 items, both fixed. [reviewed]
- second-opinion.js prepare no longer runs in an isolated worktree (second-opinion.js lines 86 to 89 quoted in the recheck; no isolation option on the prepare call). Try step 6 and live check 6 were not rerun live; only the source was read.
- build-and-check.js line 191 now passes the rubric path to the imposter; launch tests run on a git archive export at commit c775637 printed 23 tests, 23 pass, 0 fail. [checked]

Land: report.md and log.md written from the above. Token use for the run is in /workflows. [stated]

## Capture lines

- Live check 1 in the brief expects /flight:launch in the model's command list; disable-model-invocation hides it, so the brief's pass wording needs fixing.
- The brief's exact live-check allow list lacks Bash(git worktree *) and Bash(git -C *), and the private HOME needs a git identity; the live-check setup needs both.
- Nested test sessions leaked the parent's CLAUDE_CODE_SESSION_ID; the live stage used a wrapper that strips it.
- Question for the owner (from triage): should a plain session told to launch a workshop be refused instead of activating it?
- The plugin eval with 3 runs was not run in the checks stage.
