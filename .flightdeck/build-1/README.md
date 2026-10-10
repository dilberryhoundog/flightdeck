# Build 1 planning

The planning residue for side build attempt 1 of FlightDeck. Written by the lead agent; the owner's documents are `../VISION.md`, `../build.txt` and `constraints.md` here.

- `review.html`: the plain-language review page for the owner. Open it in a browser. Its "Your answer" panel builds a reply to paste back to the agent.
- `constraints.md`: the owner's file. Add constraints, scoping or truth here before a retry.
- `plan/plan.md`: the final plan the review page is built from. `plan/candidates/` holds the three competing plans it was merged from.
- `research/`: the research reports the plans were built on.
- `verify/`: findings from review, fact check, adversary and human imposter, and `plan-resolution.md` saying what was accepted or rejected.
- `workflows/plan.js`: the dynamic workflow that produced all of the above.

## Retrying the plan

Add your constraints to `constraints.md`, then ask Claude in this repository to run the planning workflow: "run the Workflow at `.flightdeck/build-1/workflows/plan.js` with args `{"outDir": ".flightdeck/build-1", "attempt": 2}`". It overwrites the files above with the new attempt; git keeps the old one. To keep both side by side, pass a different `outDir` (for example `.flightdeck/build-1/attempt-2`) and copy `constraints.md` into it first.
