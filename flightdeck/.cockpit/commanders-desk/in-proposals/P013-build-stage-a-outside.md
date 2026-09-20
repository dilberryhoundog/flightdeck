# P013 — Build stage A of the paperwork check, outside the cockpit

- **Status:** amended 2026-09-20 by the commander (D026, D027)
- **Raised:** 2026-09-20
- **Mission:** M001
- **Dossier:** DS006

## Problem

The cockpit has nothing that checks its own references. The commander's rename of three advice files left 24 broken references in live files, the second time that room has done it, and the identifier set the commander has ruled touches about 518 live references. Doing that by hand repeats the failure. The check that would make it safe is code, and no one may write it: rule 1 bars crew from writing in the cockpit, and the commander's orders bar the pilot from doing work. The guard cannot be the safeguard either way; by its own header it does not see what an interpreter-run script writes.

## Proposal

**The route.** Crew build and test outside the cockpit, in the session scratchpad or a git worktree, against a read-only copy of the cockpit. Adversaries review the code and its test results. The pilot lands the reviewed files into `base/` unchanged, the route a crew report already takes into the notepad. Rule 1 is kept and the pilot authors nothing. This route then stands for all code in `base/`, including P012, whose crew plan as written has a worker editing the guard in place.

**What is built (stage A only).** Shell and Python, both on a bare system path; parses JSON, scans text, parses no frontmatter.

- A prefix table: one row per prefix with kind, minting register, number range and default zone, and three declarations beside it: renamed, retired (`C`), reassigned (`P`, by range: below 101 a former proposal, from 101 a procedure).
- A zone and field map: which paths are live, scratch or frozen, zones read from the table and rooms enumerated from the filesystem; zones keyed on paths below room level, never on a top-level room name, since the notepad is to live at `records/notepad/` and must stay scratch; which fields of each JSON document type are expected to hold a whole-value reference; `orders.json` `text` never touched.
- A reference checker that reports, case-sensitively, every cited id and path in live files that does not resolve, and exits non-zero when any exist. It writes nothing.
- A rename tool with a dry run: tier 1 (whole-value references in live JSON, file renames) applied; tier 2 (every other live occurrence) emitted as a per-file diff for a reviewer to accept or strike; tier 3 never touched. Output is one commit's worth of changes and a printed change list.
- A table test over fixtures, including the commander's O048 as a case that must come through unchanged.

**First uses, in order.** The 24 references left by the advice rename, as the proving run. Then the identifier pass, as one reviewed, reversible commit, with the pre-pass search kept as proof that no old live id remains.

## Risk

A checker proves a reference resolves, not that a sentence is still true; prose stays with a reviewer. Once landed, each run of the rename tool writes where the guard cannot look, so containment is the review before landing, the dry run, the single commit and the change list. A false report costs a glance. Reversible by removing the files; the rename by reverting one commit.

## Crew plan

One builder seat (Opus, since the tiers are judgement in code) and one test seat (Sonnet) writing fixtures from the final paper, both outside the cockpit; the mini adversaries on the plan before building and on the result before landing. The pilot verifies by running the table test and the proving run, and reads the diff of the commander's own files to the commander before anything lands in them.

## Decision

Amended by the commander, 2026-09-20 (D026, D027). The outside-build route is replaced: write is a restriction of role, not of place, so the build team writes stage A directly into `base/`, inside a scope the pilot states in its brief, and the pilot links the team to the commander and records the team's actions. Review before use, the dry run, the single reversible commit and the printed change list stand as the containment. Added to the build: the lint is non-blocking; on success it prints one short line; on error each finding gives the file, the line, what is wrong and the exact replacement, so the fix is a small edit made without a further tool call. The pilot repairs the advice files' identifiers itself. A procedure is to create an advice file with its metadata filled whenever a request is written; the pilot extracts it when the desk documents take their new shape.
