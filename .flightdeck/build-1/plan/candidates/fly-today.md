# FlightDeck build-1 plan: "Fly it today"

Candidate plan from the "fly it today" architect, planning run attempt 1. Angle: the owner's first hour. Every pull request (PR) has a vivid way to try it in under five minutes, and FlightDeck shows, checks and finally builds part of itself. Everything in this plan is a decision made for the owner and can be overruled; nothing here is the owner's own statement unless quoted.

## 1. What the owner gets and how they try it straight away

The owner gets FlightDeck as a normal Claude Code plugin that loads in place from this repository: a pilot agent (Opus, high effort) who calls the owner "Commander", dispatches a small crew (Haiku scouts, Sonnet workers, a Sonnet reviewer, an Opus adversary and a Sonnet human imposter that plays the owner), six named launch shapes, a pre-flight card at the start of every session that says where things stand and runs FlightDeck's own checks, guards that stop pushes to main, model use above the Opus ceiling and agents writing the owner's truth files, then, in separate PRs, a "flight board" HTML page that shows every piece of work as an air-traffic flight strip with the questions waiting on the owner and a box to answer them, workshops started by a rough ask and a short interview, one-word launches ("go") that come back as a reviewed PR, a small `flight` command line, a lab that drills FlightDeck, manuals with a librarian, and an optional cockpit status band. To try it the moment PR 1 lands, the owner runs three commands in the repository (`claude plugin marketplace add "$PWD" --scope local`, `claude plugin install flight@DBHD-FlightDeck --scope local`, then `claude --agent flight:pilot --effort high`) and is flying: the pre-flight card shows the build-1 workshop itself, its PRs and its open questions, so the first thing FlightDeck shows the owner is its own build, and later PRs let the owner answer those questions on the board page and launch a real FlightDeck improvement that returns as a draft PR within the hour.

## 2. Decisions the owner left to the lead ("let em cook")

### (a) What "working" means for each part

- Choice: a part works when three things are true: (1) its one-command deterministic check passes in seconds with no model calls, (2) its "try it in five minutes" steps work exactly as written, rehearsed first by the human imposter, and (3) every review, adversary and imposter finding on it is either fixed or listed with a reason. For agent-shaped parts (agent definitions, skills, interview), "works" also means a fresh agent given only that part does the expected thing on a small fixture, checked by a smoke prompt with a known answer. Each part's own check is listed in section 3. Reason: the owner asked for "something that works great and fits the goal", not a test suite to fight; one fast check plus one human-sized try per part is the smallest proof that is still real.

### (b) Where everything goes

