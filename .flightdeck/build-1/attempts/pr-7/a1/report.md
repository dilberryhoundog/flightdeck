# PR 7: Manuals and library

This pull request is a draft. Three reasons are listed under "Why this is a draft" below.

Built on PR 1's branch (build-1-pr1-basic-a1). Merge PR 1 first; until then this pull request's diff also shows PR 1's files.

## Owner's five-minute try

The imposter measured about 8 to 10 minutes of owner time, not five. [stated] Step 4 can only show a stale page if a `checked:` date is aged by hand, because on day one nothing is stale. All the imposter's pilot calls were headless `claude -p --model haiku`, not your opus/high. [reviewed]

Step 1, install. [reviewed] The imposter ran it in a scratch clone in about 1 minute. Both commands took under a second. It skipped the `git fetch` and `git switch` part. It used a renamed marketplace and `./` in place of `"$PWD"`, because its tool blocked the variable.

In this repository: `git fetch origin && git switch build-1-pr7-manuals-a1`. If FlightDeck is not installed yet, run `claude plugin marketplace add "$PWD" --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local` (if the second says it is already installed, that is fine). If Claude Code is already open, restart it.

Step 2, ask the librarian. [reviewed] About 1 minute (38 s). The answer was correct and cited `workshops-and-launches.md:75`, about 20 lines long. Caution: the live verifier saw the pilot not send `flight:librarian` on a second run. It ran its own grep and the answer was still right. Sending the librarian is not reliable yet (accepted finding, listed below).

Start the pilot: `claude --agent flight:pilot --model opus --effort high`. Type: `Librarian, how do I retry one pull request?` The pilot sends the librarian. The answer says to add a dated line starting `PR <n>:` to `.flightdeck/build-1/constraints.md` and then say "retry PR <n>", and it cites `flightdeck/manuals/operator/workshops-and-launches.md` with a line number.

Step 3, read the manuals index. [stated] About 3 to 4 minutes of reading (62 lines, plus `first-hour.md` at 52 dense lines if followed). Nobody opened it in an editor.

Open `flightdeck/manuals/README.md` in your editor: the three shelves (operator, technical, maintenance), the library, and the first-hour guide at the top of the operator shelf.

Step 4, library check. [reviewed] With nothing stale it took 7 seconds and said "12 pages, none stale." and sent no agent. With one page aged by hand it took 73 s and about $0.18, and it edited 1 line and updated `checked:`.

In the pilot session type `/flight:library-check`. It says how many pages there are and how many are stale (checked more than 30 days ago, or a file it relies on changed since). On the first days none should be, and it stops without sending any agent; if some are listed, it sends the librarian to re-check them and tells you what it changed (nothing is committed).

Step 5, optional. [reviewed] `/flight:manual build-1` took 134 s and about $0.32. The library-review workflow on README.md took 93 s, about $0.26, and gave 7 findings (1 high).

Next, if you want: `/flight:manual build-1` drafts a manual page from build-1's files onto the right shelf, uncommitted (delete the file if you do not want it); or tell the pilot `Run the workflow at flightdeck/workflows/library-review.js with args {"work": "README.md"}` to have the librarian check a file against the manuals.

Two things the try will show you that the text does not say. `/flight:preflight` ends "not green" on this branch because of the failing test below, and first-hour step 4 does not warn about it. [reviewed] The headless runs did not show the literal pre-flight card line or the "PreToolUse:Bash hook error" label, so those were not verified. [reviewed]

## Why this is a draft

A script check is still red: `node --test 'flightdeck/tests/*.test.mjs'` exits 1 (82 of 83). The plugin eval step also did not run (exit -1). [checked]

An accepted high finding is not fixed per the recheck: F1 (the seven-agents test). The recheck ran the test on origin/build-1-pr7-manuals-a1 at head c24cf55 and it still fails: `core.test.mjs` expects exactly seven agent files and the branch has eight, `librarian.md` included. The fix commit did not touch the test. The brief's other remedies (a note in this description, or opening the pull request as a draft) could not be shown from the branch before this pull request existed; this description is that note and the pull request is opened as a draft. The capture `pr1-test-roster-grows` belongs on PR 1's branch (outside this branch, not checked). [reviewed]

A try step was [stated]: step 3, plus opening in an editor, restarting Claude Code and typing into an interactive session, were not run.

All five verifiers ran. Triage raised no question for the owner.

## Script checks [checked]

