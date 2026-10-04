# Pilot's Quarters

The pilot's agent definition and persona. The rules of the job are in `pilot.md`; the rules of the place are in the cockpit `CLAUDE.md`. How the launcher delivers these files is in `base/bin/README.md`.

- `pilot.md` — the agent definition: frontmatter and the body that becomes the pilot's system prompt. Not linted; `base/verify/lint.yaml` excludes it.
- `identity.md` — callsign, why the seat exists, working style, open questions.
- `job.md` — superseded by `pilot.md` and no longer loaded at launch. Kept for the commander to judge and remove.
- `pilot.keep` — the commander's note for this room. Do not edit.