- Choice: one home per thing. Plugin components live at the repository root (the plugin root, since `marketplace.json` uses `source: "./"`). `.claude/` is left to dev-workspace and the project settings, touched only to fix the existing adversary's model line. Work and the owner's truth live in `.flightdeck/`. Reason: a plugin cannot ship `CLAUDE.md` or `.claude/rules/`, plugin agents drop `permissionMode`, `hooks`, `mcpServers` and `initialPrompt`, and every write under `.claude/` is a protected-path write that prompts in all modes except bypass (harness-core sections 3, 6, 8, and "Facts that constrain FlightDeck's layout"), so keeping FlightDeck out of `.claude/` keeps building and dogfooding unblocked.
- Plugin root (loaded by Claude Code as the `flight` plugin):
  - `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: manifest and local marketplace (`flight@DBHD-FlightDeck`).
  - `agents/*.md`: the crew, named `flight:<name>`.
  - `skills/<name>/SKILL.md` plus supporting files: every FlightDeck action, named `/flight:<name>`.
  - `hooks/hooks.json` plus `hooks/*.mjs`: pre-flight card and guards.
  - `output-styles/radio.md`: optional flight voice for plain sessions.
  - `workflows/*.js`: runnable launch shapes, named `/flight:<name>` (PR 4).
  - `bin/flight`: the local command line (PR 5).
  - `templates/workshop/`: the workshop skeleton copied into new workshops.
  - `manuals/`: operator, technical and maintenance manuals (PR 7).
  - `CLAUDE.md`: this repository's own project context for dogfooding; it is not loaded by the plugin in other projects (`claude plugin validate` warns about this; accepted).
- Not plugin components, but present in the repository: `.flightdeck/` (workshops and the owner's truth), `library/` (sources and best-practice pages), `lab/` (checks, drills, evals; never loaded as plugin content), `mods/cockpit/` (a second, separate plugin for the optional status band, PR 8), `dev/` (dev-workspace, untouched).
- `.claude/`: `settings.json` (dev-workspace on, unchanged), `rules/` (dev-workspace's, unchanged), `agents/adversary.md` (kept because the planning workflow `plan.js` calls `agentType: 'adversary'`; only its `model: fable` line changes to `model: opus` plus `effort: high`). The local plugin install writes `.claude/settings.local.json` itself when the owner runs the install command.
- `.flightdeck/` layout:
  - `.flightdeck/VISION.md`, `.flightdeck/build.txt`: the owner's, unchanged.
  - `.flightdeck/README.md`: one screen saying what lives here.
  - `.flightdeck/<workshop>/`: one folder per piece of work. `build-1/` is the first one.
  - `.flightdeck/<workshop>/workshop.md`: the card. The owner's own four fields from their idea note (title, work, done, verify), plus a one-word status line, a decisions list and an attempts list.
  - `.flightdeck/<workshop>/constraints.md`: the owner's truth for this work, one dated line each. Agents read it; only the main conversation writes it, and only the owner's words. The owner already knows this file from build-1, so the name stays.
  - `.flightdeck/<workshop>/questions.json`: questions waiting on the owner.
  - `.flightdeck/<workshop>/attempts/<k>/`: everything one attempt produced: `brief.md`, `report.md`, `findings/`, pages. The latest attempt is the highest number; there is no state file.
  - `.flightdeck/board.html`: generated by the board, ignored by git.

### (c) How a retry works

- Choice for the whole build: the owner adds dated lines to `.flightdeck/build-1/constraints.md`, then asks Claude to rerun the planning workflow (`plan.js` with `outDir` set to `.flightdeck/build-1/attempt-2` to keep both plans side by side, as `.flightdeck/build-1/README.md` already says) or to rerun the build workflow with `attempt: 2`. Every PR then gets a new attempt folder `.flightdeck/build-1/attempts/2/pr-<n>/` and a new branch `build-1-pr<n>-<slug>-a2`. Attempt 1's branches, PRs and folders stay untouched until the owner closes them. Reason: "setup carries over, run output does not" (flightcrew `endings.md`): the retry starts from the improved inputs, not from the failed output, and git keeps the old attempt.
- Choice for one PR: the owner adds lines starting with the PR number to the same file, for example `2026-10-12 PR 3: the interview asks at most three questions`, then says "retry PR 3". The build workflow runs with `prs: [3]` and the next attempt number: a fresh brief that includes the new lines and attempt 1's findings, a fresh branch `build-1-pr3-workshops-a2` cut from the same base as before, and a fresh PR. Reason: one file for all owner truth keeps it findable; numbered attempts and suffixed branch names keep attempts apart without any state file.
- Branch names never start with `build-1/` because the branch `build-1` already exists and git cannot hold both `build-1` and `build-1/...`. All names are generated by the workflow and unique per attempt (the multi-agent paper warns that agents left to name branches pick identical names).

### (d) How big the build is and what to cut first

- Choice: eight PRs, about 100 files and 7,000 lines in total, mostly markdown and small dependency-free node scripts. PR 1 (basic) is about 42 files and 2,600 lines; the seven advanced PRs are 4 to 15 files each. Reason: every VISION section gets a working piece, and each advanced piece can be rejected alone.
- Cut order if it is too big: first PR 8 (cockpit status band, the most experimental), then PR 5 (command line; the board still works through `/flight:board`), then PR 7's librarian agent (keep the manuals as plain files), then PR 6's evals (keep the sweep drill). Never cut PR 1, PR 2 (the page), PR 3 (workshops) or PR 4 (launches): they are the first hour.

### (e) How the owner starts a piece of work

- Choice: by talking, with no forms, IDs or approval flags. Three ways, all optional: (1) plain `claude` chat, exactly as before; (2) `claude --agent flight:pilot --effort high` (the README suggests the alias `fly`) and a rough ask in normal words; when the ask is bigger than one sitting, the pilot offers a workshop; (3) `/flight:workshop <rough ask>` directly, or the board's prompt builder, which produces that line to paste. A workshop starts with cheap scouts reading the terrain, then at most one bundle of five or fewer plain questions about the owner's own intent, then the card is written. The owner says "go" and the launch starts. Nothing starts on its own. Reason: the evidence in owner-truth section 5.1 supports exactly this ("ASK ME ABOUT MY IDEAS", fatigue with node-by-node questions, "nothing starts on its own").

### (f) Where questions waiting on the owner are held

- Choice: in `.flightdeck/<workshop>/questions.json`, one file per workshop, written by any agent that would otherwise guess (background and workflow agents cannot ask the owner directly). They are surfaced in three places: a one-line count on the pre-flight card at session start, the board page (PR 2) with an answer box per question and a "Copy my answers" button that produces a block to paste into chat, and the pilot asking them live in chat (bundles of at most five) when the owner is present. With PR 5, `flight serve` saves answers straight into the file. Reason: questions must survive sessions and retries and must never be "hundreds of lines up" in chat; a file plus a page with paste-back is the shape the owner already used (owner-truth 5.2, the flightcrew round page).
- Format (owned by PR 1's template): `{"questions":[{"id":"q1","asked":"2026-10-11","by":"flight:pilot","question":"...","why":"...","options":["..."],"recommended":"...","answer":null,"answered":null}]}`. The short id exists only so a pasted answer finds its question; the page does not show it.

### (g) Replace dev-workspace or sit beside it

- Choice: sit beside it. FlightDeck never touches `dev/` or `.claude/rules/`, never calls `dw`, and works when dev-workspace is not installed (as in the build sandbox). Workshops in `.flightdeck/` are the next-era counterpart of `dev/workspace/` folders: per piece of work rather than per branch, built for many agents. Whether FlightDeck later takes over dev-workspace's commands is left to the owner; no retirement plan is written. Reason: "dev can stay" (interview decision 12), and dev-workspace's merge protection restores `.claude/rules/`, so FlightDeck placing anything there would collide.

## 3. Parts

Each part names what it is, its files, the Claude Code features it uses (all shown to exist in harness-core or harness-multi), its "working" check, and its PR.

### 3.1 Accelerate Claude Code: the flight plugin core

- What: the plugin itself, a short project `CLAUDE.md`, and a pre-flight card printed at session start.
- Files: `.claude-plugin/plugin.json` (version 0.2.0, description), `.claude-plugin/marketplace.json` (add the missing `description`), `CLAUDE.md`, `README.md` (quick start), `hooks/hooks.json`, `hooks/preflight.mjs`, `skills/preflight/SKILL.md`.
- Features: plugin manifest and local marketplace install (verified to load in place and stay writable), `SessionStart` hook in exec form with `${CLAUDE_PLUGIN_ROOT}` (stdout reaches context, verified), matcher `startup|resume|clear` so a compaction does not rerun it, project `CLAUDE.md`, a skill with `${CLAUDE_PLUGIN_ROOT}` substitution.
- Pre-flight card (at most 10 lines, under 800 characters): FlightDeck version, branch, each open workshop with status and the number of questions waiting, one line on how to start. Outside a project with `.flightdeck/`, one line only. `/flight:preflight` runs the full checklist: `claude plugin validate`, FlightDeck's static check, the hook tests, whether `worktree.baseRef` is set for launches, whether `gh` is signed in, and reports "systems green" or what is not.
- Working: `claude plugin validate .` exits 0; `node lab/checks/static.mjs` exits 0; `claude -p --plugin-dir . --agent flight:pilot "In one line, which workshops are open?"` names build-1 (a read-only smoke, which is the one safe use of `--plugin-dir`).
- PR: 1.

### 3.2 Roleplay: ranks, voice and names

- What: the owner's rank chain (commander, pilot, officers, crew) carried cheaply in agent descriptions, the pilot's greeting, page headings and an optional output style. No vocative rules, callsigns, records or approval flags.
- Ranks: Commander is the owner. Pilot is `flight:pilot`, the single lead (Opus, high effort) who dispatches and does not do the work. Officers are background sessions started with `claude --bg --agent flight:pilot --name officer-<topic> "<brief>"`, watched in `claude agents`. Crew are `flight:scout` (Haiku), `flight:worker` (Sonnet), `flight:reviewer` (Sonnet), `flight:adversary` (Opus, the "aggressor" that plays the enemy, as aggressor squadrons do in training), `flight:imposter` (Sonnet, plays the Commander), and in PR 7 `flight:librarian` (Sonnet).
- Files: `agents/pilot.md`, `agents/scout.md`, `agents/worker.md`, `agents/reviewer.md`, `agents/adversary.md`, `agents/imposter.md`, `output-styles/radio.md` (status first, short call-and-response, `keep-coding-instructions: true`, not forced on).
- Features: plugin agents with `model`, `effort`, `tools`, `color`, `maxTurns` (all supported for plugin agents), `claude --agent`, plugin output styles chosen with `/output-style`.
- Working: `claude -p --plugin-dir . --agent flight:pilot "Who are you and who am I?"` answers pilot and Commander; the static check confirms every agent description opens with its rank and that no agent body contains vocative or approval rules; plain `claude` is unaffected.
- PR: 1 (theme carried into pages in PR 2).

### 3.3 Themed HTML page suite: the flight board, prompt builder and page kit

- What: (1) the flight board: a single local HTML file showing each workshop as a flight strip (title, status, current attempt, latest result, open PRs) and every waiting question with its options, the recommended one marked, a note box, and a "Copy my answers" button; (2) a prompt builder tab: pick a launch shape, write the rough ask, done and verify, copy a ready prompt; (3) a page kit so any agent-made page (launch reports, lab results, review pages) shares the theme and always ends with an export button.
- Files (PR 2): `skills/board/SKILL.md`, `skills/board/render.mjs` (reads `.flightdeck/*/workshop.md` and `questions.json`, writes `.flightdeck/board.html` with the data embedded, so no server is needed), `skills/board/board.template.html`, `skills/board/tests/render.test.mjs` with fixtures, `skills/page/SKILL.md` (how to make a FlightDeck page: plain words, colour tokens with dark mode, phone width, one export button that copies only what changed plus a ready prompt), `skills/page/theme.css`, `.flightdeck/.gitignore` (ignores `board.html`).
- Paste-back block (exact first line, so the main conversation knows what to do): `FlightDeck answers for workshop <name>: file these into .flightdeck/<name>/questions.json`, then one line per question `q1: <choice> | note: <text>` or `q1: (unanswered)`, then `Other notes: <text>`. Unanswered questions stay open; they are never guessed.
- Features: skills with supporting files and `${CLAUDE_SKILL_DIR}`, Bash to run node, local files opened in the browser. No server in this PR.
- Working: `node --test skills/board/tests/` passes (every fixture workshop appears as a strip, every open question appears, the copy block matches the format exactly, unparseable files show as a warning strip rather than crashing); a page lint in the same test confirms no external resources except Google Fonts and colour tokens on `:root` with a dark set; a Haiku agent given only the rendered page text answers "what is waiting on the owner?" correctly.
- PR: 2 (live answering without paste in PR 5).

### 3.4 Workshops: start by talking, retry, promote

- What: the workshop skeleton and the build-1 workshop card (PR 1), then the actions: `/flight:workshop` (create a workshop from a rough ask: scouts first, the obvious written straight in, at most one bundle of five questions, card written, truth lines proposed for the owner to accept), `/flight:retry` (new attempt folder, setup carried over, one named change, previous findings attached), `/flight:promote` (move a decision from a workshop into `CLAUDE.md`, after the adversary checks it for contradiction with existing content, shown to the owner as a diff before writing).
- Files: PR 1: `templates/workshop/workshop.md`, `templates/workshop/constraints.md` (frontmatter `read: "agents"`, `write: "human"`, the precedent from build-1), `templates/workshop/questions.json`, `.flightdeck/README.md`, `.flightdeck/build-1/workshop.md`, `.flightdeck/build-1/questions.json`, `hooks/truth-guard.mjs`. PR 3: `skills/workshop/SKILL.md`, `skills/workshop/interview.md` (bundle rules: at most five questions, each with why, options and a recommendation where there are grounds; never ask the owner to approve agent-written text; never ask what a scout can find; a skipped question stays open), `skills/retry/SKILL.md`, `skills/promote/SKILL.md`, `skills/workshop/tests/scaffold.test.mjs`.
- Truth guard: a `PreToolUse` hook on `Edit|Write` that denies the write when the target is `.flightdeck/*/constraints.md`, `.flightdeck/VISION.md` or `.flightdeck/build.txt` and the call comes from a subagent or workflow agent (hook input carries `agent_id` there). The main conversation, where the owner is present, may write the owner's own words. It is a safety net (a Bash redirect can still get past it), and the static check plus review are the backstops.
- Interview without the owner present: subagents have no question tool, and headless runs remove it, so the workshop skill has two modes: live (the main conversation asks with the question tool) and file (the bundle goes into `questions.json`, the run stops, and resumes when answers are pasted). The file mode is what the human imposter tests.
- Features: skills, `AskUserQuestion` in the main conversation, Haiku subagents for scouting, `PreToolUse` hook with exit-code and JSON deny, project `CLAUDE.md` as the promotion target.
- Working: `node --test skills/workshop/tests/` passes (scaffold creates the four items; a second attempt folder is numbered from the folder listing); `node --test hooks/tests/` covers the truth guard (denies a subagent write, allows the main conversation, allows other paths); interview drill (PR 6, or the PR 3 verification below): the imposter answers a bundle as the owner and mechanical checks pass (at most five questions, each has a why, no approval questions, no repeated question, skipped answers stay open, the card's four fields are filled, `constraints.md` untouched by agents).
- PR: 1 (skeleton, card, guard) and 3 (actions).

### 3.5 Launches: shapes, crews and "go"

- What: PR 1 ships the launch shapes as content: six named shapes, each a short recipe (phases, crew and models, what decides done, when to use it, cost class), the entry-point text the pilot sends each crew member, and a "ways to fly" page (subagents from chat, a dynamic workflow, an agent team with a live adversary, officers in background sessions). PR 4 ships `/flight:launch`: from a workshop it answers "what will tell us the work is right?", picks the smallest shape that fits and says why, writes a launch card (shape, crew, models, agent count, rough token estimate, branch name) into `attempts/<k>/brief.md`, shows a five-line summary, waits for "go", runs, and delivers a PR with a report.
- The six shapes (a proposed list for the owner to correct; the owner said "about 6 shapes" but never listed them, per mine-early section 1): Recon (fan out scouts on separate angles, synthesise, check claims), Build and check (worker in a worktree, then reviewer, adversary and imposter in fresh contexts, fix once, PR; the default), Spec first (the earlier flightcrew line: define done as checks first, then build to them, then review), Many hands (one worker per item, each in its own worktree, an adversarial review per item, then merge), Root cause (hypotheses from separate evidence, refuters, loop until one survives), Decide (generate options, filter by a rubric, compare in pairs, the owner picks on a page).
- Files: PR 1: `skills/shapes/SKILL.md`, `skills/shapes/shapes/{recon,build-and-check,spec-first,many-hands,root-cause,decide}.md`, `skills/shapes/entry-points/{scout,worker,reviewer,adversary-live,adversary-cold,imposter}.md`, `skills/shapes/ways-to-fly.md`. PR 4: `skills/launch/SKILL.md`, `workflows/build-and-check.js`, `workflows/recon.js`, `skills/launch/tests/workflows.test.mjs`, `.flightdeck/demo-preflight-version/{workshop.md,constraints.md,questions.json}` (a real, tiny FlightDeck improvement used as the demo launch).
- Features: dynamic workflows shipped in the plugin's `workflows/` folder and run as `/flight:<meta.name>` with `args`; per-agent `model`, `effort` and `isolation: 'worktree'`; validated JSON returns with `schema`; agent teams and background sessions described as recipes only (teams are experimental and interactive-only, so they are never a scripted launch target); `gh pr create`.
- Worktrees: launch builders create their branch from an explicit base as their first command (`git checkout -b <branch> <base>`), so a launch does not depend on `worktree.baseRef`; `/flight:preflight` still suggests `worktree.baseRef: "head"` for the owner's own `--worktree` sessions.
- Working: `node --test skills/launch/tests/` passes (each workflow file starts with a literal `export const meta`, compiles when wrapped with stub `agent`/`parallel`/`pipeline`/`phase`/`log`, never uses `Date.now`, `Math.random`, `fable`, `xhigh`, `max` or `ultracode`); a dry-run launch (`args.dryRun: true`) on the demo workshop writes `brief.md`, `report.md` and `pr.md` into a scratch attempt without opening a PR; the owner's try opens a real draft PR.
- PR: 1 (shapes, entry points) and 4 (launch).

### 3.6 Local CLI: `flight`

- What: a small dependency-free node command on the Bash tool's PATH while the plugin is enabled (and runnable as `node bin/flight` from the owner's terminal): `flight status [--json]` (workshops, attempts, questions waiting), `flight board` (renders the board using PR 2's renderer and opens it), `flight serve` (serves the board on 127.0.0.1 only, with a per-session token in the URL, and writes submitted answers straight into `questions.json`; it serves only files under `.flightdeck/` and runs no commands from page input), `flight new <name>` (scaffold a workshop without the interview), `flight commit [-m msg]` (stage and commit `.flightdeck/` only).
- Files: `bin/flight`, `bin/lib/server.mjs`, `bin/tests/flight.test.mjs`, `skills/cli/SKILL.md` (tells agents when to use it).
- Features: plugin `bin/` executables added to the Bash tool's PATH.
- Working: `node --test bin/tests/` passes in a temporary git repository: status counts match fixtures; `commit` stages nothing outside `.flightdeck/`; `serve` binds 127.0.0.1, refuses requests without the token, refuses paths outside `.flightdeck/`, and a token-bearing answer post updates the right question.
- PR: 5. Depends on PR 2 (renderer).

### 3.7 dev-workspace: beside, not replaced

- What: no code. A short `CLAUDE.md` section saying dev-workspace may be present, FlightDeck does not need it, and agents leave `dev/` and `.claude/rules/` alone.
- Files: `CLAUDE.md` (PR 1).
- Features: none beyond project memory.
- Working: the static check confirms no shipped file calls `dev-workspace`, `dw` or writes under `dev/`; the PR 1 smoke runs in the build sandbox where dev-workspace is not installed.
- PR: 1.

### 3.8 Cheap tokens, smart agents

- What: each agent names its own model and effort in its file, with Opus only where judgement is the job: pilot and adversary on `opus` with `effort: high` set explicitly (Opus 5.5 defaults to medium), scout on `haiku`, worker, reviewer, imposter and librarian on `sonnet`. A ceiling guard and a static scan keep anything above Opus high out. Launch cards state the crew, models and a rough token estimate before "go".
- Files: `agents/*.md` (PR 1), `hooks/ceiling-guard.mjs` (PR 1), `lab/checks/static.mjs` (PR 1), launch card format in `skills/launch/SKILL.md` (PR 4).
- Ceiling guard: a `PreToolUse` hook on `Agent|Workflow` that denies a call whose input names model `fable` or `best`, or whose workflow script (inline or at `scriptPath`) contains `fable`, `effort: 'xhigh'` or `effort: 'max'`, with the reason "Owner's ceiling: Opus at high effort". The session's own effort and `/effort ultracode` cannot be set by a plugin, so `CLAUDE.md` and the quick start say to stay at `high`.
- Features: agent frontmatter `model` and `effort`, `PreToolUse` hooks, workflow per-agent `model` and `effort`.
- Working: hook tests (denies fable, allows sonnet, denies a workflow script with `xhigh`); static scan finds no `fable`, `best`, `xhigh`, `max` effort or `ultracode` in `agents/`, `skills/`, `hooks/`, `workflows/`, `output-styles/`, `templates/`; every `opus` agent has `effort: high`.
- PR: 1 (plus launch cards in PR 4).

### 3.9 Built with quality

- What: every part sits in its own folder with its own test; PRs own disjoint files so any subset merges cleanly; a static check catches the mistakes `claude plugin validate` does not (plugin agents carrying `permissionMode`, `hooks`, `mcpServers` or `initialPrompt`, which are silently dropped; machine-specific paths; over-long skill descriptions; model ceiling).
- Files: `lab/checks/static.mjs`, `lab/README.md` (PR 1); `hooks/tests/hooks.test.mjs` (PR 1); one `tests/` folder per later part; `lab/sweep.mjs` (PR 6).
- Features: `claude plugin validate`, node's built-in test runner, hooks.
- Working: `node lab/checks/static.mjs` exits 0 on every PR; the sweep drill (PR 6) breaks each hook and agent file in a temporary copy and confirms a check notices every break.
- PR: 1 and 6.

### 3.10 Human energy: truth devices

- What: the owner's statements become durable files agents use without asking again: `constraints.md` per workshop (owner-only, guarded), question bundles of five or fewer in plain words, the imposter's persona built from the owner's dated quotes, a rubric guide ("yes means pass; an honest no is a finding"), decisions promoted into `CLAUDE.md`, and pages instead of walls of text.
- Files: `templates/workshop/constraints.md`, `hooks/truth-guard.mjs`, `agents/imposter.md` (PR 1); `skills/workshop/interview.md`, `skills/promote/SKILL.md` (PR 3); `library/rubric-guide.md`, `library/adversarial-mandate.md` (PR 7).
- Imposter persona: generic in the plugin (it reads the project's `CLAUDE.md` and `.flightdeck/*/constraints.md`); in this repository it also reads `dev/workspace/research/repo-reset/user-intent.md` and `.flightdeck/build-1/research/owner-truth.md`. It answers bundles in the paste-back format, follows "try it" steps literally, and reacts in the owner's voice.
- Working: covered by the truth guard tests, the interview drill, and the imposter's verdicts on every PR (section 5).
- PR: 1, 3, 7.

### 3.11 Keep it simple

- What: plain chat stays plain. The plugin sets no default agent (its `settings.json` is not used), adds one short pre-flight card, and everything else happens only when asked.
- Files: none extra; enforced by the static check and the hook's line limit.
- Working: `claude -p --plugin-dir . "Say hello in five words"` answers normally; the pre-flight card test confirms at most 10 lines and 800 characters; the static check confirms the combined skill descriptions stay short (each under 400 characters, all under 4,000).
- PR: 1.

### 3.12 Manuals and libraries

- What: three manual shelves (operator: how to fly FlightDeck, starting with the first-hour guide; technical: how the parts work, plus a harness-facts register in the form claim, verdict, source, date, seeded from the research reports; maintenance: how to change and test an agent, hook, skill or workflow), library pages carried over from earlier branches after edits (adversarial mandate, rubric guide, terms in plain words, team design, retry doctrine), a librarian agent that answers from the corpus with citations and reviews work against it, and `/flight:manual` which drafts a manual next to the work when a workshop lands and files it on the shelf.
- Files: `manuals/operator/first-hour.md`, `manuals/operator/workshops-and-launches.md`, `manuals/technical/parts.md`, `manuals/technical/harness-facts.md`, `manuals/maintenance/changing-a-part.md`, `manuals/README.md`, `library/adversarial-mandate.md`, `library/rubric-guide.md`, `library/terms.md`, `library/team-design.md`, `library/retry.md`, `agents/librarian.md`, `skills/manual/SKILL.md`, `lab/checks/manuals.mjs`.
- Rules: one topic per manual, current form only, about 100 lines (150 maximum), source and date in frontmatter, one paragraph per line.
- Features: plugin agents and skills; `${CLAUDE_PLUGIN_ROOT}` so the librarian finds the shelves in any project.
- Working: `node lab/checks/manuals.mjs` passes (length, frontmatter, no hard wrapping, every link resolves); librarian smoke: five questions with known answers, each answer cites the right file (regex grader).
- PR: 7.

### 3.13 Laboratory

- What: a place to test and improve FlightDeck that never ships as plugin content: the static check (PR 1), the sweep drill (break one part at a time, a check must notice), the interview drill (the workshop interviewer against the human imposter, scored mechanically), the team drill (Recon with and without a cold adversary on a fixture, recording what each found and cost), skill-trigger evals (should-fire and should-not-fire cases for `/flight:workshop`, `/flight:board`, `/flight:launch`) run with `claude plugin eval` when the owner's account has it and through a fallback workflow otherwise, and a results page linking every transcript. Hill-climbing follows the sources: one change per round, train and test split, revert when only train rises, report "within noise" honestly.
- Files: `lab/sweep.mjs`, `lab/drills/README.md`, `lab/drills/interview-drill.js`, `lab/drills/team-drill.js`, `lab/evals/<case>/` (about 8 cases), `lab/evals/run-fallback.js`, `lab/fixtures/tiny-project/` (adapted from the flightcrew `export-html` toy), `lab/results/.gitkeep`, `lab/tests/sweep.test.mjs`.
- Features: dynamic workflows run by path, Haiku and Sonnet agents, `claude plugin eval` (early-access gate noted in harness-core section 10; checked first), the page kit from PR 2 if present.
- Working: `node lab/sweep.mjs` reports every break caught and exits 0; one interview drill run writes `lab/results/<run>/` with a page and transcript links; eval or fallback produces a with/without score per case.
- PR: 6 (static check in PR 1).

### 3.14 Extra under "Accelerate Claude Code": the cockpit band

- What: an optional Claude Code mod, shipped as a second plugin in the same marketplace (`flight-cockpit`, source `./mods/cockpit`), that draws one line above the prompt: workshop in focus, questions waiting, context fullness. Kept separate so the main plugin never depends on the mod API, which can change between releases.
- Files: `mods/cockpit/.claude-plugin/plugin.json`, `mods/cockpit/hooks/hooks.json` (declares the module), `mods/cockpit/register.js`, `mods/cockpit/types/index.d.ts`, `mods/cockpit/tests/band.test.ts`, plus one new entry in `.claude-plugin/marketplace.json`.
- Features: mods (Claude Code 2.1.287 or later), `$.state`, `AbovePrompt`, `claude plugin validate`, `claude plugin test`.
- Working: `claude plugin validate mods/cockpit` and `claude plugin test mods/cockpit` pass.
- PR: 8.

## 4. Pull requests, in order

### The owner's first hour, minute by minute

- 0:00 Merge PR 1 (or check out its branch), run the two install commands, start `claude --agent flight:pilot --effort high`.
- 0:01 The pre-flight card: FlightDeck 0.2.0, branch, workshop build-1 with its PRs and the questions it is waiting on. `/flight:preflight` runs FlightDeck's own checks: FlightDeck testing itself in the first minute.
- 0:05 "Pilot, run a recon: what do the sources in library/source say about evals, five lines." Three Haiku scouts go out, the pilot synthesises with citations.
- 0:10 `/flight:adversary README.md against .flightdeck/VISION.md`: ranked findings from the Opus aggressor. Ask the pilot to push to main and watch the guard refuse.
- 0:15 Check out PR 2, `/flight:board`: the browser shows build-1 as flight strips. Answer the two waiting questions, copy, paste, the pilot files them, re-render, they show answered.
- 0:25 Check out PR 3, `/flight:workshop make the pre-flight card show the plugin version`: scouts, at most five questions, a new workshop folder appears on the board.
- 0:35 Check out PR 4, `/flight:launch demo-preflight-version`: the launch card shows shape Build and check, one Sonnet builder, Sonnet reviewer, Opus adversary, Sonnet imposter, roughly 400,000 tokens. Say "go", watch `/workflows`; a draft PR improving FlightDeck's own pre-flight card arrives in about 10 to 15 minutes. FlightDeck has built part of itself.
- 0:50 PR 6: `node lab/sweep.mjs` reports every deliberate break caught in seconds, with no tokens. PR 5: `node bin/flight serve` and answer a question on the live page with no pasting.

Branching for all PRs: PR 1 targets `build-1`. PRs 2 to 8 are cut from PR 1's branch and opened against PR 1's branch so each diff shows only its own files; after the owner merges PR 1, the pilot retargets them on request (`gh pr edit <n> --base build-1`, one command each). No PR edits a file another PR owns, so any subset can be merged in any order after PR 1 (PR 5 needs PR 2).

### PR 1: Basic flight crew (Claude Code content and core locations)

- Purpose: everything a Claude Code user would recognise as content, and nothing that runs as a feature beyond guards and the pre-flight card: the crew as agent definitions, the hooks, `CLAUDE.md`, the skills that are content (pre-flight checklist, adversary, launch shapes with entry points), the output style, the workshop skeleton with build-1 as the first workshop, and the static check. After it lands the owner can fly with the pilot and crew in plain chat, run recons and adversary attacks, and see the build's own state at every session start.
- Files (about 42): `CLAUDE.md`, `README.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `agents/{pilot,scout,worker,reviewer,adversary,imposter}.md`, `skills/preflight/SKILL.md`, `skills/adversary/SKILL.md`, `skills/shapes/SKILL.md`, `skills/shapes/shapes/{recon,build-and-check,spec-first,many-hands,root-cause,decide}.md`, `skills/shapes/entry-points/{scout,worker,reviewer,adversary-live,adversary-cold,imposter}.md`, `skills/shapes/ways-to-fly.md`, `hooks/hooks.json`, `hooks/{preflight,truth-guard,git-guard,ceiling-guard}.mjs`, `hooks/tests/hooks.test.mjs`, `output-styles/radio.md`, `templates/workshop/{workshop.md,constraints.md,questions.json}`, `.flightdeck/README.md`, `.flightdeck/build-1/workshop.md`, `.flightdeck/build-1/questions.json`, `lab/README.md`, `lab/checks/static.mjs`, and the one-line model fix in `.claude/agents/adversary.md`.
- Sources adapted (read by Haiku sweeps in the build): pilot from `origin/cockpit:flightdeck/.cockpit-archive/team/officers/pilot/pilot.md` (dispatch-not-do, look to decide, evidence before acting; session bookkeeping removed); worker from `origin/cockpit:.claude/agents/worker.md`; reviewer from `origin/cockpit:.claude/agents/reviewer.md` and `origin/flightcrew-buildout:flightdeck/flightcrew/crew/critic.md`; scout from `origin/flightcrew-buildout:flightdeck/flightcrew/crew/explorer.md`; adversary from `origin/cockpit:library/review/adversarial-mandate.md` plus the live and cold entry points in `origin/cockpit:flightdeck/.cockpit-archive/team/crew/cockpit/adversary.md`; shapes from `origin/cockpit:library/source/agent-teams/routing.md` and the dynamic-workflows post; the git guard idea from the skills post's `/careful`. Every `model: fable` becomes `opus` with `effort: high` or `sonnet` or `haiku`.
- Git guard: `PreToolUse` on `Bash` with `if: "Bash(git push*)"`, denying a push whose target is `main` or `master` or that uses `--force` or `-f`, with a reason that says which owner rule it protects.
- Depends on: nothing.
- Try in under five minutes: run `claude plugin marketplace add "$PWD" --scope local`, then `claude plugin install flight@DBHD-FlightDeck --scope local`, then `claude --agent flight:pilot --effort high`. Read the pre-flight card. Type "Pilot, recon: what is in library/source, five lines." Type `/flight:adversary README.md against .flightdeck/VISION.md`. Type "push this branch to main" and watch the guard refuse. Open a second terminal and run plain `claude` to see that ordinary chat is unchanged.
- Checks: `claude plugin validate .` exits 0 (the root `CLAUDE.md` warning is expected); `node lab/checks/static.mjs` exits 0; `node --test hooks/tests/` exits 0; smoke prompts with `claude -p --plugin-dir .` (pilot names build-1 and calls the owner Commander; `/flight:preflight` prints its checklist); a live guard check in a scratch worktree (a workflow agent told to write `.flightdeck/build-1/constraints.md` is refused); review, adversary and imposter as in section 5.
- Size: about 42 files, about 2,600 lines (most of it agent and shape prose).
- Retry: add `PR 1:` lines to `.flightdeck/build-1/constraints.md`, say "retry PR 1". New branch `build-1-pr1-basic-a2`. PRs 2 to 8 are then re-cut onto the new PR 1 by a rebase-only build run (`prs: [2,...,8]`, `rebaseOnly: true`), because their files do not overlap PR 1's.

