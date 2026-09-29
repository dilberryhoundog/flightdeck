---
type: "Pilot Decision"
unit: "XD-011"
name: "rooms refactor"
status: "draft"
draft: 2
stamp: ["2026-09-25", "Pilot: Ace", "f6216b95"]
answers: ["CO-112"]
approval: ""
---
# XD-011 — Moving the cockpit's rooms to CA-042's layout

Answers CO-112. Draft 2, remade to CA-015: one action per unit, with its reason, and the target completed to the whole of CA-042. Each unit opens `+`.

+ I take CA-042 as the target in full: top level `base/`, `records/`, `logs/`, `manuals/`, `teams/`, `work/`; `records/commander/` with `orders/`, `advice/`, `questions/`, `ideas/`, `responses/`; `records/pilot/` with `decisions/`, `requests/`, `dossiers/`, `disputes/`, `plans/`, `procedures/`; `logs/shift/`, `logs/notepad/`, `logs/extract/`; `manuals/operators/`, `manuals/technical/`; `teams/dispatch/`, `teams/crew/`, `teams/officers/`, `teams/rosters/`; `work/missions/`, `work/workshop/`; because CO-112 says the rooms match CA-042 and a partial target would leave a second move.
+ I create `records/commander/responses/` in this move, because CA-042 names it and run 2 (XD-003) writes CR-001 to CR-005 into it.
+ I move `work/procedures/` to `records/pilot/procedures/`, because CA-042 puts procedures among the pilot's records and not under work; `triggers.md` moves with them.
+ I run the move after run 3 of the corpus migration, because run 3 deletes the old record directories and a move before it would move files that are about to be deleted.
+ I have a clerk in a cross-session engagement do the move from a written path map, because it is bulk file work across the whole cockpit and CO-101 keeps the pilot off the work.
+ I have the same clerk repoint every path in CLAUDE.md, the READMEs, the manifests, the procedures, the launcher, the hook, the guard and lint.yaml in the same run, because a moved room with a stale pointer is a break of the kind T018 found.
+ I have the commanders-advocate sweep the diff before the run closes, because CA-031 gives it the diff sweep and a move touches every room.
+ I sort each manual into operators or technical as CA-043 defines them, and retire a manual that is neither, because the two kinds are the constitution's and a manual that fits neither is not a manual.
+ I nest the notepad under `logs/notepad/<mission>/`, moving today's date-and-team folders under the mission they served, because CO-108 orders scratch nested by mission.
+ I move Ds007 and Ds008 from the desk to `records/pilot/dossiers/` and the desk's requests to `records/pilot/requests/` as XR, then delete the empty `commander/` room, because CA-042 has no desk and CO-091 forgets the old shapes.
+ I write the path map and read the advocate's sweep myself, and nothing else in this move, because the map is a decision and the sweep is a check, and both are the pilot's.
+ I record the move as its own dispatch with a dossier, and rewrite CLAUDE.md's room map once at the end, because CA-037 makes a dispatch the residue of a team run and one rewrite is cheaper than one per room.
