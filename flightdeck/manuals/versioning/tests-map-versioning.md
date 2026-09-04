# Tests-map versioning, check status, and the retired registry

This document governs reading and writing `tests-map` files only. The spec files they refer to are governed by their own document (`spec-versioning.md`); nothing here licenses an edit to a spec.

## Files

A tests map is a sequence of immutable version files beside the spec it maps:

```
specs/<name>/spec.v2.json
specs/<name>/tests-map.v1.json
specs/<name>/tests-map.v2.json
```

Each file is complete and self-contained. Reading the highest-numbered
`frozen` map gives the current mapping in full. Earlier versions exist for history and comparison only.

A version file is never edited after it is frozen. A revision is a new file with `version` incremented. A file with `status: "draft"` is the one version still being edited; only `frozen` files (which carry the `commit` they were frozen at) may be referenced by a kickoff or a plan.

The header records identity, lineage, and the spec version this map satisfies:

```json
{
  "name": "export-html",
  "version": 2,
  "status": "frozen",
  "commit": "4f2e9b1",
  "reason": "spec v2 pinned Warning reuse; contract check re-derived",
  "spec": {
    "name": "export-html",
    "version": 2,
    "commit": "a1b2c3d"
  }
}
```

The `spec` pin is the load-bearing field. A map satisfies exactly one frozen spec version. Map and spec version numbers move independently and will drift apart; the pin, not the filename, says which spec a map belongs to. A map whose pinned spec version is no longer the highest frozen spec version is stale in its entirety.

`previous_versions` follows the header: an append-only list of the headers of every earlier map version, newest first, each entry also carrying the
`spec` pin it held. When revising, first append the current file's own entry, then edit. Entries are never edited or pruned.

## Checks and IDs

Every check is a node with at least `id`, `status`, `kind`, `covers`,
`command`, and `baseline`. IDs are `T<n>`: permanent, never renumbered, never reused. A removed check leaves a gap in the sequence; gaps are normal and carry history.

`T1` is always the acceptance check, and the file-level `acceptance` field names it explicitly. Machine consumers read the field, not the convention. If field and convention ever disagree, stop and report; do not resolve it.

`name` is an optional human label with no meaning. All cross-references (plan units, check output directories, run-report ledger entries, review findings) use the `T<n>` id; never reference a check by name or by file path, and never copy a check's command into another document.

`covers` lists spec node IDs (`B<n>`, `E<n>`, `C<n>`, `I<n>`, or the literal `scope`). The mapping is many-to-many: a check may cover several spec nodes and a spec node may be proven by several checks.

## The coverage rule

In a frozen map, every live `B`, `E`, `C`, and `I` node of the pinned spec version appears either in at least one check's `covers` or in `unverified`
with a `reason` and `decided_by: "human"`. Nothing is silently unmapped. A draft that cannot satisfy this is not ready to freeze; the gap is either a missing check or a question for the human, never something to omit.

## The status field

`status` records what happened to a check **in this map version relative to the previous map version**. It is not a pass/fail or quality marker.

| status    | meaning in this version                           | in the next version |
|-----------|---------------------------------------------------|---------------------|
| `new`     | check did not exist in the previous version       | becomes `ok`        |
| `ok`      | check is unchanged and stable                     | stays `ok`          |
| `changed` | check's content differs from the previous version | becomes `ok`        |

Rules:

- In `tests-map.v1.json` every check is `ok`.
- Any check whose status is not `ok` must carry a `note` naming the reason, usually the spec node change or the run that prompted it.
- When the pinned spec version advances, every check whose `covers`
  includes a spec node marked `new` or `changed` in that spec version must be re-derived from the new text and marked `changed` (or retired). A check left `ok` asserts its spec nodes are unchanged.
- When creating the next version, reset every `new` and `changed` check to
  `ok` and mark only what this revision touches.

## The baseline

Each check carries its own baseline pair:

