# Build brief: PR 2, Flight board (FlightDeck build-1, attempt 1)

Written by the brief seat (Worker, reporting to the Captain of the build run) on 2026-10-11 from the approved plan `.flightdeck/build-1/attempts/plan/a2/plan.md` (sections 0, 1, 2(a) to 2(h), 3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.9, 3.10, 3.11, 4 "The owner's first hour" and "PR 2", 5, 6, 7 and 8), `.flightdeck/build-1/constraints.md`, `.flightdeck/build-1/attempts/build-notes.md`, build-1's own `context.md` and `verify.md`, and PR 1's real files on `origin/build-1-pr1-basic-a1` (commit d7230f7). The gathered sources folder `<scratch>/pr-2/sources/` was empty when this brief was written; the plan names no earlier-branch source for PR 2, so nothing is adapted from other branches. The colour tokens are taken from the planning review page `.flightdeck/build-1/review.html` (material the owner has already seen). Where this brief says "Decided here", the plan left the detail open and this brief chose it; the Captain may overrule.

In this brief `<scratch>` is `/tmp/claude-0/-home-user-flightdeck/862b2741-d117-5c94-9343-5ef6450876d9/scratchpad/build` and `<NESTED>` is `/home/user/flightdeck/.flightdeck/build-1/workflows/nested-settings.json`.

