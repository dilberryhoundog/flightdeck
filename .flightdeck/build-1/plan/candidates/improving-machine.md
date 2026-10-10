# FlightDeck build-1 plan: a machine that improves

Candidate plan, angle "a machine that improves". Written 2026-10-10 by a planning agent for attempt 1. Binding inputs: `.flightdeck/VISION.md`, `.flightdeck/build.txt`, `.flightdeck/build-1/constraints.md` (no constraints yet), with `.flightdeck/build-1-brief.md` where it agrees with build.txt. Every Claude Code feature named below is taken from the research reports in `.flightdeck/build-1/research/` (mainly `harness-core.md` and `harness-multi.md`); where a feature is documented but not yet run on this machine, the plan says so and names the fallback.

The idea behind this angle in one line: the owner's few, high-value inputs (a rough ask, a line of truth, a ruling on a decision, a diagnosis of a failed attempt) are written once into plain files that agents read every time, so any work can be retried better, good decisions climb out of a workshop into global places, and a laboratory measures FlightDeck's own documents and improves them. Every part ships with a check, a five-minute try, and at least one eval case or drill, so nothing is built that cannot later be measured and improved.

## 1. What the owner gets and how they try it straight away

The owner gets FlightDeck as a Claude Code plugin (`flight`, from the `DBHD-FlightDeck` marketplace at the repository root) that adds a small flight crew of agents (a pilot who leads and dispatches, plus crew: worker, explorer, reviewer, adversary, human imposter, and later a librarian), a handful of `/flight:` skills, two small hooks, and a `.flightdeck/` home in the project where each piece of work gets its own workshop folder holding the owner's ask, the owner's truth, the decisions made, the questions waiting for the owner, and every attempt kept apart so it can be retried. Later pull requests add a short interview that draws the owner's truth out in at most five plain questions, launches that pick a multi-agent shape and land a reviewed pull request, plain HTML pages where the owner reads questions and pastes answers back, promotion of good decisions into CLAUDE.md and manuals, manuals and a library kept fresh by a Sonnet librarian, a laboratory that evaluates and hill-climbs FlightDeck's own documents, a tiny `flight` command line, the flight-deck voice, and an optional status band. The owner tries PR 1 within five minutes of merging it: from the repository on branch `build-1`, run `claude plugin marketplace add . --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local` (the route harness-core verified loads the repository in place and leaves it writable), then open `claude --agent flight:pilot --effort high`, see the session brief listing the `build-1` workshop and its waiting questions, and type `/flight:workshop new tea-timer make me a tea timer page`. Dogfooding starts the moment PR 1 is merged: this very build lives in its own workshop (`.flightdeck/build-1/`), and the second build run that makes PRs 2 to 10 is flown by the pilot and crew that PR 1 installed, while the laboratory from PR 3 drills the other PRs before the owner merges them. Nothing half-built is used to build: only merged, owner-tried content flies the next stage.

## 2. Decisions the owner left to the lead

Each decision is shown as the choice, then a one-line reason. All of them are open to the owner's veto on the review page.

### (a) What "working" means for each part

