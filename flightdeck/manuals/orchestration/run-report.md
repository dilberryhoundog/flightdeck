# The run report

`launch/<L>/report.md` is the system-generated account of one run: what phases ran, which agents were spawned and what they returned, what failed, what was planned against what landed, which checks ran and what they said. Assembled by `fc report` (and by `fc launch end` and the SessionEnd hook) from recorded events, never narrated from memory. Read by the human at G3, by the run-log diagnosis, and by the next run's orchestrator through the kickoff's prior-reports line.

## Three documents around a run

- The evidence page `evidence.html` is the live view during the run, rewritten at every check, gate, phase change, return and ending.
- The report is that view frozen at the ending, made complete, committed with the code.
- The run-log entry is the human's diagnosis written afterwards from the report; the report is the factual body, the entry is the judgement.
- Three rules inherited: every step is a span (which step spent the money or the time), counts first then detail (skipped as visible as failed), chronology not story (each fact with its source).

## Provenance marks

Every section carries a mark saying which source produced its lines; the human weighs a fact by its source.

| mark | source | produced by |
|---|---|---|
| `[recorded]` | hooks and `fc` | `events.jsonl` lines with `source: hook` or `fc`: session boundaries, subagent start and stop, tasks, tool failures, permission denials, compactions, stop blocks, worktree removal, gates, phases, returns, merges, usage |
| `[checked]` | verification commands | `evidence/<T>.json`, `summary.json`, `boundary.json`, `locked.json`, `budget.json`: exit codes and output captured verbatim by `fc check`, `fc boundary`, `fc locked`, `fc budget` |
| `[reviewed]` | the critic | `review/pass-<n>.json` as returned, joined with `review/resolutions.json` |
| `[stated]` | the orchestrator | `fc events append --stated`, `fc launch note`; model narrative from the run's own context, confined to marked lines and one section |

- A report in which most lines are stated is a report whose harness needs more hooks; each run, pick the stated line that mattered most and ask which hook or structured return would have recorded it.
- The orchestrator's role is assembly through `fc`, not authorship; it holds no Write or Edit.

## The eight sections

| # | heading | mark | content |
|---|---|---|---|
| — | `# Run report · <spec> · <launch>` | `[recorded]` | header lines: spec (path @ commit), kickoff (version), started, ended, outcome, cost (`agents · stop blocks · minutes · tokens or not recorded`), agents, phases; plus `allow_draft`, `landed`, accepted and abandoned units when set |
| 1 | `## Ledger [checked · reviewed · stated]` | mixed | the plan reconciled against the result, four lists always present (`—` when empty): planned and landed; planned and not landed; unplanned and landed; attempted and discarded; each row: unit, spec refs, verdict, deciding source, agents |
| 2 | `## Verification [checked]` | checked | counts line (pass, fail, error, skipped), then every check with command, exit, output tail verbatim, covers, commit; then the lines `unverified:`, `quarantined:`, `test-file changes:`, `diff boundary:` |
| 3 | `## Review [reviewed]` | reviewed | findings as returned: id, kind, severity, spec ref, file and line, text, state (`open`, `resolved @ commit`, `disputed`) |
| 4 | `## Phases [recorded · stated]` | mixed | one row per phase: started, ended, gate and result, agents, tokens, ended by (gate, stop block count, stall, escalation, human, error) |
| 5 | `## Agents [recorded · stated]` | mixed | one row per `SubagentStart`: agent id, type, phase, task (stated), outcome from the stop event and the validated return, duration, tokens, artefacts, transcript path |
| 6 | `## Failures and interventions [recorded]` | recorded | chronological: `unparseable: <n>` first when any event line failed to parse, then tool failures, permission denials, stop blocks and their count, stalls, escalations, triggers, compactions, worktree removals |
| 7 | `## Orchestrator notes [stated]` | stated | `notes.md` written by `fc launch note`, else `(none recorded)` |

- Placeholders when a source is absent: no `evidence/summary.json`, Verification reads `not run` under its counts line and the three lines show `—`; no `review/pass-*.json`, Review reads `not run`; no `plan.json`, the ledger lists `—` and a line `plan: none`; no `events.jsonl`, Phases, Agents and Failures read `no events recorded`; a unit without a return file shows `not returned`.
- "Attempted and discarded" comes from `WorktreeRemove` events whose worktree produced no green return or `unit_merged`, plus a `git worktree list` snapshot.
- Findings are printed as returned; the orchestrator filters nothing; a disputed finding is marked, not removed.

