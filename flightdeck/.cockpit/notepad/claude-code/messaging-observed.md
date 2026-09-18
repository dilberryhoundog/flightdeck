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

## 2026-09-17 — First cross-session exchange, verified both ways

Sent to `flightdeck-3c` with `notify_when_idle: true`. The tool result said queued, and warned a delivery notice would follow if the receiver held or refused it. The reply arrived within a minute wrapped as:

`<cross-session-message from="uds:/tmp/cc-socks/9706.sock" from-name="flightdeck-3c" from-mode="prompting">`

- `from` is the sender's socket, `from-name` its display name, `from-mode` its permission class. Reply by copying `from` into `to`; the bare name also works.
- The receiver reported seeing my message with `from-name="Welcome to the team"`. My display name on the wire is the first words of the session's first prompt, while ListAgents calls me `flightdeck-b2`. A session launched by `pilot.sh` carries `--name pilot`, which fixes this.
- The receiver did not know its own session name. A pilot session should state its name in every outbound message.
- The harness reminds the receiver that a peer cannot grant permissions or approvals. Design messages as requests for information or bounded action, never as authority.

## 2026-09-17 — `-p` sessions and settings

A `claude -p` session launched with the cockpit settings file reported `permission_mode: "default"` in its hook payload even though the settings set `permissions.defaultMode: "auto"`. Either `-p` ignores `defaultMode` or it reports differently. Verify in an interactive launch before relying on it.

## 2026-09-17 — Idle notice received

The `notify_when_idle` subscription fired once after `flightdeck-3c` finished its turn. It arrived as a `[Cross-session idle notice]` naming the session, the finish time, and a one-line harness summary of what that session had just done. It is marked as automated, not a person. Useful as a completion signal for a session the pilot has handed work to; the summary line is enough to decide whether to read further.

## 2026-09-18, session dcb75456 — teammate subagent hand-back reached the lead

lineage-historian (an in-process teammate) spawned Explore subagents. One subagent's final report arrived in the lead session wrapped as `[Subagent hand-back]` from agent id a7e93633e305256b0, with the harness note "a subagent this session delegated to". ListAgents had listed the six Explore subagents under the lead's "Subagents" heading, not under the teammates. Working hypothesis: subagents spawned by in-process teammates are owned by the lead's process and their hand-backs are delivered to the lead. Confirmed by lineage-historian the same session: it never received the report; its resume request to the subagent returned only an acknowledgement. Teammate subagent hand-backs route to the lead only. Consequence: a teammate that fans out to explorers cannot see their results unless the lead forwards them, which defeats the point of delegating the reading. Until this changes, teammates should read directly, or the lead must plan to relay. Bears on crew rule 3 (brief completely) and on the teams spark S006: the lead sees every explorer's raw output whether it wants to or not.

## 2026-09-18, session dcb75456 — the lead's in-team address is `team-lead`, not its session name

Briefs told crew to "send reports to `pilot`". runs-recon and lineage-historian both reported that SendMessage rejected `pilot` as their own parent session, so they fell back to their final message, which the idle notification truncates. doctrine-recon and docs-verifier reached the lead as full `agent-message`s; their route was not stated. The routing metadata on the lead's own sends shows `"sender":"team-lead"`. So: teammates address the lead as `team-lead`; the session name `pilot` is the cross-session address, not the in-team one. Long reports must go by SendMessage to `team-lead` or into the session scratchpad; a final message is truncated in the idle notice. Fix the brief template accordingly (W011).