- Choice: a part works when three things are true. (1) Checkable: a check an agent can run passes (static structure check, hook tests, `claude plugin validate .`, and the part's own eval cases; deterministic checks must pass every time, model-graded cases must pass at least 2 of 3 runs). (2) Tryable: the owner's five-minute try, as written in the PR, succeeds when the human imposter follows it literally. (3) Improvable: the part ships at least one eval case or drill, so the laboratory can measure it and climb it later. The per-part check is listed in section 3.
- Reason: the owner said "show me something that works great and fits the goal"; a check proves "works", the imposter's try proves "great for me", and an eval case is what turns a one-off build into a machine that improves.

### (b) Where everything goes

- Choice: the repository root is the plugin root. Plugin components sit at the root where Claude Code looks for them: `agents/`, `skills/`, `hooks/`, `workflows/`, `output-styles/`, `bin/`, plus `manuals/` and `library/` (FlightDeck's own knowledge, shipped with it). `.flightdeck/` is the project's FlightDeck home: owner documents, workshops, and (in projects other than this one) the project's own manuals and library. `lab/` is the laboratory (not used by the plugin at run time). `.claude/` keeps only the owner's existing dev-workspace setup; FlightDeck puts nothing new there and PR 1 removes `.claude/agents/adversary.md` (it moves into the plugin with its model fixed). Reason: plugin agents and skills load from the root with no protected-path prompts, while every write to `.claude/` is a protected-path write and dev-workspace already restores `.claude/rules/` across branches (`dev/workspace/workspace-config.yml`, workspace_protection), so FlightDeck rules would fight it.
- Rules without `.claude/rules/`: FlightDeck's always-on project instructions are a short root `CLAUDE.md` (loaded in this repository; `claude plugin validate` warns that a plugin-root CLAUDE.md is not loaded as plugin context, which is expected and harmless here). Rules for where the work happens are nested `CLAUDE.md` files: `.flightdeck/CLAUDE.md` (workshop rules, loaded when an agent touches `.flightdeck/`) and `lab/CLAUDE.md` (lab rules). In other projects, where a plugin cannot ship CLAUDE.md, the `SessionStart` hook prints the brief and the workshop skill copies `.flightdeck/CLAUDE.md` into the project the first time it creates a workshop. Reason: rules sit "where the work happens", as VISION asks, and nothing depends on a location the plugin cannot ship.
- The layout after all PRs:

```
.claude-plugin/plugin.json, marketplace.json   plugin and marketplace (existing; descriptions added)
CLAUDE.md                                      short project rules for this repository
README.md                                      install and try lines
agents/                                        pilot, worker, explorer, reviewer, adversary, imposter, librarian
skills/flight/                                 hub: what FlightDeck is, ranks, where things are
skills/workshop/                               new, open, status, retry, close; template/ skeleton
skills/interview/                              draw truth out in bundles of at most five questions
skills/teams/                                  team dispatches, entry text per seat, workflow patterns
skills/launch/                                 pick a shape from a workshop and fly it
skills/pages/                                  themed HTML templates with paste-back
skills/promote/                                move decisions to global places
skills/library/                                ask the librarian, review against manuals, file an explanation
hooks/hooks.json, session-brief.mjs, owner-files-guard.mjs
workflows/                                     second-opinion, build, research, decide, refresh
output-styles/flight-deck.md                   opt-in flight voice
bin/flight                                     small CLI
manuals/                                       operator, technical, maintenance (FlightDeck's own)
library/                                       distilled pages; library/source/ stays as downloaded
.flightdeck/                                   VISION.md, build.txt, README.md, CLAUDE.md
.flightdeck/workshops/<name>/                  one folder per piece of work (see 2c)
.flightdeck/build-1/                           this build, shaped as a workshop
lab/                                           CLAUDE.md, checks/, evals/, drills/, fixtures/, climbs/, personas/, workflows/
dev/                                           dev-workspace, untouched
```

- A workshop folder holds exactly these, each created only when needed: `brief.md` (the owner's four fields from the owner's own idea note `workshop.txt`: title, work, done, verify; done and verify may start as placeholders), `truth.md` (the owner's statements, one dated line each, frontmatter `write: "human"`), `decisions.md` (dated decisions with a one-line reason and an optional `promote:` target), `questions.md` (questions waiting on the owner, in bundles), `log.md` (one entry per attempt: the one thing changed, outcome, the owner's diagnosis line), `attempts/attempt-N/` (everything one attempt produced: launch note, reports, verification, pages), and `pages/` (the latest HTML pages for the owner). There is no status field and no state file: the latest attempt is the highest-numbered folder, and open questions are the unanswered entries in `questions.md`. Reason: the flightcrew lesson "a folder listing is state" and the owner's anger at invented `run.json` and `HALT.json`.
- `.flightdeck/build-1/` is treated as a workshop without moving it (moving would break `plan.js` and the owner's instructions): PR 1 adds `brief.md` pointing to `build.txt` and `VISION.md`, and `constraints.md` plays the role of `truth.md`. The session brief hook finds workshops as any folder under `.flightdeck/` or `.flightdeck/workshops/` that holds a `brief.md`.

### (c) How a retry works

- Principle, from the flightcrew retry doctrine (`flightcrew-buildout:flightdeck/manuals/orchestration/endings.md`): setup carries over, run output does not. The inputs (brief, truth, decisions, answered questions) are the investment; an attempt is disposable and is never edited after it ends. A retry is a new attempt against improved inputs, with one recorded change, not a resume of the old run.
- Whole build: the owner adds dated lines to `.flightdeck/build-1/constraints.md` (format `2026-10-12 all: <constraint>`), then asks Claude to rerun the planning workflow (`.flightdeck/build-1/workflows/plan.js`, args `{"outDir": ".flightdeck/build-1", "attempt": 2}`) or, for a retry of the building only, the build workflow with `{"prs": [...], "attempt": 2}`. Git keeps the earlier plan; build attempts are kept apart by attempt numbers in branch names (`build-1-pr05-pages-a2`) and folders (`.flightdeck/build-1/build/pr-05/attempt-2/`). The earlier pull request stays open or is closed by the owner; no branch is ever deleted.
- One pull request: the owner adds a line naming it (`2026-10-12 PR 5: the questions page must show my recommended answer first`) and asks for `{"prs": [5], "attempt": 2}`. Only that PR's pipeline runs; it branches from the current `build-1`, so accepted PRs are already underneath it. The brief writer for that PR includes every `all:` line and every `PR 5:` line, so the change is carried in the input, not patched into the old output.
- Any workshop (PR 2 onward): `/flight:workshop retry <name>` asks for the one change (a new truth line, a ruling in `decisions.md`, a corrected done line), writes it, writes the previous attempt's log entry with the owner's diagnosis line (the owner may answer "skip"), then opens `attempts/attempt-N+1/` and branch `ws/<name>/a<N+1>`. Earlier attempts and their branches stay.
- Reason: the owner said "if it don't like some things i might add more constraints, scoping, truth etc and you try again", and "runs should accumulate many retries until they succeed".

### (d) How big the build is and what to cut first

- Size: 10 pull requests, about 150 files and 9,000 lines in total, most of it markdown (agent bodies, skills, manuals, library pages, templates) with about 2,000 lines of JavaScript (hooks, checks, workflows, CLI, pages scripts). PR 1 is the largest at about 47 files and 2,300 lines. Sizes per PR are in section 4.
- Cut order if it is too big (cut from the top): (1) PR 10 status band mod; (2) PR 8 `flight` CLI; (3) PR 5's extra page templates, keeping only the questions page; (4) PR 4's `research` and `decide` workflows, keeping only `build`; (5) PR 7's `refresh` workflow, keeping the manuals, library and librarian; (6) PR 9 roleplay voice. Never cut PR 1, PR 2 (workshops that remember) or PR 3 (the laboratory): they are the machine that improves. Inside PR 1, the first things to trim are the fifth team file (fit-n-trim) and two of the four eval cases.
- Reason: the owner said "if i like it but its too big, I cut it down", and the angle says the memory and the lab are the core while interfaces are replaceable.

### (e) How the owner starts a piece of work

- Choice: three doors to the same place, none of them a form. (1) Plain chat: just talk; FlightDeck does nothing unless asked. (2) In any session say "start a workshop for X" or type `/flight:workshop new <name> <rough ask>`: the workshop folder is made and `brief.md` is written from the owner's own words, with done and verify proposed as questions rather than invented as facts. From PR 2 a short interview follows (an explorer wave first, then at most one bundle of five questions about the owner's ideas, never about agent-written text), and its answers become `truth.md` lines in the owner's words. (3) `claude --agent flight:pilot --effort high` opens the single entry point: the pilot greets, lists workshops and waiting questions, and takes rough asks. From PR 5 the prompt builder page produces the same rough ask to paste. Work only starts when the owner says "go" (from PR 4, "go" runs `/flight:launch`). There are no IDs, no typed orders and no approval flags.
- Reason: owner-truth section 5.1: rough chat, a short interview that draws the owner's truth out, then go; "the one thing the human wants control of is what his agents do".

### (f) Where questions waiting on the owner are held

- Choice: in `questions.md` inside the workshop the question belongs to, as bundles of at most five questions, each with a plain "why", options, and a recommended option. Agents in the background (workflow agents, officers, teammates) never wait on the owner in chat; they write the question there and carry on with what they can. The `SessionStart` hook counts and names open questions across workshops in the session brief so they are never buried. From PR 5, `/flight:questions` renders them on one themed page with answer boxes and a "Copy my answers" button; the owner pastes the block back into chat and the agent files the answers (a proposed truth line goes into `truth.md` only through the owner-files guard). A live session may also ask with Claude Code's own question tool, but it records the question and answer in the file too.
- Reason: questions must survive sessions and retries and must not be "hundreds of lines up"; subagents cannot ask the owner at all (harness-core: background subagents lose `AskUserQuestion`).

### (g) dev-workspace

- Choice: FlightDeck sits beside dev-workspace for this build. It never writes under `dev/` or `.claude/rules/`, does not need the `dw` command, and its workshops in `.flightdeck/` are the next-era counterpart of `dev/workspace/` folders. The PR 8 CLI's `flight commit` commits `.flightdeck/` files the way `dw commit` commits workspace files, without replacing it. Whether FlightDeck later replaces dev-workspace is left open, and no retirement plan is written. The structure check fails any PR that changes a file under `dev/` or `.claude/rules/`.
- Reason: the owner's "dev can stay"; VISION frames FlightDeck as the next era but does not say replace; the build environment may not have `dw`.

## 3. Parts: every VISION section mapped

Each part lists: what it is; files; Claude Code features used; what working means as a check; the pull request.

### 3.1 Accelerate Claude Code

- What: FlightDeck's content fills Claude Code's own slots (agent definitions, skills, hooks, CLAUDE.md, workflows, output style) and keeps context fresh: a short root CLAUDE.md of gotchas only, nested CLAUDE.md files that load only where the work is, skill descriptions kept short, a session brief that is tiny and shorter after compaction, and (PR 7) a refresh workflow for manuals.
- Files: `CLAUDE.md`, `.flightdeck/CLAUDE.md`, `lab/CLAUDE.md`, `agents/*.md`, `skills/*/SKILL.md`, `hooks/hooks.json`, `hooks/session-brief.mjs`, `.claude-plugin/*.json`.
- Features: plugin agents (`flight:<name>`), plugin skills (`/flight:<name>`), plugin `hooks/hooks.json` with a `SessionStart` command hook in exec form reading `source`, nested CLAUDE.md loading on demand, local marketplace install.
- Working: `claude plugin validate .` passes; `node lab/checks/structure.mjs` passes (root CLAUDE.md under 200 lines, Claude Code's own stated target; each skill's description plus `when_to_use` under 1,536 characters, the listing cut-off; no agent field that plugins ignore; every referenced file exists); `node --test lab/checks/` shows the session brief prints at most 15 lines on startup and at most 3 on `compact` (chosen so the brief costs a few hundred tokens, after the cockpit's 13,000-token start; the owner may change the numbers), and prints nothing in a project without `.flightdeck/`.
- PR: 1 (refresh in PR 7).

### 3.2 Roleplay

- What: the owner's chain commander (the human), pilot (the lead agent), officers (background sessions), crew (worker agents), carried cheaply: rank lines in agent descriptions and the hub skill (PR 1), then an opt-in output style that speaks as the flight deck and addresses the owner as Commander, callsigns for crew, and a themed greeting (PR 9). No vocative rules, records or approval flags.
- Files: `skills/flight/ranks.md` (PR 1), `output-styles/flight-deck.md`, `skills/flight/callsigns.md`, an edit to `hooks/session-brief.mjs` greeting (PR 9).
- Features: plugin output styles (selected with `/output-style flight:flight-deck`; not forced), agent descriptions.
- Working: eval case `pr09-voice` (with the style on, the reply to "status?" addresses the Commander and stays under 8 lines; with it off, plain chat has no theme); structure check confirms the style is not `force-for-plugin`.
- PR: 1 (ranks), 9 (voice).

### 3.3 Themed HTML page suite

- What: self-contained HTML pages the agent fills from workshop files and the owner reads in a browser, each ending in one export button that builds a reply to paste back. Templates: questions (bundles with answer boxes), workshop board (workshops, attempts, waiting questions, decisions to promote), prompt builder (pick a workshop, a shape, crew, extra constraints, and copy a ready prompt), pull request explainer (the diff with severity notes). One shared flight-deck look (a pre-flight checklist feel), light and dark, phone width, no network except Google Fonts.
- Files: `skills/pages/SKILL.md`, `skills/pages/theme.css`, `skills/pages/answer-format.md`, `skills/pages/templates/{questions,board,prompt-builder,pr-explainer}.html`, `lab/checks/pages.test.mjs`.
- Features: a skill with supporting files reached through `${CLAUDE_SKILL_DIR}`; templates carry a `<script type="application/json">` data slot that the agent fills, and the page's own script renders it, so pages are consistent and checkable. No server is needed (PR 8 adds an optional localhost server).
- Working: `node --test lab/checks/pages.test.mjs` (each template parses, loads nothing but Google Fonts, has exactly one export button, renders a fixture data block with every question visible); the imposter answers a fixture questions page and the pasted block parses back into `questions.md` with every answer filed.
- PR: 5.

### 3.4 Workshops

- What: one folder per piece of work holding ask, truth, decisions, questions, log and attempts (layout in 2b); created by a skill, retried by a skill, closed with a short closing note (what worked, scars, how to reopen); truth drawn out by a short interview and protected so only the owner can add it.
- Files: `skills/workshop/SKILL.md`, `skills/workshop/template/{brief,truth,decisions,questions,log}.md`, `skills/workshop/flightdeck-CLAUDE.md` (copied to `.flightdeck/CLAUDE.md` in new projects), `hooks/owner-files-guard.mjs` (PR 1); `skills/workshop/retry.md`, `skills/workshop/close.md`, `skills/interview/SKILL.md`, `skills/interview/bundle-format.md` (PR 2).
- Features: skills; a `PreToolUse` hook on `Edit|Write` that returns `ask` when the target file (or the new content) has frontmatter `write: "human"`, so any agent write to `truth.md`, `constraints.md` or `VISION.md` stops for the owner (the frontmatter is the owner's own existing convention in VISION.md and constraints.md); the question tool in the main thread for live interviews; files for interviews in the background.
- Working (PR 1): eval case `pr01-workshop-fires` ("start a workshop for a tea timer" creates `.flightdeck/workshops/tea-timer/brief.md` with the owner's words and done/verify as questions); hook tests show the guard asks on a `write: "human"` file and allows anything else, and the hook command resolves through `${CLAUDE_PLUGIN_ROOT}`. Working (PR 2): eval cases `pr02-bundle-limit` (no bundle over five questions, every question has a why and a recommendation), `pr02-no-approval-questions` (no question asks the owner to approve agent-written text), `pr02-retry-keeps-attempts` (retry makes `attempt-2` and leaves `attempt-1` byte-identical), and the drill `interview-withheld-fact` (the interviewer finds a fact the imposter persona holds back).
- PR: 1 (skeleton, create, guard), 2 (interview, retry, close).

### 3.5 Launches

- What: the act of flying a workshop. `/flight:launch` reads the workshop, asks the oracle question ("what tells us the work is right?") and answers it from `brief.md`'s verify line, picks the smallest shape that fits and says why in one line, writes `attempts/attempt-N/launch.md` (shape, crew, models, expected agent count, base branch, attempt branch), and runs a saved workflow with the workshop path and attempt number as args. Reading of "launch versus workshop" for the owner to correct: the workshop is the place and its memory; a launch is one flight from it; an attempt is what a launch leaves behind.
- Shapes: shipped as runnable workflows: `build` (one worker per unit in its own worktree, reviewer, adversary, fix once, pull request into the workshop's base branch), `research` (explorer wave on separate angles, synthesis, claim check, report page), `decide` (several options, pairwise tournament, a page for the owner to pick). Described as patterns for Claude to write when needed (in `skills/teams/patterns.md`): root cause, critique panel, migration, plus the six workflow patterns from the dynamic workflows post. Officers: a long launch can run as a background session (`claude --bg --name ws-<name> --settings '{"worktree":{"baseRef":"head"}}' --agent flight:pilot "/flight:launch <name>"`), so its edits branch from the current branch and not from main. Agent teams with a live adversary are an interactive recipe in `skills/teams/` (they cannot run unattended).
- Files: `skills/launch/SKILL.md`, `workflows/build.js`, `workflows/research.js`, `workflows/decide.js` (PR 4); `skills/teams/SKILL.md`, `skills/teams/patterns.md`, team files, `workflows/second-opinion.js` (PR 1).
- Features: dynamic workflows (`agent`, `parallel`, `pipeline`, `phase`, `args`, `schema`, per-agent `model` and `effort`, `agentType: 'flight:worker'`), plugin `workflows/` (run as `/flight:<name>`; fallback: the Workflow tool with the script path), explicit worktrees created with `git worktree add .claude/worktrees/<branch> -b <branch> <base>` so the base branch is always named (avoids the `worktree.baseRef` default of main), `gh pr create --base <base>`.
- Working: eval cases `pr04-smallest-shape` (a one-file typo fix in a workshop gets "plain chat, no launch" and a three-unit feature gets `build`), `pr04-writes-into-attempt` (all launch output lands in `attempts/attempt-N/`); a drill flies `build` on the fixture project and the result is a pull request against the fixture's base branch with review, adversary and imposter findings in the attempt folder. Structure check: every workflow starts with a literal `export const meta`, ends with `return`, has no `export default`, no `Date.now`, no `Math.random`, no absolute user paths, and no effort above `high`.
- PR: 1 (team dispatches, patterns, second-opinion), 4 (launch skill and shapes).

### 3.6 Local CLI

- What: `flight`, a dependency-free Node script with five commands: `status` (workshops, latest attempts, open questions; `--json`), `new <name>` (same skeleton as the skill), `commit` (stage and commit only `.flightdeck/` files with a summary message), `check` (run `lab/checks/`), `serve` (serve `.flightdeck/` pages on 127.0.0.1 only with a per-run token; read-only, no command execution from page input).
- Files: `bin/flight`, `bin/README.md`, `lab/checks/cli.test.mjs`.
- Features: plugin `bin/` (added to the Bash tool's PATH while the plugin is enabled; documented, not yet run here, so the fallback is `node bin/flight`).
- Working: `node --test lab/checks/cli.test.mjs` on a temp fixture (status lists the fixture workshops and question count; `commit` refuses to stage anything outside `.flightdeck/`; `serve` binds 127.0.0.1 and rejects a request without the token); the whole system still works with the CLI deleted (structure check: no skill or agent requires it).
- PR: 8.

### 3.7 dev-workspace

- What: sits beside (decision 2g). FlightDeck's workshops are the agentic-era counterpart of `dev/workspace/`; `dw` stays the owner's git and archive tool.
- Files: none of its own; the rule lives in root `CLAUDE.md` and the structure check.
- Working: structure check fails a PR whose diff touches `dev/` or `.claude/rules/`; the session brief works with `dw` absent (tested in this sandbox, where it is absent).
- PR: 1.

### 3.8 Cheap tokens, smart agents

- What: each agent names its own model and effort in its file (the owner: "correct location is agent body"): pilot and adversary on Opus at high effort; worker, reviewer, imposter and librarian on Sonnet 5.5; explorer on Haiku. Workflows pass `model` and `effort` per agent explicitly. Explorer waves gather cheaply before any Opus agent reads. Eval graders use Haiku (the `claude plugin eval` default judge) and are raised to Sonnet only where a calibration sample shows Haiku disagrees with the owner. Every attempt's verification note lists which tier did each step.
- Files: `agents/*.md` frontmatter, every workflow, `lab/checks/structure.mjs`.
- Features: agent `model` and `effort` frontmatter (Opus 5.5 defaults to medium, so `effort: high` is set explicitly); workflow per-agent `model` and `effort` (effort is documented only in the workflow-authoring skill; `plan.js` already uses it, and the build pre-flight confirms it once); aliases `opus`, `sonnet`, `haiku`, which resolve to the 5.5 models on this provider.
- Working: structure check fails on `fable`, `best`, `xhigh`, `max` or `ultracode` anywhere in `agents/`, `skills/`, `workflows/`, `lab/workflows/`, `.flightdeck/build-1/workflows/`, and fails any `model: opus` agent without `effort: high`.
- PR: 1.

### 3.9 Built with quality

- What: every part is a folder with its own check, and any advanced PR can be rejected without breaking the others: advanced PRs add new files and edit only files they own (ownership listed per PR in section 4). The laboratory's sweep drill breaks one part at a time and confirms some check notices.
- Files: `lab/checks/structure.mjs`, `lab/checks/hooks.test.mjs` (PR 1); `lab/drills/sweep/drill.md`, `lab/workflows/sweep.js` (PR 3).
- Features: Node built-in test runner, `claude plugin validate`, `claude plugin eval`, dynamic workflows with worktree isolation for the sweep.
- Working: checks print one line per case (`pass <case>` or `FAIL <case>: <reason>`), then `<n>/<m> passed`, and exit 0 or 2 (the flightcrew suite protocol); the sweep drill reports, for each mutated part, which check failed, and lists any part whose mutation nothing caught as a finding.
- PR: 1 (checks), 3 (sweep).

### 3.10 Human energy

- What: the owner's truth goes into improvable documents once and is reused: `truth.md` lines, decisions with reasons the owner can overrule ("the commander denies, he does not decide"), rubrics written as yes-is-pass questions, the commander persona the imposter uses, eval cases the owner confirmed once, manuals. Questions reach the owner rarely, bundled, with recommendations, and the human imposter pre-tests every question set so tedious or jargon-filled questions are fixed before the owner sees them.
- Files: `lab/personas/commander.md` (built from dated quotes in `dev/workspace/research/repo-reset/user-intent.md` and `.flightdeck/build-1/research/owner-truth.md`), `agents/imposter.md` (PR 1); `skills/interview/` (PR 2); `skills/promote/` (PR 6); `library/rubric-guide.md` (PR 7).
- Features: files, the owner-files guard hook, the imposter agent.
- Working: imposter check on every PR that asks the owner anything (no question the persona answers "I don't know, you're the expert"; no undefined term; no more than five questions per bundle); eval case `pr06-truth-reused` (a truth line written in one workshop shows up as a CLAUDE.md gotcha after promotion and changes an agent's behaviour in a fresh session).
- PR: 1, 2, 6, 7.

### 3.11 Keep it simple

- What: installing FlightDeck changes nothing about plain chat. No default agent is set through the plugin's `settings.json`, the output style is opt-in, the session brief prints nothing in a project without `.flightdeck/`, and every feature is a `/flight:` skill or the pilot, used only when asked.
- Files: `hooks/session-brief.mjs`, skill descriptions, `.claude-plugin/` (no plugin `settings.json`).
- Features: skill descriptions as trigger conditions; `disable-model-invocation: true` on skills with side effects (launch, retry, promote) so Claude never starts them on its own.
- Working: eval case `pr01-plain-chat-quiet` ("fix the typo in README.md" in this repo fires no FlightDeck skill and spawns no FlightDeck agent; should-not-fire); structure check confirms there is no plugin `settings.json` and launch/retry/promote skills set `disable-model-invocation: true`.
- PR: 1.

### 3.12 Manuals and libraries

- What: FlightDeck's three manuals (operator: how to use it day to day; technical: how the parts fit and the Claude Code facts they rely on, each with source and date; maintenance: how to change an agent, skill, hook or workflow safely and how to run the checks, plus the correction ladder "a correction that recurs becomes a rule, a rule that keeps being broken becomes a hook"), and a library of distilled pages that cite `library/source/` (rubric guide, adversarial mandate, crew design, retry doctrine, the seven classes of check, evals and hill-climbing, multi-agent traps, a harness claims register). A Sonnet librarian presides: answers questions from the corpus with citations, reviews work against it ("does this follow our manuals?"), files a long explanation as a manual page instead of handing it to the owner, and a `refresh` workflow keeps pages fresh. Each page carries frontmatter `sources:` and `checked:` (a date), and at most about 100 lines per manual page (the cockpit manual standard).
- Files: `agents/librarian.md`, `skills/library/SKILL.md`, `workflows/refresh.js`, `manuals/{operator,technical,maintenance}.md`, `library/{rubric-guide,adversarial-mandate,crew-design,retry-doctrine,verification-classes,evals-and-climbing,multi-agent-traps,harness-register}.md`.
- Features: plugin agent, skill, workflow (Haiku sweep for pages whose `checked:` date is over 30 days old or whose cited source changed in git, Sonnet librarian re-checks and edits, Opus adversary spot-checks a sample), `curl` of the live Claude Code docs as harness-core describes.
- Working: eval cases `pr07-librarian-cites` (an answer cites a page and line; "not found" is allowed) and `pr07-file-it` (a 60-line explanation becomes a manual section, and the chat reply to the owner is under 10 lines); structure check that every library and manual page has `sources:` and `checked:` and every cited path exists.
- PR: 7.

### 3.13 Laboratory

- What: the place where FlightDeck is evaluated, drilled and improved, kept apart from real work. Evaluations are `claude plugin eval` cases (`lab/evals/<case>/prompt.md` plus `graders/*.md`, run three times each, with and without the plugin), tagged by part and split into `train` and `test`. Drills are deliberately small runs that discover how something behaves (for example a live adversary teammate against a cold workflow adversary on the same fixture). Climbs hill-climb one document at a time: one change per round, kept only if train and test both rise beyond the measured noise, reverted otherwise, with a no-edit round that sorts remaining failures by cause after two stalled rounds, and a report that says "within noise, do not merge" when that is the truth. Fixtures include the `export-html` toy project from `run/flightcrew-characterization-2`.
- Files: `lab/README.md`, `lab/evals/README.md`, `lab/drills/{sweep,live-vs-cold-adversary,team-roles-from-plugin}/drill.md`, `lab/fixtures/export-html/` (copied), `lab/climbs/README.md`, `lab/workflows/climb.js`, `lab/workflows/sweep.js` (PR 3). Every other PR adds its own `lab/evals/prNN-*` cases.
- Features: `claude plugin eval` (verified present on 2.1.296: `prompt.md` plus `graders/*.md`, `--tag`, `--eval-dir`, `--runs`, `--judge-model`, `--max-cost-usd`, HTML report), dynamic workflows, worktree isolation per trial so no trial sees another's files or git history.
- Working: `claude plugin eval . --eval-dir lab/evals --tag pr01 --runs 3 --max-cost-usd 5` runs and writes a report; the sweep drill runs end to end on PR 1's content; the first climb is flown during dogfooding on `skills/workshop/SKILL.md`'s description (should-fire and should-not-fire cases) and leaves `lab/climbs/workshop-description/climb.md` with each round's change, train and test scores, and kept or reverted.
- PR: 3 (and cases in every PR).

## 4. Pull requests, in order

Ownership rule for all PRs after PR 1: each advanced PR adds new files and edits only the existing files listed as its own below. This keeps PRs 2 to 10 independent of each other, so any of them can be rejected or retried alone; they all depend only on PR 1 being merged. Every PR must pass the common checks: `claude plugin validate .`, `node lab/checks/structure.mjs`, `node --test lab/checks/`, its own eval cases (`--tag prNN`), review, adversary and human imposter, and "no file outside the PR's list changed".

### PR 1: Basic flight deck (crew, rules, hooks, workshop skeleton)

- Purpose: put FlightDeck's Claude Code content in Claude Code's own places and lay down the core files and locations, so the owner can install the plugin, meet the pilot and crew, start a workshop, and get a second opinion on anything. Only Claude Code content (agent definitions, skills, hooks, CLAUDE.md files as rules, plugin manifests, one workflow) plus core files (team dispatches with entry text per seat, workflow patterns, the workshop skeleton, the structure check that every later PR relies on, and the commander persona the imposter uses).
- Files (about 47 files, about 2,300 lines):
  - `CLAUDE.md` (new, about 50 lines: what this repository is, where things are, the owner's writing rules, one home per thing, files with `write: "human"` are the owner's, never push to main, never force-push, never delete a branch, model ceiling, INTENT.md and HISTORY.md are history not canon).
  - `.flightdeck/CLAUDE.md` (new, about 40: the workshop file set and who writes each file, questions go to `questions.md` in bundles, decisions carry reasons, attempt output stays in its attempt folder, never edit another workshop).
  - `.flightdeck/README.md` (rewritten, about 30: index of `.flightdeck/`).
  - `.flightdeck/build-1/brief.md` (new, about 15: build-1 as a workshop; truth is `constraints.md`).
  - `.flightdeck/build-1/workflows/plan.js` (one edit: `agentType: 'flight:adversary'`).
  - `.claude/agents/adversary.md` (removed; becomes `agents/adversary.md`).
  - `.claude-plugin/plugin.json` (version 0.2.0, description), `.claude-plugin/marketplace.json` (add description).
  - `README.md` (rewritten, about 40: install and try lines).
  - `agents/pilot.md` (about 90; Opus, effort high; the lead: "look in order to decide, dispatch in order to do", decide then propose, verify a crew report before acting, claims of done need the command and its output, quiet while a team flies, keep teammates alive until the team is done; tools Read, Grep, Glob, Bash, Write, Edit, Agent, Workflow, AskUserQuestion; adapted from `cockpit:flightdeck/.cockpit-archive/team/officers/pilot/pilot.md` with the session bookkeeping stripped).
  - `agents/worker.md` (about 60; Sonnet; adapted from `cockpit:.claude/agents/worker.md` and flightcrew `implementer.md`: owns only its paths, checks are fixed, halts with a typed reason `blocked`, `contradiction-found`, `over-budget` instead of guessing, commits by name, returns `complete` with the commands run).
  - `agents/explorer.md` (about 40; Haiku; read-only; one question in, a cited answer out with `path:line` pointers and confidence; "not found" is a full answer).
  - `agents/reviewer.md` (about 60; Sonnet; fresh context; judges a diff against the brief's done list; "the implementer wanted to merge; you do not"; Read, Grep, Glob, Bash; never edits).
  - `agents/adversary.md` (about 90; Opus, effort high; the current adversary body merged with `library/review/adversarial-mandate.md` from `cockpit`, typos fixed, no opening "provide your work" reply when the work is given; two dispatch modes in the body: live (seated from the start, reports to the lead only, re-attacks changed parts) and cold (spawned after the work is frozen, reads only the work and the criteria); a severity threshold so only correctness and stated requirements are findings).
  - `agents/imposter.md` (about 60; Sonnet; acts as the owner from a persona file; follows "try it" steps literally and reports where it got stuck; answers question bundles in the paste-back format; flags jargon, walls of text, approval-of-agent-text questions and questions it cannot answer).
  - `skills/flight/SKILL.md` (about 70; hub: what FlightDeck is, the three doors to start work, where things are, plain chat always works), `skills/flight/ranks.md` (about 30: commander, pilot, officers, crew, from the owner's `ranks.txt`).
  - `skills/workshop/SKILL.md` (about 70; new, open, status), `skills/workshop/template/{brief,truth,decisions,questions,log}.md` (5 files, about 10 lines each), `skills/workshop/flightdeck-CLAUDE.md` (same text as `.flightdeck/CLAUDE.md`; the structure check keeps them identical).
  - `skills/teams/SKILL.md` (about 60; how to form a team: state the goal, pick a team file, brief each seat with its entry text, write the result into the workshop; the three ways to fly a team: a dynamic workflow (unattended, default), an interactive agent team with a live adversary (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, interactive only), or officers in background sessions), `skills/teams/patterns.md` (about 80; the oracle question, the six workflow patterns, the proposed six shapes for the owner to correct, "when not to use a workflow"), `skills/teams/{recon,decision,idea-exploration,build-check,fit-n-trim}.md` (5 team dispatches, about 35 lines each: purpose, seats with agent type and model, shape, entry text per seat, end condition; adapted from the owner-flown rosters in `cockpit:flightdeck/.cockpit-archive/team/rosters/`).
  - `workflows/second-opinion.js` (about 80; reviewer, adversary and imposter in parallel on any file or diff the owner names, then one Opus summary; the runnable workflow pattern PR 1 ships).
  - `hooks/hooks.json` (about 25), `hooks/session-brief.mjs` (about 80; exec form, reads `source`; on startup or clear prints the branch, workshops with their latest attempt, and the count and names of open questions; on compact prints at most 3 lines; prints nothing without `.flightdeck/`; exits 0 on any error), `hooks/owner-files-guard.mjs` (about 60; `PreToolUse` on `Edit|Write`; returns `ask` with a plain reason for files whose frontmatter, or new content, says `write: "human"`; also for `.flightdeck/build.txt`; allows everything else; exits 0 on any error so a fault never blocks a session).
  - `lab/README.md` (rewritten, about 20), `lab/CLAUDE.md` (about 20), `lab/checks/structure.mjs` (about 200), `lab/checks/hooks.test.mjs` (about 120), `lab/personas/commander.md` (about 60; dated owner quotes on what the owner wants, hates, would say, and would not volunteer).
  - `lab/evals/pr01-workshop-fires/`, `pr01-plain-chat-quiet/`, `pr01-adversary-planted-defect/`, `pr01-adversary-control/` (4 cases, `prompt.md` plus `graders/*.md`, about 120 lines in all).
- Depends on: nothing.
- Try in under five minutes: `gh pr checkout <n>` (or merge, then `git switch build-1 && git pull`), `claude plugin marketplace add . --scope local`, `claude plugin install flight@DBHD-FlightDeck --scope local`, then `claude --agent flight:pilot --effort high`. You should see the session brief naming the `build-1` workshop. Type `/flight:workshop new tea-timer make me a tea timer page` and open `.flightdeck/workshops/tea-timer/brief.md`. Then type `/flight:second-opinion .flightdeck/workshops/tea-timer/brief.md` and read the three short verdicts. Finally ask an agent to edit `.flightdeck/VISION.md` and watch the guard ask you first.
- Checks: the common checks; `pr01-*` eval cases; the imposter completes the try steps above in at most 5 steps; `.claude/` has no new files.
- Size: about 47 files, about 2,300 lines.
- Retry: add `PR 1:` lines to `constraints.md`, rerun the build workflow with `{"prs": [1], "attempt": 2}`; a new branch `build-1-pr01-basic-a2` and a new pull request; the first stays for comparison.

### PR 2: Workshops that remember (interview, truth, retry, close)

- Purpose: make the workshop the owner's long-lasting input. A short interview draws the owner's truth out before work starts; a retry carries the inputs forward and starts a clean attempt; a close leaves a note on how to reopen. This is the heart of "retry work at any time" and "guide agents with truth where the work happens".
- Files (about 15 files, about 550 lines): `skills/interview/SKILL.md` (about 90; explorer wave first so nothing the repo already answers is asked; questions only about the owner's ideas, never approval of agent text; bundles of at most five, each with why, options and a recommendation; a skipped question stays open, never guessed; answers become `truth.md` lines in the owner's words, through the guard; two modes: live with the question tool in the main thread, or file mode through `questions.md` for background work and for the imposter), `skills/interview/bundle-format.md` (about 40; the bundle and paste-back block, adapted from `flightcrew-core:.../specs/interview/bundles/*.json` and `interview-session-conventions.md`), `skills/workshop/retry.md` (about 40), `skills/workshop/close.md` (about 30), edit to `skills/workshop/SKILL.md` (links the two spokes; this PR owns that edit), `lab/personas/commander-withholds.md` (about 30; a persona that holds back one fact), `lab/drills/interview-withheld-fact/drill.md` (about 40), `lab/evals/pr02-bundle-limit/`, `pr02-no-approval-questions/`, `pr02-retry-keeps-attempts/`, `pr02-truth-in-owner-words/` (4 cases, about 150 lines).
- Depends on: PR 1.
- Try in under five minutes: in the tea-timer workshop from PR 1, type `/flight:interview tea-timer`, answer the one bundle (or skip questions), and open `truth.md` to see your words, dated. Then type `/flight:workshop retry tea-timer`, give one change ("it must work offline"), and see `attempts/attempt-2/` next to an untouched `attempt-1/`.
- Checks: common checks; `pr02-*` cases; the interview loop in the build run (interviewer and imposter, up to three rounds) passes the mechanical checks: no bundle over five, no repeated question, no approval question, the withheld fact is found, every truth line quotes the imposter's words.
- Size: about 15 files, about 550 lines.
- Retry: `PR 2:` lines, `{"prs": [2], "attempt": 2}`.

### PR 3: Laboratory (evals, drills, fixtures, climbs)

- Purpose: give FlightDeck a lab that measures and improves its own documents. Built early so every later PR is drilled before the owner merges it, and so the first climb can show a real improvement.
- Files (about 18 files, about 1,000 lines plus the copied fixture): `lab/README.md` (edit, owned by this PR: what evals, drills and climbs are, how to run each, cost guard), `lab/evals/README.md` (case format, `pr`/part tags, train and test tags, should-fire and should-not-fire balance, a reference solution or note for every case), `lab/climbs/README.md` (the climb rules: one surface, one change per round, noise check first, keep only if train and test both rise, revert otherwise, no-edit sorting round after two stalls, never paste failing transcripts into the target, finish at the best test score, report "within noise" honestly), `lab/workflows/climb.js` (about 200; args: target file, eval tag, rounds at most 5, cost ceiling; Haiku runs evals twice for noise, Opus at high effort reads train transcripts only and proposes one change, a Sonnet worker applies it in a worktree, Haiku reruns train and test, the script keeps or reverts, a Sonnet writer produces `lab/climbs/<target>/climb.md` and a draft pull request with the best version), `lab/workflows/sweep.js` (about 120; for each part, a worktree copy with one defined break: flip a hook decision, drop an agent `name`, add `model: fable`, remove `export const meta`, delete a template file; run the checks; a part whose break nothing catches is a finding), `lab/drills/sweep/drill.md`, `lab/drills/live-vs-cold-adversary/drill.md` (owner-run, interactive: the same planted-defect fixture reviewed by a live adversary teammate and by `second-opinion`; record which finds more and at what cost), `lab/drills/team-roles-from-plugin/drill.md` (does an agent team accept `flight:adversary` as a teammate type; the docs only name project, user and managed scopes), `lab/fixtures/export-html/` (copied from `run/flightcrew-characterization-2:flightdeck/testbench/fixtures/sample-project/`), `lab/evals/pr03-climb-reverts/` (a fixture target where the proposed change only raises train; the climb must revert).
- Depends on: PR 1.
- Try in under five minutes: `claude plugin eval . --eval-dir lab/evals --tag pr01 --runs 1 --max-cost-usd 2` and open the HTML report it writes. Then ask the pilot "run the sweep drill on agents/explorer.md" and read the one-line result per break.
- Checks: common checks; the sweep runs end to end on PR 1's content and every break is caught or listed; `pr03-climb-reverts` passes; `node lab/checks/structure.mjs` still passes with `lab/workflows/` included in the ceiling check.
- Size: about 18 files, about 1,000 lines plus the fixture (about 8 small files).
- Retry: `PR 3:` lines, `{"prs": [3], "attempt": 2}`.

### PR 4: Launches (pick a shape, fly it, land a pull request)

- Purpose: turn "go" into a multi-agent flight from a workshop that ends as a reviewed pull request, with Claude choosing the smallest shape that fits and saying why.
- Files (about 10 files, about 800 lines): `skills/launch/SKILL.md` (about 90; reads the workshop; the oracle question; shape choice with a one-line reason; writes `attempts/attempt-N/launch.md`; runs the shape's workflow with `{workshop, attempt, base}`; the officer variant for long flights; `disable-model-invocation: true`), `workflows/build.js` (about 200; brief per unit, Sonnet workers each in an explicit worktree from the workshop's base branch, Haiku check runner, Sonnet reviewer, Opus adversary, Sonnet imposter where the work asks the owner anything, Opus triage, one Sonnet fix round, a pull request into the base branch, findings filed in the attempt folder, questions filed in `questions.md`), `workflows/research.js` (about 120; Haiku explorer wave on disjoint angles, Sonnet synthesis, Sonnet claim check, report in the attempt folder), `workflows/decide.js` (about 120; Sonnet generators with different angles, Opus pairwise judge in random order, a short page or list for the owner to pick from), `lab/evals/pr04-smallest-shape/`, `pr04-writes-into-attempt/`, `pr04-oracle-asked/` (3 cases).
- Depends on: PR 1. Works better with PR 2 (truth and retries) but does not need it.
- Try in under five minutes: in the tea-timer workshop say "go" or type `/flight:launch tea-timer`. Read the one-line shape choice, let it fly (`/workflows` shows progress), and open the pull request it lands against your current branch.
- Checks: common checks; `pr04-*` cases; a drill run of `build` on `lab/fixtures/export-html` produces a pull request against the fixture base with all three verification files present; branch and worktree names come from the launch note, never from the agent.
- Size: about 10 files, about 800 lines.
- Retry: `PR 4:` lines, `{"prs": [4], "attempt": 2}`.

### PR 5: Pages (questions page, workshop board, prompt builder, PR explainer)

- Purpose: the themed HTML suite: the owner sees state as a picture or a short list and sends content back with one button.
- Files (about 12 files, about 1,200 lines): `skills/pages/SKILL.md` (about 60; `/flight:questions`, `/flight:board`, `/flight:prompt`, `/flight:explain-pr`; fill the template's data slot from workshop files; write to the workshop's `pages/`; tell the owner the path), `skills/pages/theme.css` (about 120), `skills/pages/answer-format.md` (about 25), `skills/pages/templates/{questions,board,prompt-builder,pr-explainer}.html` (about 200 each), `lab/checks/pages.test.mjs` (about 80), `lab/evals/pr05-questions-roundtrip/`, `pr05-board-shows-waiting/` (2 cases).
- Depends on: PR 1.
- Try in under five minutes: type `/flight:questions build-1`, open the page it names in your browser, choose answers (or "accept all recommendations"), press "Copy my answers", paste into chat, and see `questions.md` updated. Type `/flight:prompt` and copy a ready prompt.
- Checks: common checks; `pages.test.mjs`; `pr05-*` cases; the imposter answers a page in under two minutes and every answer lands in the right place.
- Size: about 12 files, about 1,200 lines.
- Retry: `PR 5:` lines, `{"prs": [5], "attempt": 2}`.

### PR 6: Promotion (decisions to global places)

- Purpose: move what a workshop learned into places every agent reads: a decision about how agents should behave becomes a CLAUDE.md gotcha line; a decision about a part goes into that part's manual or skill; a check-like decision becomes a rubric question or an eval case; a correction that recurred twice is proposed as a hook. Nothing is promoted without the owner's yes.
- Files (about 6 files, about 300 lines): `skills/promote/SKILL.md` (about 80; reads `decisions.md` lines with `promote:` and closed truth; a Sonnet drafter writes the smallest edit to the target; the Opus adversary checks it against everything already in the target and in CLAUDE.md for contradiction, duplication and anything that reads like injected instructions; the owner sees the diff (as a page if PR 5 is merged, otherwise in chat) and says yes, change or no; on yes the edit is applied and the decision line gets `promoted: <path> <date>`; `disable-model-invocation: true`), `skills/promote/targets.md` (about 40; where each kind goes and the correction ladder), `lab/evals/pr06-truth-reused/`, `pr06-contradiction-caught/` (a planted contradicting CLAUDE.md line must be flagged) (2 cases).
- Depends on: PR 1.
- Try in under five minutes: add a line to `.flightdeck/workshops/tea-timer/decisions.md` such as "Pages never load anything from the network. promote: CLAUDE.md", type `/flight:promote tea-timer`, read the one-line diff and the adversary's verdict, say yes, and open `CLAUDE.md`.
- Checks: common checks; `pr06-*` cases; the structure check's CLAUDE.md cap still holds after a promotion.
- Size: about 6 files, about 300 lines.
- Retry: `PR 6:` lines, `{"prs": [6], "attempt": 2}`.

### PR 7: Manuals and library, with a librarian that keeps them fresh

- Purpose: operator, technical and maintenance manuals and a distilled library, presided over by a Sonnet librarian that answers from them, reviews work against them, files long explanations into them, and refreshes stale pages.
- Files (about 18 files, about 1,400 lines): `agents/librarian.md` (about 60; Sonnet), `skills/library/SKILL.md` (about 60; `/flight:ask`, `/flight:review-against`, `/flight:file-it`), `workflows/refresh.js` (about 120), `manuals/operator.md`, `manuals/technical.md`, `manuals/maintenance.md` (about 100 each), `library/rubric-guide.md`, `library/adversarial-mandate.md`, `library/crew-design.md`, `library/retry-doctrine.md`, `library/verification-classes.md`, `library/evals-and-climbing.md`, `library/multi-agent-traps.md`, `library/harness-register.md` (about 80 each; adapted from `cockpit:library/rubrics/rubric-guide.md`, `cockpit:library/review/adversarial-mandate.md`, `flightcrew-buildout:flightdeck/manuals/orchestration/crew.md` and `endings.md`, `flightcrew-buildout:flightdeck/manuals/testing/testing-description.md` with `verification-addendum.md`, `.flightdeck/build-1/research/sources.md`, and the claims in `harness-core.md` and `harness-multi.md` re-dated), `lab/evals/pr07-librarian-cites/`, `pr07-file-it/` (2 cases).
- Depends on: PR 1.
- Try in under five minutes: type `/flight:ask how do I retry a workshop?` and check the answer cites a manual line. Then type `/flight:refresh` with `--dry-run` wording ("list stale pages only") and read the list.
- Checks: common checks; `pr07-*` cases; every page has `sources:` and `checked:`; every cited path exists; the adversary spot-checks three harness-register claims against `library/source/claude-code/`.
- Size: about 18 files, about 1,400 lines.
- Retry: `PR 7:` lines, `{"prs": [7], "attempt": 2}`.

### PR 8: The `flight` command line

- Purpose: a handful of chores agents and the owner otherwise do with many git and shell steps: status, new workshop, commit FlightDeck files, run checks, serve pages locally.
- Files (about 3 files, about 400 lines): `bin/flight` (about 250, Node, no dependencies), `bin/README.md` (about 30), `lab/checks/cli.test.mjs` (about 120).
- Depends on: PR 1.
- Try in under five minutes: `node bin/flight status` (or `flight status` inside Claude Code's Bash, if `bin/` is on the PATH), then `node bin/flight new scratch`, then `node bin/flight commit` and `git log -1 --stat`.
- Checks: common checks; `cli.test.mjs`; with `bin/` deleted, every other check still passes.
- Size: about 3 files, about 400 lines.
- Retry: `PR 8:` lines, `{"prs": [8], "attempt": 2}`.

### PR 9: Roleplay voice (flight-deck style, callsigns, greeting)

- Purpose: make it fun: an opt-in flight-deck voice that addresses the owner as Commander with short radio-style status lines in plain words, callsigns for the crew, and a themed greeting in the session brief.
- Files (about 4 files, about 200 lines): `output-styles/flight-deck.md` (about 50; `keep-coding-instructions: true`), `skills/flight/callsigns.md` (about 30), edit to `hooks/session-brief.mjs` (greeting line; this PR owns that edit), `lab/evals/pr09-voice/` (1 case).
- Depends on: PR 1.
- Try in under five minutes: `/output-style flight:flight-deck`, restart Claude Code (styles are read at start), and say "status?". Switch back with `/output-style default`.
- Checks: common checks; `pr09-voice`; the brief stays within its line limits.
- Size: about 4 files, about 200 lines.
- Retry: `PR 9:` lines, `{"prs": [9], "attempt": 2}`.

### PR 10: Status band (optional mod, cut first)

- Purpose: a small band above the prompt showing the active workshop, a running launch and the number of questions waiting, plus a `/flightdeck` command that opens the questions page. Optional: mods are new (Claude Code 2.1.287 or later) and their API may change.
- Files (about 4 files, about 300 lines): edit to `hooks/hooks.json` (adds the `modules` entry; this PR owns that edit), `hooks/flight-band.js` (about 180), `types/index.d.ts` (state contract), `tests/band.test.ts` (about 80).
- Depends on: PR 1.
- Try in under five minutes: `/reload-plugins` and look above the prompt; type `/flightdeck`.
- Checks: common checks; `claude plugin validate .` lists the mod's events; `claude plugin test` passes; state kept in `$.state` only.
- Size: about 4 files, about 300 lines.
- Retry: `PR 10:` lines, `{"prs": [10], "attempt": 2}`.

## 5. The build run

The build is two workflow runs with the owner in between, because a workflow cannot wait for a person. Run A builds PR 1 only. The owner tries and merges it (or adds `PR 1:` constraints and reruns). Run B builds PRs 2 to 10 in parallel from the updated `build-1`, flown by the crew PR 1 installed. One script serves both: `.flightdeck/build-1/workflows/build.js`, run by path with the Workflow tool (it is a build tool, not a plugin command).

### Pre-flight (the lead in the main session, owner present, before launching)

- The owner starts the session with `claude --settings .flightdeck/build-1/workflows/build-settings.json --permission-mode auto` (for Run B: `claude --agent flight:pilot --effort high --settings ... --permission-mode auto`, so the pilot flies the run). `build-settings.json` (written and committed to `build-1` by the lead during the first pre-flight, before Run A; it lives outside `.claude/`, so no protected-path prompt) allows `Bash(git *)`, `Bash(gh pr create *)`, `Bash(gh pr view *)`, `Bash(node *)`, `Bash(claude plugin *)` and `Workflow`, and denies `Bash(git push * main*)`, `Bash(git push --force*)`, `Bash(git push -f*)`, `Bash(git push * --delete *)`, `Bash(git branch -D *)`, `Bash(git branch -d *)` and `Bash(gh pr merge *)`. Deny rules win over allow rules.
- The lead checks: on `build-1`, up to date with `origin/build-1`; `gh auth status`; for Run B the plugin is installed from the local marketplace and `flight:worker` is listed; one tiny Sonnet agent launched with `effort: 'high'` runs without error (confirms per-agent effort, which is documented only in the workflow-authoring skill); `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` is noted (default min(16, CPUs minus 2)).
- The lead passes args: `{"prs": [1], "attempt": 1, "stamp": "2026-10-11"}` for Run A, `{"prs": [2,3,4,5,6,7,8,9,10], "attempt": 1, "stamp": "..."}` for Run B. The date comes in through args because the script cannot read the clock.

### Script shape

- `export const meta = { name: 'flightdeck-build-1-build', description: 'Build FlightDeck build-1 pull requests from the approved plan', phases: [Brief, Build, Check, Verify, Fix, Land, Report] }` as the first statement, plain literals only; the body ends with `return`, never `export default`.
- Constants: `OUT = '.flightdeck/build-1'`, `PLAN = OUT + '/plan/plan.md'`, a CONTEXT block (binding documents, constraints first, git rules, writing rules, model ceiling) shared by every agent, `RUN_A = args.prs` equals `[1]` (Run A uses generic agents with inlined role text because the plugin agents do not exist yet; Run B uses `agentType: 'flight:<role>'`).
- Each PR flows through `pipeline(args.prs, brief, build, check, verify, fix, land)` so PRs move independently with no barrier; a stage that returns a halt passes it through to `land`, which opens a draft pull request explaining the halt. A final `agent` call writes the report after all pipelines finish.

### Stages, models and effort

- Brief (Opus, high, one per PR): reads `plan.md` section 4 for this PR, every `all:` and `PR n:` line in `constraints.md`, and the research reports the PR touches; writes `build/pr-NN/attempt-K/brief.md` (purpose, owned file list, done list written as yes-is-pass questions, check commands, try-in-five-minutes steps, VISION sections served, out of scope); returns `{slug, branch, worktree, owned[], checks[], try_steps[], parts[]}` with a schema. Branch is `build-1-pr<NN>-<slug>-a<K>` and worktree `.claude/worktrees/<branch>`, unique by construction so no two agents pick the same name.
- Build (Sonnet 5.5, high; `flight:worker` in Run B): the first part runs `git fetch origin && git worktree add .claude/worktrees/<branch> -b <branch> origin/build-1`, so the base is always `build-1`, never main; each part (a PR with more than about 15 files is split into two or three parts with disjoint files) runs sequentially in that worktree, writes only owned paths, and commits with a message naming the PR and part; returns `{status: complete | blocked | contradiction-found | over-budget, commits[], notes}`. Run A's PR 1 contains the only `.claude/` change in the build (removing `.claude/agents/adversary.md`); if that write prompts, the run pauses once for the owner, who is present.
- Check (Haiku, effort left at its default): in the worktree runs `claude plugin validate .`, `node lab/checks/structure.mjs`, `node --test lab/checks/`, the brief's checks, `git diff --name-only origin/build-1...HEAD` against the owned list, and `claude plugin eval . --eval-dir lab/evals --tag prNN --runs 3 --max-cost-usd 5 --json <attempt>/eval.json` (if `claude plugin eval` is unavailable on the account, it records "not run" and the review covers the cases by reading them); writes `checks.md` with exit codes and last lines; returns pass or fail per check.
- Verify (in parallel, each in a fresh context, none sees the others or the builder's transcript):
  - Review (Sonnet 5.5, high; `flight:reviewer`): brief plus diff only; findings of kind correctness-gap, scope-violation, missing-file, check-not-run; verdict.
  - Adversary (Opus, high; `flight:adversary`, cold mode): "The Work" is the diff and the files; "The Criteria" are the brief's done list, the VISION sections the PR serves, `build.txt`, `constraints.md`, the owner's pain list (`owner-truth.md` section 3) and, for any Claude Code claim, `harness-core.md` and `harness-multi.md`; only correctness and stated requirements are findings.
  - Human imposter (Sonnet 5.5, high; `flight:imposter` with `lab/personas/commander.md`): follows the try steps literally in the worktree (using `claude -p` for steps that need a session) and reports each place it got stuck and the step count; reads the PR's owner-facing words (README lines, page text, questions) as the owner and flags jargon, walls of text and tedious questions. For PR 2 the script runs a loop instead: an interviewer agent (Opus, high, interview skill in file mode) writes a bundle to a fixture workshop's `questions.md`, the imposter (with `commander-withholds.md`) answers it in the paste-back format, up to three rounds, then a Haiku agent runs the mechanical interview checks. For PR 5 the imposter answers the questions page fixture and the round trip is checked.
  - Each writes its findings to `review.md`, `adversary.md` or `imposter.md` in the attempt folder and returns `{findings: [{severity, where, finding, suggested_fix}], verdict}`.
- Fix (triage on Opus, high; fix on Sonnet 5.5, high, `flight:worker`; re-check on Haiku): the triage agent accepts or rejects each finding with a one-line reason (verifying factual claims against the cited source) and writes `verify.md`; if any accepted high or medium finding or any red check remains, one fix round runs in the same worktree, then the checks rerun. There is exactly one fix round (build, refute, fix once).
- Land (Sonnet 5.5, medium): writes `pr-body.md` (purpose; try it in five minutes; checks marked `[checked]`; review, adversary and imposter summaries marked `[reviewed]`; rejected findings with reasons; size; how to retry this PR alone; tiers used per stage), runs `git push -u origin <branch>` and `gh pr create --base build-1 --head <branch> --title "PR NN: <title>" --body-file <attempt>/pr-body.md`, adding `--draft` if any check is still red or the build halted; removes the worktree with `git worktree remove` (the branch stays); returns the URL.
- Report (Opus, high, after all pipelines): writes `.flightdeck/build-1/build/report-a<K>.md` and, if PR 5 is merged, a board page; appends any question for the owner to `.flightdeck/build-1/questions.md`; commits only `.flightdeck/build-1/build/` and `questions.md` to `build-1` and pushes `build-1` (never main).

### Numbers

- Run A: one pipeline, about 10 agents. Run B: nine pipelines of about 9 agents each plus PR 2's interview loop, about 90 agents, well inside the 1,000-agent cap; the concurrency cap queues them. Nothing runs above Opus at high effort; `ultracode` and `xhigh` are never used. Opus is used for briefs, adversary, triage, the interviewer and the report; Sonnet 5.5 for building, review, imposter and landing; Haiku for checks and mechanical counts.

## 6. Dogfooding

- This build is a workshop. PR 1 adds `.flightdeck/build-1/brief.md`; `constraints.md` is its truth (guarded as the owner's file); `build/pr-NN/attempt-K/` are its attempts; `questions.md` holds what the build needs from the owner (first entries: the proposed six shapes, the "launch versus workshop" reading, which PRs to merge first); `decisions.md` records the lead's choices from this plan so the owner can deny any of them. From the first session after PR 1 is merged, the session brief shows the build-1 workshop and its waiting questions.
- The crew builds the rest. Run B is flown by `flight:pilot` and uses `flight:worker`, `flight:reviewer`, `flight:adversary` and `flight:imposter` from merged PR 1, and the `build-check` team file is the same shape the build script uses. Only merged, owner-tried content flies; nothing from PRs 2 to 10 is used to build PRs 2 to 10 (the owner's "using half built systems, to build out the half built system is a fail HARD").
- The lab drills the open PRs. Suggested merge order after Run B: PR 3 first. The pilot then runs the sweep drill and each open PR's eval cases against its branch (testing, not building) and writes `.flightdeck/build-1/build/drills-a1.md`, so the owner sees which PRs survived being broken before merging them.
- The first climb is real. Once PRs 2 and 3 are merged, the lab climbs `skills/workshop/SKILL.md`'s description on should-fire and should-not-fire cases (at most 3 rounds, cost ceiling 10 USD); the result is a draft pull request with the better description and `lab/climbs/workshop-description/climb.md`, or an honest "within noise, do not merge". This is the owner's acceptance test "I can see the lab work".
- Promotion closes the loop. Once PR 6 is merged, `/flight:promote build-1` proposes moving this build's lasting decisions (for example "FlightDeck writes nothing into `.claude/`") into CLAUDE.md or the maintenance manual, each with the owner's yes.

## 7. Risks, and what not to build

### Risks and their fallbacks

- Plugin workflows (`/flight:<name>`) are documented but not yet run here. Fallback: run them with the Workflow tool by path (`workflows/<name>.js`); PR 1's imposter try step confirms which works and the operator manual says so.
- Per-agent `effort` in workflows is documented only in the workflow-authoring skill. Fallback: the pre-flight confirms it; if it is ignored, the session runs at `/effort high`, which is still the ceiling.
- `bin/` on PATH is not yet verified, and a top-level `bin/` stops the plugin installing on claude.ai and Cowork. Fallback: `node bin/flight`; PR 8 is cut second if this matters.
- `claude plugin eval` may be gated on some accounts. Fallback: the climb and check stages run each case's `prompt.md` with a Sonnet agent and grade with a Haiku agent using the same `graders/*.md` files.
- Agent teams may not accept plugin agent types as teammates (the docs name project, user and managed scopes). The `team-roles-from-plugin` drill finds out; the teams skill then says to spawn by description or copy one definition into `.claude/agents/` by hand.
- Background officers branch from main by default. The officer recipe passes `--settings '{"worktree":{"baseRef":"head"}}'`; this combination is unverified and is the first thing PR 4's try step checks.
- Writes into `.claude/` are protected. The plan keeps FlightDeck out of `.claude/` entirely; the one deletion in PR 1 may ask the owner once.
- After PR 1, `plan.js` refers to `flight:adversary`, which exists only when the plugin is installed. The README and session brief say "install the plugin before rerunning the planning workflow".
- A broken hook could block sessions. Both hooks exit 0 on any error, are located through `${CLAUDE_PLUGIN_ROOT}`, and the hook tests check the paths exist (the cockpit guard once blocked every tool call when its script moved).
- Promotion could bloat or poison CLAUDE.md. Each promotion needs the owner's yes, the adversary checks contradiction and injected instructions, and the structure check fails CLAUDE.md at 200 lines (Claude Code's stated target), while the promote skill reports its length on every promotion so growth is visible.
- The lab could burn tokens. Climbs run only when the owner asks, at most 5 rounds, with `--max-cost-usd`; eval runs in the build use `--runs 3` on the PR's own cases only.
- Truth could become tedious again (the owner's 2 October complaint). Truth is optional, drawn out by the interview, at most one bundle to start, and agents never ask the owner to approve their own text.
- The repository root as plugin root copies the whole repository (including `library/source/` and `lab/`) into the install cache on non-local installs. Acceptable for local use; moving the plugin to `plugins/flight/` is a later option, not part of this build.
- `.claude/rules/context.md` imports a file that does not exist (`dev/workspace/context/tree.md`). It belongs to dev-workspace; FlightDeck leaves it and notes it for the owner.

### What not to build

- No central runner like `fc`, no launch state machine (`launch.json`, phases, gate switches), no `run.json`, `HALT.json`, `escalation.json` or manifest files: the folder listing is the state.
- No record prefixes, IDs, approval states, schemas or linter for workshop files; no "enacted approval" of decisions. The owner denies; he does not have to decide.
- No nine-domain spec chain, spec freeze, or spec-builder agent; the interview writes short truth lines instead.
- No copies of the 27 cockpit-only seats, the 44-row crew manifest or `crew.json`; seven agents with entry text per seat are enough.
- No test suites that test the tooling for its own sake; checks are one structure script, small hook, page and CLI tests, and eval cases of behaviour the owner cares about.
- No default agent or forced output style through the plugin's `settings.json`; plain chat stays untouched.
- No local web server in the first rounds (pages open as files; `flight serve` is optional in PR 8), no vector store, no telemetry setup.
- No automatic promotion, no automatic climbs, no automatic launches: nothing starts without the owner.
- No agent teams as an unattended launch target, no `ultracode`, no `xhigh` or `max`, no `fable`.
- No changes to `dev/`, `.claude/rules/`, `INTENT.md` or `HISTORY.md`, and no plan to retire dev-workspace.
- Nothing pushed to `main`, no force-push, no deleted branch; the owner merges every pull request.
