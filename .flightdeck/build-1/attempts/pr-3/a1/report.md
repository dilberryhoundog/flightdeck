# PR 3: Workshops

Built on PR 1's branch (build-1-pr1-basic-a1). Merge PR 1 first; until then this pull request's diff also shows PR 1's files.

This pull request is a draft. Reasons: the plugin eval step did not run (exit -1); several try steps are [stated], not run; the promote fix (commit 6f361d4) is checked by reading only and live checks 10 and 11 were not re-run; triage left one question for the owner. Details follow.

## What it adds

Four skills in the flight plugin: /flight:capture (one line added to .flightdeck/workshops.md, no folder), /flight:workshop (scouts, at most five questions, then a folder with workshop.md, context.md, verify.md and questions.md), /flight:retry (a new attempt brief with the owner's change named at the top, attaching the last attempt's findings) and /flight:promote (settled decisions go to a branch and a draft pull request, or a dry run that pushes nothing). All four set disable-model-invocation: true. Only files on lab/owned/pr3.txt are changed. Nothing under dev/ or .claude/rules/ and no PR 1 file is changed. [reviewed]

## The owner's five-minute try

1. In the repository: git fetch origin && git switch build-1-pr3-workshops-a1. If FlightDeck is installed from PR 1's try it loads from this folder; restart Claude Code (or /reload-plugins). If not, run claude plugin marketplace add "$PWD" --scope local and claude plugin install flight@DBHD-FlightDeck --scope local first. Start claude --agent flight:pilot --model opus --effort high (plain claude works too). Install ran in the imposter's scratch clone (under 1 second each, about 1 minute in all); the restart or /reload-plugins part was not run. [stated]

2. Type /flight:capture the pre-flight card lists the oldest waiting question first. It answers in one sentence with the short name it chose. Open .flightdeck/workshops.md: one new line at the end, and no new folder. Ran: one correct line, no folder. About 1 minute; the imposter had to guess a goal to type. [reviewed]

3. Type /flight:workshop <that name>. Two scouts (cheap Haiku agents that read the code) look first; then at most five questions appear in Claude Code's question box, each with a recommended answer, one starting 'The weakest part of this ask is'. Pick answers; skip any you like. The real question box was not exercised: claude -p has no question tool, so the pilot printed the questions and wrote a temporary .flightdeck/<name>.activate.md, which is removed once the answers are given. Answers were given by chat reply. About 4 minutes (1 min 43 s wait, 2 minutes to read four questions). [stated]

4. Open .flightdeck/<that name>/workshop.md (the card), context.md (what agents working there are told), verify.md (how to tell the work is right) and questions.md (your answers; skipped questions wait there, open). Ran: the four files exist. About 3 minutes to read. [reviewed]

