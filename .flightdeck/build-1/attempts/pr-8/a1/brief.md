# Build brief: PR 8, Status band (FlightDeck build-1, attempt 1)

Written 2026-10-11 by the brief seat (Worker, reporting to the Captain of the build run) from the approved plan `.flightdeck/build-1/attempts/plan/a2/plan.md` (sections 0, 1, 2(a) to 2(h), 3.0, 3.14, section 4 "PR 8", sections 5 and 7), the owner's `.flightdeck/build-1/constraints.md`, the lead's `.flightdeck/build-1/attempts/build-notes.md`, and PR 1 as built on `origin/build-1-pr1-basic-a1`. The gathered sources folder for PR 8 held 0 files: the plan names no earlier-branch source for this pull request. Everything here that the plan left open is marked "Decided here" with a reason.

Branch facts (computed by the build script, never invented): this pull request's branch is `build-1-pr8-band-a1`; unit branches are `build-1-pr8-band-a1-u1` and `build-1-pr8-band-a1-u2`; all are cut from `origin/build-1-pr1-basic-a1` (build notes: PRs 2 to 8 are cut from PR 1's branch) and the pull request opens into `build-1`. The description says: "Merge PR 1 first; until then this pull request's diff also shows PR 1's files."

## 1. Purpose

A one-line band above Claude Code's prompt that shows, at a glance and without asking anyone: how many workshops are active, with the latest attempt of the most recently changed one; how many questions are waiting on the owner; and how many captured entries are waiting to start. It is read-only. It ships as a second, separate plugin (`flight-band`) with its own marketplace file in `mods/status-band/`, so the main `flight` plugin never depends on the mod interface, which is new (Claude Code 2.1.287 or later; this machine runs 2.1.296) and can change. A separately installed plugin cannot import `flightdeck/lib/`, so the band carries its own copy of the reading rules it needs, and a test compares that copy with PR 1's reader so the two cannot drift unnoticed. It is the most experimental piece and an extra under "Accelerate Claude Code", not something VISION asks for; the owner included it ("PR 8: include").

## 2. VISION sections served

- Accelerate Claude Code: as an extra (plan 3.14): it puts FlightDeck's state into Claude Code's own interface, above the prompt, in every session in this repository where it is installed.
- Human energy (supporting): the owner sees what is waiting on them without opening a page or asking the pilot.
- Keep it simple (respected, not served): it is a separate, optional install; it never writes a file, never starts a turn and draws nothing outside a project that has a `.flightdeck/` folder.
- Not VISION's "Local CLI" (PR 5, skipped by the owner): the band is not a command line and adds no command.

## 3. Owned files

Every file this pull request adds or edits, one line each. Nothing else may change on the branch. Paths are from the repository root.

- `mods/status-band/.claude-plugin/plugin.json`: the band's plugin manifest: `name` `flight-band`, `version` `0.1.0`, a one-line plain description, `author` `{ "name": "dilberryhoundog" }`, and `"types": "./types/index.d.ts"`.
- `mods/status-band/.claude-plugin/marketplace.json`: the band's own local marketplace, named `flight-band`, with a plain `description`, `owner` `{ "name": "dilberryhoundog" }` and one entry `{ "name": "flight-band", "source": "./", "description": ..., "category": "development" }`.
- `mods/status-band/hooks/hooks.json`: declares the one hooks module: exactly `{ "modules": ["../register.js"] }` (the path is relative to `hooks.json`; checked by the brief seat with `claude plugin validate` on a scratch copy: a parent path is accepted).
- `mods/status-band/register.js`: the hooks module: refreshes a summary into `$.state` at session start, after every turn and every 30 seconds, and draws the band line in the `AbovePrompt` site from that state; reads files only through `$.fs`; never writes.
- `mods/status-band/lib/read.js`: the band's own copy of the reading rules (comment and fence stripping, the manifest parse rule, the open-question count, the settled line, the latest-attempt rule) plus `summarize` and `bandText`; pure functions, no imports, no `$`, no Node.
- `mods/status-band/types/index.d.ts`: the band's state contract: the `BandSummary` type and the `PluginState` entry `'flight-band': { band: BandSummary | null }`.
- `mods/status-band/tests/band.test.ts`: engine tests run by `claude plugin test mods/status-band`: the band draws the right line on the terminal and desktop surfaces from in-memory fixture files, the short form when narrow, nothing when there is no `.flightdeck/` or a survey holds the band, a refresh picks up a changed file, and nothing is ever written.
- `mods/status-band/tests/drift.test.mjs`: plain node test (`node --test 'mods/status-band/tests/*.test.mjs'`) that runs `lib/read.js` and PR 1's `flightdeck/lib/workshops.mjs` on the same fixtures and on the real repository's `.flightdeck/`, and fails on any difference; also pins `bandText`'s exact wording.
- `mods/status-band/.gitignore`: one line, `.claude-plugin/types/`, so the type files Claude Code lays beside a mod it loads from a folder in development never show up as untracked changes.
- `lab/owned/pr8.txt`: the ownership list (exact content in unit u1).
- `.flightdeck/build-1/attempts/pr-8/a1/brief.md`: this brief, committed by the fix stage (not by a unit).
- `.flightdeck/build-1/attempts/pr-8/a1/findings.md`: every verification finding with who raised it, severity, decision and reason; written by the fix stage.
- `.flightdeck/build-1/attempts/pr-8/a1/report.md`: the pull request report with [checked], [reviewed] and [stated] marks; written by the land stage (or the Captain).
- `.flightdeck/build-1/attempts/pr-8/a1/log.md`: stages, agents, ranks, models and effort, transcript paths, token totals where available; written by the land stage (or the Captain).

Decided here: the plan lists 8 files for PR 8 (3.14). This brief adds two, so the band is 9 files plus the owned list's attempt lines. (1) `tests/drift.test.mjs`: `claude plugin test` runs `*.test.ts` files in an environment with no file system, network or process (stated in the engine's own type file), so `band.test.ts` cannot read PR 1's reader or the repository; the plan's requirement that "its test runs them on the same fixtures as PR 1's reader test (read from the repository by the test only), so the two copies cannot drift unnoticed" is met by a plain node test beside it. PR 1's reader fixtures are built inline in `flightdeck/tests/core.test.mjs`, so the drift test rebuilds the same fixture texts and runs both readers on them. (2) `.gitignore`: without it, a `claude --plugin-dir mods/status-band` session writes `.claude-plugin/types/` into the repository and the hard-rule check would count those untracked files as changed.

