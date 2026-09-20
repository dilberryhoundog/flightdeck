---
type: "Notepad"
stamp: ["2026-09-21", "trim-critic", "T015"]
---
# Trim critique — the pilot's agent body (T015, Rq014)

## Three fixes first

1. Cut `initialPrompt` to one sentence: "Carry out the session start procedure in your instructions now." Steps 2 and 5 of the body already carry the idempotence and the greeting, and the hook line it quotes is read by the body, not by the prompt.
2. Cut the tail of `pilot.md:33` ("where a rule that left it is quoted below...") and the whole `## Triggers` section at `pilot.md:62-64`. Both are bookkeeping about the build, not instructions to the pilot.
3. Cut `pilot.sh`'s header from 27 lines to about 8: drop the effort-measurement narrative (lines 17-24) and the notepad test citations, which are already recorded in `base/settings/README.md` and `team/officers/pilot/README.md`.

## Findings

**F1 — `initialPrompt` is three sentences doing one sentence's work, and its third sentence can be read as replacing the procedure.** Severity: high.
Evidence: `pilot.md:6` — `initialPrompt: "Carry out the session start procedure in your instructions now, then greet the commander and state the current mission. The SessionStart hook has printed this session's facts above: if it reports indexed=yes, this session's log already exists, so do not open a second log and do not add a second row to the logs manifest. Read the existing log, report status, and carry on."` Against it: `pilot.md:54` session start step 5, "Greet the commander and state the current mission", and `pilot.md:51` step 2, "If the hook reports that this session is already indexed, the log exists: read it and open nothing."
Why it matters: every clause after "now" is a restatement of the procedure the same sentence just ordered, so the prompt pays for the procedure twice in every session; worse, "Read the existing log, report status, and carry on" names an alternative ending, and on the indexed path a model may take it as the whole of what to do and skip steps 3 and 4 (requests awaiting, `triggers.md`). The order that is shortest and safe fired twice is the first clause alone — the body already branches on `indexed=`.

**F2 — The body explains its own construction to a builder.** Severity: high.
Evidence: `pilot.md:33` — "...where a rule that left it is quoted below, it keeps the wording and the title it had, and `CLAUDE.md` keeps its number as a pointer." Also `pilot.md:41`, "it binds every agent here that dispatches, you included. These four are yours alone."
Why it matters: nothing the pilot does changes if the clause is removed — it is a note about how the cut was performed, addressed to whoever performed it. It is in every session's system prompt for the life of the file. Rq014's constraint is "written for any model in the seat and any session"; provenance of the cut is not something a model in the seat acts on.

**F3 — Sentences repeated word for word from `identity.md` and `commander.md`, which are appended to the same prompt.** Severity: high.
Evidence: `pilot.md:16` "Cheap crew do the reading." vs `identity.md:27` "Dispatch and verify; do not gather. Cheap crew do the reading." `pilot.md:18` "Decide, then propose. Do not hand the commander a question you can rule on yourself." vs `identity.md:24` "Decide, then propose... Do not hand the commander questions the pilot can rule on." `pilot.md:22` "The **commander** is the human owner. The commander outranks you... address them in first person." vs `commander.md:10-12` "**Rank:** Commander. Outranks the pilot... **Address as:** 'commander', first person." `pilot.md:16` "distil what they bring back into dossiers... the commander approves, denies or changes" vs `commander.md:18`, the same sentence.
Why it matters: the builder defends the first two as deliberate (`body-builder.md:34`), but the defence rests on Or036's lost sentence, which is `pilot.md:14` ("You fly the mission and you do no work. You manage teams instead.") and is untouched by cutting these. Rq014's scope-in list for the role scoping names the mission, the no-work rule, managing teams, presiding, distilling, requesting — it does not name "decide, then propose", which is `identity.md`'s working style and arrives in the same prompt. The chain-of-command duplication is scope-mandated, so only its commander bullet is worth tightening, but three of four duplications are free cuts.

**F4 — `## Triggers` is a section restating a session start step.** Severity: medium.
Evidence: `pilot.md:62-64` — "`work/procedures/triggers.md` is the manifest of the cockpit's procedures. Read it at session start and keep its conditions in mind: it names, for each procedure, the condition that makes it due, and you open the procedure file when that condition arrives." Against `pilot.md:53`, step 4: "Read `work/procedures/triggers.md`, the manifest of the cockpit's procedures." The explanation it adds is the file's own structure: `triggers.md:3` "On demand — you decide the condition has arrived", `triggers.md:11` "Periodical — the event that makes it due".
Why it matters: Rq014's ruling asked for "a plain instruction in the body to read `work/procedures/triggers.md`" in place of the `@` import; that instruction exists at step 4. The section is a second copy plus a description of a file the pilot reads at every session start anyway, and it ends the prompt on restatement.

