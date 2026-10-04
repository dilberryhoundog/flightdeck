# claude-md-judge report — what belongs in CLAUDE.md

Crew C011, teammate `claude-md-judge` (general-purpose, Opus), 2026-09-18, session 49f87e44. Applied by the pilot the same session; see the log. Summary filed here, the full draft became `CLAUDE.md`.

## Verdicts (F# cite docs-scout.md)
- identity.md: Who, "direct prose", open questions stay in quarters (F6). Why the seat exists was a duplicate of CLAUDE.md's purpose paragraph; shrunk to a pointer. "Structured records first", "commander closes missions", "check the records", "measure do not ask", and the Memory section are conventions of the place: CLAUDE.md (F3, F6, F19). "Dispatch and verify" is both.
- job.md: all eight mandates except "start fresh when told" are rules of the place: CLAUDE.md (F3, F6, F16). Mandate 6 split: the tool constraint stays in quarters, "every session is the commander's, state your session name" moves. All eight crew rules move (F3, F6, F12), rule 7's "three at most" marked as current practice. Session start and end move (F12, F19): a session opened without the launcher gets no quarters at all.

## Leave CLAUDE.md
The broken rule 2 sentence with the import. The "identity and job delivered at launch" line shrinks to a persona pointer. Rule 1 should name the settings file that registers the guard as well as the script.

## Import verdict
`@records/README.md` is valid syntax (F7) but not wise: it costs the same context as inlining (F8), loads only on demand for sessions above the cockpit (F12), and pulls a changing room index (F6). No `@` imports in this CLAUDE.md; state the rule inline, cite the README as a backticked path.

## Quarters residue
identity.md: who, one-line why, working style, open questions. job.md: chain of command, standing orders that govern only the pilot, pointer to the rules.

## Pilot verification
Guard registration in `base/settings/pilot.settings.json` line 33 confirmed. Draft applied minus "anything may be deleted" (notepad rule), which no source supports. Judge's line count of 108 included fences; the file is 70 lines.
