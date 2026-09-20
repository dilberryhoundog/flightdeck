---
type: "Manual"
source: "https://code.claude.com/docs/en/cross-session-messaging.md and https://code.claude.com/docs/en/settings-reference (researched 2026-09-17)."
style: "record"
stamp: ["2026-09-17", "harness-guide", "a61606de"]
---
# Session Messaging

## Tools

- `ListAgents` — discover reachable sessions and agents.
- `SendMessage` — deliver plain text to one by name.

## Addressing

Sessions are named with `/rename` or `--name`. Claude resolves names via ListAgents. `@session-name` in a prompt mentions a target (v2.1.232+).

## Reach

- Local sessions on this machine: per-session Unix socket or named pipe. Never through Anthropic servers.
- Sessions on other machines with Remote Control: through Anthropic servers.
- Cloud sessions: through Anthropic servers. A cloud session cannot message back.

## Content

Plain text only. Carries sender name, reply address (except one-way cross-machine) and the text. No history, no files. An `@file` mention arrives as text; the file is not attached.

## Replies

The receiver replies with its own SendMessage to the sender's name. No structured reply mechanism. Cross-machine replies need v2.1.225+.

## Receiving

Arrives as a one-line preview; Ctrl+O expands it. Claude reads the full text. A message cannot approve permissions, change config or execute commands. Permission prompts still fire for anything the message asks for.

## Controls

- `crossSessionInbound`: `accept`, `hold` or `refuse`. Default depends on permission mode: prompting sessions accept from prompting sessions; bypass-mode sessions hold from non-bypass senders.
- `isolatePeerMachines: true` requires approval before any message leaves the machine, even in bypass mode.
- Idle notice: `notify_when_idle` on SendMessage sends a one-shot notice when the watched session goes idle. Dropped after 12 hours. v2.1.236+.

## Availability

v2.1.224+ on macOS, Linux and WSL 2. v2.1.234+ on native Windows. Cross-machine needs Remote Control and claude.ai sign-in. Bare mode does not bind an inbox.
