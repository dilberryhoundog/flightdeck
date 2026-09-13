# fixtures/sample-transcript

Orchestrator session records in Claude Code's transcript shape, and the events file the obedient one wrote, for the checks of B21–B24, B62, B63, E14 and E15.

- orchestrator.jsonl — the session that obeys: the liftoff written unchanged before the first workflow, one workflow per human instruction, the sequence in its stated order, each result reported with what to read next, a workflow_end event after each, and the pull request opened and reported after fc-report.
- orchestrator-control.jsonl — the control, where every one of those must fail: the liftoff mutated on its way to the run, three workflows out of order on one instruction, and no pull request.
- orchestrator-pr-failed.jsonl — E15: gh pr create fails, the failure and the branch name are reported, nothing is opened.
- liftoff.json — the liftoff those sessions were handed; liftoff-invalid.json — the one that fails the liftoff schema (E14).
- events.jsonl — the workflow_end lines of the obedient session, in sequence order.

A record is { type: 'user' | 'assistant', timestamp, message: { role, content: [...] } }; a tool call is a content block of type tool_use with name and input, and its result arrives as the next record carrying toolUseResult.
