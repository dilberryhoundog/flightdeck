# Test Tooling

The run stage of an orchestrated launch is held together by a small set of deterministic tools. Each one reads a record, does one mechanical thing, and writes a record and an exit code. None of them judges; they exist so that every verdict the run produces is a machine outcome that can be quoted rather than a claim that must be believed. This document scopes each tool as a shape — what it takes, what it does, what it emits — precise enough to build from, and states the two record formats every tool depends on.

## Invariants

- A tool returns an exit code and a record; it never returns narrative.
- A tool reads only records, the tests map, the plan and the working tree; it never reads a transcript.
- Every record a tool writes carries the commit it was produced against.
- A tool that cannot complete writes a record stating what it could not do, then exits nonzero; it never writes a partial record that looks whole.
- Nothing in a record is summarised; raw output is stored verbatim, and any summary line sits beside it, never in place of it.

## The two records

Every tool below either produces or consumes one of two record types. These are the first things to build, because the tools are thin scripts over them.

### Check-result record

One record per execution of one check. It is the atom of evidence: workers return it, the display renders it, the verifier audits it, the report quotes it.

Fields: the check id from the tests map; the ids it covers; the exact command string as written in the map; the exit code; the raw stdout and stderr, verbatim; an optional one-line summary extracted by the check itself; the commit hash the working tree was at; the worktree or branch it ran in; the run id; the unit id if it ran inside a unit; the iteration number within that unit; start time and duration.

Rules: the command field is copied from the map, never typed; if the command actually executed differs from the map's string, the record says so and the difference is a finding. Records are immutable once written; a re-run produces a new record.

### Event record

One record per thing that happened in the run. It is the append-only history from which the ledger, the display and the budget meter are computed.

Fields: a sequence number; a timestamp; the run id; the event kind; the actor (orchestrator, or a crew role id and instance); the unit id where applicable; a payload appropriate to the kind; and the commit hash at the time of the event.

Event kinds, as a fixed vocabulary: run-started, plan-presented, gate-opened, gate-decided, worktree-created, agent-dispatched, agent-returned, return-invalid, check-run, unit-landed, unit-abandoned, boundary-excursion, target-change, contradiction-found, ceiling-hit, stall-detected, quarantine, run-ended. A kind not in the vocabulary is rejected by the schema.

Rules: the log is append-only and never rewritten; a correction is a new event that references the sequence number it corrects. Every agent return, valid or not, is an event. The check-run kind carries a pointer to a check-result record, not a copy of it.

## The tools

### Check wrapper

Shape: given a check id, read that check's command from the tests map, execute it exactly as written in a stated working directory, capture everything, and write one check-result record. Exit with the check's own exit code.

Takes: the tests map path; a check id; the working directory; the unit id and iteration number if inside a unit; the run id.

Emits: a check-result record; an event of kind check-run pointing at it.

Modes: single, as above; and `--all`, which walks every check in the map in map order, writes one record each, and additionally emits a coverage report as two lists — spec ids with at least one passing check, and spec ids with none. Coverage is never a percentage. The `--all` mode exits nonzero if any check fails or any id in the map is uncovered and not listed in the map's unverified section.

Does not: interpret output, retry, skip, or run any command not present in the map.

### Baseline verifier

Shape: run the whole map through the check wrapper against the reference fixture at the freeze commit, then compare each check's observed outcome against the `baseline.expect` field the map declares for it. Report every mismatch.

Takes: the tests map path; the fixture path; the working directory.

Emits: a baseline report listing, per check, the expected state, the observed state and whether they match; a single result line stating either that every check matched or which did not. Exits nonzero on any mismatch.

Rules: a behavioural or acceptance check expected to fail but observed passing is reported as a defective check, not a success. A structural check expected to pass but observed failing blocks the freeze. This tool's output is what the targets gate reads.

Depends on: the check wrapper.

### Diff-boundary check

Shape: given a list of allowed path patterns, diff a working tree or branch against a stated base commit and list every changed file that falls outside the allowed patterns.

Takes: the allowed-path list the test builder derived from the spec's scope section; the base commit; the tree or branch to compare.

Emits: a boundary report containing the full changed-file list, each file marked inside or outside the perimeter; an event of kind boundary-excursion for every outside file. Exits nonzero if any excursion exists.

Runs: once per unit, against the unit's worktree, before the unit is merged; once against the whole run branch after the last merge, to feed the ledger's unplanned column.

Does not: judge whether an excursion was justified; that is recorded in the ledger by a human or the orchestrator citing an event.

### Target-integrity check

Shape: the diff-boundary check inverted. Given the map's `locked_paths`, diff the run branch against the freeze commit and list every changed file that falls inside those paths.

Takes: the tests map path; the freeze commit; the run branch.

Emits: the test-file change list, which the run verifier and the report must show even when empty; an event of kind target-change for every entry. Exits nonzero if the list is non-empty.

Depends on: the same diffing core as the diff-boundary check; build them as one script with two modes.

### Lock hook