### PR 2: Flight board (themed HTML page, answers back, prompt builder)

- Purpose: the owner sees all work and everything waiting on them on one page and answers it in under two minutes; a prompt builder turns a rough idea into a prompt; agents get a page kit so every page they make looks and behaves the same.
- Files (about 8): `skills/board/SKILL.md`, `skills/board/render.mjs`, `skills/board/board.template.html`, `skills/board/tests/render.test.mjs`, `skills/board/tests/fixtures/` (two fixture workshops), `skills/page/SKILL.md`, `skills/page/theme.css`, `.flightdeck/.gitignore`.
- Depends on: PR 1 (workshop and questions formats, build-1 card).
- Try in under five minutes: check out the branch, restart Claude (or `/reload-plugins`), type `/flight:board`. The page opens with build-1's strip and its questions. Pick answers, press "Copy my answers", paste into chat. Run `/flight:board` again and see them answered. Switch to the prompt builder tab, fill four boxes, copy, paste.
- Checks: `node --test skills/board/tests/`; page lint inside that test; Haiku comprehension check on the rendered page; imposter rehearses the copy and paste loop with a fixture block into `claude -p --plugin-dir .` in a scratch worktree and confirms `questions.json` changed; review and adversary.
- Size: about 8 files, about 750 lines.
- Retry: `PR 2:` lines in constraints, "retry PR 2", new branch `build-1-pr2-board-a2`.

