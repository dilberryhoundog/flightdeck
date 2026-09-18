# P005 — The pilot's rulings on the cutter's nine open questions

- **Status:** awaiting
- **Raised:** 2026-09-18
- **Mission:** M001
- **Dossier:** DS001

## Problem

The cut left nine questions. The commander's advice (2026-09-18) is that the pilot now makes these calls and the commander approves, denies or changes them.

## Proposal

1. **Branch for harness work.** A new line cut from `flightcrew-characterization` after the suite lands, so the harness fixes are measured against the suite. Nothing on buildout.
2. **Two testbench trees.** Separated by branch until launch 1. A discovery rule for run-all is launch 1 work, not merge work.
3. **Core spec re-freeze.** Waits for the suite to land, not merely to exist. The held state was created to wait for exactly that.
4. **What the human drives when the runner goes.** The runner is not deleted in launch 1; it is reduced to leaf commands, which the roadmap's own F3 says. Deletion of what the leaf commands do not need waits for launch 2, when a run conducts itself. The commander drives through the leaf commands and the workflows in between.
5. **T44's missing standard.** Doctrine work inside the core spec repair (M006). M002 records T44 as decided-by-exemption with that pointer.
6. **Conducting-role and budget fixes.** Only what blocks landing the suite is fixed on the v1 line, which is nothing. The durable fixes belong to launch 2.
7. **Teams mined from where.** Both the cockpit runs and the flightcrew runs on the branches; run 2's contracts-first fan-out is a team record too.
8. **Mined standing orders.** Never bind a crew directly. They reach a crew only through the pilot's brief.
9. **Concurrency.** Three current missions, two horizon. The two cockpit missions start now.

## Risk

Ruling 4 departs from the core spec's SC1, which says the v1 runner is deleted. Reversible: it is a sequencing choice, and SC1 still governs the end state.

## Crew plan

None. Rulings become mission-file text once approved.

## Decision

Pending.
