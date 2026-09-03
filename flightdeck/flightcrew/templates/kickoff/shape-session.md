<!-- version: 1 -->
## Shape: session
The orchestrator runs in one Claude Code session and dispatches the crew as subagents. This is the default shape; choose it unless a wave holds more units than the implementers_concurrent ceiling allows in one turn.
Dispatch: one subagent per unit, worktree-isolated, launched from the rendered prompt; parallel units run as concurrent subagents, at most implementers_concurrent at a time, and the next chunk starts only when every return of the current chunk is stored.
Progress: the sequence of returns stored with `fc return` and the events the hooks record; the evidence page is the display, and the session's own scrollback is not evidence.
Stopping: the three gates halt the session's turn; the stop gate holds the turn in the contracts and verify phases; a halt return stops dispatch immediately and the run escalates.