Branch: `build-1-pr2-board-a1`, cut from `origin/build-1-pr1-basic-a1` (build notes: wave 1 is cut from PR 1's branch), opening into `build-1`. Unit branches: `build-1-pr2-board-a1-u1` and `build-1-pr2-board-a1-u2`, each cut from `origin/build-1-pr1-basic-a1`. Attempt folder: `.flightdeck/build-1/attempts/pr-2/a1/`. The pull request says "Merge PR 1 first; until then this pull request's diff also shows PR 1's files."

## 1. Purpose

- The owner sees all work on one local page: every active and settled workshop as a row on the board (title, latest attempt, latest result, open pull requests, settled or not), the captured work waiting to start (each with a copy button for the line `activate <name>`), and every question waiting on them with its options and the recommended one marked.
- The owner answers in under two minutes: pick an option or type a note per question, press "Copy my answers", paste into chat; the session files each answer into the right `questions.md`. Questions marked `ask-later` sit in a folded "Asked to ask later" list.
- A prompt builder tab turns a rough idea into a ready prompt for the pilot: pick a captured or active workshop or a new one, a team plan, write the rough ask, done and how to check it, copy.
- A page kit (`flightdeck/skills/page/`) so every page an agent makes shares the theme, works in light and dark and at phone width, loads nothing but Google Fonts, and ends with one button that copies only what the owner changed plus a ready prompt.
- PR 2 needs PR 1 only (formats, the shared reader `flightdeck/lib/workshops.mjs`, the manifest, the build-1 workshop). It does not need PR 3 or PR 4: the "Waiting to start" copy line `activate <name>` is understood by PR 1's pilot (`flightdeck/agents/pilot.md`, "Owner-only moves").
- Left out on purpose (plan 3.3): VISION's "other ai tools" for the page suite; only the prompt builder is built. The pull request body says so.

## 2. VISION sections served

- Themed HTML page suite: "Interactive interface. Prompt builder ... Agents show visualisations to the human. The human returns content back to the agent." The board, the prompt builder, the page kit, and the copy-back block.
- Human energy: questions answered on one page in under two minutes instead of "hundreds of lines up" in chat; answers filed into durable `questions.md` files.
- Workshops: the board shows workshop state as derived from files (captured, active, settled), latest attempts and questions, without any stored status.
- Roleplay: the flight theme carried into pages (title, colours), in plain words.
- Keep it simple: one self-contained HTML file, no server, no build step, works with PR 1 alone.
- Built with quality: own test folder, removable without breaking anything else (plan 2(a) item 3).
- Accelerate Claude Code: skills with supporting files and `${CLAUDE_SKILL_DIR}`.

## 3. Owned files

Every file this pull request adds. It edits no existing file. `lab/owned/pr2.txt` lists exactly these 24 paths. (Decided here: 24 files instead of the plan's "about 16", because the fixtures need 9 files to cover nested attempts, a malformed questions file, a settled workshop and a pending activation, and the four attempt files are counted.)

Unit u1 (page kit guide, ignore file, eval case, owned list):

- `flightdeck/skills/page/SKILL.md`: the page kit skill: rules every agent-made page follows, the HTML skeleton, the theme's class list (section 5.7), and the "copy my changes" panel format.
- `.flightdeck/.gitignore`: ignores `board.html` (two lines: a comment, then `board.html`).
- `lab/evals/pr2-board-shows-waiting/prompt.md`: eval case prompt (section 5.9).
- `lab/evals/pr2-board-shows-waiting/graders/waiting.md`: LLM grader, captured work named correctly.
- `lab/evals/pr2-board-shows-waiting/graders/questions.md`: LLM grader, open and held questions told apart.
- `lab/owned/pr2.txt`: the 24 paths of this section, one per line, after one `#` comment line.

Unit u2 (theme, board skill, renderer, page template, tests, fixtures):

- `flightdeck/skills/page/theme.css`: the theme: colour tokens on `:root` with a dark set, Google Fonts import, layout and the component classes of section 5.7.
- `flightdeck/skills/board/SKILL.md`: the board skill: how to render and report the board, how to file a pasted answers block, how to render the example board.
- `flightdeck/skills/board/render.mjs`: reads the workshops through PR 1's reader, builds the board data, renders static HTML into the template, writes `.flightdeck/board.html`; exports `collectBoard`, `renderBoard`, `writeBoard`, `answerBlock`, `buildPrompt`, `TEAM_PLANS`.
- `flightdeck/skills/board/board.template.html`: the page shell with placeholders, tabs, and the inline script for copy buttons, answers and the prompt builder.
- `flightdeck/skills/board/tests/render.test.mjs`: node tests (section 5.8).
- `flightdeck/skills/board/tests/fixtures/.flightdeck/workshops.md`
- `flightdeck/skills/board/tests/fixtures/.flightdeck/cap-two.activate.md`
- `flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/workshop.md`
- `flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/questions.md`
- `flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/attempts/pr-1/a1/report.md`
- `flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/attempts/pr-1/a2/report.md`
- `flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/attempts/plan/a3/brief.md`
- `flightdeck/skills/board/tests/fixtures/.flightdeck/ws-settled/workshop.md`
- `flightdeck/skills/board/tests/fixtures/.flightdeck/ws-settled/questions.md`

Attempt files (written by the build's later stages, not by any unit; listed in `lab/owned/pr2.txt`):

- `.flightdeck/build-1/attempts/pr-2/a1/brief.md`: this brief, copied in by the integrate stage.
- `.flightdeck/build-1/attempts/pr-2/a1/findings.md`: every finding with verifier, severity, decision and reason (fix stage).
- `.flightdeck/build-1/attempts/pr-2/a1/report.md`: the pull request report with provenance marks (land stage).
- `.flightdeck/build-1/attempts/pr-2/a1/log.md`: stages, seats, ranks, models and effort, results (land stage).

The exact content of `lab/owned/pr2.txt`:

```
# Files pull request 2 (Flight board) adds, edits or deletes, one per line.
flightdeck/skills/board/SKILL.md
flightdeck/skills/board/render.mjs
flightdeck/skills/board/board.template.html
flightdeck/skills/board/tests/render.test.mjs
flightdeck/skills/board/tests/fixtures/.flightdeck/workshops.md
flightdeck/skills/board/tests/fixtures/.flightdeck/cap-two.activate.md
flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/workshop.md
flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/questions.md
flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/attempts/pr-1/a1/report.md
flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/attempts/pr-1/a2/report.md
flightdeck/skills/board/tests/fixtures/.flightdeck/ws-nested/attempts/plan/a3/brief.md
flightdeck/skills/board/tests/fixtures/.flightdeck/ws-settled/workshop.md
flightdeck/skills/board/tests/fixtures/.flightdeck/ws-settled/questions.md
flightdeck/skills/page/SKILL.md
flightdeck/skills/page/theme.css
.flightdeck/.gitignore
lab/evals/pr2-board-shows-waiting/prompt.md
lab/evals/pr2-board-shows-waiting/graders/waiting.md
lab/evals/pr2-board-shows-waiting/graders/questions.md
lab/owned/pr2.txt
.flightdeck/build-1/attempts/pr-2/a1/brief.md
.flightdeck/build-1/attempts/pr-2/a1/findings.md
.flightdeck/build-1/attempts/pr-2/a1/report.md
.flightdeck/build-1/attempts/pr-2/a1/log.md
```

## 4. Files PR 2 must not touch

- Every file PR 1 owns (the list in `lab/owned/pr1.txt` on `origin/build-1-pr1-basic-a1`), including `flightdeck/lib/workshops.mjs`, `flightdeck/tests/core.test.mjs`, `flightdeck/agents/*.md`, `flightdeck/hooks/*`, `flightdeck/skills/team-plans/*`, `flightdeck/skills/preflight/SKILL.md`, `flightdeck/templates/workshop/*`, `flightdeck/policies.md`, `flightdeck/rubric.md`, `flightdeck/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `CLAUDE.md`, `README.md`, `.flightdeck/CLAUDE.md`, `.flightdeck/README.md`, `.flightdeck/persona.md`, `.flightdeck/workshops.md`, `.flightdeck/build-1/{README,workshop,context,verify,questions,decisions}.md`, `lab/checks/*`, `lab/owned/pr1.txt` and `.flightdeck/build-1/attempts/pr-1/`. PR 2 imports `flightdeck/lib/workshops.mjs` and reads the others; it edits none of them.
- Triage's questions and capture lines for PR 2 are not written by PR 2 into `.flightdeck/build-1/questions.md` or `.flightdeck/workshops.md` (PR 1 owns them); they go to the Captain, who adds them on PR 1's branch (build notes, "Landing").
- The owner's files: `.flightdeck/VISION.md`, `.flightdeck/build.txt`, `.flightdeck/build-1/constraints.md`.
- Build residue and planning material: `.flightdeck/build-1-brief.md`, `.flightdeck/build-1/review.html`, `.flightdeck/build-1/plan/`, `.flightdeck/build-1/research/`, `.flightdeck/build-1/verify/`, `.flightdeck/build-1/workflows/`, `.flightdeck/build-1/attempts/plan/`, `.flightdeck/build-1/attempts/build-notes.md`.
- `dev/`, `.claude/` (including `.claude/rules/`), `INTENT.md`, `HISTORY.md`, `LICENSE.txt`, `.gitattributes`, `lab/README.md`, `library/`.
- Files other pull requests own: `flightdeck/skills/{capture,workshop,retry,promote,launch,manual,library-check}/`, `flightdeck/workflows/`, `flightdeck/manuals/`, `flightdeck/library/`, `flightdeck/agents/librarian.md`, `lab/CLAUDE.md`, `lab/checks/lint.mjs`, `lab/checks/manuals.mjs`, `lab/drills/`, `lab/tests/`, `lab/workflows/`, `lab/personas/`, `lab/fixtures/`, `lab/results/`, `lab/climbs/`, `lab/evals/README.md`, `lab/evals/.gitignore`, any `lab/evals/` case not named `pr2-*`, `mods/`, `lab/owned/pr<n>.txt` for n other than 2.
- Never committed: `.flightdeck/board.html` (generated, ignored), any rendered board anywhere in the repository, a root `.gitignore`, `flightdeck/settings.json`, anything in `flightdeck/bin/`.

## 5. Shared formats (both units build against these)

### 5.1 Writing rules

- One paragraph per line in markdown, no hard wrapping, plain words, literal and direct. Every owner-facing text (page headings, explainer lines, button labels, skill descriptions) uses plain words and explains any FlightDeck term in a few words ("workshop: a piece of work with its own folder of notes and checks"). Do not use "flight strip", "scoped block", "seat" or "hook" on the page; use "row", "the workshop's own notes and checks", "role", "an automatic check".
- Scripts are dependency-free ES modules, Node built-ins only, no `package.json`, Node 22.
- Tests: on Node 22 `node --test <folder>` fails with "Cannot find module"; always use the quoted glob form: `node --test 'flightdeck/skills/board/tests/*.test.mjs'`. (Decided here: the plan wrote `node --test flightdeck/skills/board/tests/`.)
- PR 1's hard-rule check fails any `.mjs`, `.js`, `.cjs` or `.sh` file under `flightdeck/` or `lab/` that contains the word `dw` or `dev-workspace` standing alone (regex `(^|[\s'"`(;&|/])(dw|dev-workspace)(?=[\s'"`)]|$)`). Never use `dw` as an identifier or in a string.
- No `model:` or `effort:` keys anywhere in PR 2's files (frontmatter or JS option literals).
- Skill descriptions: each under 400 characters (plan 2(h)).

### 5.2 Formats read from PR 1 (do not change; quoted from PR 1's files)

- Manifest `.flightdeck/workshops.md`: lines `- <name>: <the ask> (<YYYY-MM-DD>)`. The name is the text before the first `: `; the date is the last `(YYYY-MM-DD)` at the end; the ask is everything between and may contain `:`, `|`, brackets. HTML comments and fenced code blocks are ignored. Names are lowercase letters, digits and hyphens.
- State is derived: a manifest line with no folder is captured (waiting to start); a `.flightdeck/<name>.activate.md` beside the manifest means its activation questions are waiting, and it is still captured; a folder is active; a line `settled: <YYYY-MM-DD>` in its `workshop.md` means settled.
- Card `workshop.md`: `# <title>`, `work: ...`, `done: ...`, optional `settled: <YYYY-MM-DD>`.
- Questions `questions.md`: blocks headed `## q<n>: <question>`, then lines `why:`, `options: a) <text>; b) <text>; c) <text>`, `recommended: <letter>) <option and reason>`, `asked: <YYYY-MM-DD> by <who>`, optional `ask-later: <when>`, and `answer:`. A question is open while its `answer:` is empty and it has no `ask-later:`; a question with `ask-later:` and an empty answer is held for later and not counted as open.
- Paste-back block (from `flightdeck/templates/workshop/questions.md` and plan 2(f)), exactly:

```
FlightDeck answers for workshop <name>: file these into .flightdeck/<name>/questions.md
q<n>: <option letter or text> | note: <text>
q<n>: (unanswered)
Other notes: <text>
```

- Latest attempt rule: an attempt is any folder `a<k>` at any depth under `attempts/`, grouped by parent folder, the highest `k` per group is the latest (`latestAttempts` returns `{group, name, k, label}`, label like `pr-1/a2` or `a3`).

### 5.3 PR 1 reader functions PR 2 uses (import, never copy or edit)

From `flightdeck/skills/board/render.mjs`: `import { listWorkshops, parseQuestions, stripNoise, findRoot } from '../../lib/workshops.mjs';`

- `listWorkshops(root)` returns `{workshops, captured, warnings}`; each workshop is `{name, ask, date, state: 'captured'|'active'|'settled', pendingActivation, settled, attempts, openQuestions, heldForLater}`. Manifest order first, then folders with a `workshop.md` the manifest lacks (with a warning).
- `parseQuestions(text)` returns `{questions: [{id, text, open, askLater: boolean}], open, heldForLater, warnings}`. It is the single source of truth for which questions are open or held; PR 2 only adds the display details (why, options, recommended, asked, ask-later text).
- `stripNoise(text)` removes HTML comments and fenced code blocks (so the template's format example is never shown as a question).
- `findRoot(start)` walks up to the first folder holding `.flightdeck/`, or returns null.
- None of these throw; they return warnings.

### 5.4 `render.mjs` interface (u2 writes it; u1's eval and the live checks call it)

Command line, run from anywhere: `node <plugin root>/skills/board/render.mjs [--root <dir>] [--out <file>] [--no-gh] [--json]`.

- `--root`: start folder; the root is `findRoot(<dir>)`, else `findRoot(process.env.CLAUDE_PROJECT_DIR || process.cwd())`. No root found: print `No .flightdeck/ folder found from <dir>; there is nothing to show.` and exit 0.
- `--out`: output file (resolved against the current directory); default `<root>/.flightdeck/board.html`. Parent folders are created.
- `--no-gh`: do not call `gh`.
- `--json`: print the board data (section 5.5) as one JSON line to stdout and write no file.
- Normal output, exactly these lines: `Board written: <absolute path>`, `Open it: file://<absolute path>`, then `Workshops: <a> active, <s> settled. Waiting to start: <c>. Questions waiting on you: <o> (asked to ask later: <h>).`, then `Pull requests: <n> open` or `Pull requests: not shown (<reason>)`, then one `warning: <text>` line per warning. Exit 0.
- Any internal error: print `board error: <message>` to stderr, exit 1.
- The command line runs only when the file is the main module (same `isMain()` pattern as `workshops.mjs`: compare `pathToFileURL(fs.realpathSync(process.argv[1])).href` with `import.meta.url`), so tests and live checks can `import` it without side effects.

Exports:

- `TEAM_PLANS`: `[{slug:'recon', title:'Recon'}, {slug:'build-and-check', title:'Build and check'}, {slug:'decide', title:'Decide'}, {slug:'spec-first', title:'Spec first'}, {slug:'many-hands', title:'Many hands'}, {slug:'root-cause', title:'Root cause'}]` (the six pages in PR 1's `flightdeck/skills/team-plans/`).
- `collectBoard(root, {gh = true, prs = null, now = new Date().toISOString()} = {})`: returns the data of section 5.5. Never throws: any failure becomes a warning. When `prs` is an array it is used instead of calling `gh` (for tests). When `gh` is true and `prs` is null, it runs `gh pr list --state open --json number,title,url,headRefName,isDraft --limit 50` with `spawnSync` (cwd root, timeout 10000 ms); any failure (missing command, not signed in, non-zero exit, bad JSON) gives `prs.shown = false` and `prs.note = 'the gh command is missing, not signed in, or failed'`; `gh: false` gives the note `'not asked for'`. The current branch comes from `git rev-parse --abbrev-ref HEAD` (cwd root, timeout 5000 ms), else null.
- `renderBoard(data, assets = loadAssets())`: returns the page HTML string (section 5.6). `loadAssets()` (also exported) reads `board.template.html` next to `render.mjs` and `../page/theme.css`; a missing theme gives `themeCss = ''` and adds a warning to the page.
- `writeBoard(root, {out, gh, prs, now} = {})`: collects, renders, writes; returns `{path, data}`.
- `answerBlock(name, items, otherNotes)`: pure, self-contained (no reference to anything outside its own body, because its source is inlined into the page with `Function.prototype.toString`). `items` is `[{id, option, note}]` in order. Returns the lines joined with `\n` (no trailing newline): first `FlightDeck answers for workshop <name>: file these into .flightdeck/<name>/questions.md`; then per item, after trimming and turning any run of whitespace (including newlines) in `note` into one space: option and note: `<id>: <option> | note: <note>`; option only: `<id>: <option>`; note only: `<id>: <note>`; neither: `<id>: (unanswered)`; last line `Other notes: <otherNotes trimmed and whitespace-collapsed>`, or `Other notes: (none)` when empty. (Decided here: the plan's format shows ` | note:` always; this brief adds it only when a note was written, and writes a note alone as the text answer.)
- `buildPrompt(input)`: pure and self-contained, inlined into the page the same way. `input = {name, state: 'active'|'captured'|'new', ask, done, verify, plan, today}`. Each text value is trimmed and whitespace-collapsed. For `state: 'new'`, the name is `input.name` if it matches `^[a-z0-9-]+$`, else a slug of the ask (lowercase, every run of characters outside `a-z0-9` becomes `-`, trimmed of `-`, at most the first five words and 40 characters, trailing `-` removed), else `new-work`. Returns exactly these seven lines joined with `\n`:
  1. `Captain, here is work for workshop <name>.`
  2. active: `It is active: read its constraints.md, context.md and verify.md first.`; captured: `It is captured and waiting to start: activate <name> first.`; new: `It is new: capture it as "- <name>: <ask> (<today>)" in .flightdeck/workshops.md, then activate <name>.`
  3. `Ask: <ask>` or `Ask: (none written)`
  4. `Done when: <done>` or `Done when: (propose it)`
  5. `Check it by: <verify>` or `Check it by: (propose it)`
  6. `Team plan: <plan>` or, when empty, `Team plan: pick the smallest that fits and say why in one line`
  7. `Before anything starts, show me the plan in five lines and wait for my go.`

(Decided here: the prompt builder writes a plain prompt for the pilot, which works with PR 1 alone; it does not produce `/flight:capture` or `/flight:workshop` lines, so PR 2 does not depend on PR 3.)

### 5.5 Board data (the JSON slot and `--json`)

```
{
  "version": 1,
  "generated": "<now>",
  "root": "<absolute root>",
  "branch": "<branch>" | null,
  "workshops": [ { "name", "ask", "date", "state": "active"|"settled", "settled": "<date>"|null,
                   "attempts": [ { "label", "report": "<root-relative path of report.md>"|null, "title": "<first # heading of report.md>"|null } ],
                   "openQuestions", "heldForLater",
                   "prs": [ { "number", "title", "url", "isDraft", "headRefName" } ] } ],
  "waiting": [ { "name", "ask", "date", "activateFile": ".flightdeck/<name>.activate.md"|null } ],
  "questions": [ { "workshop", "id", "text", "why", "options": [ { "letter", "text", "recommended": bool } ],
                   "recommended", "asked", "askLater", "held": bool } ],
  "prs": { "shown": bool, "note": "<text>", "other": [ <open pull requests matched to no workshop> ] },
  "teamPlans": [ { "slug", "title" } ],
  "warnings": [ "<text>" ]
}
```

- `workshops` holds active and settled workshops in `listWorkshops` order; `waiting` holds captured ones (with `activateFile` set when `pendingActivation` is true).
- Latest result (Decided here): for each latest attempt, `report` is `.flightdeck/<name>/attempts/<label>/report.md` when that file exists, and `title` is its first line starting `# ` without the `# `; otherwise both are null and the page says "no report yet". Nothing is stored as a status.
- A pull request belongs to a workshop when its `headRefName` equals the workshop name or starts with `<name>-` (branch names are `<workshop>-a<k>` and `build-1-pr<n>-<slug>-a<k>`); the rest go in `prs.other`.
- `questions` holds, for every active or settled workshop in order, the questions of its `questions.md` that are open (`held: false`) or held for later (`held: true`), in file order; answered questions are left out. Open and held come from `parseQuestions`; the display fields come from a local detail parser run on `stripNoise(text)`: within each `## q<n>` block, the values of `why:`, `options:`, `recommended:`, `asked:` and `ask-later:` (first occurrence each, case-insensitive key, optional leading `- `). Options are split from the `options:` value at each letter marker (regex `(?:^|;\s*)([a-z])\)\s*`, case-insensitive); an option is `recommended` when its letter equals the first `<letter>)` of the `recommended:` value. A question with no parseable options has `options: []`.
- `warnings` holds `listWorkshops` warnings, the theme warning if any, and a warning for any workshop whose details could not be read; it never stops the page.

### 5.6 The page (static HTML first, script second)

Decided here: `render.mjs` writes every row, captured entry and question as static HTML, so the page reads fully without its script and a text extract of it answers "what is waiting?"; the script only adds the copy buttons, the answer block and the prompt builder, using the JSON slot. The theme is inlined (copied) into the page, so `board.html` is one self-contained file with no link to the plugin folder.

Template placeholders (each exactly once in `board.template.html`; `renderBoard` throws if one is missing or left over; replace with `split(ph).join(value)`, never `String.replace` with a string, because `$&` and `$'` in data would be expanded): `{{THEME_CSS}}` (inside the head `<style>`), `{{HEADER}}`, `{{WORKSHOPS}}`, `{{WAITING}}`, `{{QUESTIONS}}`, `{{WARNINGS}}`, `{{DATA_JSON}}` (inside `<script type="application/json" id="board-data">`), `{{FUNCTIONS}}` (inside the inline `<script>`, before the page logic; `render.mjs` puts `answerBlock.toString()` and `buildPrompt.toString()` there).

Escaping: every text from files goes through an HTML escape of `&`, `<`, `>`, `"` and `'`. The JSON slot is `JSON.stringify(data)` with every `<` written as `<` (so a `</script>` in an ask cannot end the slot), and `U+2028`/`U+2029` escaped.

Exact page text and structure (tests and the comprehension check rely on these):

- `<title>FlightDeck flight board</title>`; `<html lang="en">`; viewport meta `width=device-width, initial-scale=1`.
- Header (`{{HEADER}}`): `<h1>FlightDeck flight board</h1>`, a line `Branch: <branch>` (left out when null), `Made <generated>`, and the line `To refresh: type /flight:board again, then reload this page.`
- Tabs: `<nav class="fd-tabs">` with two buttons, `Board` and `Prompt builder` (`role="tab"`, `aria-selected`). The board tab is shown first; without the script both panels show.
- `<section id="workshops">`: `<h2>Workshops</h2>`, explainer `A workshop is a piece of work with its own folder of notes, checks and attempts.`; one `<article class="fd-row" data-workshop="<name>" data-state="active|settled">` per workshop with `<h3><name></h3>`, the ask, a badge `In progress` (active) or `Settled <date>` (settled), one line per latest attempt `Latest attempt <label>: <title>` or `Latest attempt <label>: no report yet` (or `No attempts yet.`), `Questions waiting: <openQuestions>` (plus ` (asked to ask later: <n>)` when n > 0), and its open pull requests as links `#<number> <title>` with `(draft)` when draft. Empty: `<p class="fd-empty">No active workshops yet.</p>`. After the rows, when `prs.shown` is false: `Pull requests are not shown: <note>.`; when `prs.other` is not empty, a short list `Other open pull requests`.
- `<section id="waiting">`: `<h2>Waiting to start</h2>`, explainer `Work that was written down and is waiting for you to start it. To start one, copy its line and paste it to the pilot.`; `<ul>` with one `<li class="fd-row" data-workshop="<name>">` per captured entry: name, ask, date, `<code>activate <name></code>` and `<button type="button" class="fd-btn" data-copy="activate <name>">Copy</button>`; when `activateFile` is set: `Activation questions are waiting in <code>.flightdeck/<name>.activate.md</code>.` Empty: `<p class="fd-empty">Nothing is waiting to start.</p>`.
- `<section id="questions">`: `<h2>Questions waiting on you</h2>`, explainer `Pick an answer or write a note, then press Copy my answers and paste the result into your Claude chat. Skipped questions stay open.`; one `<fieldset class="fd-question" data-workshop="<w>" data-question="<id>" data-held="false">` per open question, `<legend><w> <id>: <text></legend>`, `Why: <why>`, one radio per option (`name="<w>/<id>"`, `value="<letter>"`, label `<letter>) <text>`, the recommended one with class `is-recommended` and the label suffix ` (recommended)`), `Asked: <asked>`, and a note `<textarea data-note>` labelled `Note (optional)` (labelled `Your answer` when there are no options). Empty: `<p class="fd-empty">No questions are waiting on you.</p>`. Then, only when held questions exist, `<details id="held"><summary>Asked to ask later (<n>)</summary>` with an explainer `You asked for these to be asked later. You can answer them now if you want.` and the held questions in the same fieldset form with `data-held="true"` and a line `Ask later: <askLater>`. Then `<label>Other notes <textarea id="other-notes"></textarea></label>`, `<button type="button" id="copy-answers" class="fd-btn fd-btn-primary">Copy my answers</button>`, and `<textarea id="answers-out" readonly>` (the copied text is always shown here too, so it can be copied by hand).
- `<section id="builder">`: `<h2>Prompt builder</h2>`, explainer `Turn a rough idea into a ready message for the pilot.`; fields: `Workshop` select (each active workshop `<name> (in progress)`, each settled `<name> (settled)` treated as active, each captured `<name> (waiting to start)`, and `A new piece of work`), `Name for the new work` (shown for new), `Team plan` select (`Let the Captain pick` then the six titles of `TEAM_PLANS`), textareas `Rough ask`, `Done when`, `Check it by`; `<textarea id="prompt-out" readonly>` updated on every input; `<button type="button" id="copy-prompt" class="fd-btn fd-btn-primary">Copy prompt</button>`. The script passes `today` as the browser's local date `YYYY-MM-DD` and `plan: ''` for "Let the Captain pick".
- `<section id="warnings">` only when warnings exist: `<h2>Warnings</h2>`, explainer `Something in these files could not be read. The rest of the board is still right.`, one `<article class="fd-row fd-warning">` per warning.
- Footer line: `Made by /flight:board from the files in .flightdeck/. Nothing on this page is sent anywhere.`
- No `<script src>`, no `<img>`, `<iframe>`, `<link rel="stylesheet">` or `url(...)` to any host other than `fonts.googleapis.com` and `fonts.gstatic.com`; the only network request is the theme's Google Fonts `@import`.

Copy behaviour (inline script): one function `copyText(text, statusEl)` that tries `navigator.clipboard.writeText` and falls back to selecting a temporary textarea and `document.execCommand('copy')`, then shows `Copied` or `Select the text below and copy it`. "Copy my answers" builds one block per workshop (workshops in `data.questions` order) holding every open question of that workshop and every held question the owner touched (picked an option or wrote a note), using `answerBlock`; the "Other notes" text goes into the first block, the others get `(none)`; blocks are joined with one blank line. When there is no block, it copies nothing and shows `Nothing to copy yet: no question is waiting and none was answered.` (Decided here: one button for all workshops; held questions are included only when touched.)

### 5.7 Theme contract (`theme.css`, documented in the page skill)

- First line: `@import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');`
- Tokens on `:root` (light), the same names and light values as `.flightdeck/build-1/review.html`: `--bg #eef1f4`, `--surface #ffffff`, `--surface-2 #f6f8fa`, `--ink #15212c`, `--ink-2 #4a5866`, `--ink-3 #5a6773`, `--line #d3dae1`, `--line-strong #9fadba`, `--accent #8f5300`, `--accent-bg #fff3df`, `--accent-line #e8b866`, `--go #1d6e47`, `--go-bg #e3f3ea`, `--go-line #8fcaa9`, `--info #0b627c`, `--info-bg #e2f1f6`, `--stop #a3322a`, `--stop-bg #fbe9e7`, `--code-bg #e9edf1`, `--focus #0b7fa3`, `--shadow 0 1px 2px rgba(15,28,40,.06), 0 2px 8px rgba(15,28,40,.04)`, `--font-body 'Barlow', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`, `--font-head 'Barlow Semi Condensed', 'Barlow', 'Arial Narrow', 'Segoe UI', Arial, sans-serif`, `--font-mono 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`, plus `--radius 8px`, `--gutter 16px` and `color-scheme: light`.
- Dark set, the review page's dark values (`--bg #0c1217`, `--surface #131b22`, `--surface-2 #18222b`, `--ink #dfe7ee`, `--ink-2 #a8b6c3`, `--ink-3 #8595a4`, `--line #26323d`, `--line-strong #3d4c59`, `--accent #f2aa3c`, `--accent-bg #2a2011`, `--accent-line #7a5520`, `--go #5cc893`, `--go-bg #11261c`, `--go-line #2c6046`, `--info #67c7e2`, `--info-bg #0f2430`, `--stop #f08a80`, `--stop-bg #2c1513`, `--code-bg #1b2630`, `--focus #67c7e2`, `--shadow 0 1px 2px rgba(0,0,0,.3)`, `color-scheme: dark`), written twice: inside `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` and as `:root[data-theme="dark"] { ... }`.
- `body` has an explicit `background: var(--bg)` and `color: var(--ink)`; colours anywhere else only through tokens.
- Classes (the page kit's whole vocabulary): `.fd-page` (max-width 960px, centred, side padding `var(--gutter)`), `.fd-header`, `.fd-sub` (muted line), `.fd-section`, `.fd-card`, `.fd-row` (a bordered row on the board), `.fd-badge` with `.is-go`, `.is-info`, `.is-accent`, `.is-stop`, `.is-muted`, `.fd-btn`, `.fd-btn-primary`, `.fd-tabs` and `.fd-tab` (selected with `[aria-selected="true"]`), `.fd-field` (label above an input, select or textarea, full width), `.fd-question` (fieldset), `.fd-options` (option list) with `.is-recommended`, `.fd-copy-panel` (the closing panel: button, status text, read-only textarea), `.fd-warning`, `.fd-muted`, `.fd-empty`; plus base styles for `h1`-`h3` (`--font-head`), `code`, `pre`, `details`/`summary`, `:focus-visible` (2px `--focus` outline), and `@media (prefers-reduced-motion: reduce)`.
- Phone width: nothing wider than the screen at 360px: `box-sizing: border-box` everywhere, `max-width: 100%` on inputs and textareas, `overflow-wrap: anywhere` on `code`, paths and table-free text, and `pre { overflow-x: auto }` (scroll stays inside the block, never the page).

### 5.8 The tests (`render.test.mjs`)

Node built-ins only (`node:test`, `node:assert/strict`, `node:fs`, `node:os`, `node:path`, `node:child_process`, `node:url`). The fixture root is `new URL('./fixtures/', import.meta.url)`; any test that writes copies the fixtures into a temporary folder first (`fs.cpSync(..., {recursive: true})`) and removes it in `after`; no test writes inside the repository. Test names start with `board:`. `now` is fixed to `2026-10-11T00:00:00.000Z` and `gh: false` unless a test says otherwise. Required tests:

1. Every fixture workshop appears as a row: `ws-nested` with `data-state="active"`, `ws-settled` with `data-state="settled"` and `Settled 2026-10-06`.
2. Latest attempts: `ws-nested` shows `Latest attempt plan/a3: no report yet` and `Latest attempt pr-1/a2: Fixture report two`, and never `pr-1/a1`.
3. Every captured entry appears under `#waiting`: `cap-one` and `cap-two`, each with `data-copy="activate <name>"`; `cap-two`'s ask appears HTML-escaped (`&lt;b&gt;`, `&amp;`, `&quot;`), and its line says activation questions are waiting in `.flightdeck/cap-two.activate.md`; neither fixture workshop appears under `#waiting`.
4. Open questions: `ws-nested` q1 and q3 and `ws-settled` q1 appear in `#questions` outside `<details id="held">` with `data-held="false"`; `ws-nested` q2 appears only inside `<details id="held">` (`Asked to ask later (1)`); `ws-nested` q4 (answered) appears nowhere; q1's option `b) grey` carries `is-recommended` and ` (recommended)`.
5. `answerBlock` matches the format exactly for: option only (`q1: b`), option and note (`q1: b | note: keep it calm`), note only (`q3: write it by hand`), unanswered (`q3: (unanswered)`), a note with a newline collapsed to one space, empty other notes (`Other notes: (none)`) and written other notes; the first line is exactly `FlightDeck answers for workshop ws-nested: file these into .flightdeck/ws-nested/questions.md`; and the rendered page contains `answerBlock.toString()` and `buildPrompt.toString()`.
6. `buildPrompt` returns the exact seven lines for an active, a captured and a new workshop (new with an empty name derives the slug from the ask), and the defaults `(none written)`, `(propose it)` and the team plan default line.
7. A malformed questions file shows a warning row and does not crash: the fixture's `## Not a question heading` and `## q3 no colon after the number` produce rows in `#warnings`; and a temporary root whose `ws-x/questions.md` holds random bytes and whose `workshops.md` holds a line with no date still renders with warnings.
8. A root with no `.flightdeck/` gives an empty board with a warning from `collectBoard` (no throw), and the CLI prints the "No .flightdeck/ folder found" line and exits 0.
9. The page loads nothing but Google Fonts: every `http://` or `https://` URL in the rendered page has host `fonts.googleapis.com` or `fonts.gstatic.com`; there is no `<script src`, `<iframe`, `<img`, or `<link rel="stylesheet"`.
10. Theme: the rendered page contains `:root {` (or `:root{`) defining `--bg`, `@media (prefers-color-scheme: dark)` and `:root[data-theme="dark"]`, and `body` sets a background.
11. JSON slot: the content of `<script type="application/json" id="board-data">` parses with `JSON.parse` to the same data `collectBoard` returned, and the page contains no `</script>` inside the slot although `cap-two`'s ask holds one.
12. CLI: `node render.mjs --root <tmp fixtures> --no-gh` exits 0, prints `Board written: <tmp>/.flightdeck/board.html` and the summary line `Workshops: 1 active, 1 settled. Waiting to start: 2. Questions waiting on you: 3 (asked to ask later: 1).`, and the file exists; `--out <tmp>/x/b.html` writes there instead; `--json` prints JSON and writes no file.
13. Pull requests: with `prs: [{number: 7, title: 'Fixture PR', url: 'https://github.com/o/r/pull/7', headRefName: 'ws-nested-a2', isDraft: true}, {number: 8, title: 'Stray', url: 'https://github.com/o/r/pull/8', headRefName: 'other', isDraft: false}]`, PR 7 appears in `ws-nested`'s row with `(draft)` and PR 8 under `Other open pull requests` (the test-9 URL rule is checked on a render without pull requests); with `gh: false` the page says `Pull requests are not shown`.
14. `TEAM_PLANS` has six entries and each slug has a page `flightdeck/skills/team-plans/<slug>.md` whose first line is `# <title>`.
15. `collectBoard` on the repository itself (two folders above the skill) does not throw and lists `build-1` with state `active` or `settled`.
16. Importing `render.mjs` prints nothing and writes nothing (the CLI runs only as the main module).

### 5.9 The eval case (`lab/evals/pr2-board-shows-waiting/`)

Format of `claude plugin eval` 2.1.296 (checked here with `claude plugin eval init --bare`): `prompt.md` has frontmatter keys from `schema_version, name, description, tags, plugins, runs, expected_outcome, model, max_turns, timeout_seconds, allowed_tools, artifact_publish, growthbook_overrides, append_system_prompt, env` (any other key is refused) and the user prompt as its body; each `graders/<name>.md` has frontmatter `type: llm` and `weight: 1` and the pass criteria as its body. A `prompt.md` case cannot run a scaffold script (only `case.yaml` can), so (Decided here) the case is self-contained by using the example project that ships inside the board skill, `${CLAUDE_SKILL_DIR}/tests/fixtures`, instead of fixtures copied into the case folder. It needs `--allow-tools 'Bash(node *)'` and no `--scaffold`.

- `prompt.md` frontmatter: `description: The flight board shows captured work waiting to start and tells open questions from questions held for later.`, `tags: [pr2, board]`, `max_turns: 12`, `allowed_tools: [Skill, Read, Glob, Grep, Bash]`. Body: `Render the FlightDeck flight board for the example project that ships with the board skill, writing the page to board.html in the current folder. Then, using only that page, tell me in plain words which work is waiting to start and which questions are waiting on me.`
- `graders/waiting.md`: pass when the answer names `cap-one` (the card showing how old attempts are) and `cap-two` as waiting to start, and does not call `ws-nested` or `ws-settled` waiting to start; saying that `cap-two` has activation questions waiting is fine.
- `graders/questions.md`: pass when the answer names as waiting on the owner the question about which colour the board should use for settled work, the `ws-nested` q3 question, and the `ws-settled` question "Is the fixture settled correctly?"; and it does not present "Should the board show closed pull requests?" as waiting now (saying it is held for later is fine) and does not present "Already answered question" as waiting.
- The CLI help says `--eval-dir` names a directory below the plugin; `lab/evals/` is outside `flightdeck/` (plan [probe] item 7, fallback `flightdeck/evals/`). The case stays where the plan puts it; if the eval command refuses the directory, the checks stage reports "eval dir outside the plugin not supported here" as [stated], not a failure (results never block, plan 2(a)).

### 5.10 The fixtures (exact content; u2 writes them)

All under `flightdeck/skills/board/tests/fixtures/.flightdeck/`. No `constraints.md` anywhere in the fixtures (PR 1's truth guard protects every `constraints.md` under a `.flightdeck/` folder).

- `workshops.md`: a `# Workshops` heading, a blank line, then exactly these four lines:
  - `- ws-nested: a workshop with nested attempts: a colon | a pipe [brackets] (2026-10-01)`
  - `- ws-settled: a settled workshop (2026-10-02)`
  - `- cap-one: make the card show how old attempts are (2026-10-03)`
  - `- cap-two: try <b>bold</b> & "quotes" | pipes: colons [brackets] </script> $& (2026-10-04)`
- `cap-two.activate.md`: `# Activation questions for cap-two` and one line `Fixture: activation questions are waiting.`
- `ws-nested/workshop.md`: `# Nested fixture`, blank line, `work: a fixture with nested attempts`, `done: the board shows its latest attempt per group`.
- `ws-nested/questions.md`: `# Questions for workshop ws-nested`, then four blocks in this order: `## q1: Which colour should the board use for settled work?` (`why: The owner reads settled work at a glance.`, `options: a) green; b) grey; c) blue`, `recommended: b) grey, because settled work needs no action`, `asked: 2026-10-05 by the builder`, `answer:`); `## q2: Should the board show closed pull requests?` (`why: Fixture question held for later.`, `options: a) yes; b) no`, `recommended: b) no, open ones are enough`, `asked: 2026-10-05 by the reviewer`, `ask-later: after the owner has tried the board`, `answer:`); a malformed heading `## Not a question heading` with one line `This block is not a question.`; `## q3 no colon after the number` (`why: A malformed heading the board must survive.`, `answer:`); `## q4: Already answered question` (`options: a) yes; b) no`, `recommended: a) yes`, `asked: 2026-10-05 by the scout`, `answer: a`).
- `ws-nested/attempts/pr-1/a1/report.md`: `# Fixture report one`.
- `ws-nested/attempts/pr-1/a2/report.md`: `# Fixture report two`, blank line, `Second attempt.`
- `ws-nested/attempts/plan/a3/brief.md`: `# Fixture plan brief` (no report, so the board says "no report yet").
- `ws-settled/workshop.md`: `# Settled fixture`, blank line, `work: a fixture that is settled`, `done: the board marks it settled`, `settled: 2026-10-06`.
- `ws-settled/questions.md`: `# Questions for workshop ws-settled`, then `## q1: Is the fixture settled correctly?` (`why: A settled workshop can still hold an open question.`, `options: a) yes; b) no`, `recommended: a) yes`, `asked: 2026-10-06 by the reviewer`, `answer:`).

## 6. Done (yes is pass)

1. Does `claude plugin validate flightdeck` exit 0?
2. Does `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto` print only `pass` lines and exit 0?
3. Does `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr2.txt` print only `pass` lines and exit 0 (PR 2 changed only its own 24 files against PR 1's branch)?
4. Do `node --test 'flightdeck/tests/*.test.mjs'` and `node --test 'lab/checks/*.test.mjs'` still exit 0 (PR 1 unchanged and unbroken)?
5. Does `node --test 'flightdeck/skills/board/tests/*.test.mjs'` exit 0 with all sixteen tests of section 5.8 present?
6. Does `git diff --name-only --no-renames origin/build-1-pr1-basic-a1...HEAD` list only paths in `lab/owned/pr2.txt`, and none in `lab/owned/pr1.txt`?
7. After `node flightdeck/skills/board/render.mjs --root . --no-gh` in the repository, does `git status --porcelain` print nothing (the page is ignored by `.flightdeck/.gitignore`)?
8. On PR 2's branch, does the rendered board show build-1 as a row with its latest attempts (including `pr-1/a1: PR 1: Basic flight crew`), every captured entry of `.flightdeck/workshops.md` under "Waiting to start" with a Copy button for `activate <name>`, "No questions are waiting on you", and build-1's q1 inside "Asked to ask later (1)"?
9. Does the page load nothing but Google Fonts, define its colour tokens on `:root` with a dark set, and keep everything inside the screen at 360px width?
10. Does the copy block match the paste-back format exactly (section 5.4, test 5)?
11. Is a pasted answers block filed correctly into `questions.md`, both in the session that ran `/flight:board` and in a fresh session (live checks 3 and 4)?
12. Does a Haiku agent given only the page text say correctly what is waiting on the owner and what work is waiting to start (live check 2)?
13. Does a malformed file show a warning row instead of crashing?
14. Does the prompt builder produce the exact prompt of section 5.4, and do its six team plans match PR 1's six team plan pages?
15. With PR 2's files removed in a scratch copy, do `claude plugin validate flightdeck` and `node --test 'flightdeck/tests/*.test.mjs'` still exit 0 (check 9 of section 7)?
16. Is each new skill description under 400 characters, and do neither SKILL.md nor any PR 2 file set `model:` or `effort:`?
17. Is every owner-facing text (page headings and explainers, button labels, skill descriptions, the page skill) in plain words, with no unexplained jargon?
18. Can the owner's five-minute try (section 9) be followed as written, and does the pull request description lead with it and its measured time?
19. Is nothing under `dev/` or `.claude/` changed, no PR 1 file edited, and no `board.html` committed?

## 7. Script check commands (run from the repository root on the PR branch; exact flags)

1. `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`: prints only pass lines and exits 0 (build-1's check; `auto` takes the union of `lab/owned/pr1.txt` and `lab/owned/pr2.txt`, both changed against `build-1`).
2. `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr2.txt`: prints only pass lines and exits 0. (Decided here: the plan's "hard-rule check with `lab/owned/pr2.txt`" against `origin/build-1` would fail on PR 1's files until PR 1 is merged, because this branch is cut from PR 1's branch; against PR 1's branch it checks exactly PR 2's own list.)
3. `claude plugin validate flightdeck`: exits 0 (build-1's check).
4. `node --test 'flightdeck/tests/*.test.mjs'`: exits 0 (build-1's check).
5. `node --test 'lab/checks/*.test.mjs'`: exits 0.
6. `node --test 'flightdeck/skills/board/tests/*.test.mjs'`: exits 0.
7. `node flightdeck/skills/board/render.mjs --root flightdeck/skills/board/tests/fixtures --no-gh --out <scratch>/pr-2/fixture-board.html`: exits 0 and prints `Board written: <scratch>/pr-2/fixture-board.html`.
8. `node flightdeck/skills/board/render.mjs --root . --no-gh` then `git status --porcelain`: the first exits 0 and prints `Board written: <repo>/.flightdeck/board.html`; the second prints nothing.
9. Removal check, in a throwaway worktree only (never committed): `git worktree add --detach <scratch>/pr-2/removal HEAD`, then in it `git rm -q -r flightdeck/skills/board flightdeck/skills/page .flightdeck/.gitignore lab/evals/pr2-board-shows-waiting lab/owned/pr2.txt && claude plugin validate flightdeck && node --test 'flightdeck/tests/*.test.mjs' && node --test 'lab/checks/*.test.mjs'`: exits 0; then `git worktree remove --force <scratch>/pr-2/removal`. (The hard-rule check is not run here: deleting `lab/owned/pr2.txt` makes the deletions unowned by design.)
10. Eval, reported and never blocking: `claude plugin eval flightdeck --eval-dir lab/evals --case 'pr2-*' --runs 3 --no-publish --trust-plugin --max-cost-usd 3 --allow-tools 'Bash(node *)' --json <scratch>/pr-2/eval.json`. If the command refuses `lab/evals` because it is outside the plugin, or plugin eval is unavailable, report that line as [stated].

## 8. Live checks (scratch clone, private HOME, plugin installed)

Setup, once, exactly as PR 1's live checks: `git clone /home/user/flightdeck <scratch>/pr-2/live/clone`, then in the clone `git switch build-1-pr2-board-a1`, `git init --bare <scratch>/pr-2/live/origin.git`, point the clone's `origin` at it (this is a separate clone, never the main checkout or a worktree of it), rewrite the clone's `.claude-plugin/marketplace.json` `name` to `DBHD-FlightDeck-try-pr2-a1` (do not commit it), and prefix every Claude Code command with `HOME=<scratch>/pr-2/live/home`: `claude plugin marketplace add "$PWD" --scope local` and `claude plugin install flight@DBHD-FlightDeck-try-pr2-a1 --scope local`. Every session runs from the clone's root as `HOME=<scratch>/pr-2/live/home claude -p --model haiku --settings <NESTED> --permission-mode acceptEdits --output-format json` plus the flags shown. Because the marketplace rename is an uncommitted edit, judge `git status --porcelain` results below ignoring `.claude-plugin/marketplace.json`.

1. The board skill runs: `--agent flight:pilot "/flight:board"`. Pass: `.flightdeck/board.html` exists, the answer names its path (or the `file://` link), and `git status --porcelain` shows nothing else.
2. Comprehension from the page text alone (plan 3.3): write the text with `node -e "const fs=require('fs');const h=fs.readFileSync('.flightdeck/board.html','utf8');fs.writeFileSync(process.argv[1],h.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'\"').replace(/&#39;/g,\"'\").replace(/&amp;/g,'&').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n'))" <scratch>/pr-2/live/board.txt`, then from the empty folder `<scratch>/pr-2/live/empty` (so no file can be read) run `HOME=<scratch>/pr-2/live/home claude -p --model haiku --settings <NESTED> --output-format json "Using only the page text on standard input, answer in plain words: what is waiting on the owner, and what work is waiting to start?" < <scratch>/pr-2/live/board.txt`. Pass: the answer names every captured entry that `node flightdeck/lib/workshops.mjs list` (run in the clone) shows as `captured` (on this branch: demo-attempt-age, live-checks-reach-the-hook, runner-report-file), says no question is waiting now or names build-1's q1 as held to ask later, and does not present q1 as waiting now.
3. Copy-and-paste round trip, same session (plan 3.3, the imposter's check made exact): run check 1's session again and keep its `session_id`. Build the block with the same function the page's button runs: `node --input-type=module -e "import {answerBlock} from './flightdeck/skills/board/render.mjs'; console.log(answerBlock('build-1', [{id: 'q1', option: 'a', note: 'keep it for now'}], ''))"`. Then `--agent flight:pilot --resume <session_id> "<the block>"`. Pass: in `.flightdeck/build-1/questions.md` the q1 block's line reads exactly `answer: a | note: keep it for now`; `git diff --numstat` shows only that file with 1 line added and 1 removed; the `ask-later:` line is unchanged; and `node flightdeck/skills/board/render.mjs --root . --no-gh --json` no longer lists build-1 q1 in `questions`. Then `git checkout -- .flightdeck/build-1/questions.md`.
4. Fresh session filing (the skill description must bring the board skill in when a block is pasted): with no earlier `/flight:board` in the session, run `"<the same block>"` (no `--agent`). Pass: the same file result as check 3. If it is not filed, report a medium finding (the owner pastes into whatever chat is open). Then `git checkout -- .flightdeck/build-1/questions.md`.
5. Plain chat untouched: `"Say hello in five words"`. Pass: no board is rendered (`.flightdeck/board.html` timestamp unchanged or absent) and no file changes.

A check that cannot run is reported [stated] with the reason. The imposter (plan section 5) follows the five-minute try in its own scratch clone with the renamed marketplace `DBHD-FlightDeck-try-pr2-a1`; it cannot open a browser or click, so it reads `.flightdeck/board.html` as the owner would see it, builds the copy block with `answerBlock` as in live check 3 (the same function the "Copy my answers" button runs), marks the click itself [stated], and reports minutes per step, confusion and jargon.

## 9. The owner's five-minute try

1. In the repository: `git fetch origin && git switch build-1-pr2-board-a1`. If you have not installed FlightDeck yet, run `claude plugin marketplace add "$PWD" --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local` (the plugin loads from this folder, so switching branch is enough once it is installed).
2. Start the pilot: `claude --agent flight:pilot --model opus --effort high` (or, in a session already open, type `/reload-plugins`).
3. Type `/flight:board`. It answers with the page's path, `.flightdeck/board.html`. Open that file in your browser (on a Mac: `open .flightdeck/board.html`; or double-click it in your file browser).
4. Look at the board: build-1 as a row with its latest attempts; under "Waiting to start", demo-attempt-age and the two entries the build captured, each with a Copy button for `activate <name>`; "No questions are waiting on you"; and a folded "Asked to ask later (1)" holding build-1's q1, the question you asked to be asked later.
5. Open the folded list, pick an answer for q1 (or write a note), press "Copy my answers" and paste the result into the pilot chat. The pilot writes your answer into `.flightdeck/build-1/questions.md` and says so in one line. (Answering q1 now is fine; if you would rather wait, skip this step and step 6.)
6. Type `/flight:board` again and reload the page: q1 has gone from the folded list.
7. Next, optional: the "Prompt builder" tab: pick `demo-attempt-age`, write a rough ask, press "Copy prompt" and read the message it would send the pilot.

## 10. Units

Two units (Decided here: the plan allows up to three; the renderer, its template, its theme and its tests must agree on many exact strings, so they stay in one unit, and a third unit would only split that). Both builders start with `git fetch origin && git switch -c <unit branch> origin/build-1-pr1-basic-a1`, write only their own files, commit by file name (never `git add -A`) with the attribution lines, and push only their unit branch. Each runs `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr2.txt` where the owned list exists (it is u1's; u2 runs it after integrate). Seat: `Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: how to build your unit inside your own files. You do not decide: scope, done, verification or truth; you do not accept your own findings and you send out no agents.`

### u1: the page kit guide, the ignore file, the eval case and the owned list

Files: `flightdeck/skills/page/SKILL.md`, `.flightdeck/.gitignore`, `lab/evals/pr2-board-shows-waiting/prompt.md`, `lab/evals/pr2-board-shows-waiting/graders/waiting.md`, `lab/evals/pr2-board-shows-waiting/graders/questions.md`, `lab/owned/pr2.txt`.

- `flightdeck/skills/page/SKILL.md`: frontmatter `name: page` and `description: "Page kit for any HTML page an agent makes for the owner (reports, results, review pages): FlightDeck's theme, light and dark, phone width, nothing loaded but Google Fonts, and one closing button that copies only what the owner changed plus a ready prompt."` (under 400 characters; no `model:`, `effort:` or `allowed-tools`; model-invocable). Body, plain words, one paragraph per line, sections: `# Page kit`; `## When to use` (any page an agent shows the owner; the board uses it too); `## Rules` (one self-contained `.html` file; copy the whole text of `${CLAUDE_SKILL_DIR}/theme.css` into a `<style>` in the head, never link to it; load nothing from the network except the Google Fonts the theme imports: no external scripts, images, frames or stylesheets; colours only through the theme's tokens; light and dark come from the theme, and `data-theme="light"` or `"dark"` on `<html>` forces one; phone width: the 16px side gutter and nothing wider than the screen; plain words, explain any term in a few words; pages go in the attempt folder of the work they belong to, never under `dev/` or `.claude/`); `## Skeleton` (a fenced minimal HTML skeleton: doctype, `lang="en"`, charset, viewport, `<title>` of two to four words, `<style>` with a comment where the theme text goes, `<main class="fd-page">` with a `.fd-header`, one `.fd-section` holding a `.fd-card`, and the closing `.fd-copy-panel`); `## Classes` (the full list from brief section 5.7, one line each with what it is for, and the token names); `## The closing copy panel` (every page that collects anything from the owner ends with one panel: a button `Copy my changes`, a status line, and a read-only textarea that shows the same text; the script keeps each field's starting value and copies only fields whose value changed, in this exact format: first line `Changes from <page title> (<page path>):`, then one line per changed field `- <field label>: <new value>`, then `Ready prompt: <one line telling the agent what to do with these changes>`; when nothing changed it copies nothing and says `Nothing changed yet.`; the copy tries `navigator.clipboard.writeText` and falls back to selecting the textarea); `## Check before handing it over` (search the page for `http://` and `https://`: only `fonts.googleapis.com` and `fonts.gstatic.com` may appear; open it at phone width; read it once in dark mode). Mention that the board (`/flight:board`) is a page made with this kit and that its "Copy my answers" button is its closing panel, in the paste-back format of the questions template.
- `.flightdeck/.gitignore`: exactly two lines: `# The flight board page is made fresh by /flight:board, so it is not kept in git.` and `board.html`.
- The eval case: exactly as brief section 5.9 (frontmatter keys only from the allowed list; graders `type: llm`, `weight: 1`; criteria as written there, in plain words).
- `lab/owned/pr2.txt`: exactly the block in brief section 3.
- Check before pushing: `node lab/checks/hard-rules.mjs --base origin/build-1-pr1-basic-a1 --owned lab/owned/pr2.txt` passes in your worktree, and the description is under 400 characters.

### u2: the theme, the board skill, the renderer, the page template, the tests and the fixtures

Files: `flightdeck/skills/page/theme.css`, `flightdeck/skills/board/SKILL.md`, `flightdeck/skills/board/render.mjs`, `flightdeck/skills/board/board.template.html`, `flightdeck/skills/board/tests/render.test.mjs`, and the nine fixtures `flightdeck/skills/board/tests/fixtures/.flightdeck/{workshops.md, cap-two.activate.md, ws-nested/workshop.md, ws-nested/questions.md, ws-nested/attempts/pr-1/a1/report.md, ws-nested/attempts/pr-1/a2/report.md, ws-nested/attempts/plan/a3/brief.md, ws-settled/workshop.md, ws-settled/questions.md}`.

- Read first: brief sections 5.1 to 5.8 and 5.10 (all exact), and PR 1's `flightdeck/lib/workshops.mjs` (the functions you import) and `flightdeck/templates/workshop/questions.md` (the formats). Do not edit either.
- `theme.css`: exactly the contract of 5.7 (about 200 lines).
- `render.mjs`: exactly the interface of 5.4 and the data of 5.5, rendering the page of 5.6 into the template (about 350 lines). Import from `../../lib/workshops.mjs`. Every per-workshop step in its own try/catch that turns a failure into a warning. `answerBlock` and `buildPrompt` are plain `function` declarations that use nothing outside their own bodies (no imports, no module constants, no helper functions defined elsewhere), because the page runs their `toString()` source.
- `board.template.html`: `<!doctype html>`, the head (charset, viewport, `<title>FlightDeck flight board</title>`, `<style>{{THEME_CSS}}</style>` plus a few board-only rules using the theme's tokens), `<main class="fd-page">` with `{{HEADER}}`, the tabs, the board panel (`{{WORKSHOPS}}`, `{{WAITING}}`, `{{QUESTIONS}}`, `{{WARNINGS}}`), the prompt builder panel (its static form markup lives in the template; the script fills the workshop and team plan selects from the JSON slot), the footer, `<script type="application/json" id="board-data">{{DATA_JSON}}</script>`, then one inline `<script>` holding `{{FUNCTIONS}}` and the page logic of 5.6 (tabs, `data-copy` buttons, `copyText`, Copy my answers, the prompt builder). No external script, no framework.
- `SKILL.md`: frontmatter `name: board`, `description: "Shows the flight board: one local page with every workshop, the work waiting to start and the questions waiting on the owner, with answer boxes, a Copy my answers button and a prompt builder. Also files a pasted 'FlightDeck answers for workshop' block into that workshop's questions.md."` (model-invocable on purpose, so a pasted block brings the filing rules in; Decided here) and `allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/render.mjs *), Read, Edit`; no `model:` or `effort:`. Body sections: `# Flight board`; `## Show the board`: run `node ${CLAUDE_SKILL_DIR}/render.mjs --root "${CLAUDE_PROJECT_DIR}"`, then tell the owner in at most three lines: the page's path and `file://` link, the summary line, and the pull request line if they are not shown; do not open a browser and do not read the page back into chat; the page is not kept in git; to refresh, run it again and reload. `## File answers pasted back`: when the owner pastes a block whose first line is `FlightDeck answers for workshop <name>: file these into .flightdeck/<name>/questions.md`: (1) open that file; if the file or a named question is missing, say so and file nothing for it; (2) for each line `q<n>: <value>` whose value is not `(unanswered)`, set that question's `answer:` line to `answer: <value>`, copied exactly as pasted, with the Edit tool, changing no other line (leave `ask-later:` as it is: an answered question is no longer open or held); (3) if that `answer:` line already holds text, do not overwrite it: show both and ask the owner; (4) skip `(unanswered)` lines: those questions stay open, never guess; (5) `Other notes:` other than `(none)` is the owner's own message: act on it like any message and do not write it into any file unless it asks; (6) render the board again and say in one line what was filed and where. `## Example board`: `node ${CLAUDE_SKILL_DIR}/render.mjs --root ${CLAUDE_SKILL_DIR}/tests/fixtures --no-gh --out <a file in the current folder, such as board.html>` renders the example project that ships with this skill (never write inside the plugin folder).
- `render.test.mjs`: the sixteen tests of 5.8 (about 300 lines).
- Fixtures: exactly the content of 5.10, nothing more.
- Check before pushing: `node --test 'flightdeck/skills/board/tests/*.test.mjs'` passes; `node --test 'flightdeck/tests/*.test.mjs'` still passes; `claude plugin validate flightdeck` exits 0; `node flightdeck/skills/board/render.mjs --root . --no-gh --out <scratch>/pr-2/u2-board.html` renders the real repository; no file contains a standalone `dw`.

## 11. Notes for the later stages

- Integrate: the units are disjoint, so a merge conflict means a unit wrote outside its list. After merging, run all of section 7. Write `<scratch>/pr-2/diff.patch` as `git diff origin/build-1-pr1-basic-a1...build-1-pr2-board-a1` so the reviewer and adversary see PR 2's own change, not PR 1's.
- The imposter and the live checks share the install chain; both use the renamed marketplace `DBHD-FlightDeck-try-pr2-a1` and a private `HOME`, and compare `claude plugin marketplace list` before and after.
- Capture lines for the Captain (work outside this brief, not done here):
  - `- pilot-files-answer-blocks: add one line to flightdeck/agents/pilot.md saying a pasted "FlightDeck answers for workshop" block is filed with the board skill's rules, so filing does not depend on the skill description alone (2026-10-11)`
  - `- owned-check-base-for-wave-1: the plan's "hard-rule check with lab/owned/pr<n>.txt" against origin/build-1 fails for every wave 1 and wave 2 pull request until PR 1 is merged, because they are cut from PR 1's branch; run it against origin/build-1-pr1-basic-a1 instead, or use --owned auto (2026-10-11)`
  - `- evals-below-plugin: claude plugin eval 2.1.296 says --eval-dir names a directory below the plugin, so lab/evals/ (PR 6's home for eval cases) may need the plan's fallback flightdeck/evals/ (2026-10-11)`
- The gathered sources folder `<scratch>/pr-2/sources/` was empty; nothing in this brief depends on it.
