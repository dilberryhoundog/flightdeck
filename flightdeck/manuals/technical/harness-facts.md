---
shelf: technical
sources:
  - library/source/claude-code/hooks.md
  - library/source/claude-code/large-codebases.md
  - library/source/claude-code/subagents.md
  - library/source/claude-code/agent-view.md
  - library/source/claude-code/permissions.md
  - library/source/claude-code/workflows.md
  - library/source/claude-code/worktrees.md
  - library/source/claude-code/model-config.md
  - library/source/claude-code/skills.md
  - .flightdeck/build-1/attempts/build-notes.md
  - .flightdeck/build-1/attempts/pr-1/a1/report.md
  - .flightdeck/build-1/research/harness-core.md
  - .flightdeck/build-1/attempts/plan/a2/plan.md
  - .flightdeck/build-1/context.md
  - .flightdeck/workshops.md
  - README.md
checked: 2026-10-11
---

# Claude Code facts FlightDeck relies on

The register of things Claude Code does that FlightDeck's parts depend on, each with a verdict, a source and a date, so an agent never has to guess how the harness behaves.

## How to read and add a fact

A fact is one line: an id, the claim, a verdict, a source and the date it was written. Ids are never reused. The parts page, [parts.md](parts.md), points here by id.

The verdict says how far to trust the claim. `library` means a page in `library/source/claude-code/` says it, and the source is a code span `path:line` you can open. `live docs` means it was checked against the online documentation by the plan's fact check. `tested` means it was reproduced in this build. `probe` means a check is planned and not yet run, and the claim names its fallback. `unsettled` means the sources disagree, and the claim names both sides.

To add a fact: open the source, find the line, copy the claim from it in your own words, and add the next number. If the source does not say it, the verdict is `unsettled` and the claim says what the source does say. When a fact's source changes, `/flight:library-check` flags this page and the librarian re-checks the line.

Here "Claude Code's page" means the copy in `library/source/claude-code/`. Hook input is the JSON that Claude Code sends a hook on standard input.

## The register

