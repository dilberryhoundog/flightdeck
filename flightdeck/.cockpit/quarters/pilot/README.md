# Pilot's Quarters

Who the pilot is and what the job is. `base/bin/pilot.sh` delivers `identity.md`, `job.md` and `../commander/commander.md` into the pilot's system prompt at launch, joined into one `--append-system-prompt` value. A repeated `--append-system-prompt-file` keeps only the last file, and an `@` import inside an appended file does not expand.

- `identity.md` — callsign, why the seat exists, working style, memory, open questions.
- `job.md` — chain of command, mandates, crew protocol, session start and end.
- `pilot.keep` — the commander's note for this room. Do not edit.
