# PR 8: Status band, build log

Attempt a1, branch build-1-pr8-band-a1. The lead is the Captain; every stage below is run by a Worker. Dates: 2026-10-11. All entries [stated] unless marked.

## Stages

| stage | seat and rank | model and effort |
|---|---|---|
| gather | Worker | Haiku, low |
| brief | Worker | Opus, high |
| builders (u1, u2) | Worker (one per unit) | Sonnet, high |
| integrate | Worker | Sonnet, medium |
| review | Worker | Sonnet, high |
| adversary | Worker | Opus, high |
| imposter | Worker | Sonnet, high |
| checks | Worker | Haiku, low |
| live | Worker | Sonnet, high |
| triage | Worker | Opus, high |
| fix | Worker | Sonnet, high |
| recheck | Worker | Opus, high |
| land | Worker | Sonnet, medium |

## Stage results

Units: u1 complete, u2 complete. [stated]

Integrate checks [checked]:

- `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`: exit 0
- `claude plugin validate flightdeck`: exit 0
- `node --test 'flightdeck/tests/*.test.mjs'`: exit 0
- `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr8.txt`: exit 0
- `claude plugin validate mods/status-band`: exit 0
- `claude plugin test mods/status-band`: exit 0
- `node --test 'mods/status-band/tests/*.test.mjs'`: exit 0
- `node flightdeck/lib/workshops.mjs list --json`: exit 0
- `grep -nE "fs\.write|process\.|import\(|flightdeck/lib|workshops\.mjs" mods/status-band/register.js mods/status-band/lib/read.js`: exit 0. For this grep, exit 0 means it printed a match, which is a fail under the brief's rule (prints nothing = pass). The match was `read.js` line 1. It was fixed in round 1 (ddba90d) and the recheck reran it: no output, exit 1, the pass.
- removal check: `rm -r mods/status-band lab/owned/pr8.txt` in a scratch worktree of origin/build-1-pr8-band-a1; `claude plugin validate flightdeck`: exit 0
- removal check: `node --test 'flightdeck/tests/*.test.mjs'` (same scratch worktree): exit 0

Verification verdicts: review sound (head ed59b84); adversary NOT DONE (read-only, no shell); imposter read-only try, steps [stated], total about 6.5 minutes against 5, stuck on step 6; checks 10 of 11 passed (grep failed); live L1 to L5 pass, L6 pass on substance with one literal mismatch. [reviewed]

Triage: 20 findings decided. Accepted 14 (one high, five medium counting the question item separately, the rest low), 1 question to the owner, 6 rejected; the full list is in report.md. [reviewed]

Fix: checks_green true, rounds 1. [checked]

Recheck: one item, the accepted high finding (grep on `read.js` line 1), fixed, confirmed at commit ddba90d by rerunning the grep on `register.js` and `lib/read.js` (no output, exit 1). `drift.test.mjs` still names `flightdeck/lib/workshops.mjs` on purpose and is outside the grep. [reviewed]

Draft: yes. Reasons: every try step is [stated]; triage raised one question for the owner.

Size from `git diff --stat origin/build-1-pr1-basic-a1...origin/build-1-pr8-band-a1`: 11 files, 1314 insertions. [checked]

Noted outside this brief, as capture lines: the brief's own forbidden-pattern grep and its generic L1 marketplace name (DBHD-FlightDeck-try-pr8-a1 against flight-band-try-pr8-a1) disagree; the live check used the latter. The brief's first-run screen advice (Enter) picks "No, exit" on the trust-folder screen.