Shape: a pre-write hook, registered with the harness, that reads `locked_paths` from the frozen tests map once at session start and refuses any write, edit or delete whose target resolves inside those paths.

Takes: the tests map path, from the session's environment; the path of the attempted write, from the harness.

Emits: a refusal to the harness, with the locked path named; an event of kind target-change with a payload marking it as attempted-and-blocked.

Rules: the hook enforces; it does not explain. Its message is one line. It applies to every implementing role and is the mechanism behind the convention that check files, fixtures and goldens are read-only "by hook rather than instruction". The target-integrity check remains necessary: the hook prevents, the check proves.

### Return validators

Shape: one schema per agent return contract, and one script that validates a return against the schema for the role that produced it.

Schemas needed: the worker return contract; the interface-builder return; the unit-adversary findings; the run-verifier refutations and audit; the reviewer findings; the explorer answer. Each is a JSON schema in the same family as the existing spec, plan and tests-map schemas.

Takes: a role id; the return payload.

Emits: pass or fail with the first violation named; on failure, an event of kind return-invalid. Exits nonzero on failure.

Rules: the orchestrator validates every return before acting on it. A return that fails validation is treated as no return; the agent is not re-prompted to fix it, and the failure is evidence about the role's template.

### Event emitter

Shape: a single command that appends one event record to the run's event log, validating it against the event schema first.

Takes: the event kind; the actor; optional unit id; the payload.

Emits: the appended record with its assigned sequence number. Exits nonzero if the kind is unknown or the payload fails its schema.

Rules: every other tool writes its events through this emitter, never directly to the log. The log is one file per run, newline-delimited, in the run directory.

### Stall detector

Shape: read the event log and check-result records and evaluate the kickoff's stall definition against them.

Takes: the run directory; the stall rule as declared in the kickoff, expressed in terms the tool can evaluate — the same check failing across N consecutive iterations of one unit, no unit landed within a stated number of events, or a unit exceeding its iteration ceiling.

Emits: an event of kind stall-detected naming the unit and the rule that fired. Exits nonzero if any rule fired.

Runs: after every agent return.

Depends on: the event log and check-result records.

### Budget meter

Shape: read the event log and report the run's consumption against every ceiling the kickoff declares.

Takes: the run directory; the ceilings — maximum agents, maximum iterations per unit, spend.

Emits: a budget report with, per ceiling, the declared limit and the current count; an event of kind ceiling-hit for any limit reached. Exits nonzero if any ceiling is hit.

Runs: after every agent dispatch and return. The orchestrator treats a nonzero exit as a run exit, not an obstacle.

Depends on: the event log.

### Display renderer

Shape: read the event log, check-result records and the plan, and render the run's current state as a file the human opens.

Shows, in this order: the units and their states; the coverage lists; the unverified ids; the test-file change list; boundary excursions; cost against each ceiling; the most recent events.

Rules: the display informs; it never binds. Everything on it is derived from records, so it can be regenerated at any moment and is never hand-edited. It is the observability surface, and a result that only a human can interpret belongs here and nowhere in the gate.

Depends on: the event log, check-result records, the budget meter's report.

### Ledger builder

Shape: join the plan's units to check-result records, the boundary report and worktree events, and emit the ledger the report opens with.

Columns: landed, with the merge event and the check records that gated it; not landed, with the recorded reason; unplanned, from boundary excursions and reviewer findings that name out-of-scope work; discarded, from worktrees that were created and never merged.

Emits: the ledger as a record and as rendered markdown. Exits nonzero if any plan unit cannot be placed in exactly one column.

Rules: the ledger contains no verdict on the run. It is assembled for an abandoned run exactly as for an accepted one.

Depends on: the event log, check-result records, the diff-boundary check, the return validators.

### Worktree scripts

Shape: three commands over git. Create a worktree for a unit from a stated commit, on a branch named for the run and unit. Merge a unit's worktree into the run branch as a single commit whose message carries the unit id, refusing if the merge is not clean. Prune every worktree of a run, recording each as discarded or landed.

Emits: events of kind worktree-created, unit-landed or unit-abandoned as appropriate.

Rules: merging is atomic; a merge that fails leaves the run branch untouched. Every landed unit is one commit on the run branch, so the run can be resumed from any of them.

## Dependencies

The two records come first. The check-result record is written by the check wrapper and read by the baseline verifier, the stall detector, the display and the ledger. The event record is written by every tool through the emitter and read by the stall detector, the budget meter, the display and the ledger.

Among the tools, the baseline verifier depends on the check wrapper. The target-integrity check shares its diffing core with the diff-boundary check. The stall detector and budget meter depend only on the records. The display renderer depends on the records and the budget meter. The ledger builder depends on the records, the diff-boundary check and the return validators. The lock hook, event emitter, return validators and worktree scripts stand alone.

The build order that respects this: the two record schemas; the event emitter; the check wrapper; the lock hook and the diff-boundary check with its target-integrity mode; the return validators; the baseline verifier; the stall detector and budget meter; the worktree scripts; the display renderer; the ledger builder.
