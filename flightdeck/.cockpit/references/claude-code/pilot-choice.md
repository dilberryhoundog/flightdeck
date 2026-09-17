# Pilot's Choice of Instrument

Decided 2026-09-17. Revisit when agent teams leave experimental status or when a mission needs parallel long-lived crew.

## Default: single session dispatching subagents

The pilot runs as one session and dispatches crew through the Agent tool. Reasons:

- It works today without an experimental flag.
- Crew results return to the pilot directly, which suits the cockpit's dispatch-and-verify pattern.
- Cheaper. Token cost does not scale with idle teammates.
- Fresh agents get only the spawn prompt, which enforces the cockpit boundary: crew never see the pilot's context unless the pilot writes it into the brief.

## When to use an agent team

- A mission needs several crew working in parallel over a long stretch with cross-talk (competing hypotheses, multi-angle review).
- The commander wants to watch and steer teammates directly in the agent panel.

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and an interactive session. Propose through `base/` before enabling; it is a settings change.

## When to use session messaging

- Coordinating with another live session the commander runs, such as a session working in a launch or run folder.
- Getting an idle notice when a long-running session finishes.

## Rules for the pilot

- Never use `subagent_type: "fork"` for crew. A fork carries the cockpit's context out of the cockpit.
- Use `isolation: "worktree"` for crew that write code and whose changes should be reviewed before landing.
- Continue a crew member via SendMessage for follow-ups rather than spawning fresh; it keeps their context.
