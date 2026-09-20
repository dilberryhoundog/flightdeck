# T009 — the record-keeping decision

The shared question for decision team T009, mission M001, dispatched by the session named `pilot` (address it as `team-lead`). Scratch, not authoritative.

## The place

The cockpit (`flightdeck/.cockpit/`) is the post from which one Claude session, the pilot, runs an orchestration system called flightcrew on behalf of a human, the commander. The pilot starts every session with no memory of the last. Whatever it knows arrives through files: the cockpit `CLAUDE.md` (auto-loaded), the pilot's persona files (delivered at launch), the mission file, the latest session log, and whatever else it chooses to open. The pilot does no bulk reading itself; crew do.

`records/` is meant to be the pilot's source of truth across sessions: one file answers one question. Rule 2 of the cockpit `CLAUDE.md` is its docspec.

## What has been tried

1. Team T002 wrote five long documents from recon. The commander ruled them source material, not records (`commanders-desk/out-advice/DS002.md`).
2. Team T006 mined ten conversation transcripts into a topic store (`logs/topics/`, 27 topics, 203 verbatim commander statements), then wrote seven records from it under the docspec (`notepad/research-2026-09-18/records-final/`). The commander's ruling is `commanders-desk/out-advice/DS003.md`: one lands as is, four become stubs, two are dropped, and the production method is shelved.

Only four records have ever landed, all about the Claude Code harness (`records/claude-code/`), written on day one from official docs.

## The commander's diagnosis (DS003)

- Records were written before their usefulness could be known, so the commander spent time filtering them.
- They drew on one source, the commander's conversational statements, which often quote a fragment of a larger principle stated elsewhere.
- The rule that every claim names its source pushed citations into the prose and lowered its quality. The commander would rather have plain prose, validated by a team against the sources and stamped.
- The commander suggests building records on demand: when the pilot drifts or underperforms, write a record for that gap, drawing on a wider net (source HTML guides, library, manuals, commander directives).
- The commander's vision of the system is under heavy construction and may change a lot soon, so heavy investment in record keeping now may be wasted.

## The goal

The pilot has brief, current records to refer to while conducting work, and knowledge persists across sessions. The cost of producing and maintaining them, especially the commander's reading time, is in proportion to their use.

## The decision wanted

Options for how the cockpit keeps records, and the best one. An option is a whole method: what triggers a record, who writes it, from which sources, in what form and length, how it is validated, how it stays current, how the pilot comes to read it at the right moment, and what it costs the commander. Shelving record keeping for now is a legitimate option and must be weighed honestly.