**F5 — `pilot.sh`'s header is 27 comment lines carrying a dated measurement already recorded twice elsewhere.** Severity: medium.
Evidence: `pilot.sh:2-28`, in particular 17-21, "Effort is still pinned by effortLevel in the settings file, because the agent definition's effort measured as not overriding a settings effortLevel (2026-09-21): with effort: medium in the agent JSON and no effortLevel in the --settings file, the transcript recorded the user settings' effort instead." The same fact is at `base/settings/README.md:7` and `team/officers/pilot/README.md:5`. `pilot.sh:28` cites "(notepad tests T9, T12)".
Why it matters: Rq014 asks for "small, plain shell"; a script whose comment is a fifth of its length and which carries a dated test narrative and notepad citations is a record living in code. Three copies of one measurement is three places to update when the harness changes, and by the builder's own note (`body-builder.md:52`) the `@`-import claim behind line 28 is untested.

**F6 — The frontmatter reader validates a file the commander said needs no schema.** Severity: medium.
Evidence: `pilot.sh:81-83` — `for required in ("description", "model"): if not meta.get(required): sys.exit(...)`; `pilot.sh:80` `name = meta.pop("name", "pilot")`; `pilot.sh:72-73` skips blank and `#` lines. Or061: "It is a one off file, not needing consistency. no need for schema and keep the path out of the yaml." Rq014 constraint: "the frontmatter reader is a few lines of `python3`".
Why it matters: required-key enforcement is a schema check expressed in code, over a single file the launcher itself ships beside. The comment-skipping branch and the `"pilot"` default for a key the same file always sets are dead paths. The reader is 26 lines where the flat form needs about eight, and `pilot.sh:88` then spawns a second `python3` to re-parse the JSON for a value the first process already held.

**F7 — `CLAUDE.md`'s pilot line tells crew that files not delivered at launch are delivered.** Severity: medium.
Evidence: `CLAUDE.md:14` — "who the pilot is, their tone and working style, are in the other files of that room. Both are delivered at launch." The room also holds `job.md` and `pilot.keep`; `team/officers/pilot/README.md:7` says `job.md` is "superseded by `pilot.md` and no longer loaded at launch", and `pilot.sh:36` appends only `identity.md` and `commander.md`.
Why it matters: this is exactly the stale-reference class Rq014 scoped in ("References that name `job.md` as where the rules of the job live... follow"), and it is left in the one file every crew member reads. Naming `identity.md` costs the same words and is true.

**F8 — The room README and `job.md` grew past reference-only.** Severity: medium.
Evidence: `team/officers/pilot/README.md:3` — "A repeated `--append-system-prompt-file` keeps only the last file, and an `@` import inside an appended file does not expand." That is launcher lore, duplicated from `pilot.sh:27-28`, in a directory index. `README.md:5` carries a third copy of the effort split. `job.md:21` enumerates the contents of `pilot.md` ("the role scoping, the chain of command and the standing orders above, the rules of the pilot, the crew protocol items that are the pilot's alone, and the session start and end procedures") where Rq014 asked only that the paragraph "say the rules of the job are in `pilot.md` and that the launcher no longer loads this file".
Why it matters: an index says what is in the room and points; harness behaviour belongs with the script or the manual that owns it. The `job.md` inventory is a fourth description of `pilot.md`'s sections, written into a file whose stated future is deletion.

**F9 — The body leans on `CLAUDE.md` for three of its rules and never tells the pilot to read it.** Severity: medium.
Evidence: `pilot.md:33` asserts "The rules of the place are in the cockpit `CLAUDE.md`, which you read on arrival"; `pilot.md:41` defers the whole crew protocol to it; `pilot.md:44` defers manual promotion to "the manuals rule in `CLAUDE.md`". The session start procedure, `pilot.md:50-54`, has five steps and none of them is reading `CLAUDE.md`, and the cockpit `CLAUDE.md` is nested under `flightdeck/.cockpit/` while the session's working directory is the repository root (`pilot.md:10`).
Why it matters: the pointer scheme in `CLAUDE.md` (rules 5, 10, 12 and crew protocol 4-7) and the body's three deferrals both assume that file is in context. "You read it on arrival" is an assumption about the harness stated as if it were an instruction; if the nested file is not auto-loaded for the agent, the pilot has no crew protocol at all. Either make it step 1 of session start or measure and record that it loads.

**F10 — Rq014's own fallback is only half executed.** Severity: low.
Evidence: Rq014:45 — "`effortLevel` stays in the settings file, the finding goes in the launch manual, and a workshop item carries it." `body-builder.md:51` ends "It wants a line in the launch manual and a workshop item", i.e. neither exists. The settings half is done (`pilot.settings.json:2`).
Why it matters: named as the spec's condition, not as an option; without it the only durable record that `effort:` in the body is inert is three prose sentences in READMEs and a script comment. Crew do not commit, so this is the pilot's to land before the commit.

## Verdict

fix first.
