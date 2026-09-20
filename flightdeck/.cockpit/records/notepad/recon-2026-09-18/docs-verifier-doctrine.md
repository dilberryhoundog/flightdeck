# docs-verifier: verification of doctrine-recon — M001

Crew report, C015 job 2, received 2026-09-18. Pilot's check the same day against the tip: claim 3 is not a defect in the system, because every manual on the tip starts the orchestrator as the session agent (`claude --agent orchestrator`, in `flightdeck/manuals/launch/launch-anatomy.md`, `orchestration/journey.md`, `orchestration/crew.md`), which is exactly the case where `initialPrompt` fires. The contradiction was of doctrine-recon's phrasing. Claim 1 stands as a real finding: the sealed roles (critic, explorer, spec-judge, spec-attacker, orchestrator) rely on prose to disown project instructions, and `critic.md` carries no `omitClaudeMd`. Raised as workshop W010.

## Claim 1: subagent body text overriding auto-loaded project instructions (critic.md etc.)
Verdict: contradicted (as stated), confirmed as advisory-only.
Subagents DO load CLAUDE.md by default. Source: https://code.claude.com/docs/en/sub-agents — "every level of the CLAUDE.md hierarchy the main conversation loads... " loads for non-fork subagents except Explore/Plan.
A body's prose claiming "auto-loaded project instructions... do not apply to this role" does NOT actually stop CLAUDE.md from loading into context — it is a request to the model, not an enforced mechanism. The only enforced way to suppress CLAUDE.md is the `omitClaudeMd: true` frontmatter field (requires Claude Code v2.1.271+): "launches without the user, project, and local CLAUDE.md files." critic.md uses prose only, no `omitClaudeMd` field — so the claim that it overrides project instructions is not supported by docs; the file still receives CLAUDE.md and only asks the model to disregard it.

## Claim 2: tools:, isolation: worktree, permissionMode: acceptEdits are enforced, not advisory
Verdict: confirmed.
Source: https://code.claude.com/docs/en/sub-agents. `tools` allowlist is enforced at launch ("fails to launch with an error naming the entries" if unresolved). `isolation: worktree` is "enforced for Bash/PowerShell commands" including blocking edits/commands that resolve outside the worktree. `permissionMode` is enforced per subagent lifecycle (noted "ignored for plugin subagents" only as an exception, otherwise applied).

## Claim 3: initialPrompt fires automatically at session start, used by orchestrator to run `fc launch status`
Verdict: contradicted. [Pilot: not a system defect; see header.]
Source: https://code.claude.com/docs/en/sub-agents. `initialPrompt` is "auto-submitted as the first user turn ONLY when this agent runs as the main session agent (via `--agent` or the `agent` setting)." It does not fire for ordinary subagent delegation (Task/Agent tool invocation) — only when a whole session is launched as that agent type via `--agent`. If the orchestrator role is dispatched as an ordinary subagent (not `claude --agent orchestrator`), `initialPrompt` will not fire.

## Claim 4: orchestration-principles.md quotes vs. official docs
- "goal loops stop after several consecutive no-tool-use turns" — confirmed verbatim. Source: https://code.claude.com/docs/en/goal — "If Claude keeps answering the evaluator without making progress (no tool use for several turns in a row), Claude Code stops the loop... and returns control to you with the goal still set."
- "a stop hook can be overridden after eight consecutive blocks" — confirmed verbatim. Source: https://code.claude.com/docs/en/best-practices — "Claude Code overrides the hook and ends the turn after 8 consecutive blocks."
- "prefer CLI tools over raw API calls" — confirmed, matches guidance in spirit and near-verbatim. Source: https://code.claude.com/docs/en/best-practices — "Use CLI tools... CLI tools are the most context-efficient way to interact with external services... Without `gh`, Claude can still use the GitHub API, but unauthenticated requests often hit rate limits."

## Claim 5: claude-code-facts.md fact-by-fact spot check (sampled; full file too long for line cap)
- Hook event names list, stdin envelope fields, exit codes 0/2 semantics — confirmed. Source: https://code.claude.com/docs/en/hooks.
- "Claude Code overrides the hook and ends the turn after 8 consecutive blocks" (Stop hook cap) — confirmed, see above.
- Subagent frontmatter field list (`tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `memory`, `isolation: worktree`, `mcpServers`, `hooks`, `background`, `effort`, `color`, `initialPrompt`) — confirmed, all present in https://code.claude.com/docs/en/sub-agents. Note: the facts file omits `omitClaudeMd`, which is directly relevant to Claim 1 above and should be added.
- "A subagent receives... CLAUDE.md files (except Explore and Plan)" — confirmed, matches docs exactly including the Explore/Plan exception.
- "`initialPrompt` (used when the agent runs the main session via `claude --agent <name>`)" — confirmed, matches docs precisely (this description is accurate; it's doctrine-recon's Claim 3 usage that's contradicted, not this fact file's own wording).
- `/goal` stall behavior "no turn count, so do not assume one" — confirmed; docs say "several turns in a row" with no exact number, consistent with the file's caveat.
- Worktree, permissions, non-interactive run flags spot-checked against https://code.claude.com/docs/en/worktrees and /headless and /permissions — no contradictions found in the sampled fields, but not exhaustively checked line-by-line under this cap.

All dates checked: 2026-09-18.