- H1. Hook input carries `agent_id` only when the hook fires inside a subagent, and `agent_type` inside a subagent and in a `claude --agent` session; for a plugin agent the type is the plugin-scoped name, so FlightDeck agents report `flight:<name>`. Verdict: library. Source: `library/source/claude-code/hooks.md:779`, `library/source/claude-code/hooks.md:780`, `library/source/claude-code/hooks.md:2408`, and PR 1's live checks in `.flightdeck/build-1/attempts/pr-1/a1/report.md:41`. Date: 2026-10-11.
- H2. For a SessionStart hook, plain stdout is added to Claude's context, JSON `additionalContext` is added to Claude's context, and JSON `systemMessage` is a warning shown to the user. Verdict: library. Source: `library/source/claude-code/hooks.md:822`, `library/source/claude-code/hooks.md:970`, `library/source/claude-code/hooks.md:1211`. Date: 2026-10-11.
- H3. A hook's `additionalContext`, `systemMessage` and plain stdout are each capped at 10,000 characters; over the cap Claude Code saves the text to a file and passes Claude the path with a preview of the first 2,000 characters. Verdict: library. Source: `library/source/claude-code/hooks.md:953`, `library/source/claude-code/hooks.md:956`, `library/source/claude-code/hooks.md:1042`. Date: 2026-10-11.
- H4. Hook context should be written as factual statements; text framed as out-of-band system commands can trigger Claude's prompt-injection defences, and then Claude shows the text to the user instead of using it. Verdict: library. Source: `library/source/claude-code/hooks.md:1052`. Date: 2026-10-11.
- H5. `CLAUDE_PROJECT_DIR` stays at the project root where the session started even after Claude enters a worktree; the directory Claude is really working in is the `cwd` field of the hook input. Verdict: library. Source: `library/source/claude-code/hooks.md:638`, `library/source/claude-code/hooks.md:639`. Date: 2026-10-11.
- H6. A `CLAUDE.md` file in a subdirectory loads only when Claude reads a file in that directory; the root one loads at launch. The page the brief named for this, `memory.md`, is a byte copy of `claude-directory.md` and does not say it, so the large-codebases page is the source. Verdict: library. Source: `library/source/claude-code/large-codebases.md:122`, `library/source/claude-code/large-codebases.md:63`. Date: 2026-10-11.
- H7. Whether `omitClaudeMd: true` really stops a subagent loading `CLAUDE.md` files is stated both ways. The subagents page says the field launches the subagent without the user, project and local files (managed policy files still load), and another line of the same page says the files still load through the normal message flow even when the field is set. FlightDeck sets the field on its blind roles as a best effort and does not rely on it. Verdict: unsettled. Source: `library/source/claude-code/subagents.md:33`, `library/source/claude-code/subagents.md:321`, `library/source/claude-code/subagents.md:1079` against `library/source/claude-code/subagents.md:872`. Date: 2026-10-11.
- H8. A `claude --bg` session runs with the `PATH` of the shell it was dispatched from and keeps that shell's cloud provider selection, its `ANTHROPIC_DEFAULT_*_MODEL` aliases and any `CLAUDE_CODE_EXTRA_BODY` override; the page names no other shell variable, which is why FlightDeck puts `FLIGHTDECK_UNATTENDED` in `--settings`. It reads settings (including the `env` block) from the folder it runs in, and `--settings` is passed through to dispatched sessions. Verdict: library. Source: `library/source/claude-code/agent-view.md:608`, `library/source/claude-code/agent-view.md:606`, `library/source/claude-code/agent-view.md:675`. Date: 2026-10-11.
- H9. A Bash allow rule does not match past a leading assignment of a variable outside Claude Code's known-safe list, while a deny or ask rule matches past any leading assignment. Verdict: library. Source: `library/source/claude-code/permissions.md:227`. Date: 2026-10-11.
- H10. A workflow script has no direct file or shell access and cannot load modules (a script with `import()` fails before the run starts), so its agents do the reading, writing and commands. Verdict: library. Source: `library/source/claude-code/workflows.md:366`, `library/source/claude-code/workflows.md:367`. Date: 2026-10-11.
- H11. A subagent's worktree branches from the repository's default branch unless `worktree.baseRef` is set to `"head"`. Verdict: library. Source: `library/source/claude-code/worktrees.md:118`. Date: 2026-10-11.
- H12. A hook's `if: "Bash(git *)"` checks each subcommand of a compound command and runs the hook whenever Claude Code cannot tell which commands the input runs, but the filter is best effort and the page says to use the permission system for a hard allow or deny. Verdict: library. Source: `library/source/claude-code/hooks.md:446`, `library/source/claude-code/hooks.md:453`. Date: 2026-10-11.
- H13. A PreModelSwitch hook can block a model switch that someone requested (the `/model` command, the model pickers, the `/config` setting, fast mode, an SDK or Remote Control request) and is not run for an automatic model fallback or the model restored on resume; the page lists only requested switches, so the model a session starts with is not a switch it covers. Verdict: library. Source: `library/source/claude-code/hooks.md:3165`, `library/source/claude-code/hooks.md:3175`. Date: 2026-10-11.
- H14. The managed settings `availableModels` and `deniedModels` apply everywhere a model can be named (the `/model` command, the `--model` flag, aliases, resume), and the managed `maxEffortLevel` setting caps effort on any plan and provider. Verdict: library. Source: `library/source/claude-code/model-config.md:228`, `library/source/claude-code/model-config.md:380`, `library/source/claude-code/model-config.md:446`. Date: 2026-10-11.
- H15. A background session, however started, moves into its own git worktree before it edits files, unless it is already in a linked worktree, the folder is not a git repository, the write is outside the working directory, or `worktree.bgIsolation` is "none". Verdict: library. Source: `library/source/claude-code/agent-view.md:496`, `library/source/claude-code/agent-view.md:498`, `library/source/claude-code/agent-view.md:505`. Date: 2026-10-11.
- H16. `pipeline(list, fn)` keeps a `null` in the result for each item whose agent was stopped or failed. Verdict: library. Source: `library/source/claude-code/workflows.md:318`. Date: 2026-10-11.
- H17. Per-agent `model`, `effort` and `agentType` work inside a workflow script: they worked in both planning runs and in the stage-0 check. Verdict: tested. Source: `.flightdeck/build-1/attempts/build-notes.md:22`. Date: 2026-10-11.
- H18. A local marketplace with a relative `source` loads the plugin, and the marketplace registry is keyed by marketplace name, so a second `marketplace add` with the same name repoints the install. The first part was tested with `source: "./"` and PR 1 installed `source: "./flightdeck"` the same way. Verdict: tested. Source: `.flightdeck/build-1/research/harness-core.md:30`, `.flightdeck/build-1/attempts/plan/a2/plan.md:186`, `.flightdeck/build-1/attempts/pr-1/a1/report.md:7`. Date: 2026-10-11.
- H19. A workflow script in a plugin's `workflows/` folder runs as `/<plugin>:<meta.name>`, so `/flight:library-review` once the plugin ships one; this build has not yet run it on this plugin, and the fallback is to ask for the script by its path with the Workflow tool. Verdict: probe. Source: `library/source/claude-code/workflows.md:227`, `library/source/claude-code/workflows.md:229`, `.flightdeck/build-1/attempts/plan/a2/plan.md:188`. Date: 2026-10-11.
- H20. A plugin cannot ship a `CLAUDE.md` or a `.claude/rules/` folder, and an `@` import in a `CLAUDE.md` resolves relative to the file that holds the import. Verdict: live docs. Source: `.flightdeck/build-1/research/harness-core.md:134`, `.flightdeck/build-1/research/harness-core.md:128`. Date: 2026-10-11.
- H21. Agents of a plugin are scanned recursively and a subfolder of the plugin's `agents/` folder becomes part of the agent's name (`agents/review/security.md` in plugin `my-plugin` is `my-plugin:review:security`), while for project and user agents the identity comes only from the `name` field. The seed note called this unsettled; the two statements are about different scopes and do not disagree. FlightDeck keeps `agents/` flat anyway. Verdict: library. Source: `library/source/claude-code/subagents.md:186`, `library/source/claude-code/subagents.md:190`, `library/source/claude-code/subagents.md:890`. Date: 2026-10-11.
- H22. How an output style combines with `claude --agent` is not described by Claude Code's output styles page; PR 1's live check saw the radio voice work in a pilot session. Verdict: tested. Source: `.flightdeck/build-1/attempts/pr-1/a1/report.md:41`. Date: 2026-10-11.
- H23. The commands `claude plugin eval`, `validate`, `details` and `test` exist in Claude Code 2.1.296. Verdict: tested. Source: `.flightdeck/build-1/attempts/build-notes.md:22`. Date: 2026-10-11.
- H24. Nested `claude -p` sessions work when `HOME` points at a private folder. Verdict: tested. Source: `.flightdeck/build-1/attempts/build-notes.md:15`, `.flightdeck/build-1/attempts/build-notes.md:22`. Date: 2026-10-11.
- H25. Asked in plain words to push to main, the model often refuses before the guard runs; when the guard does refuse, Claude Code shows it as "PreToolUse:Bash hook error". Verdict: tested. Source: `.flightdeck/build-1/attempts/pr-1/a1/report.md:10`, `README.md:10`. Date: 2026-10-11.
- H26. A `claude --bg` session in a fresh private `HOME` needs the trust dialog accepted once before it runs. Verdict: tested. Source: `.flightdeck/workshops.md:7`. Date: 2026-10-11.
- H27. A subagent can send out agents of its own when it holds the `Agent` tool, up to three layers below the main conversation by default; the limit is changed with `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, and leaving `Agent` out of a subagent's `tools` stops it. Verdict: library. Source: `library/source/claude-code/subagents.md:1029`, `library/source/claude-code/subagents.md:1045`. Date: 2026-10-11.
- H28. `${CLAUDE_PLUGIN_ROOT}` is filled in in plugin skills (the skill text and the Bash rules of its `allowed-tools`) and in plugin hook commands; no page says an agent body expands it, so FlightDeck's agent files never use it. Verdict: library. Source: `library/source/claude-code/skills.md:436`, `library/source/claude-code/hooks.md:632`. Date: 2026-10-11.
- H29. Model aliases point to the recommended version for the provider and move over time; to pin one, use the full model name or set `ANTHROPIC_DEFAULT_OPUS_MODEL` and the matching variables. Verdict: library. Source: `library/source/claude-code/model-config.md:57`, `library/source/claude-code/model-config.md:61`. Date: 2026-10-11.
- H30. On Node 22, `node --test` given a folder name fails with "Cannot find module"; the quoted glob form works. Verdict: tested. Source: `.flightdeck/build-1/context.md:21`. Date: 2026-10-11.
