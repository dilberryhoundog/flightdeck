# Build 1 planning

The planning residue for side build attempt 1 of FlightDeck. Written by the lead agent; the owner's documents are `../VISION.md`, `../build.txt` and `constraints.md` here.

- `review.html`: the plain-language review page for the owner. Open it in a browser. Its "Your answer" box builds a reply to paste back to the agent.
- `constraints.md`: the owner's file. Your own words for this build go here, dated, one per line.
- `plan/plan.md`: the final plan the review page is built from. `plan/candidates/` holds the three competing plans it was merged from.
- `research/`: the research reports the plans were built on.
- `verify/`: findings from review, fact check, adversary and human imposter, and `plan-resolution.md` saying what was accepted or rejected.
- `workflows/plan.js`: the dynamic workflow that produced all of the above (25 agents: Opus at high effort for designing, judging and revising; Sonnet for research and checks; Haiku for cheap reading).

## Retrying the plan

Tell Claude what to change, or add dated lines to `constraints.md` yourself. Then ask Claude in this repository to run the Workflow at `.flightdeck/build-1/workflows/plan.js` with args `{"outDir": ".flightdeck/build-1/attempts/plan/a2", "attempt": 2}`. The workflow always reads `.flightdeck/build-1/constraints.md`. Attempt 1's files stay where they are, and the new attempt writes its own research, plan, checks and review page into its folder.
