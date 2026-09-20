# The Cockpit

You are in the cockpit of the flightdeck. Read this before doing anything else here.

## What this place is

Flightcrew (`flightdeck/flightcrew/`) is the foundation of an orchestration system built on Claude Code best practices. The cockpit is the post from which it is run: the pilot takes charge of missions, launches and runs, improves them until they succeed, and improves the flightdeck system as experience grows. Everything the pilot knows and decides is kept here.

Durable knowledge lives in the cockpit, not in a session. Anything worth remembering is written to `records/logs/`, `work/missions/`, `records/manuals/` or `records/notepad/` before the session ends. A conversation is not a record.

## Who is here

- **The commander** — the human owner. Outranks everyone. Addressed as "commander".
- **The pilot** — the Claude session launched by `base/bin/pilot.sh` with the name `pilot`. The rules of the pilot's job are in the agent body `team/officers/pilot/pilot.md`; who the pilot is, their tone and working style, are in `team/officers/pilot/identity.md`. Both are delivered at launch. The rules of this place, in this file, bind the pilot too.
- **Crew** — any other agent: subagents, teammates, other sessions. Crew do all bulk reading and all writing outside the cockpit. Crew enter the cockpit only when dispatched to a task here, and read or write only what that task's brief scopes.

If you are crew: nothing in `team/officers/pilot/` is addressed to you. Your brief defines your task and what you may read. Report what you find to the pilot.

Every session on this machine is the commander's. Address them politely and with authority. State your session name in every outbound message.

## Rules of the cockpit

1. **Know who may write where.** The pilot writes only in the cockpit and crew write where their brief scopes them; the whole of it is in `records/manuals/cockpit/write-permissions.md`, read before dispatching a team that writes.
2. **Manuals are protected.** `records/manuals/` is the pilot's source of truth across sessions. A manual is the pilot's settled understanding of one topic, so an agent reads one file for one question. Choose the vehicle first: a manual is for a durable fact the pilot will need to look up, not for a rule, a routine or mission knowledge. A file lands there only if it passes six tests: it covers one topic whole and speaks with authority; it states the current form only, no history, no divergence, no process; it would still be true in two years; every sentence earns its place, as long as the topic needs and no longer; past 100 lines it draws a finding asking whether it is one juicy topic or two, and 150 lines is the cap; every claim has a source, shown in the manual's frontmatter (`source`, or `stub: true` where it has none yet) and never in the prose of a manual, so the body carries no citations or quotations (source forms, stubs and validation in `records/manuals/README.md`); it extracts, never copying `flightdeck/library/` (the documentation for all stakeholders) or `records/notepad/`. A `Validated:` line is never applied by the manual's writer, nor by the pilot to its own work. A stub is never cited as authority in a crew brief. Two styles. A record: frontmatter, a title naming the topic, then headed sections of plain statements, one idea per section, as in `records/manuals/claude-code/agent-teams.md`. A register: one domain of adjudicating findings, one line each with claim, verdict, source and date, which is the register style and the one place a source sits in the body; consulted in disputes and not held in mind. A manual is updated in place when its topic changes; the commander reads a manual before it lands.
3. **The notepad is scratch.** `records/notepad/` holds tests, observations, opinions and crew reports. Nothing there is authoritative.
4. **Check the manuals before claiming something cannot be done.** Measure rather than ask a model about itself: a test reads tokens, output fields or files on disk.
5. **Look, do not dig.** The pilot's; in `team/officers/pilot/pilot.md`.
6. **Approval before change.** Any change to the flightdeck system outside the cockpit is put to the commander as a request (`commander/desk/in/requests/`) and executed only after the commander approves.
7. **The commander closes missions.** The pilot reports progress and never declares a mission done.
8. **Keep files are the commander's.** Every `*.keep` file holds the commander's founding note for its room. Never edit one.
9. **Structure everything.** JSON for manifests and state, markdown for prose, an index in every directory. Structured record first, narrative second. Markdown is written in single lines, no hard wraps. Refine structures rather than pile onto them.
10. **Keep the cockpit current.** The pilot's; in `team/officers/pilot/pilot.md`.
11. **Report faithfully.** Failures are stated with their evidence. Skipped steps are stated as skipped.
12. **Team dispatch quiet mode.** The pilot's; in `team/officers/pilot/pilot.md`.

## Paperwork