## How claims are judged

| claim | judged by | source in the report |
|---|---|---|
| a planned unit landed | its checks pass at the final commit and a `unit_merged` event exists | Verification; Ledger deciding source |
| a planned unit did not land | a check fails, is skipped, or never ran; no merge event | Verification; the phase row that ended it |
| something unplanned landed | `boundary.json` lists a path no unit owns, or a finding names behaviour the spec did not ask for | diff boundary line; Review |
| the feature works end to end | `T1` verdict pass at HEAD | Verification, the `T1` row |
| scope was respected | `boundary.json.outside` empty; no scope-violation finding open | diff boundary line; Review |
| the checks were not weakened | `locked.json` empty, or each change accounted for | test-file changes line |
| an agent completed | its `SubagentStop` fired and its return validated against its schema (`return` event) | Agents, outcome |
| a phase ended for a reason | the recorded event that ended it (`gate`, `stop_block` count, `stall`, `escalation`, `trigger`) | Phases, ended by; Failures |
| the run should be accepted | the human, reading the ledger and the open findings | not in the report; the outcome given to `fc launch end` and the run-log entry |

- The report never states an acceptance verdict: none of `ready to merge`, `should be accepted`, `accept this run` appears outside quoted check output; a report that judges itself must be re-verified in full.
- The human's reading order at G3: ledger, open findings, the three unverified lines, cost; orchestrator notes last, if at all.

## What fc report reads

| input | gives |
|---|---|
| `launch.json` | header identity, outcome, ceilings, `landed`, accepted and abandoned units |
| `plan.json` | the units and spec refs the ledger reconciles |
| `evidence/summary.json`, `evidence/<T>.json` | counts, per-check rows, unverified, quarantined, uncovered |
| `evidence/boundary.json`, `evidence/locked.json`, `evidence/budget.json` | the boundary line, test-file changes, counts beside ceilings |
| `review/pass-<n>.json`, `review/resolutions.json` | findings and their state |
| `events.jsonl` | phases, agents, failures, cost from `usage` events; unparseable lines counted and skipped |
| `returns/<unit>.json` | per-unit status, checks, artefacts, commits |
| `notes.md` | orchestrator notes |
| `git worktree list` | the discarded list |

- `fc report` exits 0 with an absent `events.jsonl` (treated as empty) and with unparseable lines (counted); it prints one line on success.
- The same inputs render `evidence.html` through `fc evidence`: self-contained, no script, no external reference, every check's command and output verbatim, sections Unverified, Quarantined, Test-file changes, Boundary, Changed since lock, Findings, Phases, Agents, Failures.

## Building it

1. Hooks record events to `events.jsonl` (event-log on every recorded event); `fc launch gate`, `fc launch phase`, `fc return`, `fc worker merge` and the stop gate append the synthetic ones.
2. `fc check` captures every check's command, exit and last forty output lines verbatim; `fc boundary` and `fc locked` capture the change lists.
3. Every worker, explorer, verifier and critic return is validated by schema at `fc return` and stored at its fixed path; without fixed shapes the agents table and the ledger would be recalled, not assembled.
4. Cost arrives through `fc events usage <json>` (from `claude -p --output-format json` or a workflow's stage tallies); with no usage event the cost line reads `tokens not recorded`.
5. `fc report` and `fc evidence` assemble at any time; `fc launch end` and the SessionEnd hook run them at the end; `fc launch end` also inserts the run-log stub.
6. The human reads the report, decides, and writes the run-log diagnosis from the Failures section.

## Anti-patterns

- Narrated, not recorded: a report written from memory at the end of a long context; counts approximate, failures forgotten, prose convincing.
- No provenance: every line equally authoritative, so a counted event and a recollection cannot be told apart.
- Summaries of summaries: "agent 3 completed successfully" in place of the artefact it wrote and the check that passed.
- The missing "not landed": only landed units listed; all four ledger lists, always, even when empty.
- Filtered findings: findings removed before the report; the critic's independence is gone.
- No cost column: the report cannot say which step spent the money.
- The verdict in the report's own voice: "ready to merge"; the reader must re-verify everything to trust the sentence.
- The wall of transcript: raw agent output pasted in bulk; link the transcript path, quote only what a check or a failure produced.
