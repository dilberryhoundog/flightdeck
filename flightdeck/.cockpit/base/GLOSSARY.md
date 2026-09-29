# Glossary

Agreed terms and identifier prefixes for the cockpit, as the constitution requires. A term is offered with a `-` bullet and a one-line meaning; the commander flips it to `+` to approve it. A `-` left standing is held. Terms are grouped by the thing they belong to (CA-002). Mined from the dispatch records, rosters, crew files and manuals on 2026-09-24 (CO-092, XD-006); where the constitution uses a term, its meaning is the constitution's.

## Ranks

- **commander**: the human owner; the highest rank; gives orders and advice as records.
- **captain**: the pilot's rank, below the commander; makes every decision against the project and directs the teams.
- **pilot**: the agent that holds the captain's seat.
- **crew**: every agent other than the pilot: subagents, teammates and other sessions.

## Agents

- **adversary**: a seat that attacks work to find what is wrong with it.
- **live adversary**: an adversary dispatched at the first landing, attacking each artefact as it lands and reporting to the lead only.
- **cold reader**: an adversary spawned after the work is frozen, given the finished product and its sources and nothing of the history.
- **tandem**: two or more identical seats under one dispatch, run together so the seat keeps up with the rest of the team's output; tandem seats do not check each other's work (CA-054).
- **clerk**: a standalone Sonnet agent that reads, writes and searches for the cockpit; run across sessions for long jobs or as a return subagent for one.
- **commanders-advocate**: a standalone Opus agent that checks team outcomes and diffs against the commander's records and records the contradictions it finds.
- **lead**: the pilot's role in a dispatched team, managing the team's dispatch mechanics.
- **seat**: one role in a roster or dispatch, filled by a named crew member.
- **teammate**: a named crew member in a team, addressable by message, alive until shut down or the session ends.
- **return subagent**: a one-shot agent that does one task and delivers one report, then ends.
- **cross-session**: work or messages passed between separate Claude Code sessions.
- **angle**: the particular approach one specialist brings to a piece of work; many angles together make good work.
- **agent definition**: a real agent file giving a seat its own system prompt, model, tools and hooks; it always has a crew dossier to control it.
- **crew dossier**: the file that tells the pilot how to set up, vary, dispatch, test and improve one seat.
- **entry point**: the instructions that spawn a seat, written in its dossier, from which the lead's dispatch message is built.

## Teams

- **roster**: a prebuilt team that can be called again: its seats, the stages they are dispatched at, the shape of the call, what it outputs, its signals and tests.
- **dispatch**: what a team leaves behind: the seats granted, their entry instructions, the outcome, and the improvements and events found during the run.
- **brief**: the full instructions a seat is given: the goal, the mission, what it may read and write, what it returns and how long.
- **shape**: how a team's seats are run: parallel, staged, dependent.
- **stage**: the point in a team's flight at which a seat is dispatched: setup, live, end, full.
- **axis**: a dimension a team's performance is tuned across (speed, coverage, quality, alignment, security, adversarial).
- **round**: one cycle of an adversary's attack and the writer's answers on one landing.
- **pass**: one numbered, frozen version of a piece of work.
- **finding**: one numbered claim raised by a seat, with its evidence; it stands, is withdrawn or is disputed.
- **withdrawal**: a seat retracting one of its findings in writing, with a one-word reason.
- **sweep**: a scan over a set of files or records to check them or apply improvements.
- **in the room**: the commander present and taking part live while a team works, rather than reading a report afterwards.
- **at the seat**: the commander taking a seat in a team and working from inside it.

## Recording

- **record**: one written unit of the commander's or the pilot's corpus, filed by identifier, with the shape its prefix gives it.
- **record flag**: a record prefix written in chat or inside a document (CO:, CA:, CQ:) to mark text as a record for extraction.
- **commander's intent**: what the commander's records, read together, mean for the project; the standard the advocate checks work against.
- **conceptual unit**: one self-contained idea; the grain of a decision and of advice, flagged on its own inside a decision.
- **enacted approval**: the commander's act on a pilot draft: full (frozen, proceed), part (the commander amends his own record and the pilot redrafts), held (no further progress).
- **freeze**: a pilot record becomes frozen when the commander gives full approval, and the pilot proceeds; inside a team, a pass is frozen when its writer acknowledges it, and further change makes a new pass.
- **held**: a draft, record or idea kept inert until the commander returns to it.
- **standing order**: a commander order promoted to apply across every session.
- **standing decision**: a pilot decision promoted for permanence.
- **promotion**: raising a record for permanence: an order to a standing order, a decision to a standing decision, a corpus record into infrastructure.
- **hotspot**: a place where the commander's intent is built into the project: CLAUDE.md, manuals, trustworthy tests, procedures.
- **retire**: marking a record no longer relevant; the step before pruning.
- **prune**: removing a retired record for good.
- **dossier**: a presentation record giving the commander the full picture of a dispatch result, a crew member or a roster.
- **shift log**: the pilot's daily log, written during the session and read at the next session's start.
- **notepad**: scratch for the pilot and crew, nested under the mission it serves, mined for findings; nothing in it is authoritative.
- **extract**: bulk source material condensed into key findings.
- **operators manual**: a settled reference on conduct that guides the pilot and crew in operating the cockpit.
- **technical manual**: a settled reference on infrastructure that helps agents find their way.
- **procedure**: predefined conduct the pilot announces in place of writing a decision, extracted from prominent decisions and orders.

## Work

- **mission**: an epic piece of work that progresses over time and dispatches and delivers one great idea to completion.
- **horizon**: the tag on a mission the project clearly needs next.
- **spark**: a possible mission held in the incubator until promoted, joined with another, demoted to the workshop, or held.
- **workshop item**: an isolated fix, bug or maintenance job kept apart from any mission.

## Prefixes

- **CO**: commander order.
- **SO**: standing order.
- **CA**: commander advice.
- **CR**: commander response.
- **CQ**: commander question.
- **CI**: commander idea.
- **XD**: pilot decision.
- **SD**: standing decision; a status a pilot decision takes on promotion, not a separate file.
- **XR**: pilot request.
- **Ds**: pilot dossier.
- **XX**: pilot dispute.
- **XP**: pilot plan.
- **PP**: pilot procedure.
- **M**: mission.
- **Sp**: spark.
- **WS**: workshop item.
- **T**: dispatch.

Rq and P are still on disk (Rq013 to Rq015, P001 to P006) and are not listed; they become XR and PP in the rename after run 3 (XD-009).

## Commander Extracts

Quick entries by the commander (CA-052). The agent working the glossary acts on them, extracts any record flag, and leaves this section empty.
