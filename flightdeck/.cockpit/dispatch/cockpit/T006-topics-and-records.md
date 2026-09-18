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

Pending.

## Lessons

Pending.
