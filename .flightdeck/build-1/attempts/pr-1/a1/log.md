# PR 1 attempt 1: stage log

Date: 2026-10-11. Branch: build-1-pr1-basic-a1. The lead is the Captain of the build run; every stage below was run by a Worker.

## Stages

| stage | seat | rank | model | effort |
|---|---|---|---|---|
| gather | gather | Worker | Haiku | low |
| brief | brief | Worker | Opus | high |
| builders u1 to u5 | builder | Worker | Sonnet | high |
| integrate | integrate | Worker | Sonnet | medium |
| review | reviewer | Worker | Sonnet | high |
| adversary | adversary | Worker | Opus | high |
| imposter | imposter | Worker | Sonnet | high |
| checks | checks | Worker | Haiku | low |
| live | live | Worker | Sonnet | high |
| triage | triage | Worker | Opus | high |
| fix | fix | Worker | Sonnet | high |
| land | land | Worker | Sonnet | medium |

## Stage results

units: [{"id":"u1","status":"complete"},{"id":"u2","status":"complete"},{"id":"u3","status":"complete"},{"id":"u4","status":"complete"},{"id":"u5","status":"complete"}]

integrate checks: [{"command":"claude plugin validate flightdeck","exit":0},{"command":"claude plugin validate .","exit":0},{"command":"node lab/checks/hard-rules.mjs --base origin/build-1 --owned lab/owned/pr1.txt","exit":0},{"command":"node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto","exit":0},{"command":"node --test 'flightdeck/tests/*.test.mjs'","exit":0},{"command":"node --test 'lab/checks/*.test.mjs'","exit":0},{"command":"node flightdeck/lib/workshops.mjs scope build-1 --json","exit":0}]

fix: {"checks_green":true,"rounds":1}

recheck: null

## Land stage

The land Worker re-ran the seven integrate checks on the pushed branch tip (all exit 0; 64 and 33 tests pass), wrote report.md and log.md, committed them by name and pushed fast-forward. The pull request body is the same text as report.md. The Captain opens the pull request.
