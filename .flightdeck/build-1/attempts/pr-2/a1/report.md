# PR 2: Flight board

Built on PR 1's branch (build-1-pr1-basic-a1). Merge PR 1 first; until then this pull request's diff also shows PR 1's files.

This pull request is a draft. Reason: several steps of the five-minute try were [stated], not run for real (no browser, no interactive Opus start). Details below.

## Your five-minute try

The human imposter ran this try. Whole try: about 12 minutes of wall clock for the imposter; the imposter estimates your real time at about 5 minutes. Each line is marked: [reviewed] means the imposter ran it, [stated] means the imposter said it could not run it and simulated or skipped it.

1. [reviewed] In the repository: `git fetch origin && git switch build-1-pr2-board-a1`. If FlightDeck is not installed yet: `claude plugin marketplace add "$PWD" --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local` (the plugin loads from this folder, so switching branch is enough once installed). Measured: about 1 minute of clock, each plugin command under 1 second. The imposter renamed the marketplace in its scratch clone, so the name was not tested as written.
2. [stated] Start the pilot: `claude --agent flight:pilot --model opus --effort high` (or type `/reload-plugins` in a session already open). Not run interactively. The imposter used headless `claude -p --agent flight:pilot --model haiku` instead. Measured: 0 minutes.
3. [reviewed] Type `/flight:board`. It answers with the page's path, `.flightdeck/board.html`. Measured: run 8.5 seconds, about 1 minute to read the answer and find the page file. [stated] Opening the file in a browser (on a Mac: `open .flightdeck/board.html`; or double-click it): no browser was available, the imposter used jsdom 24.1.0 against the real board.html.
4. [stated] Look at the board: build-1 as a row with its latest attempts; under "Waiting to start", demo-attempt-age and the two entries the build captured, each with a Copy button for `activate <name>`; "No questions are waiting on you"; and a folded "Asked to ask later (1)" holding build-1's q1, the question you asked to be asked later. Measured: about 3 minutes reading the page text. The content matched; how it looks was not seen.
5. [stated] Open the folded list, pick an answer for q1 (or write a note), press "Copy my answers" and paste the result into the pilot chat. The pilot writes your answer into `.flightdeck/build-1/questions.md` and says so in one line. (Answering q1 now is fine; to wait, skip this step and step 6.) Measured: pilot 7.5 seconds, about 2 minutes including the page clicks. The page clicks were simulated in jsdom; the real click and clipboard were not seen. The pilot did write `answer: a` into questions.md. Its reply was three sentences, not one line.
6. [reviewed] Type `/flight:board` again and reload the page: q1 has gone from the folded list. Measured: 7 seconds.
7. [stated] Next, optional: the "Prompt builder" tab: pick demo-attempt-age, write a rough ask, press "Copy prompt" and read the message it would send the pilot. Measured: about 2 minutes, simulated in jsdom. Extra: pasting `activate demo-attempt-age` to the pilot took 20 seconds and created the workshop folder.

The imposter's verdict: the five-minute try works end to end and fits the goal, with no questions you have to decide up front. What may bother you is words and clutter (see findings).

## Script checks

All run by the integrate stage, in the branch. Exit 0 means pass.

- [checked] `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`: exit 0.
- [checked] `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr2.txt`: exit 0.
- [checked] `claude plugin validate flightdeck`: exit 0.
- [checked] `node --test 'flightdeck/tests/*.test.mjs'`: exit 0.
- [checked] `node --test 'lab/checks/*.test.mjs'`: exit 0.
- [checked] `node --test 'flightdeck/skills/board/tests/*.test.mjs'`: exit 0.
- [checked] Render of the fixtures with `--no-gh` to a scratch file: exit 0.
- [checked] Render of this repository with `--no-gh`, then `git status --porcelain`: exit 0, nothing left changed.
- [checked] Removal check in a detached worktree (remove board, page, `.flightdeck/.gitignore`, the pr2 eval and `lab/owned/pr2.txt`; validate; both test sets pass): exit 0.
- [stated] Eval: `claude plugin eval flightdeck --eval-dir lab/evals --case 'pr2-*' --runs 3 ...` did not run (exit -1, non-blocking). The machine has no bubblewrap or socat and the worktree guard refused it. The checks agent ran 10 of 11 items; this is the one not run. The eval has never run.
- [checked] The checks agent and the review agent re-ran the scripts at d6a19d7: hard-rules 9/9 in both forms, 64/64, 33/33 and 16/16 tests, validate exit 0, worktree clean after render.
- [checked] Fix stage: checks green after 2 rounds.

## Verification

Five verifiers ran. All were run against d6a19d7, before the fix rounds. [stated] The fix stage's changes are not described in this text, so I cannot say here which findings it fixed; the Captain should check them against the branch head.