```json
"baseline": {
  "expect": "fail: feature absent",
  "observed": "fail: exportProject is not defined"
}
```

`expect` states what the check should do before implementation exists:
feature checks fail for the feature's absence; world-state checks (structural, boundary, constraint) pass. `observed` records the verbatim state from the baseline run. The file-level `baseline` block records the commit and date that run happened at and a one-line reconciliation.

A map cannot be frozen until every check's `observed` matches its `expect`
at the recorded commit. A feature check that passes at baseline is broken; a check that fails for the wrong reason is measuring something other than the feature's absence. Both block the freeze.

Every revision re-runs the full baseline, not only the changed checks, and records fresh `observed` values throughout.

## Removal and the retired registry

Removal is not a status. A removed check vanishes from `checks` in the version where the decision is made, and the file-level `retired` registry gains an entry in that same version:

```json
"retired": [
  {
    "id": "T6",
    "at": 2,
    "covers": [
      "B6"
    ],
    "note": "B6 retired in spec v2; see spec registry"
  }
]
```

- The registry is append-only and carried in full in every subsequent version. Entries are never pruned.
- `at` is the map version in which the check was removed. Its final definition is in version `at - 1`.
- `covers` is mandatory in the entry: it makes the coverage hole visible at the moment of removal. In the same version, every spec node the retired check covered must be remapped to another check or added to `unverified`. The coverage rule holds in every frozen version without exception.
- The next unused `T` number is one higher than the highest ever used, counting both `checks` and the registry.

## Locked paths and the run boundary

`locked_paths` lists the test directories, check scripts, the fixture, and the map file itself. During a run these are read-only to implementing agents, enforced by hook. This document's write instructions apply only outside a run, in the targets stage or a revision session.

An agent inside a run that finds a check wrong — it contradicts the spec, it cannot be satisfied, it is flaky — reports and stops. That report is an exit from the run, and the fix is a map revision (or a spec revision)
decided by a human. There is no in-run edit path to this file.

`fixture` names the shared reference input every `expect`, `observed`, and budget threshold is a claim about. Changing the fixture invalidates every baseline and is itself a map revision.

`run_all`, when present, is a human convenience. Machine consumers always run per-check `command`s so each result is captured under its `T<n>` id.

## What an agent does with this

- **To act on the map** (plan, implement, verify, assemble a report): read the single frozen version you were pointed at, use checks by `T` id, run each check's exact `command`, and capture output keyed by id. Ignore
  `status`, `retired`, and `previous_versions`; `checks` contains exactly the live mapping. Confirm the `spec` pin matches the spec version you were also pointed at; if they disagree, stop and report.
- **To create v1** (the targets stage): derive checks from the pinned frozen spec only — no plan, no implementation. One or more checks per
  `B`, `E`, `C`, and `I` node, `T1` as acceptance, every check `ok`, coverage total or gaps placed in `unverified` as questions for the human. Run the baseline, record per-check `observed`, and leave freezing (setting `frozen`, `commit`, `reason`) to the human.
- **To revise**: copy the latest file to the next version number, append the copied file's entry to `previous_versions`, set `status: "draft"`, update the `spec` pin if the spec advanced, re-derive checks covering
  `new` or `changed` spec nodes, apply statuses and notes, move removals to
  `retired` with `at`, `covers`, and `note`, restore total coverage, reset last version's `new`/`changed` markers to `ok`, re-run the full baseline, and leave freezing to the human.
- **To report drift**: a document that records map version N was built against `tests-map.vN.json`. If a `T` id it references is `changed` in a later frozen map, or appears in `retired` with `at` greater than N, flag the document as stale against that check. Flag the map itself as stale if a frozen spec version newer than its pin exists.
- **Never** edit a frozen file, edit any map during a run, weaken an assertion or loosen a threshold as a shortcut to green, modify the fixture, renumber or reuse a `T` id, or reintroduce a retired check's content without a human reopening it as a `new` check with a note referencing the registry entry.