5. Next, optional: create .flightdeck/<that name>/constraints.md with one dated line in your words (or tell the pilot 'add to its constraints: <your words>'), then /flight:retry <that name>: attempts/a1/brief.md appears with your line named at the top (the next retry makes a2 and attaches a1's findings). Ran: a1 brief with the line named at the top; the second retry made a2 and left a1 byte-identical. About 1 minute. [reviewed]

6. Next, optional: put '- <today>: Pages never load anything from the network. Reason: they must work offline.' in its decisions.md, add 'settled: <today>' as the last line of its workshop.md (or tell the pilot 'settle <that name>'), then /flight:promote <that name> dry-run: proposed lines, where each goes, the adversary's verdict and the draft pull request text, nothing pushed. Without dry-run it pushes a branch and opens a real draft pull request for you to merge, edit or close. The dry run ran (no branch, no push, hand-off file removed), but it is the step that failed live checks 10 and 11 before the fix (see below). The real promote without dry-run and the 'settle <name>' wording were not run. About 7 minutes (2 min 43 s wait, about 4 minutes reading). [stated]

7. To throw the try away: git checkout -- .flightdeck/workshops.md and delete the folder .flightdeck/<that name>/. Ran: tree clean afterwards, under 1 minute. [reviewed]

Measured time: steps 2 to 4 took about 8 minutes, not 5 (of that about 2 minutes 20 seconds was waiting on scouts and the adversary). Steps 2 to 5 commit nothing. Total machine wall was about 400 seconds. The imposter ran on Haiku in claude -p, not interactive Opus. [stated]

## Script checks

- node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto: exit 0 [checked]
- node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr3.txt: exit 0 [checked]
- claude plugin validate flightdeck: exit 0 [checked]
- node --test 'flightdeck/tests/*.test.mjs': exit 0 (64 tests) [checked]
- node --test 'flightdeck/skills/workshop/tests/*.test.mjs': exit 0 (17 tests) [checked]
- node --test 'lab/checks/*.test.mjs': exit 0 (33 tests) [checked]
- node flightdeck/skills/workshop/scaffold.mjs check-bundle flightdeck/skills/workshop/tests/fixtures/bundle.activate.md: exit 0 (5 of 5) [checked]
- claude plugin eval flightdeck --eval-dir lab/evals --case 'pr3-*' --runs 3 --no-publish --trust-plugin --max-cost-usd 3 --json: exit -1, not run. The harness refused it before it started. It has no result. [checked]

The checks verifier: PASS for 8 of 9 commands, the ninth being the eval. [checked]

## Verification

Review (Sonnet high): mostly sound, not done. Every owned file exists and matches its spec; scratch-clone runs of the hard rules, plugin validation, tests and check-bundle all passed; capture, workshop (file mode), retry (a second retry left a1 byte-identical) and promote (refused an unsettled workshop) worked with sonnet and haiku; a real promotion built its commit without moving the owner's HEAD, index or working tree. Not tested: live mode (the question box), a real promotion with git push and gh, plain chat unchanged (check 12), and the resumed-session paste-back in check 5. [reviewed]

Adversary (Opus high): NOT DONE, by reading only; it could not run the checks, so its done items 1 to 4 are unverified. Hard rules text, scout and adversary seat texts, and disable-model-invocation hold on reading. The problems were in what the skills tell the model to do. [reviewed]

Imposter (Sonnet high): the core loop works and should be kept; fatigue costs (long promote output, four questions for a one-line change, long card and context) are the complaint. The imposter cut q3 and q4, the file:line paragraphs, the format comments and the verbatim adversary dump. [reviewed]

Live checks (Sonnet high): 10 of 12 pass (1 to 9 and 12); checks 10 and 11 FAIL. The drafter rejected all 23 to 24 candidates on 3 of 4 runs, and on the run that proposed lines it had already moved the planted push-to-main line to 'Not proposed', so the adversary never named it as contradicting 'Never push to main or master'. The real GitHub draft pull request part of check 11 was not run. No promote branch was made, nothing was pushed, and nothing outside .flightdeck/ changed. [reviewed]

Recheck (Opus high), after fix commit 6f361d4: all three accepted high findings are fixed in the text of promote/SKILL.md, targets.md and scaffold.mjs. This was checked by reading the branch, not by a live run; the live checks 10 and 11 still have to be re-run. [reviewed]

Fix round 1 ended with the script checks green, except the eval, which had not run. [checked]

## Findings and decisions

Review:
- high, accept: promote dry run gives no proposed lines, no adversary verdict and no body (the drafter rejects everything, there is no empty-edits path, and the default headings do not exist in root CLAUDE.md). Fixed in the text.
- medium, accept: the first retry on the untracked try workshop dumps the whole workshop into 'The change:' lines (24); the second retry has no rule when git log finds no commit for a1.
- medium, accept: promote-commit's badTarget accepts code files, INTENT.md, library/source/ and case variants such as .Claude/rules/x.md.
- low, accept: Workshop Step 1 routes '<name> + pasted reply block' to the rough-ask path, against Step 5.
- low, accept: lab/evals/pr3-no-approval-questions cannot be found by claude plugin eval (--eval-dir is below the plugin root only).
- low, accept: the promote drafter is a general-purpose subagent with write tools; the try ask equals the example card, so scouts cite examples/card.md into the owner's context.md.

Adversary:
- high, accept (F1): retry change detection assumes committed files; on the uncommitted try path the second retry finds no commit and reads whole files as the change.
- medium, accept (F2): git log -1 -- attempts/<label> returns the newest commit touching the folder, so later report commits hide earlier owner changes.
- medium, accept (F3): pasting the reply block with /flight:workshop <name> is routed to the rough-ask path.
- medium, accept (F4): the adversary sees only the drafter's kept lines, so the planted push-to-main decision never reaches it.
- low, accept (F5): Write(.flightdeck/**) path rules are never checked; promote has no Edit rule, so its Write of .promote.json prompts.
- low, accept (F6): example card.md:62 writes the skipped q2's outcome into context.md as settled.
- low, accept (F7): unexplained terms in targets.md:16,29, interview.md:41 and flightdeck-CLAUDE.md.
- low, reject (F8): findings.md, report.md and log.md are not on the branch (the Captain writes them).

Imposter:
- high, accept: the promote dry-run reply is a wall of about 900 words with severity codes, unexplained terms and a closing question.
- medium, accept: try step 2 reads as a claim about the card, not a goal to type.
- medium, accept: the pre-flight card lists no question, says 'activate <name>' instead of /flight:workshop <name>, and shows 'latest attempts plan/a2' unexplained.
- medium, accept: four questions for a one-line change, including a field-name question (ask-later:) and a tie-break trivia question.
- medium, question (open for the owner): 'Skip, I don't care' leaves the question open, the card says the builder must not decide it and verify.md gains a question testing that.
- medium, accept: workshop.md's work: line is about 250 words with answers pasted in; context.md is long with path:line pointers that go stale; the 'base branch only' comment is unexplained.
- low, accept: questions.md has a large format comment and the 'Other notes' line twice.
- low, accept: workshops.md ships a made-up demo line and agent captures; the chosen name truncates meaning.
- medium, accept: try step 6 has the owner type an unrelated network-ban decision into a hand-made decisions.md; the adversary then contradicts the owner's own 2026-09-14 words.
- low, reject: the retry reply misreported the brief's content and said the script printed no branch.
- low, accept: the 'five-minute' try took about 8 minutes for steps 2 to 4, and the temporary .activate.md file is not mentioned.

Checks:
- low, accept: the plugin eval step was not run (the worktree guard refused it).
- low, reject: all eight required script checks passed (not a finding).

Live:
- high, accept: the drafter rejects the planted push-to-main line, so the adversary never sees it; live checks 10 and 11 fail. Fixed in the text, not re-run.
- high, accept: the drafter proposes nothing on 3 of 4 runs (no Decisions heading, a new heading is a last resort) and the skill has no empty-proposal path. Fixed in the text, not re-run.
- medium, accept: the printed dry-run body says 'The adversary's answer above, verbatim.' instead of carrying the verdict.
- low, accept: the first retry's change is a dump of every workshop line; a2 used file modification times.
- low, reject: nested claude -p sessions inherit CLAUDE_CODE_SESSION_ID, so live-check transcripts are shared.
- low, accept: scouts raised capture scaffold-tests-in-green-check; the adversary's capture about the planted line.

Only the three accepted high findings were rechecked. The accepted medium and low findings were not part of the recheck; the log does not say whether the fix round addressed them, so none is marked fixed here. [reviewed]

## Size

17 files changed, 2302 insertions, 0 deletions, from git diff --stat origin/build-1-pr1-basic-a1...origin/build-1-pr3-workshops-a1. The largest are flightdeck/skills/workshop/scaffold.mjs (718), its test file (643), the attempt brief (319), workshop/SKILL.md (111) and promote/SKILL.md (92). findings.md, report.md and log.md are added by the Captain. [checked]

## Models per stage

gather Haiku low, brief Opus high, builders Sonnet high, integrate Sonnet medium, review Sonnet high, adversary Opus high, imposter Sonnet high, checks Haiku low, live Sonnet high, triage Opus high, fix Sonnet high, recheck Opus high, land Sonnet medium. Nothing is above Opus at high effort. [stated]

## How to retry this pull request alone

Add lines starting with "PR 3:" to .flightdeck/build-1/constraints.md, say "retry PR 3", and the build makes a new branch, build-1-pr3-workshops-a2. [stated]

## Open for the owner

Should a question you skip with "Skip, I don't care" stay open and block the builder from deciding it, or should skipping close it? Before merging, the live checks 10 and 11 should be re-run on the fixed promote text, and the plugin eval should be run from a place where it can find lab/evals.

## Captures (outside this brief)

- Scouts raised: capture scaffold-tests-in-green-check.
- The adversary raised: a capture about the planted push-to-main line.
- lab/evals sits below the repository root, not the plugin root, so claude plugin eval cannot find it.
