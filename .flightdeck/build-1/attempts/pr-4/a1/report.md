# PR 4: Launches

Draft pull request into build-1. Marks: [checked] a script ran, [reviewed] an agent judged it, [stated] an agent said so and it was not run or confirmed.

Built on PR 1's branch (build-1-pr1-basic-a1). Merge PR 1 first; until then this pull request's diff also shows PR 1's files. [stated]

## Try it in five minutes

1. In the repository, switch to this pull request's branch: git fetch origin && git switch build-1-pr4-launches-a1. If FlightDeck is not installed yet, run PR 1's two install commands: claude plugin marketplace add "$PWD" --scope local and claude plugin install flight@DBHD-FlightDeck --scope local. If it is installed, it picks up the new files the next time you start Claude Code. Measured 2 seconds; both commands worked and claude plugin list shows flight enabled. [reviewed]

2. Start the pilot: claude --agent flight:pilot --model opus --effort high. The imposter could not run this interactively (no terminal). It ran the SessionStart hook directly: the card prints correctly in under 1 second, and plain claude prints nothing at start. [stated]

3. Turn the example task into an active workshop. With PR 3 merged, type /flight:workshop demo-attempt-age. With PR 1 alone, say: "activate demo-attempt-age. Done when the pre-flight card shows how long ago each workshop's latest attempt ran. Check: node --test 'flightdeck/tests/*.test.mjs' passes." (demo-attempt-age is an example task the build made up; you can delete its line afterwards.) Measured 1.4 minutes. The folder, card, context and verify files were made correctly, but the pilot also tried to build. [reviewed]

4. Type /flight:launch demo-attempt-age. Read the five-line launch card: the team plan and why, the roles with their rank and model, how many agents and a rough token guess, and the branch it will make. Say "go". Measured 0.6 minutes to the card. The card is correct but came wrapped in about 20 extra lines. [reviewed]

5. Type /workflows to watch it run. Starting it takes under five minutes; the draft pull request arrives later (a guess: 20 to 40 minutes), and the pilot tells you when the run ends, files any questions and captured work, and gives you the link. The imposter did not run /workflows (interactive screen) and got no pull request link (the base branch was not on the throwaway origin and gh is not available). Measured launches: attempt 1 halted after 4.0 minutes (no git author name, test setup), attempt 2 halted after 2.8 minutes (a git command needed approval), attempt 3 ran all 11 agents in 10.7 minutes and made branch demo-attempt-age-a3 with 3 commits and 69 of 69 tests passing, but no pull request and an incomplete record (this is the "delivered without record files" finding below). About 17.5 minutes in total against the stated 20 to 40. [stated]

6. Next, optional: /flight:second-opinion README.md for three independent readings of one file and a short summary. If /flight:second-opinion is not offered as a command, say "run the second-opinion workflow on README.md" and the pilot runs it by its file path. This failed in the first build (1.2 minutes; the readers got a deleted worktree path). The fix is in the branch, but the step was not rerun live. [stated]

Total imposter test time was about 28 minutes. Real tokens for the one successful launch were about 0.9M fresh and output (9M with cached reads). [reviewed]

## Script checks

- node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto: exit 0, 9 of 9 pass. [checked]
- claude plugin validate flightdeck: exit 0. [checked]
- node --test 'flightdeck/tests/*.test.mjs': exit 0, 64 of 64 pass. [checked]
- node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr4.txt: exit 0, 9 of 9 pass. [checked]
- node --test 'flightdeck/skills/launch/tests/*.test.mjs': exit 1 at integrate (17 of 18; the imposter task lacked the rubric path). After the fix round it printed 23 tests, 23 pass, 0 fail, run on a git archive export of the branch at commit c775637. [checked]
- node --test 'lab/checks/*.test.mjs': exit 0, 33 of 33 pass. [checked]
- node flightdeck/lib/workshops.mjs scope ws-a --json --root flightdeck/skills/launch/tests/fixtures: exit 0; it prints the ALPHA-CONTEXT-7301 block and the ALPHA-CHECK-7302 check. [checked]
- Non-blocking plugin eval (claude plugin eval flightdeck --case 'pr4-*' --runs 3 ...): not run by the checks stage (the worktree guard refused it), exit -1. The reviewer ran one run of pr4-smallest-team-plan by hand: score 1, cost $0.04. The brief asks for 3 runs. [checked]
- Deleting every path on lab/owned/pr4.txt leaves validate, the hard-rule check and PR 1's tests green. [checked]
- Nothing outside lab/owned/pr4.txt changed, and nothing under dev/ or .claude/rules/. [checked]

