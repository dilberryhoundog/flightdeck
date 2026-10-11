# Climbs

A climb improves one document by measured rounds, and keeps a change only when it measurably helps.
Noise is how much a score moves between two identical measurements; a gain smaller than that proves nothing.

## The rule

Measure the noise first: take the baseline twice and use the difference between the two.
Each round makes exactly one change to the one document.
A climb uses training cases (the cases the improver may read) and held-back test cases (cases kept from it, used only to check the gain is real).
A change is kept only if the training score and the held-back test score both rise by more than their noise.
Otherwise it is reverted, and the climb says "within noise, do not merge".
The proposer is told not to read the held-back test cases.
A climb runs at most five rounds; the first real climb runs three.
The spending cap for the first climb is $10.
Haiku measures and Sonnet proposes.

## How to start

Ask the pilot, or run `lab/workflows/climb.js` with the Workflow tool.
The arguments are `target` (the one document), `train` and `test` (two name patterns, such as `climb-team-plans-train-*`, over `flightdeck/evals/`), `repo` (this folder's full path), `scratch` (a scratch folder's full path) and `today` (the date).
Optional arguments are `rounds`, `runs`, `maxCostUsd` and `dryRun`; a dry run changes and measures but pushes nothing.

## The first real climb

The target is the description in `flightdeck/skills/team-plans/SKILL.md`.
Its cases are written for that climb, not shipped in this pull request: cases where the skill should fire and cases where it should stay quiet.
They live in `flightdeck/evals/climb-team-plans-train-<what>/` and `flightdeck/evals/climb-team-plans-test-<what>/`, so the two name patterns are `climb-team-plans-train-*` and `climb-team-plans-test-*`.

## The result

The result is a draft pull request when a change was kept, or the honest line "within noise, do not merge".
Either way the report lands in `lab/results/<date>-climb-<document-name>/report.md` on the climb branch.
