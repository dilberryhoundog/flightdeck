---
name: capture
description: "Captures a task or goal as one line in .flightdeck/workshops.md, where it waits until you activate it. Makes no folder and starts nothing. Only you start it: /flight:capture <goal in your words>."
argument-hint: "<goal in your words>"
disable-model-invocation: true
allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs *), Read
---

# Capture

A workshop is one piece of work FlightDeck keeps track of. Capturing it means writing one line about it in `.flightdeck/workshops.md` (the list of every workshop) so it is not forgotten. The line waits there until you activate it. Nothing starts, no folder is made, nothing is committed.

The goal is what the owner typed after the command: `$ARGUMENTS`.

## Steps

1. If the goal is empty, ask for it in one line ("What is the goal, in your words?"). In a session with no person to ask, stop and say how to call it: `/flight:capture <goal in your words>`.
2. Pick a name for it: two to four words from the goal, lowercase, joined by hyphens, at most 40 characters (for example `pre-flight-card-oldest-question`). To get a name from the script instead, run `node ${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs name <goal>`; it also avoids names already taken.
3. Run `node ${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs capture <name> '<goal>'` with the owner's words exactly as typed. When the goal holds a single quote, run `node ${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs capture <name> --ask -` and pass the goal on standard input instead, so no quote can break it.
4. Never reword, shorten or fix the owner's words. They are filed as given.
5. If the script prints a line starting `refused:` because the name is taken, say so in one line. Offer `/flight:workshop <name>` if it is the same work, or a new name if it is different work, and stop.
6. Reply in one sentence, with the real name filled in: "Captured as <name>: it waits in .flightdeck/workshops.md until you activate it with /flight:workshop <name>."

## Never

Make a folder, run an agent, write any other file, commit or push. Capturing only adds the one line; the owner decides when it becomes active.
