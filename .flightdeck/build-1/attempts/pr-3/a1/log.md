# PR 3: Workshops, build log

Branch: build-1-pr3-workshops-a1, built on build-1-pr1-basic-a1, to be opened into build-1. Lead: Captain. Every stage below was run by a Worker.

## Stages

1. gather. Worker (scout seat). Haiku, low effort. Read the repository and the binding documents.
2. brief. Worker (planner seat). Opus, high effort. Wrote the attempt brief (.flightdeck/build-1/attempts/pr-3/a1/brief.md, 319 lines).
3. builders. Workers. Sonnet, high effort. Units: u1 complete, u2 complete, u3 complete.
4. integrate. Worker. Sonnet, medium effort. Ran the checks below.
5. review. Worker (reviewer seat). Sonnet, high effort. Verdict: mostly sound, not done; one high, two medium, three low findings.
6. adversary. Worker (adversary seat). Opus, high effort. Read files only, no shell. Verdict: NOT DONE; 1 high, 3 medium, 4 low findings.
7. imposter. Worker (imposter seat). Sonnet, high effort. Ran as claude -p with haiku. Core loop works; fatigue costs; steps 2 to 4 took about 8 minutes.
8. checks. Worker. Haiku, low effort. PASS for 8 of 9 commands; the plugin eval step was refused before it started.
9. live. Worker. Sonnet, high effort. 10 of 12 live checks pass; checks 10 and 11 fail.
10. triage. Worker. Opus, high effort. Accepted 3 high findings; raised one question for the owner (skip leaves a question open); rejected 5 findings.
11. fix. Worker. Sonnet, high effort. 1 round. checks_green: true. Commit 6f361d4.
12. recheck. Worker. Opus, high effort. Ran because 3 high findings were accepted. All 3 answered YES, fixed in the text, by reading the branch, not by a live run.
13. land. Worker. Sonnet, medium effort. Wrote this text; the Captain commits it and opens the pull request.

## Units

- u1: complete
- u2: complete
- u3: complete

## Integrate checks

- node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto: exit 0
- node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr3.txt: exit 0
- claude plugin validate flightdeck: exit 0
- node --test 'flightdeck/tests/*.test.mjs': exit 0
- node --test 'flightdeck/skills/workshop/tests/*.test.mjs': exit 0
- node --test 'lab/checks/*.test.mjs': exit 0
- node flightdeck/skills/workshop/scaffold.mjs check-bundle flightdeck/skills/workshop/tests/fixtures/bundle.activate.md: exit 0
- claude plugin eval flightdeck --eval-dir lab/evals --case 'pr3-*' --runs 3 --no-publish --trust-plugin --max-cost-usd 3 --json &lt;scratch&gt;/pr-3/eval.json: exit -1 (not run)

## Fix

{"checks_green": true, "rounds": 1}

## Recheck

- Promote dry run produces no proposed lines, no adversary verdict and no body: fixed in the text (commit 6f361d4). Not run live.
- Drafter filters the planted push-to-main line before the adversary sees it: fixed in the text (a flagged list, passed to the adversary). Not run live.
- Drafter proposes nothing on 3 of 4 runs and no empty-proposal path: fixed in the text (decisions proposed unless false, duplicate or in conflict; Step 6b empty-edits path). Not run live.

## Size

17 files changed, 2302 insertions, from git diff --stat origin/build-1-pr1-basic-a1...origin/build-1-pr3-workshops-a1.

## Draft

The pull request is a draft: the plugin eval did not run; try steps 1, 3 and 6 are partly [stated]; the live checks 10 and 11 were not re-run after the fix and the adversary ran without a shell; triage left one question for the owner.

## Constraints kept

Nothing was pushed to main or master, no force-push, no branch deleted, no pull request merged, no branch switched in /home/user/flightdeck. The land stage wrote no file; git fetch origin and git diff --stat were the only commands run.
