# P002 — Decide the canonical home for crew role definitions

- **Status:** withdrawn 2026-09-18, see decisions.json D012
- **Raised:** 2026-09-17
- **Mission:** M001

## Problem

The same role bodies exist in three places: `flightdeck/flightcrew/crew/worker.md`, `flightdeck/flightcrew/crew/isolated-worker.md` and `.claude/agents/worker.md`. Six crew files are copied into `.claude/agents/` with no stated source of truth. `crew.json` role ids drift from the file names, and six manifest roles have no file at all (flags 3 and 4).

## Proposal

The commander decides which is canonical: `flightdeck/flightcrew/crew/` as source with `.claude/agents/` generated from it, or the reverse. Once decided, a worker unit reconciles: one worker file with isolation as a frontmatter variant, `crew.json` ids matched to file names, and the six fileless roles either written or marked planned in the manifest.

## Risk

Changes agent definitions the harness loads. Reversible by git. Verify by diffing regenerated copies and running the validator suite.

## Crew plan

One worker per file group, isolated in a worktree. Reviewer checks ids against `crew.json`. Pilot verifies and reports.

## Decision

Pending.
