# PR 6: Laboratory

Built on PR 1's branch (build-1-pr1-basic-a1). Merge PR 1 first; until then this pull request's diff also shows PR 1's files. [stated]

This pull request is a draft. Why: two try steps could not be run here (5b and 6, marked [stated]), two eval checks did not run, and the interview drill fix has not been run live. Details are below. [reviewed]

## Five-minute try

Step 1. In the repository: `git fetch origin && git switch build-1-pr6-lab-a1` (merge PR 1 first, or try it on this branch, which already holds PR 1). The imposter did this in a scratch clone in under a minute and the plugin loaded as flight 0.2.0. [reviewed]

Step 2. `node lab/drills/sweep.mjs`: for free, it breaks FlightDeck one piece at a time in a throwaway copy (push guard, owner-files guard, model ceiling, card, one workshop's notes leaking to another, and more) and prints a pass line for each break a check caught, ending `21/21 passed`. Measured by the imposter: 33 seconds (0.6 minutes), not "about a minute". The pass lines are short names such as truth-open and scope-leak with no plain gloss yet (see finding 14 below). [reviewed]

Step 3. `node lab/drills/remove-part.mjs`: for free, it removes each later pull request's files in a throwaway copy and shows everything else stays green. On this branch it prints `pass baseline`, `pass remove pr6`, `2/2 passed`, and one more line for each later pull request you merge. Measured by the imposter: 11 seconds (0.2 minutes). [reviewed]

Step 4. `node lab/checks/lint.mjs`: checks the documents for long files and big descriptions. On this branch it prints 7 pass lines and `7/7 rules clean, 0 warnings`. It prints warnings only when a rule is broken (the imposter added 400 lines to CLAUDE.md and got `warn claude-md-length: 457 lines, over 60`, then reverted). It never fails the build. Measured: under 0.1 minute. [reviewed]

Step 5a (optional, about $0.10 in the imposter's runs). Two commands, one per case, because `--case` understands only `*`; square brackets and braces match nothing. Each writes to its own folder so the second does not overwrite the first's report:

`claude plugin eval flightdeck --eval-dir evals --case 'pr1-p*' --runs 1 --no-publish --trust-plugin --ablation none --max-cost-usd 1 --output-dir lab/evals/results/chat`

`claude plugin eval flightdeck --eval-dir evals --case 'pr1-a*' --runs 1 --no-publish --trust-plugin --ablation none --max-cost-usd 1 --output-dir lab/evals/results/adversary`

Both cases scored 1.00 in the reviewer's, the imposter's and the live verifier's runs (the plain-chat case about $0.00, the adversary case about $0.07 to $0.08). The imposter measured this step at about 4 minutes, mostly lost to the old broken glob; the corrected runs took 21 seconds and 6 seconds. The fix to these commands is in commit 69f20a3 (lab/evals/README.md lines 11 to 15); the recheck confirmed it by reading the files, not by running the evals. Note: with `--ablation none` the plain-chat case cannot show FlightDeck stayed quiet compared with bare Claude (finding 20). [reviewed]

Step 5b (optional) [stated]: `claude plugin eval flightdeck --eval-dir evals --case 'pr1-workshop-scope' --runs 1 --no-publish --trust-plugin --ablation none --max-cost-usd 1 --scaffold --allow-tools 'Bash(node *)' --output-dir lab/evals/results/scope`. Nobody could run this on this machine: granting Bash forces the operating-system sandbox, and bubblewrap and socat are not installed here. The harness refused the run and printed a score of 0.25 with a failing "Agent called 0x". That 0.25 is not a real score and says nothing about FlightDeck. On a machine with bubblewrap and socat it needs to be run once to get a real score. The README does not yet say this (finding 12). Open lab/evals/results/report.html after step 5a; the report lands there as the README says. [stated]

Step 6 (optional, with PR 3 merged) [stated]: in a pilot session say "Captain, run the interview drill", then open `lab/results/<today>-interview/index.html`. PR 3 is not merged on this branch, so the imposter could only see the clean refusal ("cannot run yet, PR 3 missing", $0.01, about 1 minute) and no results page was produced. The live verifier ran the whole drill in a clone with PR 3 merged, and only after three outside workarounds (see finding 3); it scored 6/8 (0.75) and the interviewer missed two checks, which is a result about the interviewer, not a fault in the script. The fixes in 69f20a3 for those workarounds have not been re-run live. [stated]

Total cost the imposter spent on the optional steps: about $0.23 against the stated $2, of which $0.15 was a hijacked first drill run. [reviewed]

## Script checks

All on origin/build-1-pr6-lab-a1, run by the integrate stage and re-run by the review, adversary and checks verifiers.

`node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`: 9/9 pass lines, exit 0. [checked]

`claude plugin validate flightdeck`: exit 0. [checked]

`node --test 'flightdeck/tests/*.test.mjs'`: 64 pass, exit 0. [checked]

`node --test 'lab/checks/*.test.mjs'`: 33 pass, exit 0. [checked]

`node --test 'lab/tests/*.test.mjs'`: 44 pass, exit 0. [checked]

`node lab/drills/sweep.mjs`: 21/21 pass, exit 0. [checked]

`node lab/drills/remove-part.mjs`: 2/2 pass, exit 0. [checked]

`node lab/checks/lint.mjs`: 7/7 rules clean, exit 0. [checked]

Fixture (`cd lab/fixtures/export-html && node --test 'tests/export/*.test.mjs' && node scripts/export-smoke.mjs && node scripts/export-invariants.mjs`): exit 0. [checked]

`git status --porcelain` after the two drills: empty, exit 0. [checked]

The two eval commands (`pr1-[ap]*` and `pr1-workshop-scope`) are non-blocking and returned exit -1. The first is the broken glob, since fixed in 69f20a3. The second needs the sandbox. The checks verifier's own run of both was refused by its sandbox guard, so they did not run there. [checked]

Fix stage: 1 round, checks green after it. [checked]

## Verification

Each verifier ran in a scratch clone of the branch at d4602a1 (before the fix commit 69f20a3) with PR 1's current state as the base. Nothing was pushed and /home/user/flightdeck was not touched.

Review: PR 6 is sound except for a broken eval command in try step 5 and an interview drill that cannot finish; both are one-line fixes. Owned file list `lab/owned/pr6.txt` matches the brief (36 paths). The diff against PR 1 is exactly that list minus the three attempt files still to come (findings.md, log.md, report.md). Nothing changed under `dev/` or `.claude/rules/`, and no PR 1 file was edited. The 7 fixture code files are byte-identical to the gathered sources. `scaffold.sh` is mode 100755 and writes exactly the 7 files listed. Sweep 21/21 in about 27 seconds with a clean git status; remove-part and lint pass; the team drill's plant command works (B5 then fails, the other 9 tests pass). Two eval cases scored 1.00. Could not settle: the workshop-scope eval (no sandbox here), and whether the description leads with the try (it did not exist yet). [reviewed]

Adversary: not finished at d4602a1. The code passes its own checks; every sweep find text appears exactly once in PR 1's files. Four problems stood against the criteria: no description yet, undefined terms on owner pages, the team drill page failing if followed literally, and the case.yaml schema version. Smaller issues are in the list below. [reviewed]

Imposter: PR 6 mostly works for a tired owner. The free drills and lint ran clean from a fresh clone and the sweep really breaks real files. The optional paid step failed as written (broken glob), the scope eval cannot run here, drill output is cryptic, and the biggest issue is jargon. Timings are in the try steps above. [reviewed]

Checks: all blocking checks pass at d4602a1. The two eval checks did not run because the sandbox guard refused the command text. [checked]

Live: L1 pass (sweep 21/21, remove-part 2/2, clean git status). L2 pass (a haiku pilot named the sweep command and the remove-part and interview drills for $0.005). L3 fail as written, for four separate causes; with workarounds the drill ran to the end and scored 6/8, withheld_fact_found false. L3b pass with `--add-dir`. L4 pass (plant command, then 9 pass and 1 fail on B5). L5: both PR 1 cases score 1.00 once the glob is replaced; the scope case errors for lack of bubblewrap (not blocking). The team drill, the teammate-type check and a real climb were not run ([stated], as the brief says: the first two are interactive-only experimental agent teams; climbs cost up to $10 and their cases ship later). [reviewed]

Recheck (Opus, accepted high findings only, by reading files at fix commit 69f20a3; no evals or drills were run): [reviewed]

Recheck 1, broken `--case 'pr1-[ap]*'` glob (findings 1, 15 and 28): fixed. lab/evals/README.md lines 11 and 13 now give one command per case and line 15 says brackets match nothing. Only brief.md line 30 still shows the old pattern, described as the old form that ran no case. [reviewed]

Recheck 2, interview.js NESTED had no `Bash(node *)` grant (findings 2 and 22): fixed in the file. NESTED (now line 75) carries `--allowedTools 'Bash(node *)'` for both the ask step and the answer step, and both steps now return the nested reply and permission denials so a refusal shows. Not run live. [reviewed]

Recheck 3, answer step used command substitution inside `cd ... &&` (finding 23): the command substitution is gone; the block is now written to a file and passed on standard input. The command still starts with `cd <clone> &&`, and whether the permission check accepts it needs a live re-run of L3. Not confirmed. [reviewed]

### Findings and decisions (triage, Opus)

Halt status of the five verifiers: info, accepted. [stated]

1. Review, high, accepted: try step 5 and lab/evals/README.md:11, `--case 'pr1-[ap]*'` matches no cases and exit 1 reads as a low score. Fixed (recheck 1). [reviewed]

2. Review, medium, accepted: interview.js NESTED has no `Bash(node *)` grant, so the scaffold.mjs calls are refused and the drill halts. Fixed in the file (recheck 2), not run live. [reviewed]

3. Review, low, accepted: the workshop-scope eval needs the OS sandbox (bubblewrap, socat on Linux); the README is silent and 0.25 reads as a bad score. Not rechecked. [stated]

4. Review, low, accepted: climb.js:152 hides held-back test cases only by a prompt instruction, while lab/CLAUDE.md:18 and climbs/README.md:12 state "never reads" as fact. Not rechecked. [stated]

5. Review, low, accepted: `sweep.mjs --case` naming a left-out case prints pass baseline, 1/1 passed, exit 0 (a false pass). Not rechecked. [stated]

6. Review, low, accepted: undefined terms on owner-facing pages (training/held-back test score, [stated], hard-rule check). Not rechecked. [stated]

7. Adversary F1, medium, accepted: the team drill fails when followed literally (the local-scope plugin is off in the $HOME copy; the second-opinion path and notes path are relative and do not exist there). Not rechecked. [stated]

8. Adversary F2, medium, rejected: no pull request description (report.md, findings.md, log.md missing). Rejected because those files are written by this landing step. [stated]

9. Adversary F3, medium, accepted: owner-facing pages use undefined terms (training/held-back score, glob, slug, [stated], managed scope, plugin-manifest case, "literal above the ceiling", untracked, sweep, remove-part, hard-rule check). Not rechecked. [stated]

10. Adversary F4, medium, rejected: case.yaml has schema_version "1.0" while the docs say 1.1 is required, and no eval run is recorded. Rejected by triage. Note that the two PR 1 eval cases did load and scored 1.00 in three verifiers' runs. [stated]

11. Adversary F5, low, accepted: untracked `lab/results/<date>-*/` folders make `hard-rules --owned auto` fail. Not rechecked. [stated]

12. Adversary F6, low, accepted: climb.js hard-codes this build's Claude-Session URL in the round and report commit trailers. Not rechecked. [stated]

13. Adversary F7, low, accepted: the eval README omits that granting Bash forces the OS sandbox (bubblewrap and socat on Linux, home folder unreadable). Same cause as finding 3. Not rechecked. [stated]

14. Adversary F8, low, accepted: try step 4 promised "a list of gentle warnings" but lint prints 7 pass lines and `7/7 rules clean, 0 warnings`. Step 4 above now says what it prints. [stated]

15. Imposter, high, accepted: try step 5's first eval command `pr1-[ap]*` exits 1 with no cases, and two runs into one `--output-dir` overwrite report.html. Fixed (recheck 1: separate commands and separate output folders). [reviewed]

16. Imposter, high, accepted: the scaffolded case is refused without a sandbox and prints a 0.25 that looks like FlightDeck failing. Same cause as finding 3; not fixed in code, called out in step 5b above. [stated]

17. Imposter, medium, accepted: the sweep prints 21 bare case names (truth-open, scope-leak and so on) the owner cannot read. Not rechecked. [stated]

18. Imposter, medium, rejected: nested `claude -p` inherits CLAUDE_CODE_SESSION_ID and similar from the parent session, hijacked a run and wrote a stray scratchpad file. Rejected by triage. [stated]

19. Imposter, low, accepted: try wording against real output (lint says `7/7 clean` not warnings, remove-part shows only pr6, sweep takes about 33 seconds not "about a minute"). Step text above uses the measured figures. [stated]

20. Imposter, low, accepted: `pr1-plain-chat-quiet` with `--ablation none` cannot show FlightDeck stayed quiet versus bare Claude. Not rechecked. [stated]

21. Imposter, low, rejected: PR 6 is too broad for a tired owner; split climbs and team drills into a separate pull request and cut the paid steps from the try. Rejected by triage. [stated]

22. Checks, low, rejected: both eval checks were refused by the worktree isolation guard (glob and quoted `Bash(node *)` misread). Rejected as a guard artefact. [stated]

23. Live, high, accepted: interview.js ask step, the nested session was denied every node command and the halt text hides the cause. Fixed (recheck 2); both steps now return the nested reply. Not run live. [reviewed]

24. Live, high, accepted: interview.js answer step, command substitution inside `cd ... && claude -p --resume ... "$(cat block)"` is refused. Command substitution removed (recheck 3); the `cd ... &&` part remains and needs a live re-run. [reviewed]

25. Live, medium, accepted: a scratch folder outside the nested session's working directory blocks cd and mkdir unless `--add-dir` is given. Not rechecked. [stated]

26. Live, medium, accepted: the brief's L3 command puts the prompt after the variadic `--allowedTools`, which swallows it, and `claude -p` exits 1. Not rechecked. [stated]

27. Live, low, accepted: transcripts.md says "none found" because the nested session id equals the outer id and the page agent cannot list ~/.claude. Not rechecked. [stated]

28. Live, low, accepted: the L3b halt text depends on the setup agent (a refused mkdir gives "setup failed" instead of "needs PR 3 (workshops) merged"). Not rechecked. [stated]

29. Live, low, accepted: `--case` does not support brackets or braces. Same cause as finding 1; the README now says so. [reviewed]

30. Live, low, accepted: `pr1-workshop-scope` cannot run here without bubblewrap and socat; 0.25 is not a real score. Same cause as finding 3. [stated]

Only the three high findings were rechecked. The other accepted findings went through fix round 1 as far as the fix stage's own log shows, but nobody verified them afterwards, so treat them as open until a later pass. [stated]

Triage raised no question for the owner. [stated]

## Size

34 files changed, 2878 insertions, 0 deletions, from `git diff --stat origin/build-1-pr1-basic-a1...origin/build-1-pr6-lab-a1` at 69f20a3. The three attempt files (findings.md, log.md, report.md) are added by the Captain on top. [checked]

## Models per stage

Gather: Haiku, low. Brief: Opus, high. Builders: Sonnet, high. Integrate: Sonnet, medium. Review: Sonnet, high. Adversary: Opus, high. Imposter: Sonnet, high. Checks: Haiku, low. Live: Sonnet, high. Triage: Opus, high. Fix: Sonnet, high. Recheck: Opus, high. Land: Sonnet, medium. Nothing above Opus at high effort. [stated]

## Retry this pull request alone

Add "PR 6:" lines to .flightdeck/build-1/constraints.md, then say "retry PR 6". The retry builds on a new branch, build-1-pr6-lab-a2, and leaves the other pull requests alone. [stated]
