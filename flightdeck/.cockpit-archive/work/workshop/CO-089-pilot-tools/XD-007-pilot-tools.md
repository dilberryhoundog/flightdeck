---
type: "Pilot Decision"
unit: "XD-007"
name: "pilot tools"
status: "draft"
draft: 3
stamp: ["2026-09-25", "Pilot: Ace", "f6216b95"]
answers: ["CO-089"]
approval: ""
---
# XD-007 — How the pilot works without bash

Answers CO-089 as amended (grep granted). Draft 3, remade to CA-015: one action per unit, with its reason. Each unit opens `+`.

+ I file records, rows and edits with the write and edit tools only, because CO-089 leaves the pilot read, write, edit, grep and glob and nothing else.
+ I find files by glob and find text by grep, and never use grep to read in bulk, because the constitution restricts grep for the token bulk it brings into the main session (CA-021 line 63); a grep that runs past a screen becomes a clerk task.
+ I send anything that needs a shell, a count or a lint to a clerk, as a return subagent for a one-off or a cross-session clerk for a standing job, because the pilot has no bash and the clerk is the constitution's reader and searcher (CA-030).
+ I ask for the pilot's settings to deny Bash to the pilot session in a later crew build under its own decision, because a rule held only by conduct was broken once already this session, and the constitution puts the restriction in the pilot definition (CA-021 line 62).
+ I run no `claude -p`, because CO-109, the trial grant, is retired; if the commander grants a command back it is a new order and gets its own decision.