## 4. Files PR 8 must not touch

- Every file in `lab/owned/pr1.txt` (PR 1's files), including `.claude-plugin/marketplace.json` at the repository root, `flightdeck/**`, `CLAUDE.md`, `README.md`, `.flightdeck/CLAUDE.md`, `.flightdeck/README.md`, `.flightdeck/workshops.md`, `.flightdeck/persona.md`, `.flightdeck/build-1/{workshop,context,verify,questions,decisions}.md`, `lab/checks/**`, `lab/owned/pr1.txt`. The band may read PR 1's formats; the drift test may import `flightdeck/lib/workshops.mjs`; neither edits it.
- Anything under `flightdeck/` at all: the main plugin gains nothing from PR 8 (no test file, no README line, no hook).
- Other pull requests' files: `lab/owned/pr2.txt` to `lab/owned/pr7.txt` and everything they list (`flightdeck/skills/board/`, `flightdeck/skills/page/`, `flightdeck/skills/{capture,workshop,retry,promote,launch,manual,library-check}/`, `flightdeck/workflows/`, `flightdeck/manuals/`, `flightdeck/library/`, `flightdeck/agents/librarian.md`, `lab/CLAUDE.md`, `lab/drills/`, `lab/evals/`, `lab/tests/`, `lab/workflows/`, `lab/fixtures/`, `lab/personas/`, `lab/results/`, `lab/climbs/`, `.flightdeck/.gitignore`).
- The owner's files: `.flightdeck/VISION.md`, `.flightdeck/build.txt`, `.flightdeck/build-1/constraints.md`.
- `dev/**`, `.claude/**` (including `.claude/rules/` and `.claude/settings.local.json`), `INTENT.md`, `HISTORY.md`, `LICENSE.txt`, `library/**`, `.flightdeck/build-1/workflows/**`, `.flightdeck/build-1/research/**`, `.flightdeck/build-1/attempts/` outside `pr-8/a1/`.

## 5. Shared formats and engine facts (every unit builds against these)

### 5.1 Writing rules

- Markdown and comments: one paragraph per line, no hard wrapping, plain words, literal and direct. Code comments may wrap at code width.
- Band text: plain words only. The band's words come from FlightDeck's own glossary ("workshop", "captured") and each comes with plain words beside it ("waiting to start", "waiting on you").
- Commit by file name, never `git add -A`; every commit message ends with the two attribution lines given in the build prompt.

### 5.2 PR 1 formats the band reads (from `origin/build-1-pr1-basic-a1:flightdeck/lib/workshops.mjs`; copy behaviour exactly)

- `stripNoise(text)`: normalises `\r\n` and `\r` to `\n`; removes HTML comments (`<!--...-->`, and an unclosed `<!--` to the end); drops fenced code blocks opened by a line starting (after optional spaces) with three or more backticks or tildes and closed by a fence line of the same character, at least as long, with nothing else on the line.
- Manifest `.flightdeck/workshops.md`: lines starting `- ` after `stripNoise`; name = text before the first `: `; the name must match `/^[a-z0-9-]+$/` (else skipped with a warning); a repeated name keeps the first line (warning); date = a trailing `(YYYY-MM-DD)` (missing date: kept, `date: null`, warning); ask = everything between, trimmed; a line with no `: ` is skipped with a warning. Returns `{ entries: [{ name, ask, date }], warnings }`.
- Questions `questions.md`: headings `## q<n>: <question>`; an `answer:` line (optionally bulleted, case-insensitive key), empty while open (whitespace only counts as empty); an optional `ask-later:` line; a question that is unanswered and has a non-empty `ask-later:` is held for later and not counted as open; a question with no `answer:` line counts as open with a warning; a `## ` heading that is not a question is ignored with a warning. Returns `{ questions: [{ id, text, open, askLater }], open, heldForLater, warnings }`.
- Workshop state (derived, never stored): a manifest entry with no folder `.flightdeck/<name>/` is captured (a `.flightdeck/<name>.activate.md` beside it still means captured); a folder means active; a folder whose `workshop.md`, after `stripNoise`, has a line matching `/^settled:\s*(\d{4}-\d{2}-\d{2})\s*$/m` is settled. A folder that the manifest lacks is listed only when it holds `workshop.md` (with a warning), and only when its name matches the name rule. Workshops are ordered: manifest order first, then such folders sorted by name.
- Latest-attempt rule: an attempt is any folder named `a<k>` (`/^a([1-9]\d*)$/`) at any depth under the workshop's `attempts/`; attempts are grouped by their parent folder path relative to `attempts/` (`''` for `attempts/` itself, `pr-1`, `plan`); the latest in each group is the highest `k`; label = `<group>/<name>` or `<name>` for the top group; the list is sorted by group with plain string comparison (`a < b ? -1 : a > b ? 1 : 0`). PR 1's walk lists folders up to seven levels below `attempts/` (it recurses while depth < 6, starting at depth 0) and descends into `a<k>` folders too.
- PR 1's real data on the branch (the drift test and the live checks use it): `.flightdeck/workshops.md` lists `build-1` (active), `demo-attempt-age`, `live-checks-reach-the-hook` and `runner-report-file` (captured); `.flightdeck/build-1/questions.md` holds one question, `q1`, held with `ask-later:`, so 0 open; `.flightdeck/build-1/attempts/` holds `plan/a2` and `pr-1/a1` (and `pr-8/a1` once this pull request's attempt files land). These numbers can change as the Captain files capture lines on PR 1's branch: tests and live checks compute expectations from PR 1's reader, never from this paragraph.

### 5.3 The mod interface (Claude Code 2.1.296; read from the engine's own type file and checked on a scratch copy by the brief seat)