Run on the verified head a9d68e5 by the review and checks verifiers, and by the integrate stage:

- `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`: exit 0, 9 of 9.
- `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr7.txt`: exit 0, 9 of 9.
- `claude plugin validate flightdeck`: exit 0.
- `node lab/checks/manuals.mjs`: exit 0, 14 of 14, one warning (`rubric-guide.md` is 112 lines).
- `node --test 'lab/checks/*.test.mjs'`: exit 0, 52 of 52.
- `node --test 'flightdeck/tests/library.test.mjs'`: exit 0, 19 of 19.
- `node flightdeck/skills/library-check/stale.mjs --today 2026-10-11`: exit 0, "0 stale of 12 pages".
- `node --test 'flightdeck/tests/*.test.mjs'`: exit 1, 82 of 83. RED. The one failure is `core.test.mjs:775` (PR 1's "exactly seven agent files").
- `claude plugin eval flightdeck --eval-dir lab/evals --case 'pr7-*' --runs 3 --no-publish --trust-plugin --max-cost-usd 3 --json <scratch>/pr-7/eval.json`: exit -1, did not run (the worktree guard refused it). RED.

## Verification [reviewed]

Four agents judged the branch; their verdicts are summarised here. The checks verifier's output is in the section above.

Review (head a9d68e5): meets the brief on structure. All 23 product files exist; the 24 changed files are the 23 owned files plus the brief copy. Nothing under dev/ or .claude/ changed and no PR 1 file was edited. No mismatch between the 30 harness facts and the library files they cite. It could not check the pull request description.

Adversary: not finished, 11 findings (2 high, 3 medium, 6 low). It had no shell and ran no command. It confirmed by reading: ownership list, librarian frontmatter and fallback line, both skills set `disable-model-invocation: true`, `library-review.js` meta and model ceiling, `manuals.mjs` against its spec, the retry section, the chain of command, and the carried-over library pages. Its two high findings were F1 (accepted) and F2 (rejected, below).

Imposter: all five try steps ran headless, with no crash and nothing pushed. The retry answer was right. `/flight:library-check` said "12 pages, none stale." and, with one page aged, sent the librarian and edited that page. Verdict: usable and honest, but soften the items below.

Live (scratch clone, private HOME): L1, L4, L5, L6, L7, L8, L9, L10 passed. L2 failed its strict regex on one of five pairs. L3 passed on the regex but the pilot did not reliably send the librarian. L11 ran with deviations. The main checkout stayed clean and nothing was pushed.

Findings and decisions:

- Accepted, high. F1 (adversary, checks, live): `node --test 'flightdeck/tests/*.test.mjs'` fails at `core.test.mjs:775` and `/flight:preflight` ends "not green". Not fixed per the recheck.
- Accepted, medium. Review: first-hour step 4 does not warn that preflight is "not green".
- Rejected, high. F2 (adversary): `/flight:library-check` runs `stale.mjs` from a cache copy with no git, so it never sees source changes. Live L7 showed it detecting a planted stale page and editing it in the clone.
- Rejected, medium. F4 (adversary): "loads the plugin from the flightdeck/ folder in place" is false. Live L1 showed `claude plugin list` reading from the clone's `flightdeck` folder.
- Rejected, medium. F5 (adversary): an owner with PR 1 already installed keeps a stale 0.2.0 cache copy and misses the librarian and skills.
- Accepted, medium. Review: the try and the manuals README promise the pilot sends the librarian and cites `workshops-and-launches.md`, but `pilot.md` has no librarian instruction.
- Accepted, medium. Imposter: the pilot's routing of "Librarian, ..." is unwritten; the pilot gave the librarian "Rank: Captain" and a widened brief.
- Accepted, low. Live: the pilot does not reliably send `flight:librarian`.
- Accepted, medium. Review: the eval command finds zero cases (cases live in `lab/evals`, outside the plugin) and exits 0, which looks like a pass.
- Accepted, low. Checks: the eval did not run (worktree guard refused it).
- Accepted, medium. Live: the librarian cites "Line 69" under a heading instead of `path:line` (L2 pair 3 fails), and its `policies.md` lines are off by about three.
- Accepted, low. Review: wrong librarian line numbers (`parts.md:70` for line 73).
- Accepted, medium. Review: `library-check` step 4 applies the librarian's edits without a gate; an edit added a wrong `git switch` to first-hour step 1 and a wording tidy.
- Accepted, medium. Imposter: the stale rule fires constantly (9 sources on first-hour) and costs a model run each; the librarian's edit added jargon.
- Accepted, medium. Imposter: `/flight:manual build-1` wrote a meta page with clusters of `file:line` cites and also touched `.flightdeck/workshops.md`.
- Rejected, low. Live: `/flight:manual build-1` edited an existing page to 101 lines with a transient paragraph and left the README index unchanged.
- Accepted, medium. Imposter: `README.md` lists "manuals and libraries" as later and does not name the librarian.
- Accepted, medium. Live: `README.md` crew, later-PR list and "Where things live" are stale once PR 7 lands.
- Accepted, medium. F3 (adversary): H28, `parts.md:79` and `changing-a-part.md:49` say `${CLAUDE_PLUGIN_ROOT}` is filled in only in skills; FlightDeck's own `hooks.json` relies on it.
- Accepted, low. F6: `workshops-and-launches.md:43-44` say "main branch only"; the source says base branch.
- Accepted, low. F7: "agents never write constraints.md" contradicts the retry section's "the pilot files them".
- Accepted, low. F8: H15 omits the documented worktree exceptions.
- Accepted, low. F9: PR 1's `ways-to-fly.md:21` says no workflow scripts ship; PR 7 adds `library-review.js`.
- Accepted, low. F10: `<slug>` and `<k+1>` are unexplained in the retry answer.
- Rejected, low. F11: "rank in the first line of the opening text" versus the global-rules-first order.
- Accepted, low. Imposter: `library-check` prints "Nothing is committed: see git status." even when nothing is stale.
- Rejected, low. Imposter: the Captain summary cited "step 12" and passed unverifiable items to the owner.
- Rejected, low. Imposter: the owner-facing README and first-hour are dense.
- Rejected, low. Imposter: the retry answer is about 20 lines, longer than asked.
- Rejected, low. Imposter: cut PR 7 down (drop `/flight:manual`, library-review, the "Not yet" list).
- Rejected, low. Live: try step 1 `$PWD` blocked in the imposter's tool, no "if not green" line, jargon in README steps.

One fix round ran (head c24cf55). The recheck only re-examined F1. The other accepted findings were not rechecked by an agent in this stage, so I mark none of them fixed here. [stated]

Not seen by any verifier: the pull request description (this text). The adversary also did not run the eval or live results.

## Size [checked]

`git diff --stat origin/build-1-pr1-basic-a1...origin/build-1-pr7-manuals-a1`: 24 files changed, 2403 insertions, 0 deletions. That is the 23 product files (2076 lines) plus the brief copy `.flightdeck/build-1/attempts/pr-7/a1/brief.md` (327 lines). Largest: `library.test.mjs` 327, `manuals.mjs` 240, `manuals.test.mjs` 167, `stale.mjs` 160, `library-review.js` 104, `parts.md` 100, `adversarial-mandate.md` 98.

## Models per stage [stated]

- gather: Haiku, low.
- brief: Opus, high.
- builders: Sonnet, high.
- integrate: Sonnet, medium.
- review: Sonnet, high.
- adversary: Opus, high.
- imposter: Sonnet, high.
- checks: Haiku, low.
- live: Sonnet, high.
- triage: Opus, high.
- fix: Sonnet, high.
- recheck: Opus, high.
- land: Sonnet, medium.

Nothing above Opus at high effort.

## Retry this pull request alone [stated]

Add dated lines starting `PR 7:` to `.flightdeck/build-1/constraints.md`, then say "retry PR 7". The new branch is `build-1-pr7-manuals-a2`.

## Captain's note after landing (2026-10-11)

The red check above is fixed. The cause was PR 1's test, which required exactly seven agent files; the owner foresees 30 or more agents, so the test was wrong, not the librarian. PR 1's branch now requires the seven core agents and applies the rank, ceiling and fallback-line rules to every agent file (commit cd952d3 on build-1-pr1-basic-a1). PR 1's branch was merged into this branch, and on the result: `node --test 'flightdeck/tests/*.test.mjs'` 83 of 83, `node lab/checks/manuals.mjs` 14 of 14, `node --test 'lab/checks/*.test.mjs'` 52 of 52, `claude plugin validate flightdeck` passed, hard-rules with `lab/owned/pr7.txt` 9 of 9. [checked] The eval still did not run. This pull request stays a draft for the [stated] try step.
