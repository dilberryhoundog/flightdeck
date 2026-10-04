---
type: "Mission"
unit: "M002"
status: "in_progress"
stamp: ["2026-09-20", "Pilot: Ace", "b27e6c01"]
branch: "cockpit"
assigned_by: "commander"
context: ["Sp009"]
---
# M002 — Make the cockpit self-sustaining and self-improving

- **Status:** in progress from 2026-09-21 (Or065); M001 stays current until the commander closes it

## Goal

The agent that operates the cockpit gets steadily better at administering the system, by folding well-grounded practice and the commander's steering into the cockpit as it works, so that repeated work is conducted from the cockpit's own procedures, rosters and records rather than re-prompted, and the commander steers rather than repairs.

## What done looks like

- Routine cockpit work (forming a team, cleanup, currency, topics, record keeping) is conducted from procedures, on the agent body that M001 fits out, without the commander prompting the steps, across several sessions and at least one pilot reset.
- The pilot extracts a procedure from live work when it repeats a routine, and keeps procedures current; the commander adjusts rather than authors them (Or043).
- The commander's corrections are captured at the moment they are given and routed to a vehicle the same day; the same correction is not needed twice.
- Teams are repeatable: a roster plus a procedure dispatches a known team shape with briefs drawn from the seat dossiers, and each flight improves the dossier.
- The commander's statements reach the topic store in real time rather than by deep mining, and fine-tune records and procedures at the periodic review.
- The flightcrew branch of `work/procedures/` lets the pilot conduct what the fc CLI was built for: launch and run folder setup, run iteration improvement, the pre-run teams for spec and tests, launch ending.
- Whether a manifest line actually fires is measured, not assumed.
- The commander closes the mission.

## Orders

"A mission to make the cockpit self-sustaining and self improving over time, the agent that operates here getting ever better at administering the system, through incorporating the results of well grounded practices and commanders steering inputs over time." (2026-09-18.) Order of march: fit out the cockpit (M001), then this, then the flightcrew build-out (Sp008).

On procedures (Or042, 2026-09-20): match rosters with tasks, context files and steps for repeatability; cockpit and flightcrew branches; with an actual pilot, procedures conduct with more intelligence most of what the brittle fc CLI was intended for; advanced configuration is recorded in this mission. On their making (Or043): the pilot extracts procedures from live work and keeps them updated; the commander advises and adjusts.

Promoted 2026-09-20 on the commander's word: "promote the self sustaining mission".

## Objectives

- [ ] Procedures extracted from live work as routines repeat; the `Added:` to `Approved:` loop exercised with the commander.
- [ ] Rosters matched to procedures: a procedure names its roster and tasks, and dispatch from it is one step.
- [ ] Real-time capture of the commander's statements and decisions (folds in Sp007), replacing deep mining.
- [ ] Teams from the dispatch record (folds in Sp006): lessons in `records/dispatch/MANIFEST-dispatches.json` and the seat dossiers feed the next brief.
- [ ] The flightcrew branch of `work/procedures/`, built once the cockpit fitout settles and work on the system begins; starts with a survey of what the fc CLI does.
- [ ] Advanced procedure configuration: a procedure calling another, conditional steps, versioning and retirement, due-ness machinery if events prove too loose.
- [ ] A measure of whether manifest lines fire, and of drift events a line should have caught.
- [ ] Enforcement where instruction is not enough: damage-preventing rules in the guard.
- [ ] Team infrastructure refitted to the shapes the commander set in CA004 (added 2026-09-22 on his word, found by accident in T017): roster, dossier in two kinds, dispatch as the pilot's residue with crew bulk in the notepad and hook output in `records/events/`, agent definitions, a notepad README per team, and P002 rewritten from the findings (WS031, WS030). Preceded by boundary manuals on adversary mechanics, agent team function, team file infrastructure and found strategies, then a narrow discovery run on the team-builder's own seats, entry points and shape, then the mini-spec team for the build request (Or066).

## Crew dispatched

- 2026-09-21 — T017, idea exploration of the team-builder with the commander in the room (Or065, Or066): cockpit-auditor, record-miner, practice-scout, option-maker; adversary live from the first report (Or067), source-adversary in tandem (Or071), body of experiments he ordered in flight (pooled queue, cold readers); Ds007, CA004.

## Outcome

Pending.

## Lessons (appended as they happen)

- From T009: put the commander's latest order on the subject in every seat's read scope.
- From T017: a discovery run on an idea that presupposes settled infrastructure answers the infrastructure question instead; settle the boundaries first, then run discovery narrowly (Or084). And the briefs anchored the crew on today's placeholders (P002, the schemas) when the idea file said the infrastructure could change; read the idea's own scope before naming the files in scope.

## Re-activation

To be written at close.