- A mod is a plugin folder with `.claude-plugin/plugin.json` and `hooks/hooks.json` naming one hooks module under `modules`, path relative to `hooks.json`. The module exports `register(on, options)`; `on(event, matcher?, hook)`; every hook is `($, e, next)`; `return next(e)` passes on.
- The module runs with no DOM and no Node: no `fs`, no `process`, no `require`, no `import()`. Files of the plugin are imported with static `import` declarations; every imported file is an ES module whatever its suffix. Everything outside goes through `$`.
- `claude plugin validate` reads the module's source the way the engine does. Rule found on the scratch copy: a function that receives `$` must be a function declared at the top of the file (a `function` declaration or a `const` bound to one), and `$` is always spelled `$.noun.method(...)` at the call site. Passing `$` to a closure defined inside `register` fails validation.
- State: `import { atom, read, update } from 'claude-code'`; `const band = atom({ plugin: 'flight-band', key: 'band' }, null)`; `await read($, band)` inside a render hook subscribes the drawing; `await update($, band, () => value)` from any other hook or timer redraws readers. A render hook never writes state. Every state key must be declared in the contract named by `plugin.json` `types`; `claude plugin validate` checks it.
- Files: `$.fs.read(path)` resolves the text and rejects when missing (or over 4 MiB); `$.fs.list(path)` resolves `[{ name, kind: 'file'|'dir'|'other', size, mtimeMs, isLink }]` (mtime only for files; 0 for folders) and rejects when missing; `$.fs.stat(path)` resolves `{ kind, size, mtimeMs, isLink }` for files and folders and rejects `ENOENT`; paths are absolute or relative to the working directory.
- Session: the `session.start` input carries `cwd` (absolute), `surface`, `isInteractive`; `session.start` hooks are awaited before the first prompt; `next(e)` resolves `{ cwd }`. `$.session.cwd()` answers the working directory later. `$.clock.every(ms, fn)` runs `fn` every `ms` until cancelled or the module reloads.
- Drawing: `on('ui.render', { component: 'AbovePrompt' }, hook)`; `e.surface` is `terminal` or `desktop` (the band site is raised on those two only); `e.props.hasSurvey` (yield with `next(e)` while true), `e.props.isWorking`, `e.props.maxRows`, `e.props.bodyColumns` (the cells the band's tree may use); elements come from `const { Box, Text } = $.ui.resolve(e)`; `h` is a global factory, so a `.js` module writes `h(Box, { key: 'flight-band' }, h(Text, { dimColor: true, wrap: 'truncate-end' }, text))` with no JSX. Returning `next(e)` with nothing beneath draws nothing.
- Tests: `claude plugin test <folder>` runs `*.test.ts` and `*.test.tsx` with `import { test, expect, describe, mock } from 'claude-code/testing'`; `test(name, async ($, on) => ...)`; the test's `on` hooks sit beneath the plugin and stand for the engine, and must answer with result objects: `{ value: <result> }` or `{ deny: '<reason>' }` (a bare string fails with "returned something that is not a result object"; a `deny` rejects the plugin's call). `session.start` is raised with `await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })` and answered beneath with `on('session.start', ($, e) => ({ cwd: e.cwd }))`. A drawing is mounted with `await $.ui.mount({ plugin: 'flight-band', surface, component: 'AbovePrompt', props })` and read with `await ui.find({ type: 'Text', text: /.../ })`, then `await ui.unmount()`; the full props type is `RenderPropsOf<'AbovePrompt'>` in the type file. `mock.clock` answers the clock from memory so a test can advance it.
- The type file for this build is `/tmp/claude-0/bundled-skills/2.1.296/84565ac8e016d80869f9ab6d8847e395/plugin-authoring/types/claude-code.d.ts` (about 21,500 lines; grep it for `'turn.complete'`, `AbovePrompt: {`, `RenderPropsOf`, `mock`, `EngineClassic`). If that path is gone, any session that loads the `plugin-authoring` skill writes a fresh copy and names its path. Do not write any file under `/root/.claude/dev-mods/`: a write there asks the owner a hot-reload question.
- A headless `claude -p --debug-file <log>` session that loads the plugin writes lines such as `hooks module flight-band@<marketplace> loaded (worker, ...); events: session.start,turn.complete,ui.render`, `plugin.register: flight-band (...) ... admitted`, and one `$.fs.read (flight-band): <path> failed: ENOENT ...` line per failed read. A `-p` session draws nothing above the prompt.
- Installing from a folder marketplace whose entry is `"source": "./"` reads the plugin from that folder itself (checked: `claude plugin list` shows `Read from: <folder>`); edits reach a running session with `/reload-plugins`.

## 6. Done (yes is pass)

