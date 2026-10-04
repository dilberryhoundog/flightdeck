<!-- SOURCE material, T002, 2026-09-18. Fully referenced and verified; not a record. The commander ruled on 2026-09-18 (commanders-desk/out-advice/DS002.md) that records are sharp, current-form and timeless, and these are the source they are extracted from. -->

# Harness Facts

Purpose: no mission is built on folklore. Flightcrew's code, hooks, manuals and run logs make claims about how Claude Code behaves. This record states which of those claims official documentation supports and which it contradicts.

Researched by: T002 (certified research team, mission M001), records seat, from the T001 verification reports of T001 `docs-verifier` (claude-code-guide, Sonnet) against claims raised by T001 `runs-recon`, T001 `lineage-historian` and T001 `doctrine-recon`, then contested by the T002 adversary seat, which re-fetched the sub-agents and worktrees pages and supplied the verbatim wording carried below. Research date: 2026-09-18. Claims were raised from `run/flightcrew-characterization-2` at `4fd81d8` and `flightcrew-buildout` at `1c81888`.

Versions: the Claude Code CLI on this machine is 2.1.274. Every documentation page below was read on 2026-09-18, against the published pages rather than a running binary, so where a page names its own version gate this record carries that gate rather than attributing it to the installed CLI.

Observations that documentation does not settle are not facts and are not in this record. Four remain open, on hook conflict resolution, the PATH given to hooks, the workflow runtime's treatment of `export default`, and whether a stall message on exit 0 is displayed. They are held in `../../notepad/recon-2026-09-18/` in the runs-recon and docs-verifier reports, and must be tested directly before any mission leans on them.

## Subagents

**A role with no Write tool cannot write.** The `tools` field is a hard allowlist. A role defined without Write has no way to produce a file. Source: https://code.claude.com/docs/en/sub-agents (2026-09-18). What flightcrew concludes from this, that a command must therefore accept input on stdin, is its own design choice and not a documented requirement.

**The allowlist's launch failure is narrower than flightcrew assumes.** The documented trigger is that *nothing* in the `tools` list resolves, for example because every entry is misspelled, and in that case Claude Code *usually* refuses to launch the subagent and returns an error naming the unresolved entries. A single bad entry among good ones is not promised to fail at launch. Source: https://code.claude.com/docs/en/sub-agents (2026-09-18).

**`isolation: worktree` and `permissionMode` are enforced, not advisory.** Worktree isolation is enforced for Bash and PowerShell commands, and Claude Code blocks a command when it cannot verify from the command text that any git the command runs stays inside the worktree, including when the command name is computed at runtime or the syntax cannot be parsed. That check cannot be turned off. Source: https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/worktrees (2026-09-18).

**`maxTurns` is the only documented turn limit, and reaching it is not the end.** At the limit Claude Code returns the subagent's output marked as partial, and Claude can resume it to continue. The partial marking requires v2.1.246 or later. Source: https://code.claude.com/docs/en/sub-agents (2026-09-18).

**The turn model flightcrew runs on is broken, and the harness facts are only half of why.** The documented half is above: one enforced limit, and partial output that can be resumed. Against it stand these facts about this repository, at `4fd81d8` and in the run log on `flightcrew-characterization`. Characterization run 1 was abandoned when its contracts unit spent 25 turns and stopped without delivering a worker return. Three turn numbers exist in the system and only the frontmatter `maxTurns` binds. Seven of the ten role files declare no `maxTurns` at all. The implementer declares 200 where the roster says 25. No turn is reserved for an agent's return, so a unit can exhaust its budget with nothing handed back. Human waits and gate waits are counted as run minutes. The commander's assessment, spoken 2026-09-18: the turn budget was a major problem last run and needs surgery, not settling.

**A subagent stopped deliberately does not auto-resume.** A subagent stopped with `x` in `/tasks` or by an SDK `stop_task` request does not auto-resume; a message sent to it is refused and Claude is told the agent was cancelled. Source: https://code.claude.com/docs/en/sub-agents (2026-09-18). Flightcrew recorded this from experience and it is documented.

**Prose cannot disown project instructions, and the enforced alternative does not help the orchestrator.** Four crew roles state that auto-loaded project instructions do not apply to them. Subagents load every level of the CLAUDE.md hierarchy by default, the built-in Explore and Plan agents excepted. The only enforced suppression is `omitClaudeMd: true`, which requires v2.1.271 or later, and it is ignored when the agent runs as the main session agent via `--agent` or the `agent` setting; managed policy files still load regardless. Since flightcrew starts its orchestrator exactly that way, there is no enforced suppression available for that role at all. Source: https://code.claude.com/docs/en/sub-agents (2026-09-18).

**`initialPrompt` fires only for the main session agent**, auto-submitted as the first user turn when the agent runs via `--agent` or the `agent` setting. It does not fire on ordinary subagent dispatch. Flightcrew's manuals do start the orchestrator that way, so its use is sound. Source: https://code.claude.com/docs/en/sub-agents (2026-09-18).

