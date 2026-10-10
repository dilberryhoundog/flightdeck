# FlightDeck build-1 plan: harness-native and lean

Candidate plan, angle "harness-native and lean", attempt 1. Written by a planning agent on 2026-10-10. Nothing here is the owner's decision until the owner says so. The owner's documents are `.flightdeck/VISION.md`, `.flightdeck/build.txt` and `.flightdeck/build-1/constraints.md` (empty today: "(none yet)").

The one idea behind this plan: FlightDeck is content poured into the slots Claude Code already has (agent files, skills, plugin hooks, an output style, saved workflows, background sessions, agent teams, worktrees), plus three plain folders it needs and Claude Code does not supply (a workshop folder per piece of work, a library, a lab). No runner, no state files, no record scheme, no server beyond a static file server. Every part sits in its own folder and its own pull request, so the owner can delete or reject any one of them and the rest still passes its check.

## 1. What the owner gets, and how they try it straight away

The owner gets the `flight` plugin, installable from this repository in two commands, that turns any Claude Code session into a flight deck: a pilot agent (Opus at high effort) that dispatches and does not do the work, six crew agents (a Haiku explorer, a Sonnet worker, a Sonnet reviewer, an Opus adversary, a Sonnet human imposter and a Sonnet librarian), a workshop skill that draws the owner's intent out in at most five plain questions and writes it into a folder under `.flightdeck/workshops/`, a launch skill that picks one of six team shapes and runs it as a dynamic workflow, saved workflows for the two shapes used most (`/flight:crosscheck`, which runs review, adversary and imposter on anything, and `/flight:focused-build`, which builds in a worktree, crosschecks, fixes once and opens a pull request), team recipes for agent teams and background "officer" sessions, a guard that asks before any agent changes a file the owner marked as theirs, a short greeting at session start that lists open workshops and questions waiting for the Commander, and an opt-in flight-themed output style. Six more pull requests each add one advanced part (HTML pages with a copy-back answer box, the big fan-out build, manuals and library with promotion, the lab, a small `flight` command, and a status band above the prompt), and each can be rejected alone. To try it the moment PR 1 lands: in the repository run `claude plugin marketplace add . --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local`, start `claude --agent flight:pilot --effort high`, say "start a workshop: tidy the README install section", answer the few questions, then type `/flight:crosscheck README.md`. Dogfooding starts there: the owner's first workshop is real FlightDeck work, and the second build wave is run with FlightDeck's own agents and verification after PR 1 is merged, never before (the owner learnt that "using half built systems, to build out the half built system is a fail HARD").

## 2. Decisions the owner left to the lead ("let em cook")

### (a) What "working" means for each part

Choice: a part works when three things are true. (1) Its check command exits 0: `bash lab/checks/static.sh` for every part, plus the part's own check listed in section 3. (2) The human imposter, playing the owner, follows the part's "try it" steps literally in a fresh session and finishes in under five minutes without help, and every question the part asks is one the owner could answer. (3) Removing the part's files leaves `bash lab/checks/static.sh` and `claude plugin validate .` green, so no other part depends on it except through PR 1.

Reason: the owner said "show me something that works great. and fits the goal"; a check an agent can run proves "works", the imposter proves "fits the owner", and the removal test proves "I can cut it down".

### (b) Where everything goes

Choice: the repository root is the plugin root (as `.claude-plugin/marketplace.json` already says with `source: "./"`), so plugin parts sit at the root in the folders Claude Code scans; the project's own working material sits in `.flightdeck/`; `.claude/` is left almost untouched.

Reason: plugin components only load from the plugin root folders; writes under `.claude/` are protected-path writes that prompt or fail in every mode except bypass, so keeping FlightDeck out of `.claude/` keeps agents unblocked; and `.claude/rules/` is owned by dev-workspace (its config restores it on merge), so FlightDeck must not touch it.

The layout, by audience:

- Plugin root (ships to every project that installs `flight`): `.claude-plugin/plugin.json` and `marketplace.json`; `agents/` (seven agent files, named `flight:<name>`); `skills/` (`workshop`, `launch`, `teams`, later `page` and `promote`, each a folder with `SKILL.md`, invoked as `/flight:<name>`); `workflows/` (saved workflows, run as `/flight:<name>`); `hooks/hooks.json` plus two small scripts; `output-styles/flight-deck.md`; later `bin/flight`; `library/` (concepts and best practice, readable by agents through `${CLAUDE_PLUGIN_ROOT}/library/`); `manuals/` (operator, technical and maintenance notes for each FlightDeck part).
- Repository only (not plugin components, though they sit in the same folder): `CLAUDE.md` (instructions for agents working on FlightDeck itself; a plugin cannot ship a CLAUDE.md, and `claude plugin validate .` reports this one as "not loaded as project context", which is expected); `README.md`; `lab/` (checks, drills, evals, fixtures; for improving FlightDeck, not used by other projects); `dev/` (dev-workspace, untouched); `library/source/` (downloaded sources).
- `.flightdeck/` in any project (this one included): owner documents (`VISION.md`, `build.txt` here); `workshops/<name>/` (one per piece of work); `manuals/` (that project's manuals, written when a workshop's decisions are promoted). In this repository `.flightdeck/build-1/` stays where it is as the first workshop (it predates the workshops folder; moving it would break the owner's links and `plan.js`).
- `.claude/` in this repository: PR 1 deletes only `.claude/agents/adversary.md` (it says `model: fable`, above the owner's ceiling, and the plugin's `agents/adversary.md` replaces it). `.claude/settings.json` (which enables dev-workspace) and `.claude/rules/` are not touched. Installing the plugin with `--scope local` writes `.claude/settings.local.json` itself, which is personal and not committed.
- One workshop folder holds exactly: `workshop.md` (the owner's four fields from his own note `ideas/workshop.txt`: title, work, done, verify; agents may draft and edit it), `truth.md` (dated one-line statements in the owner's words, frontmatter `read: "agents"` and `write: "human"` exactly like `VISION.md` and `constraints.md`), `questions.md` (questions waiting for the Commander), and `runs/run-<n>/` (one folder per attempt: the brief, findings, reports, pages). No index, no manifest, no status field: the latest run is the highest number, and a question is open while its `answer:` line is empty.

### (c) How a retry works

Choice for the whole build: the owner adds dated lines to `.flightdeck/build-1/constraints.md`; a line that starts `PR <n>:` applies to that pull request only, any other line applies to all. To redo the plan, rerun `.flightdeck/build-1/workflows/plan.js` (as `.flightdeck/build-1/README.md` already says). To redo the build, rerun the build workflow `.flightdeck/build-1/workflows/build.js` with `{"wave": 2, "prs": [3], "attempt": 2}` (or any list of PRs).

Choice for one pull request: a retry starts again from `origin/build-1` in a fresh worktree on a new branch `build-1/pr-<n>-<slug>-a<attempt>` and records into a new folder `.flightdeck/build-1/runs/pr-<n>/attempt-<attempt>/`. Setup carries over (plan, constraints, brief); run output does not (no salvaging the old diff). The old pull request is left open for the owner to close; agents never delete or force-push a branch.

Choice for any workshop: the same rule at a smaller size. The owner adds a dated line to the workshop's `truth.md` (or answers a question), and the next launch writes `runs/run-<n+1>/` from a fresh worktree.

Reason: one owner file, one line format, numbered folders and new branches is the whole mechanism; it reuses the owner's existing `constraints.md` convention and the flightcrew lesson "setup carries over, run output does not", and invents no state file (the owner on invented state: "umm where the F did run.json come from?").

### (d) How big the build is, and what to cut first

Choice: seven pull requests. PR 1 (basics) is about 29 files and 1,800 lines, mostly markdown. The six advanced PRs together are about 57 files and 3,300 lines (the lab's eval cases and fixture account for half the files). Total about 86 files and 5,100 lines, of which roughly 700 lines are scripts and the rest is markdown, JSON and HTML.

Cut order if it is too big: 1st PR 7 (status band, a novelty that needs the newest Claude Code), 2nd PR 6 (the `flight` command; dev-workspace already does git chores and a top-level `bin/` stops the plugin installing in claude.ai and Cowork), 3rd PR 3 (fan-out build; the focused build in PR 1 covers most work), 4th PR 5 (the lab beyond the static check, which stays in PR 1), 5th PR 4 (manuals, library and promotion), last PR 2 (HTML pages). PR 1 is never cut; it can only be trimmed (for example drop the output style or the teams recipes).

Reason: the owner said "if i like it but its too big, I cut it down"; the order cuts novelty and duplication of existing tools first and keeps what the owner touches every day.

### (e) How the owner starts a piece of work

Choice: in plain chat, or in a pilot session (`claude --agent flight:pilot --effort high`), the owner says roughly what they want ("start a workshop: ..."), or types `/flight:workshop <rough ask>`. The skill first sends Haiku explorers to read the code so it never asks what it can look up, then asks at most one bundle of at most five plain questions about the owner's own ideas (each with a recommended answer), and writes `workshop.md`, `truth.md` (the owner's words, which the owner approves through the guard's prompt) and `questions.md` (anything unanswered). The owner then types `/flight:launch` to say go. The launch skill cannot start itself (`disable-model-invocation: true`), so nothing starts without the Commander. PR 2 adds a prompt-builder page as a second way in.

Reason: the evidence (owner-truth section 5.1) supports a rough ask, a short interview that writes the owner's truth into a workshop, then "go", with no typed orders, IDs or approval forms; a skill plus a slash command is the native way to do exactly that.

### (f) Where questions waiting on the owner are held

Choice: in `questions.md` inside the workshop they belong to (for the build itself, `.flightdeck/build-1/questions.md`). Each question is a short block: the question, why it matters, the options with one marked recommended, and an empty `answer:` line. The session-start hook counts empty `answer:` lines under `.flightdeck/` and prints "2 questions waiting for the Commander in <path>" at the top of every session. The owner answers by typing in chat, by filling the `answer:` line, or (after PR 2) on an HTML page whose "Copy my answers" button gives a block to paste back.

Reason: subagents and workflow agents cannot ask the human (they lose AskUserQuestion, and a workflow cannot pause for input), so questions must live in a file that survives sessions and retries; the owner complained that "the question is now hundreds of lines up", which a file plus a greeting line fixes.

### (g) Does FlightDeck replace dev-workspace or sit beside it?

Choice: it sits beside it for this build. FlightDeck does not touch `dev/`, `.claude/rules/` or the dev-workspace setting, does not depend on `dw` being installed, and does not copy its commands (the PR 6 `flight` command only does flight-deck chores dev-workspace does not: list workshops, serve pages, commit `.flightdeck/` files). Workshops take the role the old workspace folders played, for multi-agent work.

Reason: the owner said "dev can stay", the vision says HITL "is not forgotten", and the CONCEPT note says "stub this component ... investigate but don't fully transfer yet".

### Two readings the owner should correct if wrong

- Launch versus workshop: a workshop is the place (a folder holding the owner's truth and everything the work produced); a launch is the act of sending a multi-agent run out of that place; each launch is one `runs/run-<n>/` attempt.
- The "about 6 shapes": the owner never listed them. This plan proposes, as a guess: focused build, fan-out build (the old flightcrew shape), research and synthesis, root cause, decision, and crosscheck panel; plus plain chat as "shape zero" and an agent team with a live adversary as an interactive variant of the decision and crosscheck shapes.

## 3. Parts: every VISION.md section mapped to parts

Each entry: what it is; files; Claude Code features used; what "working" means as a check; which PR.

### Accelerate Claude Code

- What: FlightDeck content in Claude Code's own slots, and fresh context for agents: a short greeting from live files instead of a large always-loaded document, short agent descriptions, blind roles that skip CLAUDE.md.
- Files: `agents/*.md`, `skills/*/SKILL.md`, `workflows/*.js`, `hooks/hooks.json`, `hooks/session-start.sh`, `output-styles/flight-deck.md`, `CLAUDE.md`, `README.md`.
- Claude Code features: plugin installed from a local marketplace (loads in place, edits apply after `/reload-plugins`), plugin agents, skills, saved plugin workflows, plugin hooks (`SessionStart` stdout reaches context), `omitClaudeMd` on explorer, adversary and imposter.
- Working: `claude plugin validate .` passes with only the known CLAUDE.md and marketplace notes; `static.sh` passes; in a session with the plugin installed, `/agents` (or the agent list) shows the seven `flight:` agents and `/` autocomplete shows the `flight:` skills and workflows; the greeting is under 1,500 characters and prints nothing in a project with no `.flightdeck/` folder.
- PR: 1.

### Roleplay

- What: the rank chain the owner gave, used as names and tone only: Commander (the owner), Pilot (the lead agent, captain rank, callsign "Ace"), Officers (any flight agent run as a background session), Crew (explorer, worker, reviewer, adversary, imposter, librarian). Agent descriptions name the rank. The greeting and the output style speak to the Commander. No vocative rules, no approval flags, no records.
- Files: `agents/pilot.md` and the crew files (rank line in each description), `output-styles/flight-deck.md` (opt-in with `/output-style flight:flight-deck`; `keep-coding-instructions: true`; not forced on the owner), `skills/teams/rosters.md` (teams named recon, decision, fit-n-trim, idea-exploration from the owner's own rosters).
- Claude Code features: agent `description` and `color`, plugin output styles.
- Working: a fresh pilot session greets the Commander by rank in one line and then answers plainly; the imposter reads the greeting and finds no jargon; plain chat without the output style shows no roleplay at all.
- PR: 1.

### Themed HTML page suite

- What: single-file pages the agent writes from templates into the workshop (`runs/run-<n>/*.html` or the workshop root): a questions page (renders `questions.md` as cards with options, a note box and "Copy my answers", which builds a block the owner pastes back), a report page (what was built, checks with provenance marks, findings, try steps), and a prompt builder (fields for title, work, done, verify and truth lines that copies a ready "start a workshop" prompt). Flight-deck look (checklist and flight-plan feel), light and dark, phone width, no network except Google Fonts, no server needed. PR 6 adds `flight serve` for those who prefer a local address.
- Files: `skills/page/SKILL.md`, `skills/page/templates/base.html`, `skills/page/templates/questions.html`, `skills/page/templates/report.html`, `skills/page/templates/prompt-builder.html`, `manuals/pages.md`.
- Claude Code features: a skill with supporting files read through `${CLAUDE_SKILL_DIR}`; the agent writes the page with Write; no hook, no MCP server.
- Working: the static check scans every template for external scripts or links other than Google Fonts and for the colour tokens on `:root` with a dark-mode override; the imposter opens the questions page source for a sample workshop, fills an answer as the owner would, and the block the copy button builds (read from the script) pastes back into chat and the agent writes it into `questions.md` correctly.
- PR: 2.

### Workshops

- What: one folder per piece of work under `.flightdeck/workshops/<slug>/` with `workshop.md`, `truth.md`, `questions.md` and `runs/run-<n>/`; branch-isolated because it lives in git on the work's branch; retry is a new run folder; truth is the owner's dated lines, drawn out by a short interview, never a form; a guard asks the owner before any agent edits a file marked `write: "human"`; promotion of a decision to CLAUDE.md or a manual comes in PR 4.
- Files: `skills/workshop/SKILL.md`, `skills/workshop/template/workshop.md`, `skills/workshop/template/truth.md`, `skills/workshop/template/questions.md`, `hooks/human-owned.mjs`, `hooks/hooks.json` (PreToolUse on `Edit|Write`), `.flightdeck/README.md`.
- Claude Code features: skill with templates; Haiku explorer subagents before any question; `PreToolUse` hook returning `permissionDecision: "ask"` for `.flightdeck/` files whose frontmatter says `write: "human"` (it fails open on any error, and is located through `${CLAUDE_PLUGIN_ROOT}` so a moved repo cannot leave a dangling path).
- Working: `static.sh` feeds the guard three sample tool calls (edit `truth.md`: ask; edit `workshop.md`: no output; malformed input: no output, exit 0); the imposter runs `/flight:workshop` on a sample ask in a scratch clone and answers as the owner; mechanical checks on the transcript: at most five questions, none asks the owner to approve agent-written text, each has a recommended option, the three files exist with the right frontmatter, unanswered questions land in `questions.md`.
- PR: 1 (skeleton, skill, guard); 4 (promotion).

### Launches

- What: the launch skill reads the workshop, asks itself the oracle question ("what will tell us the work is right?"), picks the smallest shape that fits, writes `runs/run-<n>/brief.md` (what to build, the proof list, rules, the output contract: modelled on the run-2 `kickoff.md` that delivered 58 of 61 checks in a day), shows the Commander the shape, seats, models and a rough agent count, and on go runs the matching saved workflow or composes one from `shapes.md`. Workers get a written brief, disjoint paths, a unique branch name and their own worktree; the author never verifies its own work; every launch ends in a pull request into the branch the workshop lives on. Agent teams and background officers are recipes for interactive use.
- Files: `skills/launch/SKILL.md`, `skills/launch/shapes.md` (six shapes, each: when to use, oracle, seats and models, phases, owner touch points, rough agent count), `workflows/crosscheck.js`, `workflows/focused-build.js`, `skills/teams/SKILL.md`, `skills/teams/rosters.md` (four rosters with spawn prompts, plus the officer recipe `claude --bg --agent flight:pilot --name officer-<topic> "<brief>"`); PR 3 adds `workflows/fan-out-build.js`.
- Claude Code features: dynamic workflows saved in the plugin's `workflows/` (`agent()` with `model`, `agentType: 'flight:<name>'`, `isolation: 'worktree'`, `schema`; `parallel()`, `pipeline()`, `args`); agent teams (needs `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and an interactive session; roles come from the `flight:` agent files); background sessions (`claude --bg`, `claude agents`); cross-session messaging for pilot-to-officer notes; worktrees.
- Working: the imposter runs `/flight:crosscheck README.md` in a scratch clone and gets three sets of findings written to the run folder; `/flight:focused-build` on a one-line change in a scratch clone with a local bare repository as its remote produces a pushed branch, a crosscheck file and a pull request body (the `gh` step is skipped for the local remote); `static.sh` checks every workflow starts with `export const meta`, ends with a top-level `return`, contains no `export default`, no `effort: 'xhigh'`, no `'max'`, and no absolute home path.
- PR: 1 (shapes, crosscheck, focused build, teams recipes); 3 (fan-out build).

### Local CLI

- What: `flight`, a POSIX shell script of three commands: `flight status` (workshops, latest run of each, open questions), `flight serve` (a static file server bound to 127.0.0.1 serving only `.flightdeck/`, printing the address), `flight commit "<message>"` (stages and commits only `.flightdeck/` files: "bulk commit the flightdeck"). Nothing else; the system works without it.
- Files: `bin/flight`, `manuals/cli.md`.
- Claude Code features: plugin `bin/` (added to the Bash tool's PATH while the plugin is enabled; documented, not yet verified, so PR 6's first check is to verify it).
- Working: in a pilot session, "run flight status" prints the workshops; `flight commit` in a scratch clone stages nothing outside `.flightdeck/`; `flight serve` answers on 127.0.0.1 only and returns 404 for a path outside `.flightdeck/`.
- PR: 6.

### dev-workspace

- What: sits beside. CLAUDE.md tells agents dev-workspace may be missing and plain `git` and `gh` are fine; FlightDeck never edits `dev/` or `.claude/rules/`.
- Files: `CLAUDE.md` (three lines).
- Claude Code features: none.
- Working: `git diff --name-only origin/build-1...<branch>` for every FlightDeck PR lists nothing under `dev/` or `.claude/rules/` (part of each PR's review).
- PR: 1.

### Cheap tokens, smart agents

- What: each agent file names its own model and effort ("correct location is agent body"): pilot and adversary `opus` with `effort: high`; worker, reviewer, imposter, librarian `sonnet` with `effort: high`; explorer `haiku`. Workflows pass `model` per call too. Nothing above Opus high; no `fable`, no `xhigh`, no `max`, no ultracode anywhere. Aliases (`opus`, `sonnet`, `haiku`) resolve to the 5.5 models on the owner's subscription. Blind roles skip CLAUDE.md to save tokens. The launch skill prints a rough agent count before go.
- Files: frontmatter of `agents/*.md`; `workflows/*.js`; `lab/checks/static.sh` (the ceiling check).
- Claude Code features: agent `model`, `effort`, `omitClaudeMd`, `maxTurns`; workflow per-agent `model` (documented) and `effort` (documented only in the workflow-authoring skill text, so the build run probes it first).
- Working: `static.sh` fails if any agent lacks a model, uses anything but opus, sonnet or haiku, sets an opus agent without `effort: high` or lower, or any shipped file contains `model: fable`, `xhigh`, `effort: max` or `ultracode`.
- PR: 1.

### Built with quality

- What: every part has its own folder, its own PR, its own check and its own manual page; one static check guards the shared rules; the lab can mutate a part to prove the check notices, and remove a part to prove nothing else breaks.
- Files: `lab/checks/static.sh` (PR 1); `lab/drills/sweep.sh` and `lab/drills/remove-part.sh` (PR 5).
- Claude Code features: `claude plugin validate`; worktrees for drills.
- Working: `static.sh` prints one line per case (`pass <case>` or `FAIL <case>: <reason>`) and `<n>/<m> passed`, exit 0 or 2 (the flightcrew suite protocol); `sweep.sh` reports every mutation caught; `remove-part.sh` reports green after removing each advanced part.
- PR: 1 and 5.

### Human energy

- What: the owner's input goes into long-lasting files agents reuse: `truth.md` lines, answered questions, rubrics in the library, the imposter's persona. Questions come in one bundle of at most five, about the owner's ideas only, each with a recommendation; a skipped question stays open rather than being guessed; the owner is never asked to approve agent-written text.
- Files: `skills/workshop/SKILL.md` (the bundle rules from `library/spec/interview-session-conventions.md` on the cockpit branch), `agents/imposter.md`, `library/rubric-guide.md` (PR 4), `lab/personas/owner.md` (PR 5, built from the owner's dated quotes in `dev/workspace/research/repo-reset/user-intent.md`).
- Claude Code features: skills, subagents.
- Working: the interview drill (PR 5) runs the workshop skill against the imposter three times and checks the mechanical rules each time; the imposter reports any question it, as the owner, "cannot answer".
- PR: 1 and 5.

### Keep it simple

- What: installing `flight` changes nothing in a plain chat: no file is created, no question asked, no workflow started; the greeting is silent where there is no `.flightdeck/`; the output style is opt-in; the launch skill cannot fire on its own.
- Files: none beyond the above; the property is checked.
- Claude Code features: `disable-model-invocation: true` on `launch` and later `promote`; hook matchers scoped narrowly.
- Working: in a scratch clone with the plugin installed, `claude -p --model haiku "What does README.md say?"` answers and `git status --porcelain` stays empty.
- PR: 1.

### Manuals and libraries

- What: a librarian agent (Sonnet) that answers "does this follow our manuals and library?" with path and line citations and returns only the answer; a library seeded from the best earlier writing (rubric guide, terms, team design, retry doctrine, the seven classes of check, the adversarial mandate, harness facts with a date and source on every item); one manual per FlightDeck part with three short headings (operate, how it works, maintain), at most 100 lines each; a promote skill that turns a workshop decision into a CLAUDE.md line, a library item or a project manual, shown to the owner as a diff and checked by the adversary for contradictions before the owner approves the write.
- Files: `agents/librarian.md` (PR 1); PR 4: `library/README.md`, `library/terms.md`, `library/rubric-guide.md`, `library/team-design.md`, `library/retry.md`, `library/checks.md`, `library/harness-facts.md`, `manuals/README.md`, `manuals/workshops.md`, `manuals/launches.md`, `manuals/agents.md`, `manuals/hooks.md`, `manuals/lab.md`, `skills/promote/SKILL.md`. PR 2, 6 and 7 each add their own `manuals/<part>.md`.
- Claude Code features: a specialist subagent searching in its own context (the Claude Code Guide pattern); a skill with `disable-model-invocation: true`; the human-owned guard for CLAUDE.md is not used (CLAUDE.md is not marked `write: "human"`), so promotion relies on the normal edit prompt.
- Working: the librarian, asked "does agents/worker.md follow library/team-design.md?", answers with at least one `path:line` citation per claim; each library file names its source and date; `wc -l manuals/*.md` shows none over 100 lines; the imposter promotes a sample decision and sees a diff before any write.
- PR: 1 (librarian), 4 (content and promote).

### Laboratory

- What: a place to drill and evaluate FlightDeck itself, not shipped for use in other projects: the sweep drill (mutate a part, confirm the static check fails), the remove-part drill, the interview drill (imposter versus workshop skill, mechanical checks), a team drill recipe (an agent team with a live adversary on a fixture, for the owner to run interactively and write down what was learnt), skill trigger evals (should-fire and should-not-fire prompts for each skill) for `claude plugin eval` if the owner's account has it, and the toy `export-html` fixture project from `origin/run/flightcrew-characterization-2:flightdeck/testbench/fixtures/sample-project/`.
- Files: `lab/README.md`, `lab/checks/static.sh` (PR 1), PR 5: `lab/drills/sweep.sh`, `lab/drills/remove-part.sh`, `lab/drills/interview.js`, `lab/drills/team-drill.md`, `lab/personas/owner.md`, `lab/evals/<case>/` (eight cases), `lab/fixtures/export-html/` (about six files), `lab/results/README.md` (drills write dated results here).
- Claude Code features: dynamic workflow run by path (`lab/drills/interview.js`), worktrees, `claude plugin eval` (early-access gate; checked before use), agent teams for the team drill.
- Working: each drill prints `n/m passed` and exits 0; `interview.js` returns its mechanical results for three imposter runs; the eval cases run under `claude plugin eval` or the drill prints "plugin eval not available on this account" and exits 0.
- PR: 1 (static check), 5 (the rest).

## 4. Pull requests, in order

Branches are `build-1/pr-<n>-<slug>`, each opened into `build-1`. Every PR's description carries its try steps, check results marked `[checked]` (a script ran), `[reviewed]` (an agent judged) or `[stated]` (an agent said so), the findings and what was done about each, and how to retry it.

### PR 1: Flight deck basics (Claude Code content and core locations)

Purpose: everything Claude Code loads natively, plus the core locations: seven agent files with entry points, the workshop, launch and teams skills with the workshop skeleton, six shape notes, two saved workflows, the greeting and guard hooks, the output style, the repository's CLAUDE.md and README, and the static check. After this PR the owner can install the plugin and run a real workshop, crosscheck and focused build.

Files:
- `agents/pilot.md` (Opus high; lead, captain rank, callsign Ace; "look to decide, dispatch to do"; keeps its context lean; picks the smallest shape; nothing starts without the Commander's go; questions go to `questions.md`; reports with provenance marks; never pushes to main; no `tools` line so it inherits everything, including Workflow when run as the main agent)
- `agents/explorer.md` (Haiku; one question in, cited answer out with `path:line` and certain/probable/guess; "not found" is an answer; `omitClaudeMd: true`; tools Read, Grep, Glob, Bash)
- `agents/worker.md` (Sonnet high; one unit, writes only its listed paths, halts with a typed reason: blocked, contradiction, boundary, budget; commits by name; adapted from `origin/cockpit:.claude/agents/worker.md`; no `isolation` line, so callers choose the worktree)
- `agents/reviewer.md` (Sonnet high; fresh context; judges the diff against the workshop's done and verify or the brief; four finding kinds; never edits; "the builder wanted to merge; you do not")
- `agents/adversary.md` (Opus high; the adversarial mandate from `origin/cockpit:library/review/adversarial-mandate.md` merged with the current adversary file and its live and cold modes; starts at once when given The Work and The Criteria; findings only on correctness or stated requirements; no file writes; `omitClaudeMd: true`)
- `agents/imposter.md` (Sonnet high; plays the Commander from a persona built from the workshop's `truth.md`, `workshop.md`, CLAUDE.md and any persona file it is given; answers question bundles in the paste-back format, says "(unanswered)" where the owner would not know, flags jargon and walls of text, follows try steps literally and reports where it got stuck; `omitClaudeMd: true`)
- `agents/librarian.md` (Sonnet; searches `library/`, `manuals/` and `.flightdeck/manuals/`; returns only the answer with citations)
- `skills/workshop/SKILL.md`, `skills/workshop/template/workshop.md`, `skills/workshop/template/truth.md`, `skills/workshop/template/questions.md`
- `skills/launch/SKILL.md` (`disable-model-invocation: true`), `skills/launch/shapes.md`
- `skills/teams/SKILL.md`, `skills/teams/rosters.md`
- `workflows/crosscheck.js`, `workflows/focused-build.js`
- `hooks/hooks.json`, `hooks/session-start.sh`, `hooks/human-owned.mjs`
- `output-styles/flight-deck.md`
- `CLAUDE.md` (under 60 lines: what this repository is; the owner's documents bind and everything else is agent-written; never push to main, never force-push, never delete a branch; model ceiling; one paragraph per line, no tables in chat, literal and direct; the layout above; dev-workspace may be missing; a plugin cannot ship CLAUDE.md, so FlightDeck's always-on text lives in the greeting hook and skills)
- `README.md` (rewritten: what FlightDeck is in three lines, the two install commands, the five-minute try)
- `.flightdeck/README.md` (rewritten: owner documents, workshops, build-1)
- `lab/README.md` (one paragraph), `lab/checks/static.sh`
- `.claude-plugin/marketplace.json` (adds the missing `description`)
- `.flightdeck/build-1/workflows/plan.js` (one change: `agentType: 'adversary'` becomes `'flight:adversary'`)
- deleted: `.claude/agents/adversary.md`

Depends on: nothing.

Try in under five minutes:
1. Check out the PR branch `build-1/pr-1-basics` (or `build-1` after merging), then run `claude plugin marketplace add . --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local`.
2. `bash lab/checks/static.sh` prints `n/n passed`.
3. `claude --agent flight:pilot --effort high`: the pilot greets the Commander; say "start a workshop: tidy the README install section"; answer its questions (at most five); approve the `truth.md` write when asked; see `.flightdeck/workshops/tidy-readme/`.
4. Type `/flight:crosscheck README.md`; three short sets of findings arrive and land in the workshop's run folder.
5. Open plain `claude` and ask anything: nothing FlightDeck-shaped happens.

Checks it must pass: `static.sh` all green; `claude plugin validate .` passes with only the two known notes; imposter completes the try steps; interview mechanical rules hold; greeting under 1,500 characters and silent without `.flightdeck/`; guard cases pass; plain chat leaves `git status` clean; no file under `dev/` or `.claude/rules/` changed; review and adversary find no unresolved high finding.

Size: 29 files touched (28 added or changed, 1 deleted), about 1,800 lines.

Retry: add `PR 1:` lines to `constraints.md`; rerun the build workflow with `{"wave": 1, "attempt": 2}`; the new branch is `build-1/pr-1-basics-a2`.

### PR 2: HTML pages with a copy-back answer box

Purpose: the themed page suite. A page skill and four templates so any agent can show the Commander a questions page, a report page or a prompt builder, and get the Commander's answer back as a pasted block. No server.

Files: `skills/page/SKILL.md`, `skills/page/templates/base.html`, `skills/page/templates/questions.html`, `skills/page/templates/report.html`, `skills/page/templates/prompt-builder.html`, `manuals/pages.md`, `lab/checks/pages.sh` (template scan), and a one-line mention in `skills/workshop/SKILL.md` ("offer the questions page when there are more than two open questions").

Depends on: PR 1.

Try in under five minutes: in the PR 1 tidy-readme workshop, say "show me the questions as a page"; open the file it names in a browser; pick answers, press "Copy my answers", paste into chat; the agent fills the `answer:` lines. Then say "give me the prompt builder" and open it.

Checks: `bash lab/checks/pages.sh` (no external resources but Google Fonts, colour tokens with a dark override, a copy button with a fallback); imposter fills a sample questions page as the owner and the pasted block round-trips into `questions.md`; review and adversary.

Size: 8 files, about 900 lines (mostly HTML and CSS).

Retry: `PR 2:` lines in `constraints.md`, then `{"wave": 2, "prs": [2], "attempt": 2}`.

### PR 3: Fan-out build (the old flightcrew shape as one saved workflow)

Purpose: a saved workflow for larger work: an Opus planner cuts the work into units with disjoint paths and at most four waves, Sonnet workers build each unit in its own worktree on a uniquely named branch, a Sonnet integrator merges them, the crosscheck panel runs on the whole, an Opus triage accepts or rejects findings, one fix round, then a pull request into the workshop's branch.

Files: `workflows/fan-out-build.js`, `manuals/launches-fan-out.md`, an updated fan-out section in `skills/launch/shapes.md` (points to the saved workflow instead of "compose it yourself").

Depends on: PR 1.

Try in under five minutes: in a scratch clone, "start a workshop: add a --version flag to lab/checks/static.sh and a test for it", then `/flight:launch`; the pilot proposes fan-out or focused build and you say which; watch `/workflows`. (The run itself takes longer than five minutes; the try is seeing it start correctly and finish with a branch.)

Checks: a run on a two-unit toy task in a scratch clone with a local bare remote produces two unit commits merged on one branch plus a crosscheck file; `static.sh` workflow rules; review and adversary.

Size: 3 files, about 320 lines.

Retry: `PR 3:` lines, then `{"wave": 2, "prs": [3], "attempt": 2}`.

### PR 4: Manuals, library and promotion

Purpose: give the librarian something to preside over and give the owner a one-step way to promote a workshop decision into CLAUDE.md, the library or a manual, with a diff shown first.

Files: `library/README.md`, `library/terms.md` (ranks plus the testing terms from `origin/cockpit:library/terms.md`), `library/rubric-guide.md` (from `origin/cockpit:library/rubrics/rubric-guide.md`, nearly as-is), `library/team-design.md` (trimmed from `origin/flightcrew-buildout:flightdeck/manuals/orchestration/crew.md`), `library/retry.md` (trimmed from `endings.md`), `library/checks.md` (the seven classes and the agent-shaped addendum), `library/harness-facts.md` (claim, verdict, source, date; seeded from the research reports and re-checked on the owner's Claude Code version), `manuals/README.md`, `manuals/workshops.md`, `manuals/launches.md`, `manuals/agents.md`, `manuals/hooks.md`, `manuals/lab.md`, `skills/promote/SKILL.md`.

Depends on: PR 1.

Try in under five minutes: ask the librarian "does agents/worker.md follow library/team-design.md?"; then `/flight:promote` a line from the tidy-readme workshop into CLAUDE.md and see the diff before approving.

Checks: every library file has a source and date line; no manual over 100 lines; librarian answer cites `path:line`; promote shows a diff before any write and the adversary's contradiction check runs; review and adversary.

Size: 14 files, about 950 lines.

Retry: `PR 4:` lines, then `{"wave": 2, "prs": [4], "attempt": 2}`.

### PR 5: Laboratory

Purpose: drills and evaluations that improve FlightDeck itself: mutation sweep, remove-part, interview drill with the imposter, a team drill recipe, skill trigger evals and a toy fixture project.

Files: `lab/drills/sweep.sh`, `lab/drills/remove-part.sh`, `lab/drills/interview.js`, `lab/drills/team-drill.md`, `lab/personas/owner.md`, `lab/evals/` (eight case folders, each a prompt and a grader), `lab/fixtures/export-html/` (about six files copied from the characterization-2 branch), `lab/results/README.md`, `lab/README.md` (expanded).

Depends on: PR 1.

Try in under five minutes: `bash lab/drills/sweep.sh` (every mutation caught), `bash lab/drills/remove-part.sh` (green after each removal), then "run the workflow at lab/drills/interview.js" and read its three-line result.

Checks: the drills pass on `build-1` with PR 1; the sweep catches at least one deliberately broken part per rule in `static.sh`; the interview drill's mechanical results are present; eval cases run or the drill reports the gate honestly; review and adversary.

Size: about 24 files, about 700 lines.

Retry: `PR 5:` lines, then `{"wave": 2, "prs": [5], "attempt": 2}`.

### PR 6: The `flight` command

Purpose: the local CLI, kept to three commands that do flight-deck chores (status, serve, commit).

Files: `bin/flight`, `manuals/cli.md`, `lab/checks/cli.sh`.

Depends on: PR 1 (PR 2 makes `flight serve` more useful but is not needed).

Try in under five minutes: in a pilot session say "run flight status"; then `flight serve` and open the printed address; then `flight commit "test"` in a scratch clone.

Checks: first, prove `bin/` is on the Bash tool's PATH (`claude -p "run: command -v flight"` in a scratch clone with the plugin installed); `lab/checks/cli.sh` (commit stages only `.flightdeck/`, serve binds 127.0.0.1 and refuses paths outside `.flightdeck/`); review and adversary.

Size: 3 files, about 220 lines.

Retry: `PR 6:` lines, then `{"wave": 2, "prs": [6], "attempt": 2}`. Note on the PR: a top-level `bin/` stops claude.ai and Cowork installing the plugin; the owner decides.

### PR 7: Status band above the prompt (a mod)

Purpose: a small Claude Code mod that draws one line above the prompt: the current workshop, its latest run, and the count of questions waiting for the Commander. Read-only; no command gating.

Files: `hooks/hooks.json` (adds the `modules` entry; the only PR besides PR 1 that touches a PR 1 file), `hooks/band.js`, `types/index.d.ts` (the state contract), `tests/band.test.ts`, `manuals/band.md`.

Depends on: PR 1; Claude Code 2.1.287 or later.

Try in under five minutes: restart Claude Code in the repository; the band shows "FLIGHT DECK | tidy-readme | run 1 | 1 question waiting"; answer the question and the count drops.

Checks: `claude plugin validate .` lists the mod's events; `claude plugin test` passes; the owner confirms the band is visible (the imposter cannot see the terminal); review and adversary.

Size: 5 files, about 250 lines.

Retry: `PR 7:` lines, then `{"wave": 2, "prs": [7], "attempt": 2}`; if rejected, the `modules` line is the only thing to remove from `hooks/hooks.json`.

## 5. The build run

The build is two workflow runs, because a workflow cannot wait for the Commander. Wave 1 builds PR 1 only and stops. The owner tries and merges PR 1. Wave 2 builds PRs 2 to 7 in parallel, each from the updated `build-1`, with FlightDeck's own agents. If the owner says "don't wait for me", wave 2 can branch from the PR 1 branch instead (`{"base": "build-1/pr-1-basics"}`) and each PR description says "merge after PR 1".

Script: `.flightdeck/build-1/workflows/build.js`, run by path from a session on an up-to-date local `build-1` checkout ("run the Workflow at `.flightdeck/build-1/workflows/build.js` with args `{...}`"). It is not saved under `.claude/workflows/` (protected path) or the plugin's `workflows/` (it is build-1 residue, not a FlightDeck feature).

Args: `wave` (1 or 2), `prs` (list of PR numbers; default all in the wave), `attempt` (default 1), `base` (default `build-1`), `scratch` (an absolute scratch directory path), `today` (date string; the script cannot read the clock).

Constants inside the script: the context block (owner documents bind; `constraints.md` read first; never push to main, never force-push, never delete a branch; model ceiling; one paragraph per line; plain words), the path to the final plan, and a findings schema (`severity` high/medium/low, `where`, `finding`, `evidence`, `suggested_fix`) and a build-return schema (`branch`, `commit`, `files`, `status` complete/blocked/contradiction/boundary/budget, `notes`).

Before the run the lead asks the owner for two things in the main session: start it with Opus and `/effort high` (never ultracode), and approve allow rules in `.claude/settings.local.json` for `Bash(git *)`, `Bash(gh pr create *)`, `Bash(claude plugin *)`, `Bash(claude -p *)`, `Bash(bash lab/*)` and `Workflow` so the agents are not stalled by prompts. On a machine with few CPUs the lead also suggests `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS=4`.

Stages, with model and effort:

0. Probe and preflight. `agent('Reply with OK.', {model: 'haiku', effort: 'low', label: 'probe'})`; if it returns null, set a flag and omit `effort` from every later call (the agent files' own `effort` and the session's high setting then apply). Then one Sonnet agent at medium effort runs `git fetch origin`, confirms `origin/build-1` exists, `claude --version`, `claude plugin validate .`, `gh auth status`, and for wave 2 confirms PR 1 is merged (`git show origin/build-1:agents/pilot.md`) and `claude plugin list` shows `flight@DBHD-FlightDeck`. If anything fails, the script returns the problems and builds nothing.
1. Gather (Haiku, low effort, one per PR, parallel). Copies the earlier-branch files the plan names for that PR into `<scratch>/pr-<n>/sources/` with `git show origin/<branch>:<path>`, and returns the list. Read-only to the repository.
2. Brief (Opus, high, one per PR, parallel). Reads the plan's section for the PR, every `constraints.md` line that applies (untagged or `PR <n>:`), and the gathered sources; writes `<scratch>/pr-<n>/brief.md`: purpose, every file with a one-line content spec, done, checks, rules (allowed paths, the ceiling, writing rules), try steps; and splits the PR into at most three parts with disjoint paths (PR 1 uses three: agents and output style; skills and workflows; hooks, CLAUDE.md, READMEs, static check and the `.claude` deletion). Returns the brief path and the parts.
3. Build (Sonnet, high, `isolation: 'worktree'`, one per part; wave 2 passes `agentType: 'flight:worker'`). First commands: `git fetch origin && git switch -c build-1/pr-<n>-<slug>[-a<attempt>]/part-<k> origin/<base>` (this sidesteps the trap that worktrees branch from `main` by default). Builds only its paths, runs `bash lab/checks/static.sh` where it exists, commits by name with the attribution lines, does not push. Returns the build-return schema. A halt return stops that PR, not the wave.
4. Integrate (Sonnet, medium, worktree, one per PR). `git switch -c build-1/pr-<n>-<slug>[-a<attempt>] origin/<base>`, merges the part branches (they share the repository's `.git`), copies the brief to `.flightdeck/build-1/runs/pr-<n>/attempt-<attempt>/brief.md`, runs `static.sh` and `claude plugin validate .`, commits, `git push -u origin <branch>` (never main, never force). Returns the branch and the check results with exit codes and the last lines of output. In wave 2 a Haiku agent then lists `git diff --name-only origin/<base>...<branch>` for every PR and flags any file touched by two PRs.
5. Verify (three agents per PR, in parallel, none sees another's output).
   - Review: Sonnet, high (`agentType: 'flight:reviewer'` in wave 2). Reads `git diff origin/<base>...origin/<branch>` and the brief; checks every listed file exists and matches its spec, nothing outside the allowed paths changed, nothing under `dev/` or `.claude/rules/`, checks are real commands. Read-only, no worktree.
   - Adversary: Opus, high (`agentType: 'flight:adversary'` in wave 2). The Work is the diff and files; The Criteria are the brief, VISION.md, build.txt, constraints.md, the owner's pain points (owner-truth section 3), the model ceiling, and the harness facts in `research/harness-core.md` "Facts that constrain FlightDeck's layout". Findings only on correctness or stated requirements, each with evidence a second reader can reproduce. Read-only.
   - Human imposter: Sonnet, high (`agentType: 'flight:imposter'` in wave 2). Persona from `dev/workspace/research/repo-reset/user-intent.md` and `research/owner-truth.md` (and `lab/personas/owner.md` once PR 5 exists). Clones the PR branch into `<scratch>/pr-<n>/try/`, installs the plugin there with `--scope local`, and follows the PR's try steps literally through `claude -p --model sonnet` sessions, continuing with `--resume <id>` to answer any questions the feature asks in the owner's voice; counts steps and notes confusion, jargon, failures and anything it, as the owner, could not answer. For PR 7 it reads instead of runs. Writes only inside its scratch folder.
6. Triage (Opus, high, one per PR). Decides accept or reject for every finding with a one-line reason, applying a severity bar (a reviewer told to find gaps always finds some). Returns the accepted fixes and the PR body draft.
7. Fix once (Sonnet, high, worktree, one per PR; always runs). `git fetch origin && git switch -c build-1/pr-<n>-<slug>-fix origin/<branch>`, applies accepted fixes (if any), writes `.flightdeck/build-1/runs/pr-<n>/attempt-<attempt>/findings.md` (every finding, verifier, severity, decision, reason), reruns `static.sh`, commits, and pushes fast-forward with `git push origin HEAD:<branch>`. There is no second fix round.
8. Recheck (Opus, high, only when a high finding was accepted). For each, "is it fixed? yes or no, with a quote". Unfixed high findings make the PR a draft.
9. Open the pull request (Haiku, medium). Writes the body file from the triage draft (purpose, try steps, checks marked `[checked]`, verification marked `[reviewed]`, findings and decisions, unresolved items, retry instructions) and runs `gh pr create --base <base> --head <branch> --title "PR <n>: <title>" --body-file <file>` with `--draft` when stage 8 left anything open. Returns the URL.
10. Wave 2 only, combined check (Sonnet, medium, worktree). Creates a local branch from `origin/<base>`, merges every wave-2 PR branch (not pushed), runs `static.sh`, `claude plugin validate .` and, if PR 5 was built, `lab/drills/remove-part.sh` from its branch; reports merge conflicts and failures for the wave page.
11. Wave page (Sonnet, high, no worktree). Writes `.flightdeck/build-1/runs/wave-<n>.html` in the main checkout: one plain card per PR (what it adds, try steps, results, open findings, how to retry), and an answer panel with keep, change or cut per PR and a "Copy my answer" button. In wave 2 it uses the PR 2 page templates if PR 2 built cleanly.

The script returns the PR list (number, URL, draft or not, check results, unresolved findings) and the page path. The lead, in the main session, then commits the wave page and any `questions.md` the run produced to `build-1`, pushes, and tells the owner where the page is.

Agent count: wave 1 about 17 agents; wave 2 about 9 per PR plus 4, so about 58. Neither touches the 1,000-agent cap; the concurrency cap queues them.

## 6. Dogfooding

- Before PR 1 is merged, FlightDeck is not used to build itself; wave 1 is a plain workflow. This honours "using half built systems, to build out the half built system is a fail HARD".
- `.flightdeck/build-1/` is treated as the first workshop: `constraints.md` is its truth (already `write: "human"`, so PR 1's guard protects it), `plan/` and `research/` are its residue, `runs/pr-<n>/attempt-<m>/` its attempts, `questions.md` its questions for the Commander, which the PR 1 greeting surfaces in every session.
- The owner's first try of PR 1 is real FlightDeck work: the tidy-readme workshop. If the owner keeps it, its decision is the first thing PR 4's promote skill moves into CLAUDE.md.
- Wave 2 runs with the plugin installed: workers, reviewers, adversaries and imposters are the `flight:` agents from PR 1, every wave-2 PR is gated by PR 1's `static.sh`, and every wave-2 PR's verification follows the crosscheck shape from PR 1.
- The lab drills the build: PR 5's sweep and remove-part drills run on PR 1 content as PR 5's own verification, and the combined check (stage 10) runs remove-part across all wave-2 branches together.
- After the build, any single PR can be retried from inside FlightDeck: in the build-1 workshop, `/flight:launch` with focused build, using the `PR <n>:` constraints as the brief's extra truth.

## 7. Risks, and what not to build

Risks, each with its handling:

- Plugin workflows (`workflows/*.js` run as `/flight:<name>`) are documented but were not run during research. PR 1's imposter must start `/flight:crosscheck` in a scratch clone; if they do not load, the launch skill runs the same files by path, which is documented.
- The per-agent `effort` option in workflows is documented only in the workflow-authoring skill text. Stage 0 probes it; the fallback is agent-file `effort` plus a session at high.
- An earlier cockpit note says an agent file's `effort` did not apply to a main-session agent on 2.1.278; the try steps therefore pass `--effort high` to the pilot.
- Plugin `bin/` on PATH is unverified; PR 6 verifies it first. A top-level `bin/` blocks claude.ai and Cowork installs.
- `claude plugin eval` may be behind an early-access gate; PR 5's evals report the gate instead of failing.
- Mods need 2.1.287 or later and their API can change; PR 7 is first to cut.
- Writes under `.claude/` prompt in every mode but bypass; the only one in the build is deleting `.claude/agents/adversary.md` in PR 1, which may pause the run once for approval.
- Worktrees branch from `main` by default; every build agent explicitly switches to `origin/build-1` first.
- Nested `claude -p` sessions run by the imposter cost tokens and do not wait out usage limits; they use Sonnet and stop at the try steps.
- Plugin hooks fire in every project where `flight` is enabled; the greeting is silent without `.flightdeck/`, and the guard only matches `.flightdeck/` files marked `write: "human"`.
- The guard's "ask" adds one prompt per truth write; if the owner finds that tedious, the fix is one line in `hooks/hooks.json`.
- Agent teams are experimental and turning them on changes ordinary delegation (named subagents launch as teammates); the teams recipes say so and set the variable per session, never in shared settings.
- A remote install copies the whole repository, including `library/source/` PDFs, into the plugin cache; the local-marketplace install used here loads in place. Moving the plugin into a subfolder is a later choice.
- The root CLAUDE.md is reported by `claude plugin validate .` as not loaded from the plugin; expected, and the check allows that one note.
- CLAUDE.md and the dev-workspace rules both instruct agents about git; CLAUDE.md is written to agree with them (use `dw` when installed, plain git otherwise) rather than contradict.
- The six shapes and the launch-versus-workshop reading are guesses for the owner to correct.
- `INTENT.md` (agent-written, says "built by hand") may mislead fresh agents; CLAUDE.md names the owner's documents as the only binding ones. Deleting or rewriting `INTENT.md` is left to the owner.

What not to build:

- No runner or command at the centre (no `fc`); the `flight` command is three chores and optional.
- No state files: no `run.json`, `launch.json`, `HALT.json`, `index.json`, manifests or event logs. Folder listings and empty `answer:` lines are the state.
- No record scheme: no ID prefixes, approval states, enacted approvals, dossiers or request numbers.
- No JSON schemas for documents and no linters beyond `static.sh` and the page and CLI checks.
- No replacement for anything Claude Code ships: no custom dispatcher, messaging, memory, team definitions file, worktree manager or permission system.
- No per-agent boundary or lock hooks (plugin agents cannot carry hooks, and worktrees already contain workers); no stop gates.
- No spec chain, nine-domain spec, kickoff part library or frozen test map.
- No test suites of the machinery beyond one static check and the drills.
- No copying of rules or CLAUDE.md into users' projects, no edits to `.claude/rules/`, no changes to dev-workspace.
- No automatic promotion to CLAUDE.md, and no truth written without the owner seeing it.
- No Fable, no `xhigh`, no `max`, no ultracode, anywhere.
- No web server that runs commands; `flight serve` serves files only, on 127.0.0.1.