- [reviewed] Review: PASS with 7 low findings, no high or medium. Scoped to 21 files, all on `lab/owned/pr2.txt`, nothing under `dev/` or `.claude/rules/`, no PR 1 file edited. Live checks passed on Haiku except the eval check. Not seen: the click, 360px layout and dark mode (no browser); the pull request description.
- [reviewed] Adversary: no high or medium findings, 4 low. Read statically only (no shell). Found render.mjs, the question and detail parsing, placeholder replacement, answer block and prompt builder, the test file (16 tests), fixtures and owned list correct against the brief. Did not run scripts, live checks, the imposter's run or check the pull request description.
- [reviewed] Imposter: the try works end to end. Two findings rated medium, the rest low.
- [reviewed] Checks: all required commands pass; no high findings; eval item not run.
- [reviewed] Live: checks 1, 2, 3 and 5 pass; check 4 (fresh-session filing) fails on exact wording. Everything ran in a scratch clone with a private HOME and an empty bare remote; nothing was pushed. Pilot runs were on Haiku, not Opus high.

Accepted high findings: 0. No recheck was needed.

### Findings and decisions

Medium, accepted:
- Imposter: a note typed in "Other notes" with no question to answer is silently dropped; Copy says "Nothing to copy yet".
- Live: a fresh Haiku session filing a pasted block added a date to the line (`(answered 2026-10-11)`, `(2026-10-11)`), and once added an extra line. In the same session the line was filed exactly: `answer: a | note: keep it for now`, 1 line added, 1 removed.

Medium, rejected:
- Imposter: the build's own capture lines (live-checks-reach-the-hook, runner-report-file) appear unlabelled and in jargon under "Waiting to start".

Low, accepted:
- Review: the eval command in brief 7.10 finds no case because `--eval-dir` resolves below `flightdeck/` and the case is in `lab/evals/`.
- Review: a fresh pilot session filed the pasted block with an added date.
- Review: the example board command writes board.html into the current folder, which is not ignored at the repository root.
- Review: try step 4 hardcodes "demo-attempt-age and the two entries the build captured".
- Review: the page uses "the pilot", "Let the Captain pick", "Team plan" unexplained, shows a raw ISO timestamp and "the gh command".
- Review: `lab/owned/pr2.txt` names findings.md, report.md and log.md, which did not exist yet when checked (this text is report.md and log.md).
- Adversary F1: a long unbroken word in an option label overflows at 360px (theme uses `overflow-wrap: break-word` and the label is a flex row).
- Adversary F2: FlightDeck terms (pilot, Captain, Team plan, Activation questions, attempt label) are unexplained; raw UTC time.
- Adversary F4: the page kit skeleton has no copy-panel script, and its status line starts with "Nothing changed yet." contrary to its own rule.
- Imposter: raw timestamp, "gh" sentence, attempt labels like plan/a2, "no report yet", several latest-attempt lines per row.
- Imposter: the pilot's reply after filing is three sentences, not the promised one line.
- Imposter: the prompt builder opens "Captain, ..." though you started "pilot"; "Rough ask" is not prefilled for a waiting workshop.
- Imposter: the Questions section shows the instruction, Other notes box and Copy button when nothing is waiting.
- Imposter: no browser, so looks, dark mode, 360px, the real click and clipboard were not seen; pilot run on Haiku, not Opus high.
- Checks: eval item not run; the worktree guard refused the command.
- Live: nested `claude -p` sessions inherit the parent's session id; fresh and resume checks need an explicit `--session-id`.
- Live: the page opens on "No questions are waiting on you" with the held question in a closed fold; jargon terms.
- All five: run status of the five verifiers.

Low, rejected:
- Review: `allowed-tools` grants unrestricted Read and Edit while the board skill is active.
- Adversary F3: the workshop row never shows the `# title` from workshop.md.
- Imposter: q1 wording uses workshop, launch and attempt; its ask-later page does not exist yet; the answer is stored as a bare letter.

Questions for you from triage: none.

## Size

[checked] `git diff --stat origin/build-1-pr1-basic-a1...origin/build-1-pr2-board-a1`: 21 files changed, 1782 insertions, 0 deletions. Main parts: `render.mjs` 444 lines, `board.template.html` 224, `render.test.mjs` 300, `brief.md` 372, `page/theme.css` 185, `page/SKILL.md` 119, `board/SKILL.md` 34.

## Models per stage

- [stated] Gather: Haiku, low.
- [stated] Brief: Opus, high.
- [stated] Builders: Sonnet, high.
- [stated] Integrate: Sonnet, medium.
- [stated] Review: Sonnet, high.
- [stated] Adversary: Opus, high.
- [stated] Imposter: Sonnet, high.
- [stated] Checks: Haiku, low.
- [stated] Live: Sonnet, high.
- [stated] Triage: Opus, high.
- [stated] Fix: Sonnet, high.
- [stated] Land: Sonnet, medium.

## Retry this pull request alone

Add "PR 2:" lines to `.flightdeck/build-1/constraints.md`, then say "retry PR 2". The retry goes on a new branch, build-1-pr2-board-a2.

## Capture lines (outside my brief)

- The eval has never run on this machine (no bubblewrap or socat). Someone needs a machine where it can run before the eval counts as a check.
- Pilot filing wording is not stable on a fresh session. The pilot description does not yet name the answer-block rule (copy the line as given); the review suggests pilot.md should.
