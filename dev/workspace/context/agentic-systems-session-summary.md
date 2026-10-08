# Session summary: from a cockpit rebuild to agentic systems

This records what a working session from 2 to 7 October 2026 established, for anyone picking the work up without that conversation. The session began as a cleanup of an earlier agent-management layer in this repository (the "first cockpit", now archived) and ended with a decomposition of agentic workflows into sixteen systems. The decomposition itself is in `flightdeck/agentic-systems.md`; this file holds the findings and decisions around it.

## Standing decisions

- The decomposition is a working one, not a settled design. Everything under `flightdeck/` is an experiment, including its folder layouts; read any existing structure as a record of how the thinking developed, never as a requirement.
- Build one system at a time. Earlier attempts tried to build the whole thing at once and failed.
- Never replace what Claude Code ships. The layer accelerates the native tools; it does not compete with them.
- The human can always fall back to direct conversation with a standard model. No part of the layer removes that.

## Why the first cockpit failed

These come from the first cockpit's own records in `flightdeck/.cockpit-archive/`, read by a forensic agent and spot-checked.

- **It never did project work.** Of its 19 team dispatches, 16 worked on the cockpit itself and two more wrote cockpit records about the project. Only one looked at the project, and it only read. Fitting out the cockpit was made the gate before any real work, and the gate kept moving: about ten restructures in thirteen days, with the identifier scheme changed three times. With no real work flowing through, nothing measured the machinery.
- **Every human input became a typed record.** In two weeks the human wrote 96 orders, a 147-line founding document and 47 "truth" statements. 73 glossary entries waited for a sign-off that never came, 9 of 11 recorded contradictions stayed open, and the scheme for approving part of a decision failed in use.
- **Each correction became a rule, and the rules did not change behaviour.** The lead agent running ahead, doing work itself and misreporting an agent's state all recurred after rules were written against them.
- **What worked was structural.** An adversary seated before the first result landed; measuring a claim instead of asking the model about itself; two blind readers and a judge, which settled in fifteen minutes what four adversary rounds had not; a short spec and an advocate for the human's intent before building; adversaries on the strongest model; keeping agents alive for a second pass.
- **Starting a session cost about 13,000 tokens** before the first reply, and the start procedure re-ran after every compaction.

## The pattern across attempts

Each earlier attempt automated the doing and left a human gate at deciding, diagnosing or routing. In the orchestrated build runner (`flightdeck/flightcrew/`), the human wrote the diagnosis after every failed run and managed each launch. In the first cockpit, the human approved every decision the lead agent made. That is why human-in-the-loop work kept returning around systems meant to remove it.

## What already exists toward the goal

- **A callable "done" for deterministic builds.** `flightdeck/flightcrew/crew/crew.json` requires that "Claims of completion are made by presenting the command run and its output", builds checks from a frozen spec before any plan, gives workers the return statuses `complete`, `blocked`, `contradiction-found` and `over-budget`, and tells an agent that cannot finish to follow its escalation rule instead of improvising.
- **Measured knowledge of the harness.** In the archive: `records/manuals/claude-code/agent-team-function.md` (how agent teams behave on this machine), `records/manuals/cockpit/adversary-mechanics.md` and `found-strategies.md` (live, paired and cold adversaries), `base/bin/pilot.sh` (starting a session from an agent definition), and `records/dispatch/cockpit/T013.json` (the blind-reader check).

## Verified Claude Code facts

Checked against the captured docs in `library/source/claude-code/` during the session, on Claude Code 2.1.283 to 2.1.292. Several correct claims in the six documents under `library/source/agent-teams/`.