### PR 3: Workshops (start work by talking, retry, promote)

- Purpose: the owner starts work with a rough ask and a short interview about their own intent, gets a workshop folder with a clear card, can retry an attempt after adding truth, and can promote a decision into `CLAUDE.md`.
- Files (about 7): `skills/workshop/SKILL.md`, `skills/workshop/interview.md`, `skills/workshop/tests/scaffold.test.mjs`, `skills/retry/SKILL.md`, `skills/promote/SKILL.md`, `skills/workshop/tests/fixtures/bundle-answer.txt`, `skills/workshop/examples/card.md`.
- Depends on: PR 1 (template, guard). Uses PR 2's board if present but does not need it.
- Try in under five minutes: `/flight:workshop make the pre-flight card show the plugin version`. Answer at most five questions. Open `.flightdeck/<new name>/workshop.md`. Add a line to its `constraints.md` and run `/flight:retry <name>`: attempt 2 appears with the change named.
- Checks: `node --test skills/workshop/tests/`; interview drill in the verification stage (imposter answers as the owner in file mode; mechanical checks listed in 3.4); promote dry run (the adversary flags a planted contradiction with `CLAUDE.md`); review and adversary.
- Size: about 7 files, about 600 lines.
- Retry: `PR 3:` lines, "retry PR 3", branch `build-1-pr3-workshops-a2`.

