### Testing
+ check — any executable verification, test or otherwise, that returns pass or fail
+ target — a check that exists before the work and is locked against it
+ gate — the point where check results decide whether work stops or continues
+ class — one of the many kinds of check, distinguished by what it proves
+ verdict — the signal a check returns: an exit code, a ratio, or a verdict sheet
+ probe — a fresh session or agent whose only job is to be an ordinary user of the artefact
+ record — the captured transcript and outputs of one probe run
+ fixture — the known input a check runs against: reference data for code, a minimal scratch project for an agent-shaped artefact
+ check class — the declared method by which a behaviour will be falsified
+ scenario — a fixed starting prompt and context under which the agent is exercised
+ judge — an isolated evaluator that grades a transcript or artefact against a rubric


### Spec
+ ID — the stable number a behaviour, edge case or constraint carries for life
+ domain — one of the nine named parts of a spec
+ freeze — the moment a spec stops changing and work begins against it

### Rubric
+ rubric — the written instrument a judge grades against
+ verdict sheet — the judge's output: per-question answers with quotations
+ critical question — one whose failure fails the behaviour outright
