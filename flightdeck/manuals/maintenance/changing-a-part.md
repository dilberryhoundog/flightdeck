---
shelf: maintenance
sources:
  - flightdeck/policies.md
  - flightdeck/agents/builder.md
  - flightdeck/hooks/hooks.json
  - flightdeck/hooks/guard.mjs
  - flightdeck/tests/core.test.mjs
  - flightdeck/skills/preflight/SKILL.md
  - flightdeck/skills/team-plans/SKILL.md
  - flightdeck/skills/team-plans/entry-points.md
  - flightdeck/workflows/library-review.js
  - lab/checks/hard-rules.mjs
  - lab/checks/manuals.mjs
  - lab/owned/pr1.txt
  - .flightdeck/build-1/context.md
  - .flightdeck/build-1/decisions.md
  - CLAUDE.md
  - .flightdeck/CLAUDE.md
checked: 2026-10-11
---

# Changing a part and testing it

How to change an agent, hook, skill, workflow or manual page without breaking the rules the checks hold, and how to keep a correction from being given twice.

Run the plugin's tests after every change: `node --test 'flightdeck/tests/*.test.mjs'`. On Node 22 always quote the glob; given a bare folder name the command fails with "Cannot find module" ([H30](../technical/harness-facts.md)). Then run the hard-rule check, described under "Ownership and the checks" below.

## An agent

An agent is one file in `flightdeck/agents/`. Copy `flightdeck/agents/builder.md` as a starting point and keep these rules.

- Frontmatter: `name` (the file name without `.md`), `description` (what the dispatcher reads to decide when to use the agent, under 300 characters), `tools` (an allowlist, so give only what the job needs), `model` and `effort`.
- Model and effort follow the function, not the rank: Opus for judging and leading, Sonnet for building and checking, Haiku for cheap reading. Every `opus` agent sets `effort: high`. Nothing goes above Opus at high effort, and `fable`, `best`, `xhigh` and `max` never appear as a value.
- No rank word (Commander, Captain, Officer, Worker) in the file name, `name:` or description. Rank is a seat given in the opening text.
- Exactly one line starting `Fallback rank: `, copied from `flightdeck/policies.md` (the three lines are listed there). Every agent but the pilot and runner uses the Worker line.
- Test: the content tests in `flightdeck/tests/core.test.mjs` read every agent file. Run the quoted glob above.

## A hook

Hooks are registered in `flightdeck/hooks/hooks.json` and run `flightdeck/hooks/guard.mjs` with a mode (`truth`, `git` or `ceiling`) or `flightdeck/hooks/preflight.mjs`. To change a rule, edit the matching function in `guard.mjs` and add a test for the refusal and one for what must still be allowed to `flightdeck/tests/core.test.mjs`.

A guard fails open: if it breaks, work continues. The one exception is the `git` rule, which fails closed and denies with "guard error". Keep it that way, and keep each guard's stated limit in `flightdeck/policies.md` true. A hook is a safety net, not a permission system, so say what it misses.

## A skill

A skill is a folder with a `SKILL.md`, like `flightdeck/skills/preflight/SKILL.md`. Frontmatter: `name`, `description` (under 400 characters; the descriptions of all skills together stay under 4,000), and `allowed-tools` where the skill runs commands. Set `disable-model-invocation: true` on anything that writes files or starts work, so it runs only when the owner types it.

`${CLAUDE_PLUGIN_ROOT}` is filled in inside plugin skills (text and `allowed-tools`) and in `hooks/hooks.json` commands, not in agent files ([H28](../technical/harness-facts.md)). Use it in `SKILL.md` and `hooks.json`; in agent files and other pages write `<plugin root>` or a path from the project.

## A workflow

A workflow is a script the Workflow tool runs. The example is `flightdeck/workflows/library-review.js`. The rules:

- The first statement is a literal `export const meta = { ... }`. There is no `Date.now`, no `Math.random` and no `export default`.
- Every `agent()` call names `model` and `effort`, within the ceiling. A call that sends a FlightDeck agent also names `agentType: 'flight:<name>'`.
- Every stage returns a result or `{halt: reason}`, never nothing; a stage that receives a halt passes it on. A failed agent can come back as `null`, so check for it ([H16](../technical/harness-facts.md)).
- A script cannot read files or run commands ([H10](../technical/harness-facts.md)). A first agent fetches what the script needs and returns it as a schema result.
- Test it by compiling it with stub agents that record each call, as `.flightdeck/build-1/workflows/build.test.mjs` does for the build script.

## A manual or library page

Every page under `flightdeck/manuals/` and `flightdeck/library/` starts with frontmatter: `shelf:` (matching its folder; `index` for a README), `sources:` (a list of repository paths that exist, or web addresses) and `checked:` (the date someone last confirmed the page against its sources). Then a `# Title` line, one summary line and `##` sections. One paragraph per line, no hard wrapping, lists with `- `, no tables, about 100 lines.

Every link must resolve and every file path in a code span must exist, with its line if one is given. Run `node lab/checks/manuals.mjs`; it prints a line per page and fails any page that breaks these rules. Add the page to its README index or the check fails. When you change a page's source, `/flight:library-check` will flag the page as stale; re-check it and update `checked:`.

## Adding an agent without adding a rank

Ranks stay four: Commander, Captain, Officer and Worker. A new job is a new agent, never a new rank.

- Name it by its function ("verifier", not "senior reviewer"), with a description that says what it does.
- Give it the standard Worker `Fallback rank:` line, and a rank line in its opening text when it is sent out.
- If it will be sent with an opening text, give it a seat in `flightdeck/skills/team-plans/entry-points.md`: a heading and a `Rank:` line in the shape the tests check.
- Add its name to the agent list in `flightdeck/tests/core.test.mjs` (the `AGENTS` list) and its model and effort to the by-function test.
- If you ever need a fifth rank, that is the owner's decision, not an agent's.

## The correction ladder

When you correct an agent, put the correction at the lowest rung that will hold.

- Once: a line in the workshop's `context.md`, or a dated line you write in its `constraints.md`.
- It recurs: a rule line in the root `CLAUDE.md`, in `.flightdeck/CLAUDE.md` or in `flightdeck/policies.md`.
- It keeps being broken: a hook or a check in `lab/checks/`, because a rule an agent can forget should become something a script enforces.

## Ownership and the checks

Each pull request lists the files it adds or edits in `lab/owned/pr<n>.txt`, one path per line (PR 1's is `lab/owned/pr1.txt`). A pull request edits only files on its own list and never another's; a change it needs elsewhere is written down as a capture line.

Run `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`. It prints only pass lines when the ceiling, `dev/`, `.claude/rules/`, `dw` calls, the owned list and the guard registration are all in order. Quote the test glob on Node 22: `node --test 'flightdeck/tests/*.test.mjs'` and `node --test 'lab/checks/*.test.mjs'`. Only hard rules fail a check; anything else is a warning (`.flightdeck/build-1/decisions.md:12`).
