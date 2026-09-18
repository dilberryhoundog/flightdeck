# S006 — Teams built by mining the crew dispatch records

- **Raised by:** commander, 2026-09-18, session dcb75456
- **Heat:** hot

## The spark

"Teams (of teammates) built by mining our agent dispatch records. So we can dispatch highly effective congruent teams for particular tasks. We will look to extend the cockpit later to accommodate teams."

## What exists

- `logs/crew-manifest.json` records every dispatch since C001: type, model, mode, purpose, access, outcome, verification, where filed. C001 to C016 as of today.
- `quarters/crew/` holds dossiers on recruited roles; the commander's rule is that a role is recruited after repeated appearances in the manifest.
- Three team runs so far: the first team (C006 to C008), the CLAUDE.md review (C009 to C011), the recon team (C012 to C016), each with its own notepad folder.
- Official guidance gathered today in `notepad/recon-2026-09-18/docs-verifier-alignment.md`: three to five teammates, focused seats, explicit goals in the spawn prompt, adversarial framing, monitoring.

## What is unknown

- What a team record looks like: composition, briefs, message pattern, outcome, cost, what the pilot verified and what the pilot corrected.
- Where teams live in the cockpit. A `teams/` room is the commander's stated direction.
- How a team template is invoked: by the pilot from a manifest entry, or by a launcher.

## Momentum

- 2026-09-18 — Commander: "The next idea is a dispatch/ folder that stores our teams. Rather than recording teammate by teammate, we should record our teams, with agents inside. This allows us to overview team makeup and overall purpose also." So the unit of record is the team, and the crew manifest's teammate-by-teammate rows become the agents inside a team record. Today's recon team (C012 to C016, five seats, three readers plus a verifier plus a cutter, with seven explorer subagents under the readers) is the first candidate record. The cutter's M008 proposes exactly this as its cockpit extension.

- 2026-09-18 — Raised by the commander during the recon team run. Sent to mission-cutter as a commander-stated mission.

## Matures when

The recon team's mission cuts are approved and the dispatch record has enough team runs to mine.
