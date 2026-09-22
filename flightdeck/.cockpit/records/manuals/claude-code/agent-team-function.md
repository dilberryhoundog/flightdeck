---
type: "Manual"
stub: true
style: "record"
stamp: ["2026-09-22", "Pilot: Ace", "71b94de4"]
context: ["T015", "T016", "T017"]
---
# Agent team function, as measured in the cockpit

The harness facts a team design rests on. Each was measured in a cockpit session on CLI 2.1.278 or read from the official page and checked raw; the working notes are in the T015 to T017 notepad folders. `agent-teams.md` and `subagents.md` beside this file hold the documented mechanics; this file holds what the cockpit has measured about them.

## Lifetime

A team lives for one session. One team per session; a teammate cannot spawn teammates, though it can spawn foreground subagents. The lead is fixed. Teammates are not restored on resume. The team config and the task list are removed at session end, so nothing that lives only there survives: harvest it during the flight.

## What a teammate is given

A teammate spawned from an agent definition receives the definition's tools, model and body. Skills are not applied. Whether the definition's hooks or its `memory` reach a teammate is not documented and not yet measured. The body is appended to the default prompt in-process and replaces it in split panes. A teammate's system prompt does not contain the lead's agent body or appended persona; the cockpit `CLAUDE.md` reaches it as a nested memory when it reads a cockpit file. The lead's shell directory at spawn becomes the teammate's working directory.

## Capability is fixed at spawn

A seat's tools are decided when it is spawned and follow the lead's availability at that moment. A change in user settings reaches the running lead without a restart and reaches teammates spawned afterwards; it does not reach teammates already running. A roster that depends on a tool is spawned after the tool exists.

## Permissions

Teammates inherit the lead's permission mode except `dontAsk`. Under `auto` mode the classifier approves actions without a human; after three consecutive blocks or twenty in a session, not configurable, the session returns to prompting. An unattended team is therefore possible under `auto` while its work stays inside what the classifier approves. `permissionMode` in an agent definition is ignored under `auto`.

## The shared task list

The Task tools (TaskCreate, TaskGet, TaskList, TaskUpdate) are available by default only on the models the tools reference lists; on others they are enabled by `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` in settings or by `--tools`. An agent definition's `tools` field does not enable them; naming them there leaves the agent with whatever else resolved. TaskStop is separate and always present. The list lives at `~/.claude/tasks/<team name>/`; `CLAUDE_CODE_TASK_LIST_ID` shares one list across sessions.

The lead creates tasks; dependencies block claiming and unblock automatically on completion. A teammate claims by setting itself as owner. A claim on a task that already has an owner is accepted, last writer wins; the file lock protects the file, not the claim, so two claims within about a second both succeed, most often when a shared dependency unblocks. Claim, then read the task back to confirm the owner. No field scopes a task to a role; scoping is by assignment, dependency or the task's wording, which a cooperative seat respects. Setting an owner sends that seat a `task_assignment` message; these arrive minutes late, so the list is the truth and the notification is not. Completed tasks are deleted and a finished list is empty: the list is a queue, not a record. An idle teammate does not poll the list; a working one can poll inside its turn.

## Hooks around teams

`TaskCreated` and `TaskCompleted` fire on creation and completion and can refuse with feedback; both carry the teammate's name, neither carries its agent type or an owner, and no hook fires on a claim. `TeammateIdle` can keep a teammate working. `SubagentStart` and `SubagentStop` carry the agent type and fire on a teammate's turns. Whether a definition's own hooks run for a teammate is unmeasured.

## Messages and state

Inside a team the lead is addressed as `main`; the session's name bounces. A message to a busy teammate is read between its tool calls and lands inside the round it is writing. An idle notification is written at the end of a turn, before the seat reads the messages queued during it, and reaches the lead after the seat may already be working again: a seat's state is read from its transcript, not from its notice. Each teammate's transcript sits under the session's `subagents/` folder with a `.meta.json` beside it holding the agent type, model, kind, permission mode and team name, and no spawn time (the file's own time serves). The transcript's `prompt_snapshot` rows hold the system prompt the seat was sent.

## The human at a seat

The human can select a teammate and type to it; plain text and skills go to that seat, built-in commands stay with the lead, and Escape interrupts the seat's turn. The seat's idle notification still goes to the lead. Whether the seat can tell the human's typing from a relayed message is not measured.
