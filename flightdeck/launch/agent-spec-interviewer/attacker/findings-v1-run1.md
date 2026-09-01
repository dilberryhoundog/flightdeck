# Attacker findings — run 1 · spec-attacker (definition model) · inputs: draft + project root · after judge run 8 (ready)

F1 · blocking · I7 · Dispatch target named `rubric-judge`; the project's judge agent is `spec-judge`; I7 reuse points at the rubric file, not an agent. Which agent name is dispatched for the judge role? · absorbed (I7, I8, SC16, VER)

F2 · blocking · B14 · C1 passes --schema; B14/E11 invoke validate-spec.mjs --for-freeze without it; the script's default schema path no longer exists. Is the freeze invocation the C1 command plus --for-freeze? · absorbed (B14, E11)

F3 · blocking · B14 · Schema requires commit (a hash) iff frozen; the freeze commit contains the file holding that hash; a commit cannot contain its own hash. Which hash does commit record, and what does git show --stat show? · asked (P-freeze-commit)

F4 · blocking · B15 · "Per the versioning rules" and D19's encoded standards name no document by path; spec-versioning.md is cited nowhere. Which documents does the body builder encode, and where are their rules stated for b15? · absorbed (C11, D19, B15)

F5 · blocking · B1 · No explorer agent exists in the project; crew.json's explorer return has no id or candidates. What happens when no explorer exists, and who assigns X<n>? · absorbed (E18, I6)

F6 · blocking · B10 · "Dispatched in the turn in which" the conditions hold: once per draft change, or every turn? What stops repeated dispatch? · absorbed (B10)

F7 · blocking · B30 · B30 requires asked or absorbed; I9/B31/D4 allow rejected; a rejected judge entry blocks re-dispatch forever. · absorbed (B30)

F8 · blocking · B22 · Problems sourced from answers, verdicts or findings cannot cite an explorer return or the intention. · absorbed (B22)

F9 · blocking · B7 · Register state of a problem held as a Q node is unstated; no route back when the explorer returns nothing certain. · absorbed (B7, E19)

F10 · blocking · E1 · B3 requires the draft before the first bundle; E1's split question precedes any draft. · absorbed (E1)

F11 · blocking · I3 · No default means of presenting a bundle when no surface is attached. · absorbed (D20)

F12 · blocking · VER · Body is a main-session role, fixture installs it as a subagent; scripted provider turns unstated. · absorbed (VER run.sh)

F13 · blocking · E8 · "Provider stops responding" has no observable trigger. · absorbed (E8)

F14 · blocking · C2 · Deliverable list for --deliverable has no session-time source. · absorbed (C2)

F15 · non-blocking · B25 · Order of resume wave vs re-ask unstated. · absorbed (B25)

F16 · non-blocking · I3 · When a bundle becomes answered is unstated. · absorbed (I3)

F17 · non-blocking · B9 · "Path-shaped name" undefined. · absorbed (B9)

F18 · non-blocking · I2 · Owner name has no session input. · absorbed (I1)

F19 · non-blocking · C10 · C10 binds model opus; D7 says no model bound. · absorbed (C10, D7)

F20 · non-blocking · E10 · Ledger has no dispatch record shape. · absorbed (I9, E10)

F21 · non-blocking · B23 · Bundle timing for an uncertain candidate unstated. · absorbed (B23)

F22 · non-blocking · E16 · "Does not return" has no detection rule. · absorbed (E16)