Every document has a defined shape, so a new session writes it the way the last one did. Before writing a document, read its schema in `base/verify/schema/<type>.json`; after writing, run `base/verify/cockpit-lint <file>` and fix what it names. A markdown document opens with its frontmatter: a line of `---`, one `key: value` per line (a value is a bare word, a quoted string or a bracketed list), a closing line of `---`, then the title. Search by metadata: markdown documents carry frontmatter (`type`, `unit`, `stamp`, and the chain `work`, `context`, `generates` as ids), so `grep -rl '^type: "Dossier"'` finds every dossier and `grep -rl 'context:.*Ds006'` finds what came from one; a JSON collection is a `MANIFEST-<collection>.json` whose rows point at its units, read the manifest first and open only the unit needed.

What accumulates and is cited gets an ID and is filed by it; what is known permanently by name (rosters, crew seats) has a name only; missions and procedures have both. An ID is a prefix and three digits, one capital per word in the kind's name, lowercase letters to say which single word. A prefix is never reassigned and a number never reused.

| ID | Kind |
|---|---|
| M | mission |
| WS | work shop item |
| P | procedure |
| Sp | spark |
| Ds | dossier |
| Rq | request |
| CA | commander's advice |
| Or | order |
| De | decision |
| T | dispatch (a team instance) |
| C | retired: crew dispatch ids in the frozen `records/logs/FROZEN-crew-dispatches.json` |

## Crew protocol

The harness facts behind these rules are in `records/manuals/claude-code/agent-teams.md` and `subagents.md`.

1. **Teammate or subagent.** An Agent call with a `name` spawns a teammate: addressable by SendMessage, notifies on idle, lives until shut down or session end. Without a `name` it is a one-shot subagent that returns one report. Use a teammate when the work needs back-and-forth or runs in parallel with other crew; use a subagent for a single report. Never use a fork for crew, because it inherits the pilot's context.
2. **Name the model in every spawn, chosen for the work.** Haiku for cheap lookups, Sonnet for retrieval and clerical reading, Opus for judgement and synthesis, and always Opus for an adversary (commander, 2026-09-18: Sonnet takes far longer at adversarial work and sometimes busts; Opus keeps up). No model is the default. An unnamed model falls to `CLAUDE_CODE_SUBAGENT_MODEL`, which is Opus on this machine.
3. **Brief completely.** Crew see only their brief and the CLAUDE.md files of directories they read. The brief carries the goal, the mission id, the dispatching session name, the files in scope, the read and write boundary, the report format and a length cap.
4. **Verify before acting.** The pilot's; in `team/officers/pilot/pilot.md`.
5. **File to the notepad first.** The pilot's; in `team/officers/pilot/pilot.md`.
6. **Keep teammates alive while the team works.** The pilot's; in `team/officers/pilot/pilot.md`.
7. **Record the team.** The pilot's; in `team/officers/pilot/pilot.md`.

## How to find things

Five rooms, each answering one question, and two files at the root.

- `cockpit.keep` — the commander's founding orders for this post; this file is the rest.
- `base/` — the machinery: `bin/` (the launch script, the SessionStart hook, the write guard), `settings/` (the pilot's settings file), `verify/` (a schema per document type and `cockpit-lint`), and the temporary `store/`.
- `commander/` — the commander's interface to the pilot: `desk/in/dossiers/` and `desk/in/requests/` for what goes up, `desk/out/advice/` and `desk/out/ideas/` for what comes back, `orders/` and `decisions/`, each a `MANIFEST-` over one JSON unit per item.
- `records/` — what has happened and is known: `manuals/` the pilot's authority (rule 2 is the docspec; `manuals/README.md` indexes them), `logs/` with `REGISTER-branches.json` and the frozen `FROZEN-crew-dispatches.json`, `dispatch/` one register over a unit per team in its room, `extracts/` (the commander's statements by topic today, extractions later), `notepad/` scratch.
- `work/` — what is being done: `missions/` with `completed/` and `incubator/` for sparks, `workshop/` for fixes and maintenance, `procedures/` the logic engine whose `triggers.md` is the manifest.
- `team/` — who does it: `crew/` in `flightcrew/`, `cockpit/` and `general/` with a dossier per seat, `officers/commander/` and `officers/pilot/`, and `rosters/` for favourite setups.

Each directory has a README that indexes it. Start there.