- Subagents nest three layers deep by default, set by `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`.
- There is no hard limit on teammates; the figure of twenty is the concurrency cap for ordinary subagents.
- Sessions run with `-p`, and Agent SDK sessions, cannot spawn teammates.
- An agent definition's `skills` field never reaches a teammate.
- `SubagentStart` fires on every message an in-process teammate handles, not only at spawn.
- A `Stop` hook can block finishing only eight times in a row, and its input carries background tasks, not the task list.
- Hooks set in a settings file also run inside subagents, so a lock meant for a lead agent blocks its workers too unless it checks the agent type.
- Dynamic workflows take no input mid-run.
- Auto mode returns to prompting after three blocks in a row or twenty in a session.

Found by experience in the session:

- Turning on agent teams takes effect only in a new session.
- A session restart makes already-finished subagents impossible to resume and withdraws the session scratchpad. Subagents still running at the restart survived.

## Findings from Anthropic's dev blog

The posts are in `library/source/claude-dev-blog/`; supporting papers are in `library/source/anthropic/`.

- **Background sessions and agent view.** `claude --agent <name> --bg "<prompt>"` starts a session that outlives the terminal, works in its own worktree and ends with a report. `claude agents --json` is the documented way for another session to read its state.
- **Mods.** Hooks that load once and stay in the session; they keep state, deny a call with a reason, register tools and commands, draw UI, and tell the main session's turns from a subagent's. They need Claude Code 2.1.287 or later, and their API can change between releases.
- **Compose a harness per task.** The dynamic-workflows post argues for a workflow written for the task at hand over a fixed catalogue.
- **Newer models need far less instruction.** Anthropic removed over 80% of Claude Code's system prompt for its newest models with no measured loss.
- **Mine corrections instead of authoring rules.** A workflow can cluster the corrections a human keeps making and keep only those that would have prevented a real mistake.
- **Contain rather than approve.** Users approved about 93% of permission prompts; hard limits hold where supervision does not.
- **Measuring makes a thing tractable.** The team that sped up claude.ai dropped any benchmark that did not track what users felt.
- **Put human rulings on a page.** Throwaway HTML pages with controls and an export are easier to answer than flags typed into markdown.
- **Agents work well as tool calls and stumble as long-lived peers.** Prompts assigning roles or a hierarchy made little difference in Anthropic's multi-agent study.

## What the research team found

A team of five explorers, a live adversary and a synthesiser researched "agentic workflows" on 7 October 2026; its files are in `dev/workspace/research/agentic-workflows/`, starting with `SYNTHESIS.md`. The brief asked which features recur, so the team returned a survey of Claude Code's agentic features and vendor products, not a study of how agent systems become independent of the human. The results that still bear on that question:

- No report found independent evidence that any agentic feature improves outcomes; the evidence is vendor reports and anecdotes. Effects have to be measured locally.
- No published, tested policy exists for when an agent should escalate to a human.
- Claude Code has no tracking of scored outcomes across runs.

## Lessons from running the team

- Keep a team's working files in the repository from the start, not in session scratch.
- Do not restart the session while a team is out.
- A fresh agent given the report and the adversary's findings can stand in for a lost author; these revisers fixed every finding that held.
- Check a file's age before handing it to an agent as a source.
- Brief by the question being asked, not by an inventory of features.

## Drills not yet run

- Can a background session lead an agent team?
- Can a lead agent with restricted tools start a background session?
- Is a lead told when a background session it started goes idle?

## Loose ends

- A custom command-line tool risks repeating the build runner's `fc` CLI, which the first cockpit's records call brittle. Skills invoked as slash commands already do that job.
- `library/source/claude-code/memory.md` is a byte-for-byte copy of `claude-directory.md`; the real memory doc was never captured.

## Where things are

- `flightdeck/agentic-systems.md` — the decomposition into systems.
- `flightdeck/.cockpit/constitution.md` — the principles written for the new cockpit.
- `flightdeck/.cockpit-archive/` — the first cockpit, kept as a source to mine.
- `dev/workspace/research/agentic-workflows/` — the research team's reports, the adversary's findings and the synthesis.
- `library/source/` — captured Claude Code docs, Anthropic's dev blog and papers. The six documents in `agent-teams/` are proposals from a web chat session and should be read critically.