### PR 4: Launches ("go" returns a reviewed PR)

- Purpose: from a workshop, one command picks a shape, shows the crew and cost, and on "go" runs it and returns a PR with a report marked by provenance ([checked] a script ran, [reviewed] a judge read it, [stated] an agent said so). Ships two runnable shapes; the other four are written by the pilot from their recipes when chosen.
- Files (about 8): `skills/launch/SKILL.md`, `workflows/build-and-check.js`, `workflows/recon.js`, `skills/launch/tests/workflows.test.mjs`, `skills/launch/report-template.md`, `.flightdeck/demo-preflight-version/{workshop.md,constraints.md,questions.json}`.
- `build-and-check.js` stages: brief (reads the workshop card, constraints and answered questions), build (Sonnet worker, `isolation: 'worktree'`, creates its branch from the given base), check (Haiku runs the card's verify commands), review (Sonnet) plus adversary (Opus high) plus imposter (Sonnet) in parallel with no shared notes, triage (Opus high, accept or reject each finding with a reason), fix once (Sonnet, same worktree), recheck (Haiku), report and PR (Sonnet, `gh pr create --draft --base <base>`, or `pr.md` only when `dryRun`). Arguments: `workshop`, `attempt`, `base`, `dryRun`.
- Depends on: PR 1 (crew, shapes). Works with PR 3 workshops but runs on any folder with a `workshop.md`.
- Try in under five minutes: `/flight:launch demo-preflight-version`, read the five-line launch card, say "go", watch `/workflows`. The draft PR arrives in about 10 to 15 minutes; the kick-off itself takes under five.
- Checks: `node --test skills/launch/tests/`; a dry-run launch of the demo workshop in the verification stage; review, adversary, imposter.
- Size: about 8 files, about 850 lines.
- Retry: `PR 4:` lines, "retry PR 4", branch `build-1-pr4-launch-a2`.

### PR 5: Local CLI `flight`

- Purpose: agents and the owner get a handful of chores in one command each, including the live board server that takes answers without copy and paste, and bulk commit of `.flightdeck/`.
- Files (4): `bin/flight`, `bin/lib/server.mjs`, `bin/tests/flight.test.mjs`, `skills/cli/SKILL.md`.
- Depends on: PR 1, PR 2 (renderer).
- Try in under five minutes: `node bin/flight status`, then `node bin/flight serve`, open the printed localhost link, answer a question, and see `questions.json` change; `node bin/flight commit -m "board answers"`.
- Checks: `node --test bin/tests/`; review, adversary (asked specifically about the server's exposure: localhost only, token, path limits, no command execution), imposter.
- Size: 4 files, about 500 lines.
- Retry: `PR 5:` lines, "retry PR 5", branch `build-1-pr5-cli-a2`.

### PR 6: Laboratory (drills and evals)

- Purpose: FlightDeck tests and improves itself: a no-token sweep drill, an interview drill against the imposter, a team drill, and skill-trigger evals with a results page.
- Files (about 15): `lab/sweep.mjs`, `lab/tests/sweep.test.mjs`, `lab/drills/README.md`, `lab/drills/interview-drill.js`, `lab/drills/team-drill.js`, `lab/evals/` (about 8 case folders), `lab/evals/run-fallback.js`, `lab/fixtures/tiny-project/` (3 to 4 files), `lab/results/.gitkeep`.
- Depends on: PR 1. The interview drill needs PR 3 and skips with a clear message if it is absent.
- Try in under five minutes: `node lab/sweep.mjs` (seconds, no tokens). Then "Pilot, run the interview drill" and open the results page when it finishes (a few minutes of Haiku and Sonnet).
- Checks: `node --test lab/tests/`; one real drill run during verification with its transcript read by the reviewer; review, adversary, imposter.
- Size: about 15 files, about 900 lines.
- Retry: `PR 6:` lines, "retry PR 6", branch `build-1-pr6-lab-a2`.

### PR 7: Manuals and library (with the librarian)

- Purpose: the operator manual starts with the first-hour guide; technical and maintenance shelves hold how the parts work and how to change them; earlier-branch library pages are carried over in edited form; the librarian answers with citations and reviews work against the corpus.
- Files (about 14): listed in 3.12.
- Depends on: PR 1.
- Try in under five minutes: "Librarian, how do I retry one PR?" (answer cites `manuals/operator/workshops-and-launches.md`); `/flight:manual` on the build-1 workshop drafts a manual page.
- Checks: `node lab/checks/manuals.mjs`; librarian smoke with five known questions; review, adversary, imposter (reads the first-hour guide as the owner).
- Size: about 14 files, about 950 lines.
- Retry: `PR 7:` lines, "retry PR 7", branch `build-1-pr7-manuals-a2`.

### PR 8: Cockpit band (optional mod)

- Purpose: a one-line status band above the prompt showing the workshop in focus, questions waiting and context fullness. The most experimental piece and the first to cut.
- Files (6): listed in 3.14.
- Depends on: PR 1 (reads the same files the pre-flight card reads).
- Try in under five minutes: `claude plugin install flight-cockpit@DBHD-FlightDeck --scope local`, restart, look above the prompt.
- Checks: `claude plugin validate mods/cockpit`, `claude plugin test mods/cockpit`; review, adversary, imposter.
- Size: 6 files, about 400 lines.
- Retry: `PR 8:` lines, "retry PR 8", branch `build-1-pr8-cockpit-a2`.

## 5. The build run

Written after the owner approves. It is a saved-in-repo dynamic workflow, `.flightdeck/build-1/workflows/build.js`, run by path like `plan.js`, launched from the owner's interactive session (so a usage-limit wait pauses the run instead of failing agents, which does not happen under `claude -p` or in background sessions). The main session is the lead: Opus at `/effort high`, never `ultracode`.

### Stage 0: Pre-flight in the owner's session (owner present, about five minutes)

- The lead reads the owner's pasted answer from the review page: kept PRs become the `prs` list; changes become dated lines in `.flightdeck/build-1/constraints.md` in the owner's own words (the main conversation may write them; the owner is present).
- The lead makes the one protected-path edit (the model line in `.claude/agents/adversary.md`), which needs one approval click from the owner, and commits it to `build-1`.
- The lead runs a tiny probe workflow (three Haiku agents) to settle the unverified facts from harness-multi item 21: that `effort: 'high'` is accepted per agent, that `model: 'sonnet'` and `'haiku'` and `'opus'` are accepted, that an agent with `isolation: 'worktree'` can run `git checkout -b <name> origin/build-1`, commit and `git push`, and that `gh auth status` succeeds. If `effort` is rejected, the script drops the option and relies on agent definitions and the session's high effort; if `gh` fails, the land step pushes branches and writes PR bodies to files for the owner to open.
- The lead then launches `build.js` with `args: {attempt: 1, prs: [...], outDir: ".flightdeck/build-1"}`.

### Stages inside `build.js`

- Inputs that change between retries come only through `args` and committed files (constraints, previous findings), so a resume replays unchanged prefixes and a retry is a new run.
- Phase "Brief" (Opus, high, one agent per PR, in parallel, not isolated): writes `.flightdeck/build-1/attempts/<k>/pr-<n>/brief.md` from `.flightdeck/build-1/plan/plan.md`, the constraints file (lines for this PR and general lines), and, on a retry, the previous attempt's `findings/` and `report.md`. The brief lists the exact files this PR owns (and the files it must not touch), the sources to adapt as `branch:path`, the done statement, the check commands, the five-minute try steps, and the branch name.
- Phase "Sources" (Haiku, one per PR, not isolated): copies each named source with `git show origin/<branch>:<path>` into `attempts/<k>/pr-<n>/sources/` so builders read local files, not other branches.
- Clerk (Haiku): commits `attempts/<k>/` to `build-1` and pushes, because worktrees cannot see uncommitted files. This is a barrier.
- Phase "Build PR 1" (only if PR 1 is in `prs`): five Sonnet workers (effort high, `isolation: 'worktree'`, `maxTurns` sized to leave room for the return), each owning a disjoint unit: (u1) the six agents and the output style; (u2) pre-flight and adversary skills, `CLAUDE.md`, `README.md`, manifests; (u3) the shapes skill with recipes, entry points and ways-to-fly; (u4) hooks and hook tests; (u5) workshop templates, build-1 card and questions, `.flightdeck/README.md`, `lab/README.md`, `lab/checks/static.mjs`. Each runs `git checkout -b build-1-pr1-basic-a<k>-u<i> origin/build-1` first, writes only its owned files, runs its local check, commits by file name, pushes, and returns `{branch, files, checks}` as validated JSON. Then an integrator (Sonnet, high, worktree) creates `build-1-pr1-basic-a<k>` from `origin/build-1`, merges the five unit branches, runs every PR 1 check, pushes, and returns the branch and check results.
- Phase "Build PRs 2 to 8": a `pipeline()` over the remaining PRs so each flows on its own with no barrier between them. Each PR has one to three Sonnet workers with disjoint files (one for PRs 3, 5 and 8; two for PRs 2, 4 and 7; three for PR 6), each branching from PR 1's branch (from this run, or the accepted one named in `args.pr1Branch`), then an integrator as above when there is more than one worker.
- Verification block, run per PR inside the pipeline:
  - Checks (Haiku, effort low, not isolated): runs the brief's check commands against the PR branch in a fresh worktree and returns pass or fail per command with the last 20 lines of output. Deterministic checks come first and gate nothing alone; they feed the triage.
  - Review (Sonnet, high, not isolated, read-only): reads `git diff <base>...<branch>`, the brief and the reviewer body from `agents/reviewer.md` on the PR 1 branch ("read this file and act as it says"), and returns findings that concern correctness or the brief only.
  - Adversary (Opus, high, `agentType: 'adversary'`, the project agent fixed in stage 0): "The Work" is the PR branch and diff; "The Criteria" are the brief's done statement, the constraints lines, the VISION section the PR serves, the owner's named mistakes, and the model ceiling. Writes `attempts/<k>/pr-<n>/findings/adversary.md` and returns its findings.
  - Human imposter (Sonnet, high, `isolation: 'worktree'` on the PR branch): adopts the owner persona from `owner-truth.md` and `user-intent.md`, follows the five-minute try steps literally (interactive steps become `claude -p --plugin-dir <worktree>` prompts, which are read-only; script steps run with node directly), answers any interview bundle as the owner (PR 3), and reports in the owner's voice: did it work, what confused, what smells like past mistakes, what to cut. Returns findings; it cannot write outside its worktree, so the triage agent files them.
  - The three verifiers run in parallel in fresh contexts, see neither each other's output nor the builders' transcripts, and share no notes (the multi-agent paper's collusion and conformity warnings).
  - Triage (Opus, high, not isolated): decides accept or reject for every finding with a one-line reason, writes `attempts/<k>/pr-<n>/findings/{review,imposter,checks,resolution}.md`, and turns accepted findings into a fix list. A finding that needs the owner's view becomes a question in `.flightdeck/build-1/questions.json` instead of a guess.
  - Fix once (Sonnet, high, worktree on the PR branch): applies the fix list, reruns the checks, commits, pushes. A second fix round is allowed only when a deterministic check is still red; after that the PR is opened as a draft and marked "not green" in its report.
  - Land (Sonnet, medium, not isolated): writes `attempts/<k>/pr-<n>/report.md` with provenance marks (what was [checked], [reviewed], [stated]), then `gh pr create --base <build-1 for PR 1, PR 1's branch for the rest> --head <branch> --title "PR <n>: <title>" --body-file <report>`. The body leads with the five-minute try, then checks, then findings and their resolutions, size, and how to retry. Never `main`, never `--force`, never a merge; the owner merges.
- Phase "Landing" (after all PRs): one Sonnet agent (high) first does the single real install rehearsal, serially, in a worktree of PR 1's branch (`claude plugin marketplace add`, `claude plugin install`, a `claude -p` smoke, then uninstall); then writes `.flightdeck/build-1/attempts/<k>/landing.html` with the page kit's rules (PR 2's `theme.css` if PR 2 was built): one card per PR with its try steps and a copy button, check results, findings summary, and a keep, change or cut panel that copies a reply. The imposter reads the page as the owner; one Sonnet fixer applies its findings. The clerk commits `attempts/<k>/` and `questions.json` to `build-1` and pushes. The lead tells the owner where the page is and stops.
- Failure handling: an agent that returns `null` (stopped or errored) marks its PR "not built" in the return value and the run continues with the others; nothing is retried silently inside the run. The script ends with `return {prs: [{n, branch, url, checks, findings, status}]}`.

### Models, effort and size

- Opus at high effort: the lead, briefs, triage, adversary. Sonnet: builders, integrators, fixers, review, imposter, landing page (high), land (medium). Haiku: sources, clerk, check runners, probes. Nothing at `xhigh`, `max`, `fable` or `ultracode`; every `agent()` call names its model and effort explicitly.
- About 100 agents in total (PR 1 about 15, PRs 2 to 8 about 10 each, plus briefs, sources, clerk and landing). Concurrency is whatever the machine allows (the default is up to 16, fewer with few CPUs); the owner can raise `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS`. The owner said there is no limit on agents; the runtime caps (1,000 per run, 4,096 per fan-out) are far above this.

## 6. Dogfooding

- The build is a workshop. `.flightdeck/build-1/` already holds the owner's truth (`constraints.md`), research, plan, verification and review page; PR 1 adds its `workshop.md` card and `questions.json`, so the first pre-flight card the owner sees is FlightDeck reporting on its own build, and the board (PR 2) shows the build's PRs as strips with the build's own open questions.
- The owner answers the build's questions through FlightDeck: questions that triage could not settle land in `.flightdeck/build-1/questions.json`, and the owner answers them on the board page and pastes the block back, so the first real use of the page is about FlightDeck itself.
- PR 1 verifies PRs 2 to 8: the build run's reviewer reads `agents/reviewer.md` from PR 1's branch and acts as it, the static check and hook tests from PR 1 run on every later PR, and the truth guard is exercised live by a workflow agent. If PR 1's content is weak, it shows up as poor findings on later PRs, which is evidence for a PR 1 retry.
- FlightDeck builds part of itself, safely: the demo launch in PR 4 is a real improvement to FlightDeck's own pre-flight card, run through `/flight:launch` and returning a draft PR. After the build, "retry PR n" can run through `/flight:launch` on the build-1 workshop instead of `build.js`, once PRs 1 and 4 are accepted.
- The lab drills the other PRs: the sweep breaks PR 1's hooks and agent files and checks the checks notice; the interview drill pits PR 3's interviewer against the imposter; the evals test whether PR 2, 3 and 4's skills fire when they should and stay quiet when they should not.
- How this respects "using half built systems, to build out the half built system is a fail HARD": the build machinery itself is a plain Claude Code workflow (`build.js`) that depends on no unmerged FlightDeck feature. FlightDeck's own parts are used during the build only to show state, to supply role text and to run checks, where a defect produces findings rather than a broken build. Self-building through launches starts only after PR 1 and PR 4 are accepted by the owner. This resolution is the lead's inference, shown for the owner to overrule.

## 7. Risks, and what not to build

### Risks

- Protected paths: every Claude write under `.claude/` asks for approval outside bypass mode. Mitigation: FlightDeck lives at the plugin root and in `.flightdeck/`; the single `.claude/` edit happens in stage 0 with the owner present.
- `--plugin-dir` makes the whole directory protected for writes (verified). Mitigation: the owner installs through the local marketplace; `--plugin-dir` is used only for read-only smoke prompts in checks.
- Unverified features the plan leans on: per-agent `effort` in workflows (skill text only), plugin `workflows/` running as `/flight:<name>` (documented, not run here), `agentType` naming a plugin agent inside a workflow, `claude plugin eval` availability (early-access gate), mod API stability, skill preloading for a main-thread agent (did not preload in one test, so the pilot does not rely on `skills:`). Mitigation: stage 0 probes the first three; PR 4 falls back to running scripts by path and to inline role text; PR 6 has a fallback runner; PR 8 is a separate plugin and first to cut.
- Agent `effort` in frontmatter may not apply to a main-thread agent (measured once on an older CLI in cockpit `pilot.sh`). Mitigation: the quick start passes `--effort high` explicitly.
- `bin/` blocks installing the plugin on claude.ai and Cowork. Mitigation: the CLI is its own PR and can be rejected; if the owner later wants claude.ai, the CLI moves into a skill folder.
- Stacked PRs: PRs 2 to 8 are opened against PR 1's branch and need retargeting after PR 1 merges; a PR 1 retry means re-cutting them. Mitigation: disjoint file ownership makes the re-cut a mechanical rebase-only run.
- Model aliases differ by provider (on Bedrock `sonnet` is an older model). Mitigation: aliases are kept for readability; the technical manual says how to pin full ids.
- The six shapes are a guess at the owner's "about 6". Mitigation: shown on the review page as a question.
- Hooks are safety nets, not permission systems (Bash redirects bypass the truth guard; shell tricks can bypass the git guard). Mitigation: static check, review and the owner's merge are the backstops; no claim of enforcement beyond what the hook does.
- Questions written by agents can be malformed JSON. Mitigation: the board renders a warning strip instead of failing, and the static check validates every `questions.json` it finds.
- Plugin hooks fire in every session and every subagent where the plugin is enabled. Mitigation: narrow matchers and `if` rules, at most 10 lines from the pre-flight card, and exit 0 on any internal error except the explicit denials.
- Small machines run few workflow agents at once, so the build run is a queue and takes longer. Mitigation: stated on the review page; the owner can raise the concurrency variable.
- The whole repository is copied into the plugin cache on install because the root is the plugin (including `library/source/`). Accepted for now; noted in the technical manual with the alternative (`source: "./plugins/flight"`).

### What not to build

- No central runner like `fc`, no `launch.json` state machine, no `run.json`, `HALT.json`, gate switches or escalation files: the folder listing is the state.
- No record prefixes, numbered requests, approval states, manifests or global registers; no vocative rules or callsigns; no truth statements required for every item.
- No rules in `.claude/rules/` and nothing under `dev/`.
- No replacement for Claude Code's teams, messaging, memory, worktrees or permissions; FlightDeck only fills their slots and gives recipes.
- No spec-first nine-domain spec chain as the default (it survives as one shape, "Spec first").
- No large test suites per check id; one fast check per part, plus drills in the lab.
- No web server before PR 5, and never one that binds beyond localhost, runs commands from page input or serves files outside `.flightdeck/`.
- No default agent for every session and nothing that starts on its own.
- No `fable`, `best`, `xhigh`, `max` effort or `ultracode` anywhere.
- No plan to retire dev-workspace.
- No publishing outside the owner's machine and GitHub repository.
