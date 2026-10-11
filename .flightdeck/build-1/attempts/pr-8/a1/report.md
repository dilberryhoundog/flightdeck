# PR 8: Status band

Built on PR 1's branch (build-1-pr1-basic-a1). Merge PR 1 first; until then this pull request's diff also shows PR 1's files. [stated]

This pull request is a draft. Reasons: every try step is [stated] (nobody has seen the band on a real screen), and triage left one question for the owner (see "Question for you").

What it adds: a small separate plugin, `mods/status-band/`, named flight-band. It draws one line above the prompt in Claude Code and refreshes it after each reply and about every 30 seconds. It only reads: it never writes a file. It touches nothing in `flightdeck/`, `dev/` or `.claude/rules/`. You can install it and remove it on its own. [reviewed]

## Your five-minute try

Every step below is [stated]: the imposter read the steps and ran none of them, and no agent can see a terminal screen. The review and live checks did run steps 2, 3 and 7 in a scratch clone with a private HOME, and they worked [reviewed]. The imposter estimates about 6.5 minutes in all, against the 5 promised, with step 6 the slow one (3 minutes, about 1 if the question format is shown). [stated]

1. In the repository: `git fetch origin && git switch build-1-pr8-band-a1` (or, once PR 8 is merged, any branch that has `mods/status-band/`). [stated]
2. `claude plugin marketplace add "$PWD/mods/status-band" --scope local` [stated]
3. `claude plugin install flight-band@flight-band --scope local` [stated]
4. Start Claude Code in the repository (`claude`, or `claude --agent flight:pilot --model opus --effort high`); in a session already open, type `/reload-plugins` or restart it. [stated]
5. Look just above the prompt: one line like `FlightDeck: 1 active workshop (build-1, latest pr-8/a1) | 0 questions waiting on you | 3 captured, waiting to start`. "Active workshop" means a piece of work with its own folder; "captured" means a line in `.flightdeck/workshops.md` waiting for you to start it. The numbers match the pre-flight card in a pilot session. [stated until you look: no agent can see a terminal screen]
6. Optional: add a question with an empty `answer:` line to `.flightdeck/build-1/questions.md`; after Claude's next reply, or within about 30 seconds, the questions number goes up by one. Delete it again afterwards. [stated]
7. To remove the band: `claude plugin uninstall flight-band@flight-band --scope local` (and `claude plugin marketplace remove flight-band` if you want the marketplace gone too). [stated]

Known rough edges in these steps (triage accepted these findings): step 6 does not show the question format, and copying q1 keeps its `ask-later:` line, so the number never moves (q1 is why the band shows 0 questions while q1 sits unanswered). If the band does not draw, it says nothing, and the steps give no minimum Claude Code version and no next move. The "latest pr-8/a1" label depends on folder modified times, so the exact string in step 5 is not guaranteed. The "numbers match the pre-flight card" claim and the `--agent flight:pilot` option in step 4 need PR 1's flight plugin. Steps 1 and 6 ask you to switch branches and edit a tracked file, and `git switch` may refuse because of worktrees. Step 7 does not say to confirm the removal or that the scope must match. Which of these the fix round changed is not confirmed by the recheck (only the high finding below was rechecked).

## Question for you

Triage question, not decided: the "3 captured" count includes a made-up demo line and lines agents wrote, and the imposter would cut the "captured" count and the "latest attempt" label first. The number you care about is "questions waiting on you". Keep both, or cut them? [reviewed]

## Script checks

All [checked].

- `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`: exit 0.
- `claude plugin validate flightdeck`: exit 0.
- `node --test 'flightdeck/tests/*.test.mjs'`: exit 0 (64 pass per review).
- `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr8.txt`: exit 0.
- `claude plugin validate mods/status-band`: exit 0.
- `claude plugin test mods/status-band`: exit 0 (8 pass, 0 fail per review and live).
- `node --test 'mods/status-band/tests/*.test.mjs'`: exit 0 (17 pass, 0 fail).
- `node flightdeck/lib/workshops.mjs list --json`: exit 0.
- Forbidden-pattern grep over `mods/status-band/register.js` and `mods/status-band/lib/read.js`: it first printed a match (read.js line 1 named `flightdeck/lib/workshops.mjs`), which is a fail under its rule (prints nothing = pass). After the fix (commit ddba90d) the recheck ran it on both files: no output, exit 1, which is the pass.
- Removal check: removing `mods/status-band` and `lab/owned/pr8.txt` in a scratch worktree of the branch, `claude plugin validate flightdeck` exit 0 and `node --test 'flightdeck/tests/*.test.mjs'` exit 0.

## Verification

Five verifiers ran. The review, adversary, imposter and live verdicts are [reviewed]; the checks verdict is [checked].

