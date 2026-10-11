# PR 6: Laboratory, build log (attempt a1)

Branch build-1-pr6-lab-a1, fix commit 69f20a3, base build-1-pr1-basic-a1. Lead seat: Captain. Every stage below ran as a Worker reporting to the Captain.

## Stages

1. Gather. Worker. Haiku, low. Gathered the fixture sources and material for the brief.

2. Brief. Worker. Opus, high. Wrote the brief for PR 6 (the owned list `lab/owned/pr6.txt` has 36 paths).

3. Builders. Workers. Sonnet, high. Three units. Results: u1 complete, u2 complete, u3 complete.

4. Integrate. Worker. Sonnet, medium. Joined the units and ran the integrate checks (below).

5. Review. Worker. Sonnet, high. Verdict: sound except for a broken eval command in try step 5 and an interview drill that cannot finish.

6. Adversary. Worker. Opus, high. Verdict: not finished (description missing, undefined terms, team drill page, schema version, plus smaller issues).

7. Imposter. Worker. Sonnet, high. Verdict: mostly works for a tired owner; the optional paid step fails as written; jargon is the biggest issue.

8. Checks. Worker. Haiku, low. All blocking checks pass at d4602a1; the two eval checks did not run (sandbox guard refused the command text).

9. Live. Worker. Sonnet, high. L1, L2, L3b, L4 pass; L3 fail as written (four causes); L5 not blocking.

10. Triage. Worker. Opus, high. Accepted 3 high findings (and the other accepted items), rejected 7 findings (F2, F4, imposter hijack, imposter split, checks guard). No question raised for the owner.

11. Fix. Worker. Sonnet, high. 1 round, checks_green true. Fix commit 69f20a3.

12. Recheck. Worker. Opus, high. Run because 3 high findings were accepted. 3 of 3 marked fixed; the third is not confirmed live (see below).

13. Land. Worker. Sonnet, medium. Wrote report.md and log.md. The Captain commits them to .flightdeck/build-1/attempts/pr-6/a1/ and opens the pull request into build-1.

## Stage results

Units: u1 complete, u2 complete, u3 complete.

Integrate checks:

| command | exit |
|---|---|
| node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto | 0 |
| claude plugin validate flightdeck | 0 |
| node --test 'flightdeck/tests/*.test.mjs' | 0 |
| node --test 'lab/checks/*.test.mjs' | 0 |
| node --test 'lab/tests/*.test.mjs' | 0 |
| node lab/drills/sweep.mjs | 0 |
| node lab/drills/remove-part.mjs | 0 |
| node lab/checks/lint.mjs | 0 |
| cd lab/fixtures/export-html && node --test 'tests/export/*.test.mjs' && node scripts/export-smoke.mjs && node scripts/export-invariants.mjs | 0 |
| git status --porcelain (after the two drills) | 0 |
| claude plugin eval ... --case 'pr1-[ap]*' (eval-a, non-blocking) | -1 |
| claude plugin eval ... --case 'pr1-workshop-scope' (eval-b, non-blocking) | -1 |

Fix: checks_green true, rounds 1.

Recheck:

1. Broken `--case 'pr1-[ap]*'` glob (review, imposter, live; fixes 1, 4, 18): fixed, by reading lab/evals/README.md lines 11, 13, 15 and brief.md line 329 at 69f20a3. Evals not run.

2. interview.js NESTED lacks `Bash(node *)` (review, live; fixes 5, 6): fixed in the file (line 75, used by the ask step at line 100 and the answer step at line 129). Both steps return the nested reply. Not run live.

3. Answer step command substitution (live; fix 7): fixed on the stated cause (block written to a file, passed on standard input). The command still starts with `cd <clone> &&`; whether the permission check accepts it is not confirmed and needs a live L3 re-run.

## Draft status

Draft: yes. Reasons: try steps 5b and 6 were [stated] (not run by the imposter); the two eval checks did not run or score (exit -1); the interview drill fix has not been re-run live.

## Capture lines (work outside this brief, for the Captain)

Re-run L3 (the interview drill) live on a machine with PR 3 merged to confirm the 69f20a3 fix.

Run `pr1-workshop-scope` once on a machine with bubblewrap and socat to get a real score.

The accepted low and medium findings that the recheck did not cover (jargon on owner pages, team drill page, sweep false pass on a left-out case, untracked results folders, hard-coded session URL in climb.js, README sandbox note, transcripts.md "none found") are not verified as fixed.
