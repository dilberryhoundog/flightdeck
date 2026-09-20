# Teammate test of the agent body — T016, 2026-09-21

Session 71b94de4, launched by `pilot.sh` on the agent body (8a05299). One Haiku teammate, `body-tester`, spawned by the Agent tool with `subagent_type: general-purpose`.

## What the teammate said

- It is crew, from the "Who is here" line in the cockpit `CLAUDE.md`.
- It has no session start duty.
- Its system prompt has no "# Pilot", no "# Pilot — Identity", no "# Commander".
- The cockpit `CLAUDE.md` reached it; it said "in system prompt".

## What the disk says

The teammate's transcript is `~/.claude/projects/-Users-dylangraham-Projects-flightdeck/<session id>/subagents/agent-abody-tester-<hash>.jsonl`, with a `.meta.json` beside it. It holds `attachment` rows of type `prompt_snapshot` whose `systemPrompt` field is the system prompt the teammate was sent. So a teammate's system prompt can be read from disk, not asked for.

- The recorded system prompt (21 KB across two snapshots): zero matches for `pilot`, `Pilot`, `Ace`, `commander`, `Commander`, `cockpit`, `Standing orders`. Its headings are the harness's own (Harness, Session-specific guidance, Memory, Environment, Context management, Finishing work, Agent Teammate Communication). The pilot's body, `identity.md` and `commander.md` do not reach a teammate.
- The cockpit `CLAUDE.md` arrived as a `nested_memory` attachment at transcript row 17, after the teammate's first tool round, not in the system prompt. The teammate's account of where it came from was wrong; its account of what it had was right.
- The teammate's working directory was the cockpit, because the pilot's shell had moved there before the spawn. The team config (`~/.claude/teams/session-<id>/config.json`) records the lead's cwd as the repo root and the teammate's as the cockpit.

## The pilot's error

The brief told the teammate to read `flightdeck/.cockpit/README.md`. There is none: the cockpit root has `CLAUDE.md` and `cockpit.keep` and no README. The read failed and the nested `CLAUDE.md` loaded anyway. Whether the failed read or the working directory triggered the load is not settled by this test.
