---
shelf: technical
sources:
  - flightdeck/.claude-plugin/plugin.json
  - .claude-plugin/marketplace.json
  - flightdeck/agents/pilot.md
  - flightdeck/agents/runner.md
  - flightdeck/agents/scout.md
  - flightdeck/agents/builder.md
  - flightdeck/agents/reviewer.md
  - flightdeck/agents/adversary.md
  - flightdeck/agents/imposter.md
  - flightdeck/agents/librarian.md
  - flightdeck/policies.md
  - flightdeck/hooks/hooks.json
  - flightdeck/hooks/preflight.mjs
  - flightdeck/hooks/guard.mjs
  - flightdeck/skills/preflight/SKILL.md
  - flightdeck/lib/workshops.mjs
  - flightdeck/skills/team-plans/SKILL.md
  - flightdeck/skills/team-plans/ways-to-fly.md
  - flightdeck/skills/manual/SKILL.md
  - flightdeck/skills/library-check/SKILL.md
  - flightdeck/skills/library-check/stale.mjs
  - flightdeck/workflows/library-review.js
  - lab/checks/hard-rules.mjs
  - lab/checks/manuals.mjs
  - .flightdeck/build-1/decisions.md
  - library/source/claude-code/model-config.md
checked: 2026-10-11
---

# How the parts work

Each part of FlightDeck on this branch (the first pull request plus the manuals and library), what files make it up, and what it does and does not do.

Claude Code behaviour these parts rely on is listed by id in [harness-facts.md](harness-facts.md); an id such as [H1](harness-facts.md) is a fact with its source and verdict.

## Plugin and marketplace

