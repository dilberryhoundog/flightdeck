# Run report shape

`fc launch end` and `fc report` render `launch/<L>/report.md` to this shape. The headings appear in this order and are not optional; a section whose input is absent prints its placeholder rather than disappearing. The report never states an acceptance verdict: it records what was checked, what was reviewed and what was merely stated, and the human decides.

```
# Run report · {{spec_name}} · {{launch}}
spec: {{spec_name}} v{{spec_version}} @ {{spec_commit}}    kickoff: {{kickoff_version}}
started: {{started}}    ended: {{ended}}    outcome: {{outcome}}
cost: {{agents}} agents · {{stop_blocks}} stop blocks · {{minutes}} minutes · {{tokens}}
agents: {{agent_count}}    phases: {{phase_list}} [recorded]

## Ledger [checked · reviewed · stated]

## Verification [checked]

## Review [reviewed]

## Phases [recorded · stated]

## Agents [recorded · stated]

## Failures and interventions [recorded]

## Orchestrator notes [stated]
```

## Header

`cost` reads `{{tokens}}` as `not recorded` when no usage event was seen. Three lines appear only when the launch carries them: `allow_draft: true`, `landed: {{landed_commit}} · {{landed_pr}} · {{integration_check}}`, and for a partial run `accepted units: {{accepted_units}}    abandoned units: {{abandoned_units}}`.

## Ledger

One row per plan unit: unit, kind, its checks with their verdicts, branch, merge commit and return status. A unit with no return file reads `not returned`. Below the rows: merged units, units still open, the behaviours listed as unverified, and `attempted and discarded` — the worktrees removed without a green return or a merge, read from the WorktreeRemove events and a `git worktree list` snapshot. Without plan.json each list reads `—` and a line reads `plan: none`.

## Verification

The counts line from `evidence/summary.json` (pass, fail, error, skipped) then four lines that are always present:

```
unverified: {{unverified_ids}}
quarantined: {{quarantined_ids}}
test-file changes: {{test_file_changes}}
diff boundary: {{boundary_result}}
```

Without `evidence/summary.json` the counts line reads `not run` and the four lines show `—`.

## Review

Every finding of every critic pass as it was returned — id, kind, severity, spec node, file, line, text — joined with its state from `review/resolutions.json`. Without a `review/pass-*.json` file the section reads `not run`.

## Phases, Agents, Failures

Phases: one row per phase change and gate in order, with its timestamp and whether a hook recorded it or a human stated it. Agents: one row per agent id in the events with its type, its turns and its usage where usage was observed. Failures and interventions: the first row is `unparseable: {{n}}` counting event lines that did not parse, then the escalations, fired triggers, denied edits, stop blocks and stalls in order. Without `events.jsonl` all three sections read `no events recorded`.

## Orchestrator notes

The contents of `notes.md`, written by `fc launch note`, or `(none recorded)`.
