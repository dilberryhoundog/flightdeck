# P003 — Repair STRUCTURE.md and liftoff.template.yaml paths

- **Status:** withdrawn 2026-09-18, see decisions.json D012
- **Raised:** 2026-09-17
- **Mission:** M001

## Problem

`../../../../STRUCTURE.md` documents `radar/` where the tree has `HUD/`, a `launch/example-launch/` that does not exist, and omits `.controlcenter/` and `.cockpit/`. `flightdeck/flightcrew/templates/liftoff.template.yaml` points at pre-reorganisation paths (`flightdeck/crew.json`, `flightdeck/templates/*`, `flightdeck/runs/`) and names two templates that do not exist (flags 5 and 6). Crew reading these will act on a layout that is not there.

## Proposal

One worker unit updates both files to the current tree. The cockpit is documented in STRUCTURE.md as the pilot's post with its access rule. Missing templates are either added as stubs or removed from the liftoff references, the commander's call.

## Risk

Low. Documentation and a template. Reversible by git.

## Crew plan

One worker. Reviewer confirms every path named in both files exists. Pilot verifies with a directory listing.

## Decision

Pending.