## Verification

Review (Sonnet high): not ready to accept as first built. 13 of 14 changed files matched their brief. Running the plugin through the marketplace, /flight:build-and-check, /flight:recon and /flight:second-opinion appear as commands; /flight:launch is hidden from the model's list by disable-model-invocation (the brief's live check 1 wording is wrong, not the pull request). With no folder, /flight:launch gives the "captured, not active" refusal. With a folder it prints the card and waits for "go". Recon by path ran to the end with every claim marked. Second-opinion failed on a file target. The "go" run, dry-run launch, live checks 2 and 18, the /add-dir fallback and the pilot's own activation were not run by the reviewer. [reviewed]

Adversary (Opus high): not done as first built. Held: GLOBAL and seat lines match PR 1 word for word; meta blocks, phase titles and forbidden tokens follow 6.3; models and efforts match the 6.4 to 6.6 tables and stay under the ceiling; the opening order follows 6.2; halt paths are correct; the dry run and real run give the right report-stage text; lab/owned/pr4.txt lists the 17 brief paths in order; no PR 1, owner, dev/ or .claude/ file is touched. [reviewed]

Imposter (Sonnet high), using claude -p with haiku standing in for the pilot: install, the five-line card and a real build-and-check run worked; the run built a correct feature and 69 of 69 tests passed on re-run. Second-opinion on a plain file was broken. Pilot-behaviour findings may be milder with real Opus. Not tried: /workflows and a live interactive pilot session. [reviewed]

Live checks (Sonnet high), scratch clone with a private HOME and throwaway origin: check 1 failed on its literal wording (see above); check 2 failed (a plain session activated the workshop and wrote five files); check 3 passed; check 4 passed only after adding a git identity and, with the brief's exact allow list, the record files did not reach the branch (needed Bash(git worktree *) and Bash(git -C *)); check 5 passed (names flightdeck/hooks/preflight.mjs:50, every claim marked); check 6 failed (readers got a deleted path). Teardown clean: /home/user/flightdeck was untouched and its origin is still the GitHub URL. [reviewed]

Checks (Haiku low): FAIL at integrate on the launch tests (17 of 18); the plugin eval could not be run. [reviewed]

Recheck (Opus high) after one fix round, both accepted high findings fixed, by reading the source and running the test: [reviewed]
- second-opinion.js no longer uses isolation 'worktree' for prepare. For a branch it writes the diff and file list to a temp folder from mktemp -d outside the repository; for a file it returns the absolute path in the owner's checkout and never a path under .claude/worktrees/. Try step 6 and live check 6 were not rerun live. [reviewed]
- build-and-check.js line 191 now gives the imposter "The rubric: " plus the rubric.md path; the launch tests print 23 of 23. [checked]

## Findings and decisions

