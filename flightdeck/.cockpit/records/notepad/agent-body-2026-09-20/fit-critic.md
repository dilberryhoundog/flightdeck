---
type: "Notepad"
stamp: ["2026-09-21", "fit-critic", "T015"]
---
# Fit critic — the pilot's agent body (T015, Rq014)

Seat: fit-critic. Criteria: Or036's lost sentence; nothing lost or doubled in the move; crew safety; durability; the launcher; dangling references. Criterion 1 is met and draws no finding: `pilot.md:14` reads "You fly the mission and you do no work. You manage teams instead." in the first section of the body, in plain words, ahead of everything else.

## Three fixes first

1. Settle effort one way before this lands: either implement the ruling in `records/notepad/agent-body-2026-09-20/headless-measurements.md:15` (launcher passes `--effort` from `pilot.md`, `effortLevel` leaves the settings file) or keep today's arrangement and correct the three places that still give the disproved round-one reason (F1).
2. Cut from `pilot.md` what `commander.md` and `identity.md` already say in the same prompt, or strike the sentence in `commander.md:16` that claims those lines are "stated nowhere else in the cockpit" (F2, F6).
3. Repair the two pointers that now point at nothing: `work/procedures/README.md:5` ("Imported into the cockpit `CLAUDE.md`") and the missing launch-manual line Rq014's own fallback requires (F3, F4).

## Findings

**F1 — The build's effort arrangement is contradicted by the pilot's own second measurement, and three files state the reason that measurement disproved. High.**
`records/notepad/agent-body-2026-09-20/headless-measurements.md:13-15`: "No `effortLevel` in any settings file; agent `effort: medium`: transcript records `effort: high`. Agent `effort: low`: `effort: high`. The agent definition's `effort` does not apply to a main session agent launched from `--agents` JSON ... Same launch with the CLI flag `--effort medium`: transcript records `effort: medium`. The flag pins it. Ruling: the launcher reads `effort` from `pilot.md` and passes `--effort`; `effortLevel` leaves the pilot's settings file." The build does none of that: `base/settings/pilot.settings.json:2` still carries `"effortLevel": "medium"`, and `base/bin/pilot.sh:126-132` passes no `--effort`. Three files still give the superseded round-one reason: `base/bin/pilot.sh:18-20` ("the agent definition's effort measured as not overriding a settings effortLevel (2026-09-21): with effort: medium in the agent JSON and no effortLevel in the --settings file, the transcript recorded the user settings' effort instead"), `base/settings/README.md:7` ("It is here and not in the agent body because the agent definition's `effort` measured as not overriding a settings `effortLevel`"), `team/officers/pilot/README.md:5` ("the `effort` here is the seat's stated intent, but `base/settings/pilot.settings.json` is what takes hold"). `work/workshop/WS028.json:8` compounds it: "(the user settings carry `effortLevel: high`)" is no longer true (round two records the commander removing it) and its two "to close" steps — measure "with no `effortLevel` in any settings file, or with `--effort` passed by the launcher" — were both already measured.
Why it matters: the durable record of a measured harness fact is wrong in four places, and the launcher does not do what the pilot ruled it should, so the next session inherits a settled question as an open one.

**F2 — `commander.md` is appended to the same prompt and already carries the body's opening scoping, chain of command and standing order 2; its own sentence says it does not. High.**
`team/officers/commander/commander.md:16`: "What stands and is stated nowhere else in the cockpit:" then `:18` "The pilot flies the mission and does no work: presides over the room where crews thrash things out, distils recon into dossiers, makes the requests; the commander approves, denies or changes (2026-09-18)." `pilot.md:14-16` now says the same thing in the same prompt. Likewise `commander.md:24` "The pilot's knowledge may be reset at any time; files predating a reset are not read" against `pilot.md:29` "**Start fresh when told.** The commander may reset your knowledge. Prior mission files that predate a reset are not yours and are not read"; and `commander.md:10-12` ("Outranks the pilot", "Address as: 'commander', first person") against `pilot.md:22` ("The commander outranks you ... address them in first person"). The builder's report names only the `identity.md` overlap (`body-builder.md:34`) and does not name this one.
Why it matters: criterion 2 asks for what is now stated twice in the same prompt; this is three pairs, and one of the two files asserts in writing that it is unique.

**F3 — `work/procedures/README.md` still says `triggers.md` is imported into `CLAUDE.md`. Medium.**
`work/procedures/README.md:5`: "`triggers.md` — the manifest: one line per approved procedure, under its trigger kind. Imported into the cockpit `CLAUDE.md`, so it stays a routing table and explains nothing." `CLAUDE.md` no longer holds a "## Triggers" section or the `@work/procedures/triggers.md` import (`body-builder.md:10`), and the replacement is `pilot.md:62-64`.
Why it matters: a session or crew member reading the procedures room is told the manifest arrives automatically, which is exactly the mechanism the cut removed, so the read may never happen.

