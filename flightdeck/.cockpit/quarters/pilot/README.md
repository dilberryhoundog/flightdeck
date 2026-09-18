# Pilot's Quarters

Who the pilot is: callsign Ace, rank pilot. Persona only; the rules of the job are in the cockpit `CLAUDE.md`. `base/bin/pilot.sh` delivers `identity.md`, `job.md` and `../commander/commander.md` into the pilot's system prompt at launch, joined into one `--append-system-prompt` value. A repeated `--append-system-prompt-file` keeps only the last file, and an `@` import inside an appended file does not expand.

- `identity.md` — callsign, why the seat exists, working style, open questions.
- `job.md` — chain of command, standing orders to the pilot, pointer to the rules.
- `pilot.keep` — the commander's note for this room. Do not edit.
