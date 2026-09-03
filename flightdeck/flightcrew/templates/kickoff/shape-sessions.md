<!-- version: 1 -->
## Shape: sessions
The run is split across more than one Claude Code session against the same launch: one conducting session that owns the gates, and one further session per long-running stream of units. Choose this shape when a stream needs its own context window for hours rather than turns; the gates, the fc commands and the stored returns are identical to the other shapes.
Dispatch: each session dispatches implementers for its own units only, and only from prompts rendered by `fc worker render` in that session. Two sessions never hold the same unit, and the implementers_concurrent ceiling counts across every session, not per session.
Progress: the launch folder is the only shared state — the stored returns, the events file and the evidence page. A session that needs to know what another has done reads `fc launch status` and the returns, never the other session's transcript.
Stopping: only the conducting session records gates and runs `fc launch end`. A stream session that reaches a halt or a ceiling runs `fc launch escalate` and ends its turn; the escalation is visible to every session through the launch folder.