**Concurrency and depth are capped.** `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` defaults to 20, and a further spawn fails with `Concurrent subagent limit reached`. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` defaults to 3, three layers below the main conversation. Nested subagents count toward the concurrent total while running. Source: https://code.claude.com/docs/en/sub-agents (2026-09-18).

**`fable` is a valid model alias** alongside `sonnet`, `opus` and `haiku`. Source: https://code.claude.com/docs/en/sub-agents (2026-09-18). The model-config page adds two facts, both re-fetched and confirmed: "Fable 5.1 requires Claude Code v2.1.257 or later", and "Neither Fable model is the account-type default on any plan or provider. Select one explicitly." The universal is the page's own wording, not an extrapolation. Source: https://code.claude.com/docs/en/model-config (2026-09-18).

**Fable is the most capable tier, above opus.** The model-config page calls the Fable models "the most capable models in Claude Code" and points the alias at the hardest and longest-running tasks. This bears directly on reading flightcrew's roster: a role on `fable` is on a higher tier than a role on `opus`, not a lower one. Source: https://code.claude.com/docs/en/model-config (2026-09-18).

## Worktrees

**The default base is the remote default branch, with a fallback that reverses it.** Subagent worktrees branch from the repository's default branch unless `worktree.baseRef` is set to `head`. But if no remote is configured, or `origin/HEAD` is not cached locally and cannot be fetched, the worktree falls back to the local `HEAD`. Both halves are live terrain here, because several branches in this repository have no remote counterpart. Flightcrew's workflows README asserts HEAD unconditionally and is wrong on the default. Source: https://code.claude.com/docs/en/worktrees (2026-09-18).

**A worktree checks out a commit, so uncommitted files are invisible to a worker** whatever the base ref. This is the true reason for the consequence flightcrew draws, which its own README attributes to the base ref instead. Source: https://code.claude.com/docs/en/worktrees (2026-09-18).

**`$CLAUDE_PROJECT_DIR` stays where the session started, and `cwd` is the way out.** The project dir still points at the project root where the session started, worktrees included. The `cwd` field in the hook's input JSON is the worktree root, and it moves again when Claude runs `cd`. A hook that needs the worktree path reads `cwd`. Source: https://code.claude.com/docs/en/hooks, https://code.claude.com/docs/en/worktrees (2026-09-18).

**Starting a session in a worktree requires workspace trust**, and non-interactive runs with `-p` skip that check, so `claude -p --worktree` proceeds without it. This is a rule about `--worktree` startup, not about hooks in general. Source: https://code.claude.com/docs/en/worktrees (2026-09-18).

## Hooks, workflows, permissions and sandboxing

Every entry below was re-fetched against the live pages on 2026-09-18 and confirmed. None was contradicted.

**Hook events and exit codes.** The event names bound in `hooks/settings.fragment.json` are all documented events, each with its own section on the page. The stdin envelope fields match, being `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `permission_mode`, `effort` and `hook_event_name`, and exit 0 versus 2 carries the documented meaning. Source: https://code.claude.com/docs/en/hooks (2026-09-18). Worth knowing: the page documents roughly thirty hook events in all, and flightcrew binds only some of them. How many it binds is a fact about this repository, not about the harness, and is stated below with its commit.

**A `PreToolUse` hook can block by exiting 2, not only by printing a JSON decision.** Flightcrew's hooks README states the JSON path as the only one. The documented table gives PreToolUse as blocking the tool call on exit 2, and the page is emphatic that exit 2 wins: "On events that can block, exit 2 blocks whether or not you print JSON: even a JSON permissionDecision of 'allow' can't override it." Source: https://code.claude.com/docs/en/hooks (2026-09-18).

**The eight-block ceiling is real.** "Claude Code overrides the hook and ends the turn after 8 consecutive blocks." That is the fact behind `ceilings.stop_blocks` having a maximum of 8. Source: https://code.claude.com/docs/en/hooks, Stop input section (2026-09-18); the same sentence also appears on the best-practices page.

**`WorktreeCreate` replaces creation rather than observing it.** Any non-zero exit from `WorktreeCreate` aborts worktree creation, and the hook prints the directory path so Claude Code can use it as the session's working directory. Source: https://code.claude.com/docs/en/hooks for the abort, https://code.claude.com/docs/en/worktrees for the example (2026-09-18).

**Workflow scripts.** A workflow runs as `/<name>`, Claude passes its arguments as structured data, and the runtime makes `Date.now()`, `Math.random()` and a no-argument `new Date()` throw inside the script. Source: https://code.claude.com/docs/en/workflows (2026-09-18).

**`Agent(<role>)` and `Workflow(<name>)` are real permission forms, documented on different pages.** `Agent(<name>)` matches a custom subagent by name and is on the permissions page. `Workflow(<name>)` approves one saved workflow by name and is on the workflows page; the permissions page does not mention it. Source: https://code.claude.com/docs/en/permissions, https://code.claude.com/docs/en/workflows (2026-09-18).

**`sandbox.filesystem.deny` and `permissions.deny` are independent.** Sandbox filesystem paths "are enforced at the OS level, so all commands running inside the sandbox, including their child processes, respect them." Separately, "Bash commands that modify files within the sandbox boundaries execute without prompting, even in Manual mode, where the file edit tools would prompt", which shows the two mechanisms do not cover each other. Source: https://code.claude.com/docs/en/sandboxing (2026-09-18).

## Claims about flightcrew's own code

These statements describe this repository rather than the harness. They rest on the codebase at `run/flightcrew-characterization-2` `4fd81d8`, researched by the T002 records seat for this record, and on no documentation page.

**The settings fragment binds fourteen hook events**, counted directly from `flightdeck/flightcrew/hooks/settings.fragment.json`: SessionStart, SessionEnd, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, PostToolUseFailure, PermissionDenied, PreCompact, PostCompact, WorktreeRemove, PreToolUse, PostToolUse and Stop. Flightcrew's own hooks README says twelve.

**Flightcrew starts its orchestrator as the main session agent**, via `claude --agent orchestrator`, which is what makes its use of `initialPrompt` sound and its use of `omitClaudeMd` impossible.

**Four crew roles disown project instructions in prose without carrying `omitClaudeMd`**: critic, explorer, spec-judge and spec-attacker.

**Flightcrew's run-1 log treats a turn-limit stop as an unrecoverable loss of the unit**, which the documented partial-output-and-resume behaviour contradicts. The turn model's other facts are gathered under the turn budget above rather than repeated here.

