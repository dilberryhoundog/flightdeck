<!-- version: 2 -->
## Shape: session
The orchestrator runs in one Claude Code session and dispatches the crew as subagents. Under this shape every parallel wave of the plan fits within the implementers_concurrent ceiling in one turn; the plan validator enforces that.
Dispatch: one subagent per unit, worktree-isolated, launched from the prompt `fc worker render` produced for that unit; the units of a parallel wave run as concurrent subagents.
Progress: the sequence of returns stored with `fc return` and the events the hooks record in the launch folder's events file, summarised by `fc events summary`; the evidence page is the display, and the session's own scrollback is not evidence.
Stopping: the three gates halt the session's turn; the stop gate holds the turn in the contracts and verify phases; on a halt return the orchestrator stops dispatching at once, runs `fc launch escalate halt --detail "…"` and ends the turn.