**F4 — Rq014's effort fallback requires a line in the launch manual; the manual is untouched. Medium.**
`Rq014.md:45`: "If the harness verifier finds that `effort` in an agent definition does not apply to a main session agent, or does not hold on resume, `effortLevel` stays in the settings file, **the finding goes in the launch manual**, and a workshop item carries it." The fallback fired (`body-builder.md:51`). `WS028` exists, so the workshop half is done, but `records/manuals/claude-code/settings-and-launch.md` still lists `effort` among the agent frontmatter fields (`:25`) and says "its `model` picks the model unless `--model` overrides" (`:23`) with no word on effort precedence; `body-builder.md:51` concedes "It wants a line in the launch manual and a workshop item."
Why it matters: the manual is the pilot's authority across sessions; leaving the measured fact only in the notepad means rule 3 ("nothing there is authoritative") puts a future pilot back to guessing.

**F5 — The fire-twice safety rests on a manifest field `pilot.md` never tells the pilot to write. Medium.**
`pilot.md:6` (`initialPrompt`): "if it reports indexed=yes, this session's log already exists". `base/bin/session-start.sh:22` computes it: `mine = [l for l in logs if l.get("session_id") == sid or l.get("session") == short]`. `pilot.md:51` is the only instruction on writing the row: "add its entry to `records/logs/MANIFEST-logs.json` now with a placeholder summary" — it names neither `session_id`, `session` nor `path`, and the body sends the pilot nowhere else for the shape (the shape is in `records/logs/README.md:7`, uncited by the body).
Why it matters: a row written without `session_id`/`session` makes the hook print `indexed=no` on the next resume and regenerate a `log_name` from today's date, so the prompt opens a second log — the single failure the `initialPrompt` was written to prevent.

**F6 — `identity.md` is appended to the same prompt and repeats two of the body's sentences. Medium.**
`identity.md:24` "Decide, then propose ... Do not hand the commander questions the pilot can rule on" and `:27` "Dispatch and verify; do not gather. Cheap crew do the reading" against `pilot.md:18` "Decide, then propose. Do not hand the commander a question you can rule on yourself" and `pilot.md:16` "Cheap crew do the reading". `body-builder.md:34` defends both as "Or036's lost sentence and its neighbours had to be in the body itself", but Or036's sentence is "do no work, manage teams instead" (`Or036.json:5`), which is `pilot.md:14` and is not either of these two.
Why it matters: the stated reason covers line 14 only, so two sentences are duplicated in one prompt with no reason that survives reading Or036.

**F7 — `pilot.md:33` promises wording the build did not keep. Medium-low.**
`pilot.md:33`: "where a rule that left it is quoted below, it keeps the wording and the title it had". `body-builder.md:27-29` records three rewordings: rule 12 into second person, crew protocol 5's "follows rule 2" into "follows the manuals rule in `CLAUDE.md`", crew protocol 6's `pilot.sh resume` into `base/bin/pilot.sh resume`; and session start step 2 gained a clause (`:30`).
Why it matters: the body tells the model it is reading the cockpit's exact words, so a later diff against `CLAUDE.md` history reads as tampering rather than as the deliberate edits they were.

**F8 — `pilot.sh --agents-json` without `--check` launches a live session instead of printing the JSON. Medium-low.**
`base/bin/pilot.sh:50` `[ "$a" = --agents-json ] && { SHOW_JSON=1; continue; }` removes the flag from the pass-through, but `:111` reads `SHOW_JSON` only inside `if [ -n "$CHECK" ]`. With `--agents-json` alone, the flag is swallowed, nothing prints, and `:123` `exec "$@"` starts a real pilot session.
Why it matters: an inspection command silently becomes a launch, which is the one side effect the flag exists to avoid; the usage block at `:9` only documents the paired form.

**F9 — `base/settings/README.md:13` cites a rule numbering that no longer exists. Low.**
`base/settings/README.md:13`: "Blocks writes outside the cockpit and `dev/workspace`. Mandate one enforced mechanically, on the commander's order." The cockpit has rules, not mandates, and `CLAUDE.md:23` rule 1 now delegates the content to `records/manuals/cockpit/write-permissions.md`.
Why it matters: this is a file the build rewrote, and the surviving sentence sends a reader after a "mandate one" that is nowhere in the cockpit.

**F10 — "the room" in the body collides with the cockpit's own use of "room". Low.**
`pilot.md:16`: "You preside over the room where crews thrash things out." `CLAUDE.md:70` uses the word for directories: "Five rooms, each answering one question". The body defines neither sense, and the commander's source phrasing is a quotation from a transcript (`records/extracts/topics/the-pilot-role.json:41`), not a term the cockpit explains anywhere.
Why it matters: criterion 4 bars an unexplained local term; a fresh model in the seat can read "preside over the room" as presiding over a directory.

**F11 — A dated attribution sits in the body. Low.**
`pilot.md:45`: "there is no fixed cap (commander, 2026-09-18: arbitrary limits are bad)". `Rq014.md:33`: "The body is written for any model in the seat and any session: no session context, no callsign, universal terms."
Why it matters: it is the only date in the body and it carries session history into a file the spec says holds none; the rule reads the same without it.

**F12 — `CLAUDE.md` still cites a directory that does not exist. Low.**
`CLAUDE.md:24` (rule 2): "it extracts, never copying `flightdeck/library/` (the documentation for all stakeholders)". No `flightdeck/library/` exists on this branch. `Rq014.md:51` verifies "every path the body and `CLAUDE.md` cite exists"; `body-builder.md:49` discloses this as the one failure and leaves it as pre-existing.
Why it matters: the spec's verification line is stated as passing for `CLAUDE.md` and does not, and the miss sits in the rule that governs every manual.

## Verdict

fix first.