Accepted:
- High, review, adversary (F2), imposter, live: second-opinion prepare hands readers a deleted or stale worktree path for a file target. Fixed. [reviewed]
- High (review, checks) and medium (adversary F1): build-and-check imposter task lacks the rubric path, so launch test 11 fails and done items 5 and 12 fail. Fixed. [reviewed]
- Medium, review and adversary F4: SKILL.md never gives the /flight:build-and-check command (done item 15). [reviewed]
- Medium, review and adversary F3: report-template.md says every line carries a mark but most example lines do not; its "Questions for you" example is not a full questions.md block. [reviewed]
- Low, review and adversary F9: launch card line 5 and step 10 fit only Build and check; Recon returns status 'done' with report_text and the skill has no step for it. [reviewed]
- Low, review and adversary F6: opening() embeds the scoped block and QUESTIONS without safe(), so a workshop file line starting "Rank: " or "Task: " breaks the one-Rank, one-Task rule. [reviewed]
- Low, review: for a branch target, second-opinion keeps its prepare worktree under .claude/worktrees/, so git status shows untracked files, against 6.6 "writes nothing in the repository". [reviewed]
- Low, adversary F5: the card must be exactly five lines but the skill also says to explain "draft pull request" the first time it appears in the card. [reviewed]
- Low, adversary F8: the agentType-file test regex never matches because scripts write 'flight:' + name; second-opinion agentTypes are not asserted. [reviewed]
- Low, adversary F11: the report stage's task does not carry the brief text, against 6.4 stage 9. [reviewed]
- Medium, imposter and live: a launch says "delivered" while findings.md, report.md, log.md and pr.md never reached the branch; with the brief's exact allow list the report agent's Write is refused and the Captain's repair path needs git approvals. [reviewed]
- Medium, imposter: the five-line card is buried in about 25 lines of preamble, explanations and caveats; Roles repeats "Worker" eleven times. [reviewed]
- Medium, imposter: card line 4 promises "log.md records the real use" but log.md says token use is in /workflows; the 20 to 40 minute guess was 10.7 minutes. [reviewed]
- Medium, live: the imposter runs before the push, so try steps written with origin refs and $? always fail. [reviewed]
- Low, imposter: the generated report hands the owner six hand-typed shell recipes for the try. [reviewed]

Question for the owner (triage question, not decided): a plain session told "Launch the demo-attempt-age workshop for me." activates the workshop and writes five files (workshop.md, context.md, verify.md, questions.md, decisions.md) with no Skill or Workflow call; the guard hook blocked constraints.md. Is that acceptable, or must a plain session refuse? [reviewed]

Rejected:
- review: lab/owned/pr4.txt names findings.md, report.md and log.md, which are not on the branch yet (they are the Captain's landing files). [reviewed]
- review low, adversary F7: dry() rewrites "git push" and "gh pr create" inside embedded results on a dry run. [reviewed]
- adversary F10: recon's default third angle cannot be served by a scout limited to Read, Grep and Glob. [reviewed]
- imposter: the run stalls on approvals (no git identity; builder git var gate) and the halt message uses alarming jargon. [reviewed]
- imposter: the pilot ran ahead after "activate" and sent builders. [reviewed]
- imposter: the demo feature shows a wrong age after any checkout. [reviewed]
- imposter: README.md does not describe launches or the PR 4 try steps. [reviewed]
- imposter: launches leave .claude/worktrees/ untracked with many worktrees. [reviewed]
- imposter: too many doors (workflow commands beside /flight:launch skip the card and go). [reviewed]
- imposter: nested test sessions wrote task output outside the private HOME and shared one session id. [reviewed]
- checks: the non-blocking plugin eval was not run. [reviewed]
- live: one of three dry-run launches answered "plain chat is enough" with no card, and the card is surrounded by extra paragraphs. [reviewed]
- live: the live-check setup omits a git identity and uninstall --scope local; check 1 expects /flight:launch in the model's list. [reviewed]

## Size

14 files changed, 1598 insertions, 0 deletions, from git diff --stat origin/build-1-pr1-basic-a1...origin/build-1-pr4-launches-a1. The largest are workflows.test.mjs (478), build-and-check.js (295), the brief (262), second-opinion.js (140), recon.js (125), SKILL.md (114) and report-template.md (110). [checked]

## Models per stage

gather Haiku low; brief Opus high; builders Sonnet high; integrate Sonnet medium; review Sonnet high; adversary Opus high; imposter Sonnet high; checks Haiku low; live Sonnet high; triage Opus high; fix Sonnet high; recheck Opus high; land Sonnet medium. [stated]

## Retry this pull request alone

Add "PR 4:" lines to .flightdeck/build-1/constraints.md, then say "retry PR 4". The retry builds a new branch, build-1-pr4-launches-a2. Other pull requests are not touched. [stated]
