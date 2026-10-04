---
type: "Pilot Decision"
unit: "XD-010"
name: "disputes name records"
status: "draft"
draft: 3
stamp: ["2026-09-25", "Pilot: Ace", "f6216b95"]
answers: ["CO-111"]
approval: ""
---
# XD-010 — Every dispute names records, not lines

Answers CO-111. Draft 3, remade to CA-015: one action per unit, with its reason; `lines` and `binds` stay units of their own so each can be struck. Each unit opens `+`.

+ I name the extracted commander record on each side of every dispute, quoting its statement from the record file, because CA-018 and CA-047 make a dispute a record against a record, project content, or itself, and a line of the constitution is none of those.
+ I name the one record twice where both sides sit inside it (XX-001 in CA-007, XX-002 in CA-008) and say in the body that the record contradicts itself, because CA-047 counts a record against itself as a contradiction and the reader must see it is one record.
+ I put the record ids on both sides into each dispute's `context`, because a grep on `context` is the documented way to find what a record led to, and a dispute should be found from either record.
+ I add duplication as a ground for a dispute, in the schema's `sides` description and in the next dispute that needs it, because CA-047 says a record duplicating another of the same kind is also a contradiction; no filed dispute rests on that ground yet.
+ I keep `lines` on every constitution-sourced record, because it names the constitution lines a statement came from and lets the advocate check any record against the document in one step; it is a field beyond the constitution's words, added by my ruling, and it is here on its own so it can be struck.
+ I keep `binds` on every commander order, "pilot" or "all", because it records who an order reaches and lets a universal-conduct order be told from a session one without promoting it; it too is my addition and stands on its own here.
+ I bring a dispute's summary, sides and body into line with any change the commander made to the records it names when I close it, because CA-050 requires it; XX-005, XX-006 and XX-008 were synced that way today.

# Commander Response

(CN: including `lines` is a single action, I cannot deny it when include with other wanted decision units. `binds` also appears in the Ds but not here.)
