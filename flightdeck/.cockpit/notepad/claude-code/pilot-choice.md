# Pilot's Choice of Instrument

Decided 2026-09-17, revised the same evening on the commander's order: the teams flag is now set in the pilot's settings. "The env flag is your link to the outside world. Be bold, learn it from the beginning."

## Two instruments, both live

Subagents via the Agent tool for bounded reads and single units. Agent teams for anything parallel or long-lived. The pilot learns teams by using them on real missions, starting with research and review teams as the docs advise.

## Subagents: when and why

The pilot runs as one session and dispatches crew through the Agent tool. Reasons:

- It works today without an experimental flag.
- Crew results return to the pilot directly, which suits the cockpit's dispatch-and-verify pattern.
- Cheaper. Token cost does not scale with idle teammates.
- Fresh agents get only the spawn prompt, which enforces the cockpit boundary: crew never see the pilot's context unless the pilot writes it into the brief.

## When to use an agent team

- A mission needs several crew working in parallel over a long stretch with cross-talk (competing hypotheses, multi-angle review).
- The commander wants to watch and steer teammates directly in the agent panel.

Enabled by `base/settings/pilot.settings.json`. Interactive sessions only, so teams exist only when the commander invokes the pilot through `base/bin/pilot.sh`. Teammates never enter the cockpit; the guard hook in the pilot's settings applies to the pilot's own tools, and teammates receive an explicit do-not-write rule in their spawn prompt.

## When to use session messaging

- Coordinating with another live session the commander runs, such as a session working in a launch or run folder.
- Getting an idle notice when a long-running session finishes.

## Rules for the pilot

- Never use `subagent_type: "fork"` for crew. A fork carries the cockpit's context out of the cockpit.
- Use `isolation: "worktree"` for crew that write code and whose changes should be reviewed before landing.
- Continue a crew member via SendMessage for follow-ups rather than spawning fresh; it keeps their context.


## Launcher implication (moved from records/claude-code/settings-and-launch.md, 2026-09-18)

A launcher must pass the same flags every time, on first launch and on resume. A settings file by path carries hooks, permissions, env and messaging policy. The persona itself comes from either an agent definition (replaces the system prompt, restricts tools) or an appended system prompt file (keeps the default prompt). The choice is tested in `launch-tests.md`.
