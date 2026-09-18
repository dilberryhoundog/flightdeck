# T002 — Certified research team

- **Date:** 2026-09-18, session dcb75456, mission M001, room cockpit
- **Purpose:** turn the recon and the genesis sources into records for the pilot: extracted, sourced, contested, verified, and run past the commander before landing
- **Seats:** 5 teammates, no subagents

## Seats

- `source-reader`, general-purpose, Sonnet. Reason: the genesis documents are already written prose; clerical reading with a fixed shape. Reads: `library/source/**` on flightcrew-buildout, the orchestration principles on constitution-research and their review on main. Returns: what the genesis says the system is meant to be, and where the built system diverges.
- `transcript-miner`, general-purpose, Opus. Reason: extracting the commander's definitions and guidance from long transcripts is judgement. Reads: the session histories under dev/workspace/history on the characterization and run-2 branches. Returns: the commander's definitions of launch and run, and guidance on system shape, architecture and decisions, quoted and dated.
- `records-writer`, general-purpose, Opus. Reason: writing records that extract rather than copy is synthesis under a rule. Reads: the recon reports, the two readers' returns, the records rule. Returns: draft records, revised after the adversary and the verifier.
- `docs-verifier`, claude-code-guide, Sonnet. Reason: official-docs lookup. Verifies every harness claim in a draft record.
- `adversary`, general-purpose, Opus (commander's rule: adversaries on Opus). Reason: a record reaches the commander already contested once. Applies the adversarial mandate to each draft against the records rule and the cited sources.

## Shape

The two readers run in parallel and deliver to the writer and the lead. The writer drafts, sends each draft to the adversary and the verifier, revises, and delivers to the lead. The lead files drafts in the notepad and puts them to the commander as a dossier before any record lands.

## Outcome

Five records drafted, contested and revised in one session; drafts at `notepad/research-2026-09-18/records-draft/`, dossier DS002, proposal P008. The adversary raised about fifty findings across two passes and withdrew four of its own (a false framing passed as verified; a true claim flagged as overreach; a correct code claim challenged on a header comment; a verbatim quote called fabricated after stopping at the first match). The writer rejected one finding with evidence and was right, and caught its own reversed model-tier claim. The verifier discarded its own first pass after catching the fetch tool's summariser inventing a figure. The pilot confirmed every high finding at source before ruling, reversed one of its own rulings (the longer quotation was the better one), and caught nothing the seats had not already caught themselves. Delivery: every report reached team-lead intact by SendMessage and scratchpad file; no truncation; no subagents spawned.

## Lessons

- This is the certified research team shape: reader seats, a writer that re-verifies rather than carries, an Opus adversary under the library's own mandate, a docs verifier that reads raw pages, and the pilot ruling. Reuse it as-is for records work.
- Two standing rules for any verifying seat: check for a second occurrence before calling a quote fabricated; re-run every negative claim ("no source says X") across spellings and variants before it stays.
- The writer returning to the source rather than taking a high-severity finding is what saved a correct sentence. A writer must be briefed to contest the adversary with evidence.
- A WebFetch answer is model output over the page, not the page; numbers and quoted phrases that will enter a record are confirmed against raw HTML.
- Transcript quotation needs three warnings in the brief: agent returns hide inside user blocks; commissioned documents read like the commander's prose and are not; pasted exchanges carry seams.
- The lead's rulings can cross with the writer's revisions; consolidate fixes into one message and ask for one final delivery.
- Sonnet was adequate for the source-reader but produced one misattributed citation and one retracted divergence; Opus was right for the miner, the writer and the adversary.
- The adversary referred to the commander as "he"; briefs should state they/them for anyone whose pronouns are not given.