Files: `flightdeck/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. The plugin is named `flight`, version `0.2.0`; the marketplace is named `DBHD-FlightDeck` and lists the plugin with `source: "./flightdeck"`, so installing it from a checkout of this repository loads the plugin from the `flightdeck/` folder in place ([H18](harness-facts.md)).

The owner installs with `claude plugin marketplace add "$PWD" --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local`. The marketplace registry is keyed by name, so adding a second marketplace with the same name repoints the install. A plugin cannot ship a `CLAUDE.md` or rule files, so those live in the repository root ([H20](harness-facts.md)).

## Agents

Files: one file per agent in `flightdeck/agents/`, kept flat ([H21](harness-facts.md)). Agents are named by their job and never by a rank; rank is a seat given in the opening text (see `flightdeck/policies.md`). Model and effort are chosen by function.

- pilot and adversary: Opus at high effort. The pilot leads the owner's session; the adversary attacks work from its criteria.
- scout: Haiku, `maxTurns: 40`. Reads and reports with `path:line` pointers.
- runner, builder, reviewer, imposter and librarian: Sonnet at high effort. The builder has `isolation: worktree`.
- blind roles: scout, adversary and imposter set `omitClaudeMd: true` so they judge from what they are handed. Claude Code's page is split on whether this works, so treat it as best effort ([H7](harness-facts.md)).

Every agent file holds exactly one `Fallback rank:` line, used only when its opening text gives no `Rank:` line. The pilot's is Captain, the runner's is Officer when run as a background session, and every other agent's is "Worker in the team of whoever sent you". The librarian uses the Worker line and adds one separate sentence saying it sits as an Officer when run as a standing background session over the corpus. Lines 49 to 55 of `flightdeck/policies.md` hold the three lines.

## Hooks

Files: `flightdeck/hooks/hooks.json`, `flightdeck/hooks/preflight.mjs` and `flightdeck/hooks/guard.mjs`. Hooks are small scripts Claude Code runs automatically at set moments. A hook prints a refusal and exits 0; the exit code is never the signal.

- The card: `preflight.mjs` runs when a session starts, and acts only when the hook input says `agent_type` is `flight:pilot` and the project has a `.flightdeck/` folder ([H1](harness-facts.md)). It prints at most 10 lines and 800 characters, as both `systemMessage` (shown to the owner) and `additionalContext` (given to the pilot) ([H2](harness-facts.md), [H3](harness-facts.md)). It stays silent in plain `claude` and on any error.
- Guard mode `truth`: refuses an agent's Edit or Write on `constraints.md`, `VISION.md`, `build.txt` and any file whose frontmatter says `write: "human"`. It applies to subagents, runner sessions and sessions with `FLIGHTDECK_UNATTENDED=1`, never to the owner's own session. It fails open. Limit: it misses writes made through Bash redirects (`flightdeck/policies.md:9`).
- Guard mode `git`: refuses an agent's push to main or master, force-push and remote branch deletion, including abbreviated options, `--mirror`, `--all`, `--prune` and glob refspecs. It checks agents only. It is the one rule that fails closed: malformed input is denied with "guard error". Limit: it misses git run from scripts or aliases, and branch protection on `main` is the hard stop (`flightdeck/policies.md:7`). The `if: "Bash(git *)"` filter is best effort ([H12](harness-facts.md)). Claude Code shows a refusal as "PreToolUse:Bash hook error" ([H25](harness-facts.md)).
- Guard mode `ceiling`: refuses an Agent launch or a workflow script that names a model above Opus or an effort above high, and a `/model` switch in a FlightDeck session. It fails open. Limit: it does not cover a session's own start-up model or effort, so Claude Code's managed settings are the machine-wide ceiling (`flightdeck/policies.md:8`, [H13](harness-facts.md), [H14](harness-facts.md)).

## The shared reader

File: `flightdeck/lib/workshops.mjs`, no dependencies. Exports: `parseManifest` (the lines of `.flightdeck/workshops.md`), `parseQuestions` (open and held questions), `parseVerify` (a workshop's checks and questions), `parseDecisions`, `latestAttempts` (the highest `a<k>` folder in each group), `listWorkshops` (state derived from folders and the `settled:` line), `scopeBlock` and `findRoot` (walks up to the folder that holds `.flightdeck/`). Every function returns warnings instead of throwing.

The command `node <plugin root>/lib/workshops.mjs scope <name> [--json]` prints the workshop's block. With `--json` it prints `{block, checks, questions, warnings}`. The block is the workshop's `constraints.md`, `context.md` and `verify.md` under fixed headings; files are never cut, and over 6,000 characters it adds a warning line. The command `list` prints one line per workshop. Exit code is always 0.

## How a workshop's notes and checks reach its agents

There is one path: the opening text, the first message an agent gets. The senders are the pilot (told to run the scope command and paste the output after the `Rank:` line, `flightdeck/agents/pilot.md:34`), the runner (its first prompt is made at start by shell command substitution, `flightdeck/skills/team-plans/ways-to-fly.md:37`) and the first agent of a workflow, which runs the command with `--json` because a script cannot read files ([H10](harness-facts.md)).

There is no hook for it, on purpose (`.flightdeck/build-1/decisions.md:15`). A hook sees which agent type is starting, not which workshop it works in, and two agents of one type may work in different workshops ([H1](harness-facts.md)). Only the sender knows the workshop.

## Team plans skill

Files: `flightdeck/skills/team-plans/SKILL.md`, six plan pages, `entry-points.md` (the `Rank:` line and task per seat) and `ways-to-fly.md` (four ways to run a plan). The `${CLAUDE_PLUGIN_ROOT}` placeholder is filled in only inside skills ([H28](harness-facts.md)), so `SKILL.md` carries the real paths and every other page writes `<plugin root>`. Agent files never use the placeholder.

## The pre-flight skill

File: `flightdeck/skills/preflight/SKILL.md`. `/flight:preflight` is typed by the owner (`disable-model-invocation: true`). It runs four checks (plugin validation, the hard-rule check if present, the plugin's tests, the always-on token cost) and then reports GitHub sign-in, worktree base, model ceiling and branch protection as information. It ends with "systems green" or "not green:" and the list of what failed. The information items never change that last line.

## The hard-rule check

File: `lab/checks/hard-rules.mjs`. It prints `pass <case>` or `FAIL <case>: <reason>` and ends with `<n>/<m> passed`. The cases: `base`, `ceiling`, `dev-untouched`, `claude-rules-untouched`, `no-dw-calls`, `owned`, `no-plugin-settings`, `owner-only-skills` and `git-guard-registered`. It runs only in FlightDeck's repository (`flightdeck/policies.md:10`).

## Manuals, library and librarian

The corpus is the manual shelves in `flightdeck/manuals/` and the library in `flightdeck/library/`, plus a project's own `.flightdeck/manuals/<shelf>/` pages when they exist. The librarian, `flightdeck/agents/librarian.md`, is read-only (Read, Grep, Glob, Bash) and answers with `path:line`.

- `/flight:manual <workshop>` (`flightdeck/skills/manual/SKILL.md`) has the librarian draft one page from a workshop's files and files it on the right shelf. It never commits.
- `/flight:library-check` (`flightdeck/skills/library-check/SKILL.md`) runs `flightdeck/skills/library-check/stale.mjs`, which lists pages checked more than 30 days ago or whose source changed in git since. With nothing stale it sends no agent.
- `flightdeck/workflows/library-review.js` has the librarian check a piece of work against the corpus ([H19](harness-facts.md)).
- `lab/checks/manuals.mjs` checks frontmatter, one paragraph per line, and that every link and cited path exists.

## Pinning full model ids

An alias such as `opus` points to the version recommended for the provider, which can be older on another provider ([H29](harness-facts.md)). To pin one, write the full model name in an agent's `model:` line, or set `ANTHROPIC_DEFAULT_OPUS_MODEL` and its Sonnet and Haiku siblings. Claude Code's page is `library/source/claude-code/model-config.md:61`. Keep a pinned model within the ceiling: nothing above Opus at high effort.
