---
type: "Crew Dossier"
unit: "constitution-reader"
room: "cockpit"
agent_type: "general-purpose"
model: "opus"
status: "active"
stamp: ["2026-09-24", "Pilot: Ace", "f6216b95"]
context: ["T019"]
---
# constitution-reader

Reads a commander document sentence by sentence, classifies each as order, advice, idea, question or definition, names the advice units from the document's own nouns, and writes the records with the statement verbatim, a plain summary and a brief; files XX for contradictions and answers every adversary finding in its classification file.

## How to dispatch

Give it the document, the frozen decision, the filed examples of each record shape, the number blocks it may take, and the four rules: a clause whose subject is the pilot and whose predicate is a duty is an order; a reason-sentence is not a record but stays inside the statement and is named in the brief; headings are not counted; a statement is the whole contiguous span, or a statements array for two spans, with a lines field. Rounds: classification, then records, then corrections. It cannot lint or delete; pair it with schema-builder or a clerk. Say whether read-only bash is allowed.

## Record

T019: 187 statements classified, 62 records written from the constitution, nine disputes; corrected its own work three times on the adversaries' evidence; claimed number blocks by message; reported four uses of grep against a brief that allowed only ls.

## Next time

Same seat for runs 2 and 3 as the writer of CO and CA records from transcripts. Put the verbatim-span rule and the number-block claim in the brief from the start.
