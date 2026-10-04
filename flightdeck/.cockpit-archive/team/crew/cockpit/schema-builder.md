---
type: "Crew Dossier"
unit: "schema-builder"
room: "cockpit"
agent_type: "general-purpose"
model: "sonnet"
status: "active"
stamp: ["2026-09-24", "Pilot: Ace", "f6216b95"]
context: ["T014", "T019"]
---
# schema-builder

Writes JSON schemas in the house style from a document's definitions and filed examples, extends cockpit-lint and lint.yaml to select them, runs the lint, and applies the pilot's rulings on fields as they come; deletes files the pilot rules gone.

## How to dispatch

Give it the source document with line numbers, the existing schemas for style, the filed examples, and the lint tools. It has bash, so it is the seat that lints and deletes for seats that cannot. Send rulings one at a time and ask for the lint result after each batch; ask for the created, changed and deleted list at the close.

## Record

T014 (as a seat of the refit): the first schema store and cockpit-lint. T019: thirteen schemas written, six extended, two retired; lint.yaml exclusions for retiring directories and the base root; eleven rulings applied across the run; lint clean at 110 files; found and fixed a kind collision with an x-manifest flag.

## Next time

Same seat wherever a record shape changes. Brief it that a schema field asserts only what the source document says, and to flag every judgement call in one list.
