# T006 — Topics and records team

- **Date:** 2026-09-18, session dcb75456, mission M001, room cockpit
- **Purpose:** the commander's strengthened research team (DS002 advice): mine the commander's statements into timeless flightdeck system topics in `logs/topics/`, distil the first records under the docspec, validated, compared and contested before the commander reads them
- **Seats:** 5 teammates, no subagents

## Seats

- `topic-extractor`, general-purpose, Opus. Reason: deciding what is a timeless system topic and what is run chatter is judgement. Reads the ten transcripts and the two advice files. Returns topic JSON files per the topics schema, statements verbatim with grep-derived refs and one-line context.
- `record-writer`, general-purpose, Opus. Reason: distilling a topic into a record under six tests is synthesis. Reads the topics, the docspec, the exemplar and the T002 source material. Returns records; can split topics, purge stale statements, update a record when its topic changes.
- `discovery`, general-purpose, Sonnet. Reason: fetching the surrounding repo terrain to validate a topic's references is retrieval. Reads branches by git plumbing. Returns confirmations or corrections per topic reference.
- `validator`, claude-code-guide, Sonnet. Reason: adjudicating disputed claims against official Anthropic sources, the harness records and the library is lookup. Returns verdicts on claims raised by any seat or by itself.
- `adversary`, general-purpose, Opus (commander's rule). Reason: the comparer and the critic in one seat: attacks each draft record against the six tests, the exemplar's style, the existing records for inconsistency, and the cited sources. Applies the adversarial mandate.

## Shape

Extractor first; discovery and validator work as topics land; the writer drafts once a topic is stable, sends each draft to the adversary and the validator, revises, and delivers to the lead. The lead files topics and puts records to the commander as a dossier before any land.

## Outcome

27 topics and 203 statements in `logs/topics/`, every transcript ref verified at its line by the extractor's verifier and again by the pilot. Six records and one register drafted, contested across four adversary passes (about forty findings, six withdrawn by the adversary in writing), validated, discovery-checked against the branches; drafts at `notepad/research-2026-09-18/records-final/`, dossier DS003, proposal P009. Two supersessions read too widely were caught and narrowed. Two commander rulings obtained in session (O039, O040) closed questions the records could not. The pilot's own errors caught by seats: two turn-opener line numbers in a ruling, one wrong advice-file attribution, one over-broad supersession ruling.

## Lessons

- The topic store is the right intermediate: it caught a superseded claim the writer had just added, and it made every quote checkable with one command.
- A summarising fetch can establish a presence but never an absence; every negative is checked against raw HTML.
- Anchor findings on quoted text, not line numbers; files are live and line numbers rot between attack and revision.
- Citations name the line the sentence sits on; "same turn" and turn-opener numbers are how errors enter, including from the pilot. A wrong citation is present and a missing one is absent, so a completeness sweep never sees the wrong one; the check that catches it resolves every citation against its line by script before landing. The writer's script found one miss in 83 that four attentive passes had not.
- A writer that applies a disputed ruling in its weakest true form and sends the question up is what gets the commander to answer it; the adversary's best finding survived only because of that.
- Brief every seat with the full read scope it will need (transcripts for the writer, the advice files and orders for the adversary); lifting boundaries mid-run cost rounds.
- Two seats should not share a name across teams; a dead seat revives when addressed.
- Extend a verifier and prove it fails on a bad input before trusting its pass.
