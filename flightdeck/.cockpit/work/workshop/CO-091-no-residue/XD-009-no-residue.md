---
type: "Pilot Decision"
unit: "XD-009"
name: "no residue"
status: "draft"
draft: 3
stamp: ["2026-09-25", "Pilot: Ace", "f6216b95"]
answers: ["CO-091"]
approval: ""
---
# XD-009 — No residue from the old prefixes

Answers CO-091. Draft 3, remade to CA-015: one action per unit, with its reason. Each unit opens `+`.

+ I write no old id (Or, De, Rq, P, C, the old CA) into any field of a migrated record, because CO-091 says redundant prefixes are forgotten and an alias field is the residue it forbids.
+ I have the run 3 team delete `commander/orders/`, `commander/decisions/` and `commander/desk/out/advice/` once the migration dossier is written, because the records in them will exist in the new shape by then and a second copy is residue.
+ I have the run 3 clerk repoint every live citation of an old id to the new id, or remove it where the record was pruned, because a citation that points at a deleted record is residue of another kind; shift logs are left as written, because a log is history.
+ I rename the four dossiers and dispatches filed under current prefixes without the dash (Ds007, Ds008, T018, T019) to the dash and a name in the rooms refactor under CO-112, because CA-001 and CA-049 apply to every record and the refactor is the one move that touches every file.
+ I rename Rq013 to Rq015 to XR and P001 to P006 to PP in the same refactor, because those prefixes are not in the constitution's set and the records under them are still live.
+ I have a clerk add a `name` field and the name in the file name to the records filed before CA-049 (CO-085 to CO-111, CA-001 to CA-046, XD-001 to XD-006, XX-001 to XX-009) in the same refactor, because CA-049 covers all records and doing it in one move avoids two renames of one file.
+ I move a settled order to `orders/settled/` and a retired record to `retired/` with its manifest row pointing at the new path, because CA-051 names settled/ as an order's resting place and neither directory keeps an old id.
+ I list no old prefix in the glossary or the CLAUDE.md prefix table, because a listed prefix reads as current.
