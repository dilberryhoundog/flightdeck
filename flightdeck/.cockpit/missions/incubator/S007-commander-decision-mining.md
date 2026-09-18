# S007 — Record and mine the commander's decisions

- **Raised by:** commander, 2026-09-18, session dcb75456
- **Heat:** hot

## The spark

"Now that I have a role one step higher in the chain as the commander, record and mine all my decisions so that the cockpit and flightdeck align over time with my vision, rather than me define it blind session by session. We will mine your daily logs and look to formulate teams to do this task."

## What exists

- `quarters/commander/commander.md`: standing orders recorded verbatim or near-verbatim, newest at the bottom, plus preferences and working relationship.
- `base/decisions.json`: D001 to D012, approvals and rejections of proposals and questions.
- `logs/`: one log per session since 2026-09-17, each entry tagged with a mission id; the commander's corrections are recorded in the entry where they landed.
- The recon team's topology file, which is the commander's account of flightdeck's history in their own words.

## What is unknown

- The shape of a decision record that can be mined: subject, decision, the rule it implies, the files it changed, the mission it served.
- Whether the dossier, decisions.json and the logs should stay three places or fold into one record with three views.
- What a mining team looks like: a reader over the logs, a synthesiser that proposes rules, an adversary that checks them against the commander's words, the commander approving.

## Momentum

- 2026-09-18 — Raised by the commander during the recon team run. Sent to mission-cutter as a commander-stated mission.

- 2026-09-18 — Commander (DS001 advice): not epic alone; converges with S006 on the epic: make the cockpit self-sustaining and self-improving over time, the agent that operates here getting ever better at administering the system through well-grounded practices and the commander's steering inputs.

## Matures when

The mission cuts are approved and the daily logs have enough sessions to mine.
