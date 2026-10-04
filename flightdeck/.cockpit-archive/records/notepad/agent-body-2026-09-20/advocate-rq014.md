# Rq014 — commander-advocate findings

Seat: commander-advocate. Mission M001. Document under attack: `commander/desk/in/requests/Rq014.md` (frozen). Standard: Or036, Or060, Or061, Or018 and `commander/desk/out/ideas/mini-spec.txt`. The pilot's rulings are not the standard.

## F1 — The one thing the commander said was lost is not in the body's contents list. High.
Or036: "things like 'do no work, manage teams instead' is kinda lost without an agent body". Rq014 names it only in the Goal ("fly the mission, do no work, manage teams, preside over the room"), and then the Scope in list of what the body carries is: "chain of command and the two standing orders now in `job.md`; session start; session end; look, do not dig; keep the cockpit current; team dispatch quiet mode; the crew protocol; the triggers import". None of those is "do no work, manage teams instead"; that sentence lives in `identity.md` ("Not to build", "Dispatch and verify; do not gather"), which the launcher still appends separately and which the spec does not move.
Why it matters: a builder working from Scope in can satisfy every listed item and still ship a body that does not carry the single deficiency Or036 was written to fix.

## F2 — The lint line is the thing the commander said not to do, and his decision is handed back to him as a question. High.
Or061: "no need for schema and keep the path out of the yaml." Rq014: "so one exclusion `!team/officers/pilot/pilot.md` is needed to keep it unlinted. The commander said to keep the path out of the yaml; if he meant no line at all, the glob is narrowed to the three dossier files by name instead. His call; the default is the exclusion." The default puts the path in the yaml verbatim; the alternative puts three other paths in the yaml. Both options break the instruction, and neither is offered as the pilot's ruling — it is put back to the commander.
Why it matters: it offends the drift criterion and the reopened-decision criterion at once, and the default course is the one his words forbid.

## F3 — "Rules of the place" versus "pilot-only" is applied without a test, and inconsistently. Medium-high.
Or018: "after reading that file upon arival all agents should know they are in the cockpit, they should know the rules, how to find things, the purpose of the place etc." Rq014 moves "the crew protocol" and turns rules 5, 10 and 12 into pointers "to the pilot's agent body", while keeping rule 7 whole with the reason "crew must not declare a mission done either". The same reason holds for the crew protocol (any crew member who dispatches a subagent loses "Name the model in every spawn", "Never use a fork for crew", "Brief completely") and for rule 10 (crew write in the cockpit under rule 1). The destination is closed to them by CLAUDE.md's own line: "If you are crew: nothing in `team/officers/pilot/` is addressed to you."
Why it matters: the cut is the pilot's by Or060 ("3. Yours"), but the spec states no test for the cut, so a builder cannot reproduce it and crew lose rules Or018 says every arriving agent should have.

## F4 — `--legacy` cannot be "untouched" once the settings keys go. Medium.
Rq014 at once says "`base/settings/pilot.settings.json`: `model` and `effortLevel` removed" and "`pilot.sh --legacy` launches the way it does today, untouched, until the commander removes `job.md`", and verifies "`pilot.sh --legacy --check` prints today's command unchanged". The legacy path's model and effort come only from that settings file (`pilot.sh` header: "the settings file pins Fable at medium effort for a fresh start"). With the keys gone, legacy prints the same command but launches on whatever the account default is, with no effort pin.
Why it matters: the fallback the spec keeps as the safety net is silently broken by another line of the same spec, and the verification is written so it would still pass.

## F5 — Effort on resume is not decided and not verified. Medium.
`pilot.sh` header: "On resume the model saved in the transcript beats the settings file (effort does not; it still comes from settings)". Rq014 removes `effortLevel` from settings and says only "On resume the model it re-asserts is read from `pilot.md`, not written in the script" — nothing about effort. `records/manuals/claude-code/settings-and-launch.md` restores "Permission mode, model and agent" from the transcript and says nothing about `effort`. The only effort check is on a fresh headless launch.
Why it matters: Or061 says "model and effort in the settings is the wrong place. correct location is agent body" — if agent `effort` does not survive resume, the build delivers the model half of that order and quietly drops the effort half.