1. Does `lab/owned/pr8.txt` list exactly the files in section 3, one per line, and does the branch change nothing else beyond PR 1's own list (`node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto` and `--base origin/build-1-pr1-basic-a1 --owned lab/owned/pr8.txt` both print only pass lines)?
2. Does `claude plugin validate mods/status-band` exit 0 and report the module hooks `session.start`, `turn.complete` and `ui.render{component=AbovePrompt}`, state reads and writes of `flight-band.band` only, and no `$.fs.write`, `$.process`, `$.network`, `$.prompt`, `$.session.append` or `$.tool` call?
3. Does `claude plugin test mods/status-band` exit 0 with every test in `band.test.ts` passing on both the `terminal` and `desktop` surfaces?
4. Does `node --test 'mods/status-band/tests/*.test.mjs'` exit 0, with the band's rules giving the same results as PR 1's `flightdeck/lib/workshops.mjs` on every shared fixture and on the repository's real `.flightdeck/`?
5. Do `claude plugin validate flightdeck` and `node --test 'flightdeck/tests/*.test.mjs'` still exit 0, unchanged by this pull request?
6. Is the band read-only: no `$.fs.write` anywhere in `mods/status-band/`, and the band test's write counter stays at zero?
7. Does nothing in `mods/status-band/register.js` or `mods/status-band/lib/read.js` import or name a file under `flightdeck/` (only the drift test imports PR 1's reader)?
8. Does the band draw exactly the line in section 7.3 for a fixture with active, settled, captured and pending-activation workshops, nested attempts and an `ask-later` question, and the short form when `bodyColumns` is below the full line's length?
9. Does the band draw nothing in a project with no `.flightdeck/` folder anywhere above the working directory, and nothing while `e.props.hasSurvey` is true?
10. Does a change to a workshop's `questions.md` show in the band after the next completed turn or within about 30 seconds, without a restart?
11. Does a headless session in a scratch clone with the band installed log that the `flight-band` hooks module loaded and was admitted, with no failed read of `.flightdeck/workshops.md` and no refused or skipped `flight-band` hook?
12. Are the five-minute try steps in the pull request description first, do they work as written up to the point where a screen is needed, and is the "look above the prompt" step marked [stated] until the owner confirms it?
13. Is every owner-facing text (the band line, both descriptions, the pull request description) in plain words, with "captured" and "workshop" each beside plain words?
14. Does deleting `mods/status-band/` and `lab/owned/pr8.txt` in a scratch worktree leave `claude plugin validate flightdeck`, `node --test 'flightdeck/tests/*.test.mjs'` and `node lab/checks/hard-rules.mjs` green?
15. Does the band use no model or effort value at all (so nothing above Opus at high), and does the branch push only to `build-1-pr8-band-a1*` branches, never to main, never forced?

## 7. Script check commands (run from the repository root on the PR branch; exact flags)

### 7.1 build-1's own checks (from `.flightdeck/build-1/verify.md`)

- `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`: prints only `pass` lines and exits 0. (With `auto`, the check allows the union of every `lab/owned/pr*.txt` changed on the branch, which is `pr1.txt` and `pr8.txt` while PR 1 is unmerged.)
- `claude plugin validate flightdeck`: exits 0.
- `node --test 'flightdeck/tests/*.test.mjs'`: exits 0. (Quoted glob form: on Node 22 a folder name fails with "Cannot find module".)

### 7.2 PR 8's own checks

- `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr8.txt`: prints only `pass` lines and exits 0 (PR 8's own diff against PR 1's branch, checked against PR 8's list alone; the plan's "hard-rule check with `lab/owned/pr8.txt`").
- `claude plugin validate mods/status-band`: exits 0; its report shows the hooks, state keys and calls listed in done question 2. Warnings about a missing author or description must not appear (both are filled in).
- `claude plugin test mods/status-band`: exits 0, `0 fail`.
- `node --test 'mods/status-band/tests/*.test.mjs'`: exits 0.
- `node flightdeck/lib/workshops.mjs list --json`: exits 0; used by the drift test and the live checks as the expected values.
- `grep -nE "fs\.write|process\.|import\(|flightdeck/lib|workshops\.mjs" mods/status-band/register.js mods/status-band/lib/read.js`: prints nothing (exit 1 is the pass).
- Removal check (scratch worktree only, never committed): `git worktree add <scratch>/pr-8/removal origin/build-1-pr8-band-a1 && cd <scratch>/pr-8/removal && rm -r mods/status-band lab/owned/pr8.txt && claude plugin validate flightdeck && node --test 'flightdeck/tests/*.test.mjs'`: both exit 0; then `git worktree remove --force <scratch>/pr-8/removal`.
- Optional, information only: type-check with the type file's header `tsconfig.json`, kept outside the mod folder, its `include` naming the type file and `mods/status-band/{register.js,lib,types,tests}` with `"allowJs": true, "checkJs": true`: `tsc -p <scratch>/pr-8/tsconfig.json`. A type error is a finding, not a block.

## 8. Live checks (for the live-check tester; scratch clone, private HOME, plugin installed)

The band draws only on a real screen, which a `claude -p` session does not have. The build script asks the live seat for PR 8 to run at least `claude plugin validate` and `claude plugin test` on the band in a scratch clone; checks L3 to L5 below go further and are run when the seat can, otherwise reported [stated] with the reason. Every nested Claude Code command runs with a private home folder. `<S>` is `<scratch>/pr-8/live`; `<NESTED>` is `/home/user/flightdeck/.flightdeck/build-1/workflows/nested-settings.json`.

- L1, clone and install: `git clone /home/user/flightdeck <S>/repo && cd <S>/repo && git fetch origin build-1-pr8-band-a1 && git switch build-1-pr8-band-a1`; `git init --bare <S>/origin.git && git remote set-url origin <S>/origin.git` (in the clone only); rewrite the clone's `mods/status-band/.claude-plugin/marketplace.json` `"name"` to `flight-band-try-pr8-a1`; then `HOME=<S>/home claude plugin marketplace list` (record), `HOME=<S>/home claude plugin marketplace add "$PWD/mods/status-band" --scope local`, `HOME=<S>/home claude plugin install flight-band@flight-band-try-pr8-a1 --scope local`, `HOME=<S>/home claude plugin list`. Pass: the list shows `flight-band@flight-band-try-pr8-a1`, `Status: enabled`, `Read from: <S>/repo/mods/status-band`.
- L2, validate and test in the clone: `claude plugin validate mods/status-band` exits 0 with the report in done question 2; `claude plugin test mods/status-band` exits 0; `node --test 'mods/status-band/tests/*.test.mjs'` exits 0.
- L3, the module loads in a real session: in `<S>/repo`, `HOME=<S>/home claude -p --model haiku --settings <NESTED> --debug-file <S>/band-debug.log "Reply with the single word OK"`. Pass: the reply is OK; `grep -n "flight-band" <S>/band-debug.log` shows `hooks module flight-band@flight-band-try-pr8-a1 loaded` with `events: session.start,turn.complete,ui.render` and `plugin.register: flight-band` ... `admitted`; there is no `$.fs.read (flight-band): <S>/repo/.flightdeck/workshops.md failed` line, no `$.fs.write (flight-band)` line, and no line with `flight-band` and `refused`, `skipped` or `not loaded`.
- L4, the band on a real screen (where `tmux` is available; it is at `/usr/bin/tmux` on this machine): first compute the expected numbers with `node flightdeck/lib/workshops.mjs list --json` in `<S>/repo` (active = workshops with state `active`; captured = `captured`; questions = sum of `openQuestions` over workshops with state `active` or `settled`). Then `tmux new-session -d -s flight-band -x 200 -y 50 "cd <S>/repo && HOME=<S>/home claude --model haiku --settings <NESTED>"`; wait about 20 seconds; `tmux capture-pane -p -t flight-band > <S>/screen-1.txt`. If the screen shows a first-run question (theme, trust this folder, sign-in method), answer it with `tmux send-keys -t flight-band Enter` (or the key the screen names), wait 10 seconds and capture again; if a sign-in is demanded, stop and report L4 [stated]. Pass: the capture holds one line starting `FlightDeck: ` with exactly the expected active count, `question`/`questions waiting on you` with the expected number, and `captured, waiting to start` with the expected number, and the latest attempt label shown is one of build-1's latest-attempt labels from the list output.
- L5, the band follows the files: with the L4 session still open, append to `<S>/repo/.flightdeck/build-1/questions.md` the block `\n## q99: Live check question?\nwhy: live check\nasked: 2026-10-11 by the live check\nanswer:\n`; wait about 40 seconds (the 30-second refresh); capture to `<S>/screen-2.txt`. Pass: the questions number is one higher than in L4. Then `tmux kill-session -t flight-band`.
- L6, clean up: `HOME=<S>/home claude plugin uninstall flight-band@flight-band-try-pr8-a1 --scope local`, `HOME=<S>/home claude plugin marketplace remove flight-band-try-pr8-a1`, `HOME=<S>/home claude plugin marketplace list` equals the L1 record. The owner's real `DBHD-FlightDeck` install is never touched (the private home makes this so; any change to it is a high finding).
- Imposter (per the build script): reads the code and the try steps instead of running them, as the owner, and marks the try [stated] until the owner looks.

## 9. The owner's five-minute try (leads the pull request description)

1. In the repository: `git fetch origin && git switch build-1-pr8-band-a1` (or, once PR 8 is merged, any branch that has `mods/status-band/`).
2. `claude plugin marketplace add "$PWD/mods/status-band" --scope local`
3. `claude plugin install flight-band@flight-band --scope local`
4. Start Claude Code in the repository (`claude`, or `claude --agent flight:pilot --model opus --effort high`); in a session that was already open, type `/reload-plugins` or restart it.
5. Look just above the prompt. You should see one line like: `FlightDeck: 1 active workshop (build-1, latest pr-8/a1) | 0 questions waiting on you | 3 captured, waiting to start`. "Active workshop" means a piece of work with its own folder; "captured" means a line in `.flightdeck/workshops.md` waiting for you to start it. The numbers match the pre-flight card in a pilot session. [stated until you look: no agent can see a terminal screen.]
6. Optional: add a question with an empty `answer:` line to `.flightdeck/build-1/questions.md`; after Claude's next reply, or within about 30 seconds, the questions number goes up by one. Delete it again afterwards.
7. To remove the band: `claude plugin uninstall flight-band@flight-band --scope local` (and `claude plugin marketplace remove flight-band` if you want the marketplace gone too).

## 10. Units (at most three; disjoint files)

Both units are cut from `origin/build-1-pr1-basic-a1`, write only their own files, run the checks they name, commit by file name with the attribution lines and push their unit branch. Unit u2 imports u1's `lib/read.js` by the exact interface below, so neither waits for the other; the integrate stage merges both.

### u1: the reading rules, the drift test and the owned list

Files: `mods/status-band/lib/read.js`, `mods/status-band/tests/drift.test.mjs`, `lab/owned/pr8.txt`.

`mods/status-band/lib/read.js`. An ES module with no `import` statements, no `$`, no Node globals (`process`, `Buffer`, `require`) and no `import()`; it must load both in the engine's sandbox and in plain node 22 (node prints a module-type warning at most). Open with a comment saying it is the band's own copy of PR 1's reading rules in `flightdeck/lib/workshops.mjs`, kept identical in behaviour by `tests/drift.test.mjs`, because a separately installed plugin cannot import the main plugin. Exports, exactly these names:

- `NAME_RE`: `/^[a-z0-9-]+$/`.
- `ATTEMPT_DEPTH`: `7` (folders are collected down to seven levels below `attempts/`, as PR 1's walk does).
- `REFRESH_MS`: `30000`.
- `stripNoise(text)`, `parseManifest(text)`, `parseQuestions(text)`: behaviour and return shapes copied from PR 1's functions of the same names (section 5.2), including every warning string, so the drift test can compare whole return values with `deepEqual`. Copy PR 1's code for these three functions and adjust nothing but what the sandbox needs (nothing, as far as the brief seat can see).
- `settledDate(cardText)`: `null` for `null` or `undefined`; otherwise the date string from `/^settled:\s*(\d{4}-\d{2}-\d{2})\s*$/m` on `stripNoise(cardText)`, or `null`.
- `latestAttempts(dirPaths)`: `dirPaths` is an array of folder paths relative to the workshop's `attempts/` folder, `/`-separated, without leading or trailing slash (for example `['pr-1', 'pr-1/a1', 'pr-1/a2', 'plan', 'plan/a2', 'a1', 'a3']`). For each path whose last segment matches `/^a([1-9]\d*)$/`, group = the path before the last segment (`''` when none), `k` = the number; keep the highest `k` per group. Return `[{ group, name, k, label }]` sorted by group with `(a < b ? -1 : a > b ? 1 : 0)`, `label` = `group ? group + '/' + name : name`. Same shape and order as PR 1's `latestAttempts(workshopDir)`.
- `summarize(input)`: pure; never throws (wrap the body; on an internal error return `{ active: 0, settled: 0, captured: 0, openQuestions: 0, heldForLater: 0, latest: null, warnings: ['summary failed: <message>'] }`). Input: `{ manifestText: string | null, folders: Folder[] }` where each `Folder` is `{ name, cardText: string | null, questionsText: string | null, attemptDirs: string[], changedMs: number, attemptMs: { [label]: number } }` and `folders` holds every directory directly under `.flightdeck/` whose name matches `NAME_RE` (whether or not it has a card). Rules, mirroring PR 1's `listWorkshops`: workshops are the manifest entries in order (a folder in `folders` with the same name makes it active, settled when `settledDate(cardText)` is not null; no folder makes it captured), then every folder not in the manifest whose `cardText !== null`, sorted by name, each adding the warning `workshop <name> is not in workshops.md`. Output: `{ active, settled, captured, openQuestions, heldForLater, latest, warnings }`: counts of workshops by state; `openQuestions` and `heldForLater` = sums of `parseQuestions(questionsText ?? '').open` and `.heldForLater` over every workshop that has a folder (active and settled; decided here: a settled workshop's open question still waits on the owner); `latest` = `null` when no workshop is active, else `{ workshop, label }` for the active workshop with the greatest `changedMs` (ties: the earlier one in workshop order), where `label` is, among `latestAttempts(attemptDirs)`, the one with the greatest `attemptMs[label]` (missing counts as 0; ties: the one later in the sorted list), or `null` when it has no attempts; `warnings` = the manifest's and questions' warnings prefixed as PR 1 does (`<name>: <warning>` for question warnings) plus the not-in-manifest warnings.
- `bandText(summary, columns)`: returns `''` when `summary` is null. Otherwise builds, with singular and plural spelled out:
  - part A: `no active workshop` when `active === 0`; else `<active> active workshop` or `<active> active workshops`, followed when `latest` is set by ` (<workshop>, latest <label>)`, or ` (<workshop>)` when `label` is null;
  - part B: `<n> question waiting on you` or `<n> questions waiting on you` (`n` = `openQuestions`; `0 questions`);
  - part C: `<n> captured, waiting to start`;
  - full line: `FlightDeck: <A> | <B> | <C>`.
  - When `columns` is a number and the full line is longer than `columns`, return the short line `FlightDeck: <active> active | <openQuestions> waiting on you | <captured> captured` instead (returned as is even if still too long; the drawing truncates it).
  - Examples the drift test pins exactly: `{active:1, openQuestions:0, captured:3, latest:{workshop:'build-1', label:'pr-8/a1'}}` with columns 200 gives `FlightDeck: 1 active workshop (build-1, latest pr-8/a1) | 0 questions waiting on you | 3 captured, waiting to start`; the same with columns 60 gives `FlightDeck: 1 active | 0 waiting on you | 3 captured`; `{active:2, openQuestions:1, captured:0, latest:{workshop:'alpha', label:null}}` gives `FlightDeck: 2 active workshops (alpha) | 1 question waiting on you | 0 captured, waiting to start`; `{active:0, openQuestions:0, captured:1, latest:null}` gives `FlightDeck: no active workshop | 0 questions waiting on you | 1 captured, waiting to start`.
- Decided here: held-for-later questions are not shown in the band (the plan counts only open questions; the board shows the held ones); the separator is ` | ` in plain ASCII; the band says "waiting on you" because the owner is the reader.

`mods/status-band/tests/drift.test.mjs`. Node built-ins only (`node:test`, `node:assert/strict`, `node:fs`, `node:os`, `node:path`, `node:url`). Imports the band's rules from `../lib/read.js` and PR 1's reader from `../../../flightdeck/lib/workshops.mjs` (both resolved from `import.meta.url`); this is the only file in `mods/status-band/` that names `flightdeck/`. Fixtures are built in temporary folders (`fs.mkdtempSync(path.join(os.tmpdir(), 'band-'))`) and removed in `after`. A helper `gather(root)` builds `summarize`'s input from a real folder the way `register.js` will through `$.fs`: reads `.flightdeck/workshops.md` (null if missing), lists the `.flightdeck/` folders matching `NAME_RE`, and for each reads `workshop.md` and `questions.md` (null if missing), sets `changedMs` to the greatest file mtime directly in the folder, collects `attemptDirs` by walking `attempts/` to `ATTEMPT_DEPTH` levels (folders only, descending into every folder), and sets `attemptMs` for each latest label from `fs.statSync(...).mtimeMs`. Tests, each named `drift: ...`:
- manifest: `deepEqual(band.parseManifest(t), pr1.parseManifest(t))` for every text PR 1's reader tests use (copy them from `origin/build-1-pr1-basic-a1:flightdeck/tests/core.test.mjs` tests "reader: manifest asks may hold colons, bars, brackets and parentheses", "a manifest line without a date ...", "HTML comments and fenced code blocks are ignored") plus a duplicate name, `\r\n` line ends, an unclosed `<!--` and a tilde fence.
- questions: the same deep comparison for PR 1's `QUESTIONS` fixture (copy verbatim from `core.test.mjs`), the malformed-file fixture from "reader: questions count open and held ones, and a malformed file gives warnings, not exceptions", the whitespace-after-`answer:` fixture, a bulleted `- answer:` line and an empty string.
- latest attempt: one temp workshop with folders `attempts/a1`, `attempts/a3`, `attempts/pr-1/a1`, `attempts/pr-1/a2`, `attempts/plan/a2`, `attempts/g/h/a9`, `attempts/a0`, `attempts/a1/a2` and a file `attempts/notes.md`; `deepEqual(band.latestAttempts(dirs), pr1.latestAttempts(dir))` where `dirs` comes from the walk; also a workshop with no `attempts/` folder gives `[]` from both.
- states and counts: temp projects copied from PR 1's card and reader fixtures (five manifest lines with `three.activate.md`, `live` active and `done-one` settled; a folder not in the manifest with and without `workshop.md`; a folder with a bad name; the `alpha` workshop with `QUESTIONS`; a settled workshop with one open question); for each, `pr = pr1.listWorkshops(root)` and `b = band.summarize(gather(root))`, assert `b.active === pr.workshops.filter(w => w.state === 'active').length`, the same for `settled`, `b.captured === pr.captured`, `b.openQuestions` and `b.heldForLater` equal the sums of PR 1's `openQuestions` and `heldForLater` over workshops whose state is not `captured`, and `b.latest.label` (when set) is one of PR 1's labels for that workshop.
- real data: run the same comparison on the repository's own root (two folders up from `mods/status-band/tests/`), which holds PR 1's `.flightdeck/`.
- band text: the four `bandText` examples above, exactly.
- no imports in the copy: read `../lib/read.js` as text and assert it contains no `import ` statement and no `process.`, `require(` or `import(`.

`lab/owned/pr8.txt`, exactly:

```
# Files pull request 8 (Status band) adds, edits or deletes, one per line.
mods/status-band/.claude-plugin/plugin.json
mods/status-band/.claude-plugin/marketplace.json
mods/status-band/hooks/hooks.json
mods/status-band/register.js
mods/status-band/lib/read.js
mods/status-band/types/index.d.ts
mods/status-band/tests/band.test.ts
mods/status-band/tests/drift.test.mjs
mods/status-band/.gitignore
lab/owned/pr8.txt
.flightdeck/build-1/attempts/pr-8/a1/brief.md
.flightdeck/build-1/attempts/pr-8/a1/findings.md
.flightdeck/build-1/attempts/pr-8/a1/report.md
.flightdeck/build-1/attempts/pr-8/a1/log.md
```

u1 checks before pushing: `node --test 'mods/status-band/tests/*.test.mjs'` exits 0; `node --test 'flightdeck/tests/*.test.mjs'` exits 0.

### u2: the mod itself: manifests, module, state contract, engine tests

Files: `mods/status-band/.claude-plugin/plugin.json`, `mods/status-band/.claude-plugin/marketplace.json`, `mods/status-band/hooks/hooks.json`, `mods/status-band/register.js`, `mods/status-band/types/index.d.ts`, `mods/status-band/tests/band.test.ts`, `mods/status-band/.gitignore`.

Manifests (JSON, two-space indent):
- `plugin.json`: `{ "name": "flight-band", "version": "0.1.0", "description": "FlightDeck status band: one line above the prompt showing active workshops, questions waiting on you and captured work waiting to start.", "author": { "name": "dilberryhoundog" }, "types": "./types/index.d.ts" }`.
- `marketplace.json`: `{ "$schema": "https://anthropic.com/claude-code/marketplace.schema.json", "name": "flight-band", "description": "The FlightDeck status band, a separate optional plugin served from this folder.", "owner": { "name": "dilberryhoundog" }, "plugins": [ { "name": "flight-band", "description": "One line above the prompt showing what FlightDeck is waiting on.", "source": "./", "category": "development" } ] }`.
- `hooks/hooks.json`: `{ "modules": ["../register.js"] }`. Fallback, only if `claude plugin validate mods/status-band` refuses the parent path on the integrated branch: move the module to `mods/status-band/hooks/register.js` (import `../lib/read.js`), set `"modules": ["./register.js"]`, update `lab/owned/pr8.txt` through u1's file at integration, and say so in the report.
- `.gitignore`: the single line `.claude-plugin/types/`.

`types/index.d.ts`, exactly in substance:

```ts
export type BandLatest = { workshop: string; label: string | null }
export type BandSummary = { active: number; settled: number; captured: number; openQuestions: number; heldForLater: number; latest: BandLatest | null; warnings: string[] }

declare module 'claude-code' {
  interface PluginState {
    'flight-band': { band: BandSummary | null }
  }
}
```

`register.js` (no JSX; `h` is a global; a short header comment says what the band shows, that it is read-only, and that its reading rules live in `lib/read.js`):
- Imports: `import { atom, read, update } from 'claude-code'` and `import { NAME_RE, ATTEMPT_DEPTH, REFRESH_MS, latestAttempts, summarize, bandText } from './lib/read.js'`.
- Module values: `const band = atom({ plugin: 'flight-band', key: 'band' }, null)`; `let lastCwd = null`; `let timer = null`.
- Top-level `async function isDir($, p)`: `$.fs.stat(p)` resolves `kind === 'dir'`, any rejection gives `false`.
- Top-level `async function findRoot($, start)`: walks up from `start` (absolute, `/`-separated; strip a trailing `/`) checking `isDir($, dir + '/.flightdeck')`; returns the first such `dir`, or `null` after the filesystem root. Decided here: POSIX paths only, like the rest of this build; Windows is not handled.
- Top-level `async function walkAttempts($, base, rel, depth, out)`: lists `base + '/' + rel` (or `base` when `rel` is empty) with `$.fs.list`, catching a rejection as an empty list; for every entry with `kind === 'dir'` pushes `rel ? rel + '/' + name : name` and recurses while `depth < ATTEMPT_DEPTH - 1`, so folders down to `ATTEMPT_DEPTH` levels are collected (match PR 1: first call at depth 0).
- Top-level `async function gather($, root)`: `fd = root + '/.flightdeck'`; `manifestText` = `$.fs.read(fd + '/workshops.md')` or null; list `fd` and keep `kind === 'dir'` entries matching `NAME_RE`; for each folder: `cardText` and `questionsText` from `workshop.md` and `questions.md` (null when missing); `changedMs` = the greatest `mtimeMs` among the folder's `kind === 'file'` entries from `$.fs.list` (0 when none); `attemptDirs` from `walkAttempts($, folder + '/attempts', '', 0, [])`; `attemptMs` = for each label in `latestAttempts(attemptDirs)`, `(await $.fs.stat(folder + '/attempts/' + label)).mtimeMs`, 0 on rejection. Returns `{ manifestText, folders }`.
- Top-level `async function refresh($, cwd)`: if `cwd` is falsy, do nothing. Otherwise inside `try`: `root = await findRoot($, cwd)`; `next = root ? summarize(await gather($, root)) : null`; `await update($, band, () => next)`. On any error keep the previous value (empty `catch`). It never calls `$.fs.write` or anything that writes.
- Hooks inside `export const register = on => { ... }` (typed with the JSDoc `/** @type {import('claude-code').Register} */`):
  - `on('session.start', async ($, e, next) => { lastCwd = e.cwd; await refresh($, e.cwd); if (!timer) timer = $.clock.every(REFRESH_MS, () => refresh($, lastCwd)); return next(e) })`. If `claude plugin validate` refuses the timer closure, move the timer start into a top-level `function startTimer($)` and call that.
  - `on('turn.complete', async ($, e, next) => { await refresh($, lastCwd ?? await $.session.cwd()); return next(e) })`. (Decided here: refresh after every completed turn, plus every 30 seconds so hand edits made while Claude is idle still show; the cost is a few small file reads.)
  - `on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => { const s = await read($, band); if (!s || e.props.hasSurvey) return next(e); const text = bandText(s, e.props.bodyColumns); if (!text) return next(e); const { Box, Text } = $.ui.resolve(e); return h(Box, { key: 'flight-band' }, h(Text, { dimColor: true, wrap: 'truncate-end' }, text)) })`.
- Nothing else: no buttons, no commands, no toasts, no status line, no `.catch` handlers (none of these hooks is a guard).

`tests/band.test.ts` (run by `claude plugin test mods/status-band`; imports only from `'claude-code/testing'`):
- A fixture helper holds an in-memory file tree keyed by absolute path under `/proj` (files with text and an `mtimeMs`, folders) and installs bottom hooks with the test's `on`: `fs.read` answers `{ value: text }` or `{ deny: 'ENOENT' }`; `fs.list` answers `{ value: [{ name, kind, size, mtimeMs, isLink: false }] }` (mtime 0 for folders) or `{ deny: 'ENOENT' }`; `fs.stat` answers `{ value: { kind, size, mtimeMs, isLink: false } }` (folders carry their own mtime) or `{ deny: 'ENOENT' }`; `fs.write` records the call in a counter and answers `{ deny: 'read-only test' }`; `session.start` answers `({ cwd: e.cwd })`; `session.cwd` answered as the type file requires (find its result form; if it cannot be answered, the tests rely on `lastCwd`). Start each test with `await $.session.start({ cwd: '/proj/sub', surface: 'terminal', isInteractive: true })` so `findRoot` must walk up one level.
- Mount helper: `$.ui.mount({ plugin: 'flight-band', surface, component: 'AbovePrompt', props })` with props of type `RenderPropsOf<'AbovePrompt'>` filled from the type file (`hasSurvey: false`, `isWorking: false`, `maxRows: 10`, `bodyColumns: 200`, a `scroll` value as the type requires, plus any other required prop); read with `ui.find({ type: 'Text', text: /^FlightDeck: / })`; `ui.unmount()` after each.
- Fixture project: `.flightdeck/workshops.md` with `- alpha: fix a|b: the [x] (y) part (2026-10-01)`, `- beta: later (2026-10-02)`, `- gamma: pending (2026-10-03)` (with `.flightdeck/gamma.activate.md`), `- done-one: finished (2026-10-04)`; `.flightdeck/alpha/` with `workshop.md`, PR 1's `QUESTIONS` text as `questions.md` (1 open, 1 answered, 1 held), attempts folders `a1`, `pr-1/a1`, `pr-1/a2`, `plan/a2` with `pr-1/a2` given the newest mtime; `.flightdeck/done-one/` with a card holding `settled: 2026-10-05` and a `questions.md` with one open question.
- Tests (each body loops over `['terminal', 'desktop'] as const`):
  1. full line: the drawn text is exactly `FlightDeck: 1 active workshop (alpha, latest pr-1/a2) | 2 questions waiting on you | 2 captured, waiting to start`.
  2. short line: with `bodyColumns: 60` the text is exactly `FlightDeck: 1 active | 2 waiting on you | 2 captured`.
  3. no project: with no `.flightdeck/` anywhere above `/proj/sub`, no element matches `/FlightDeck/` (if the mount rejects because nothing is drawn, the test accepts that rejection as "nothing drawn" and says so in a comment).
  4. survey: with `hasSurvey: true`, no element matches `/FlightDeck/`.
  5. refresh: change `alpha/questions.md` in the fixture to add one more open question, then trigger a refresh by raising `turn.complete` through the test's `$` with the input the type file gives for `'turn.complete'` (answered beneath with its result form), or, if that event cannot be raised from a test, by advancing `mock.clock` past 30,000 ms; the drawn text then says `3 questions waiting on you`. At least one of the two refresh paths must be tested; the test comment names which.
  6. broken files: a `workshops.md` holding only malformed lines and a `questions.md` with a heading but no `answer:` line still draw a line (no throw); the expected text is written in the test.
  7. read-only: after all of the above in the file, the `fs.write` counter is 0.

u2 checks before pushing: `claude plugin validate mods/status-band` exits 0 with the report in done question 2; `claude plugin test mods/status-band` exits 0. The test imports `lib/read.js` through `register.js`, so u2 runs these after fetching u1's branch into a scratch worktree if u1 has pushed (`git fetch origin build-1-pr8-band-a1-u1` and a throwaway local merge that is never pushed), or against a local stub of `lib/read.js` that is never committed; the integrate stage reruns both on the merged branch.

## 11. Decisions made in this brief (the plan left these open)

- Two files beyond the plan's eight: `tests/drift.test.mjs` (the engine test has no file access, so the drift comparison with PR 1's reader runs under plain node) and `.gitignore` (keeps engine-written type files out of git). Reason in section 3.
- The module stays at the plan's path `mods/status-band/register.js` with `hooks.json` naming `../register.js`; validated on a scratch copy; a named fallback exists.
- No JSX: `register.js` is plain JavaScript using the global `h`, so the plan's `.js` file name holds.
- Refresh: at session start, after every completed turn and every 30 seconds.
- "Most recently changed" workshop: the active workshop whose own files (directly in its folder) have the newest modification time; its shown attempt is the latest-attempt label whose folder is newest; ties as in u1.
- Questions waiting: open questions of every workshop that has a folder (active and settled); held-for-later questions are not shown.
- The band draws nothing outside a project with `.flightdeck/`, nothing while a survey holds the band, and has no buttons.
- Exact band wording and the short form (section 10, u1).
- The scratch-clone marketplace name for tests is `flight-band-try-pr8-a1`, following the build's `-try-pr<n>-a<k>` naming.
- The hard-rule check runs twice: `--owned auto` against `origin/build-1` (build-1's own check) and `--owned lab/owned/pr8.txt` against `origin/build-1-pr1-basic-a1` (PR 8's own diff), because the branch is cut from PR 1's unmerged branch.

## 12. Notes for the later stages

- Pull request body: lead with section 9's try steps and say step 5 is [stated] until the owner looks; then the checks [checked], the verification [reviewed], findings and what was done, size, models per stage, and "Retry: add `PR 8:` lines to `.flightdeck/build-1/constraints.md` and say retry PR 8; the next attempt is branch `build-1-pr8-band-a2`." Also: "Merge PR 1 first; until then this pull request's diff also shows PR 1's files." And: "This is an extra, not something VISION asks for; it is fourth in the plan's cut order."
- Capture lines (work outside this brief, not done here): none found while writing the brief.
- The fix stage commits this file as `.flightdeck/build-1/attempts/pr-8/a1/brief.md`.