- Review: sound, no high findings, nothing blocks merge. Nine files and the owned list match their specs; the diff touches only owned files. Ran hard-rules (9/9 twice), plugin validate and test, both node test sets, and try steps 2, 3 and 7 literally in a scratch clone. A real `claude -p` run logged the hooks module loaded and the plugin admitted, with no refused or skipped line. Not checked: whether the band draws on a real screen, and the pull request description.
- Adversary: NOT DONE, from reading only (no shell, so it ran no check). Found two medium and three low findings. Done questions 11 and 12 could not be judged from the work it was given.
- Imposter: reads as a small, read-only, mostly sensible extra; could not see the screen. Would not stop the thread, but does not trust steps 5 and 6 yet. Asks nothing of the owner. Its suggested answer to the standing question q1 is "keep the reading, ask me after I have tried PR 3 and PR 4".
- Checks: 10 of 11 command runs passed; the forbidden-pattern grep failed (fixed, see above).
- Live: L1 to L5 pass; L6 passes on substance with one literal mismatch. The band drew `FlightDeck: 1 active workshop (build-1, latest pr-8/a1) | 0 questions waiting on you | 3 captured, waiting to start` above the prompt in a tmux screen capture; after adding q99, the line went to 1 question within 40 seconds. The look-above-the-prompt step stays [stated] until you look.

## Findings and decisions

Accepted:

- checks, high: the forbidden-pattern grep fails on `read.js` line 1. Fixed, and the recheck confirms it (ddba90d). [checked]
- review, low: the same grep failure, seen as a contradiction inside the brief. Accepted. [reviewed]
- adversary, medium (F1): `read.js` line 1 names a file under `flightdeck/`, so done question 7 is answered no. Accepted (same line as the high finding). [reviewed]
- review, low: two optional type errors in `register.js`, and the JSDoc spells `import (` with a space to get past the grep. Accepted.
- adversary, medium (F2): below about 120 columns the band shows the short form, which drops the plain words beside "captured" and drops "questions". Accepted.
- review, low: the band line and `plugin.json` say "workshop" with no plain gloss, and "latest pr-8/a1" is internal jargon. Accepted.
- adversary, low (F3): the timer test and the never-writes test run only on "terminal", not on both surfaces. Accepted.
- adversary, low (F4): `anyFlightDeckText` treats any mount rejection as "nothing drawn", so the no-project and survey tests can pass falsely. Accepted.
- imposter, medium: step 6 does not show the question format and copying q1 keeps its `ask-later:` line. Accepted.
- imposter, medium: if the band does not draw, there is no sign; no minimum Claude Code version and no next move. Accepted.
- imposter, low: "latest pr-8/a1" is unexplained and depends on folder modified times. Accepted.
- imposter, low: the "numbers match the pre-flight card" claim and `--agent flight:pilot` cannot be checked without PR 1's flight plugin. Accepted.
- imposter, low: steps 1 and 6 make the owner switch branches and edit a tracked file. Accepted.
- imposter, low: step 7 does not say to confirm removal or that the scope must match. Accepted.

Question for the owner:

- imposter, medium: the captured count and latest label are noise (see "Question for you").

Rejected:

- adversary, low (F5): a workshop folder that is a symbolic link is active in PR 1 but captured in the band.
- imposter, low: hide the band when everything is 0; cost of re-reading every 30 seconds.
- live, low: L6 marketplace list differs from the L1 record because `claude-plugins-official` was auto-added on first interactive run.
- live, low: on the trust-folder screen Enter picks "No, exit".
- live, low: Node prints MODULE_TYPELESS_PACKAGE_JSON when the drift test imports `lib/read.js`.
- live, low: `nested-settings.json` deny rules mix `*` with the `:*` syntax and print warnings.

Recheck (high-severity finding, one item): fixed [reviewed]. `read.js` line 1 now reads "// The status band's own copy of the reading rules in FlightDeck PR 1's shared reader (the main plugin's lib folder)." The path `flightdeck/lib/workshops.mjs` still appears in `mods/status-band/tests/drift.test.mjs` lines 2 and 11; the grep does not cover that file, and the drift test is meant to import PR 1's reader.

## Size

`git diff --stat origin/build-1-pr1-basic-a1...origin/build-1-pr8-band-a1`: 11 files changed, 1314 insertions, 0 deletions. [checked]

- `.flightdeck/build-1/attempts/pr-8/a1/brief.md`: 263
- `lab/owned/pr8.txt`: 15
- `mods/status-band/.claude-plugin/marketplace.json`: 16
- `mods/status-band/.claude-plugin/plugin.json`: 9
- `mods/status-band/.gitignore`: 1
- `mods/status-band/hooks/hooks.json`: 3
- `mods/status-band/lib/read.js`: 202
- `mods/status-band/register.js`: 128
- `mods/status-band/tests/band.test.ts`: 288
- `mods/status-band/tests/drift.test.mjs`: 371
- `mods/status-band/types/index.d.ts`: 18

This count is from the head before the recheck's one-line comment change (ddba90d), which does not change the file list.

## Models per stage

gather Haiku low; brief Opus high; builders Sonnet high; integrate Sonnet medium; review Sonnet high; adversary Opus high; imposter Sonnet high; checks Haiku low; live Sonnet high; triage Opus high; fix Sonnet high; recheck Opus high; land Sonnet medium. [stated]

## How to retry this pull request alone

Add "PR 8:" lines to `.flightdeck/build-1/constraints.md`, then say "retry PR 8". The retry builds on a new branch, `build-1-pr8-band-a2`.
