# Messaging — Observed from the Cockpit

Facts observed by the pilot calling the tools, not from docs. Date each entry.

## 2026-09-17 — ListAgents from the cockpit session

- This session is named `flightdeck-b2 [9bc1cf]`. That is the address other sessions use. It is not listed among peers.
- Peers reachable on this machine: `flightdeck-3c [9d8b6e]` (interactive, idle, started a day earlier) and `spec-builder (3) [d5b14c]` (background, idle, started seven days earlier).
- Names appear to be auto-generated as `<project>-<two hex>` when `--name` is not given. Confirm in docs.
- Background subagents of a past session remain listed and addressable for days. A stale one can be resumed by a message, which is a cost and a hazard: message only what the pilot means to wake.

## 2026-09-17 — SendMessage tool contract

- `to` is a bare name from ListAgents, a teammate name, `main`, or a raw agentId. Append `[ref]` only to disambiguate.
- Plain text only. `@path` attaches nothing on the receiving side.
- A successful send means delivered to the session, not read. A session in a different permission mode holds the message for its human. Silence is not agreement.
- `notify_when_idle: true` subscribes once to the target's next idle. Main conversation only, same machine only.
- A subagent's send goes out under the parent session's address and replies land in the parent's conversation.
- Never ask a peer to do something this session was denied. Permission laundering.

## 2026-09-17 — Continuing a crew member

SendMessage to a subagent's agentId resumes it with its context. Used to send the harness-guide back out for the settings research rather than briefing a fresh agent.

## 2026-09-17 — `claude agents`

`claude agents` lists running sessions, not agent definitions. Needs a TTY; `claude agents --json` works from a script and returns pid, id, cwd, kind (interactive or background), startedAt, sessionId, name, status, and for background agents a state. This is the shell-side twin of ListAgents and the way a launcher script can check whether a pilot session is already up before starting another.