## F6 — The `--check` verification cannot see what it claims to prove. Medium.
Rq014: "`pilot.sh --check` prints a command carrying `--agents`, `--agent pilot` and the appended identity and commander files, and no `job.md`" and "The `--agents` JSON the launcher builds parses as JSON and its `prompt` equals the body of `pilot.md` byte for byte." Today `run()` replaces the whole persona with a fixed placeholder: `printf '<identity.md+job.md+commander.md> '`. The placeholder is a literal string in the script, so it proves nothing about the content behind it, and `--check` as written never emits the `--agents` JSON to be parsed or compared.
Why it matters: two of the six verification lines would pass on a build that concatenated the wrong files, unless the spec says `--check` must print the agents JSON unmasked, which it does not.

## F7 — The headless launch check asks the model about itself and tests an effort level that is not observable. Medium.
Rq014: "A headless launch (`claude -p` with the launcher's flags, a throwaway name) answers from the body: asked for its standing orders and its session start steps, it states them; asked its model, the transcript shows Fable at medium effort with neither key in the settings file." CLAUDE.md rule 4: "Measure rather than ask a model about itself: a test reads tokens, output fields or files on disk." Effort level is not an output field of a `-p` transcript. And `initialPrompt` is "auto-submitted as the first user turn under `--agent`" (`records/manuals/claude-code/harness-register.md`), which collides with the `-p` prompt the check supplies; the spec does not say which wins.
Why it matters: the check the commander would lean on to believe the body landed is, as written, either unrunnable or an interview with the model.

## F8 — `job.md` is de-wired now and left on disk stating the opposite of the new arrangement. Medium.
Or060: "job.md is pretty much redundant after this ... after it lands and im impressed i will remove the job description." Rq014: "It still appends `identity.md` and `commander.md`; it stops appending `job.md`." The file then stays in the office still saying "The mandates, the crew protocol and the session start and end procedures are rules of the place, not of the person. They live in the cockpit `CLAUDE.md`" — false the moment the cut lands. Scope in covers only "References that name `job.md` as where the rules of the job live", not `job.md`'s own text.
Why it matters: the commander kept `job.md` alive on purpose until he is impressed, and the spec leaves the copy he is meant to judge saying the rules are somewhere they no longer are.

## F9 — A pilot's gloss is filed under "Decisions already made (the commander's)". Medium.
Or061: "flightdeck keeps a store of agents because. when it become distributable you run a simple command and the agents are transfered." Rq014: "`pilot.md` lives in the pilot office, the cockpit being flightdeck's store of agents until a transfer command exists (Or060, Or061)." "Until a transfer command exists" is not in either order; the commander described a store that a future command copies out of, not an arrangement that expires when the command arrives.
Why it matters: it is the one section of the request the commander is told he need not re-read, and it carries a clause he did not say.

## F10 — The hook still does the session start pointing the commander said would stop. Medium-low.
Or036: "Also this will stop the need for you to do the session start read from the hook. It will be directly in the agent body." Rq014: "`base/bin/session-start.sh`: its last line points at the agent body instead of `CLAUDE.md`." The line survives, repointed; the body already carries session start, so the hook is still instructing the read.
Why it matters: the commander named a thing that would stop, and the spec keeps it with a new target.

## F11 — What happens if `initialPrompt` fires on every resume is left open. Low.
Rq014 files it under the commander's later tests: "whether `initialPrompt` fires again on `pilot.sh resume` is observed and recorded in the launch manual." If it does fire, the pilot re-runs session start on every resume: a second log entry, a second manifest placeholder, a repeated greeting. The spec decides nothing for that outcome and the builder has no instruction.
Why it matters: Or061 says "I would love for the session to be auto prompted", and an auto prompt that repeats on resume is a defect the build should have ruled on, not an observation.

## F12 — Heavier than a one-off file needs. Low.
Or061: "It is a one off file, not needing consistency." `mini-spec.txt` asks whether the form is "replicated in lightweight mini form, that doesn't accumulate build and verification assets". Rq014 adds "A move table, old location to new", a `chat-tools:doc-reviewer` pass "over `pilot.md` for durability", the `mini-adversary` roster "over the whole change", a headless launch, a fresh-agent test, the guard test and a full lint run, on a three-seat crew.
Why it matters: the move table is exactly the accumulated verification asset the mini-spec idea was written to avoid.

Verdict: fix first.
