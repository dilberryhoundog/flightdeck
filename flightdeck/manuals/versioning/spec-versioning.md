# Spec versioning, node status, and the retired registry

## Files

A spec is a folder of immutable version files:

```
specs/<name>/spec.v1.json
specs/<name>/spec.v2.json
```

Each file is a complete, self-contained spec. Reading the highest-numbered
`frozen` file gives the current spec in full; no other file is needed to act on it. Earlier versions exist for history and comparison only.

A version file is never edited after it is frozen. A revision is a new file with `version` incremented. A file with `status: "draft"` is the one version still being edited; only `frozen` files (which carry the `commit` they were frozen at) may be referenced by a kickoff, a plan, or a tests map.

The file header records why the version exists:

```json
{
  "name": "export-html",
  "version": 2,
  "status": "frozen",
  "commit": "a1b2c3d",
  "reason": "run 3 abandoned: Warning redefined; pin interface reuse"
}
```

The header is followed by `previous_versions`: an append-only list of the headers of every earlier version, oldest first, so a file carries its own lineage even when read outside its folder:

```json
"previous_versions": [
  {
    "v": 1,
    "file": "spec.v1.json",
    "date": "2026-08-24",
    "commit": "7c1d0aa",
    "reason": "initial, from interview"
  }
]
```

`file` is the sibling filename only, with no directory. When revising, first append the current file's own entry (`v`, `file`, `date`, `commit`,
`reason`) to this list, then edit. Entries are copies of frozen headers and are never edited or pruned.

## Nodes and IDs

Every part of the spec is a node with at least `id`, `status`, `text`. IDs (`INT`, `SC1`, `C2`, `I1`, `B5`, `E3`, `D1`, `VER`, `ACC`) are permanent:
never renumbered, never reused. A removed node leaves a gap in the sequence. Gaps are normal and carry history; do not close them.

Permanence begins at the first freeze. Until `spec.v1.json` has been frozen for the first time it has no dependents — no kickoff, plan, tests map or review may reference a draft — so its IDs are not yet load-bearing. While v1 is still draft its IDs may be renumbered, closed up and reused as the first spec is thrashed out, and a node removed from it leaves no gap and no registry entry. Everything above about permanence takes effect the moment v1 is frozen, and binds every version after it.

All cross-references between documents (plans, tests maps, check output, review findings, run reports) use these IDs. Reference a node by ID; never copy its text.

## The status field

`status` records what happened to a node **in this version relative to the previous version**. It is not a quality or progress marker.

| status    | meaning in this version                          | in the next version |
|-----------|--------------------------------------------------|---------------------|
| `new`     | node did not exist in the previous version       | becomes `ok`        |
| `ok`      | node is unchanged and stable                     | stays `ok`          |
| `changed` | node's content differs from the previous version | becomes `ok`        |

Rules:

- In `spec.v1.json` every node is `ok`.
- While `spec.v1.json` is still `draft` its IDs are not yet permanent and may be renumbered; see Nodes and IDs.
- Any node whose status is not `ok` must carry a `note` giving the reason, usually one line naming the run or session that prompted it.
- When creating the next version, reset every `new` and `changed` node to
  `ok` and mark only what this revision touches.

## Removal and the retired registry

Removal is not a status. A removed node vanishes from its array in the version where the decision is made, and the file-level `retired` registry gains an entry in that same version:

```json
"retired": [
  {
    "id": "B6",
    "at": 2,
    "text": "A file that fails to parse is reported with its path and line.",
    "note": "duplicated E2 once B5 named the warning kind"
  }
]
```

- The registry is append-only and carried in full in every subsequent version. Entries are never pruned.
- `at` is the version in which the node was removed, so it is never lower than 2 and never higher than this file's `version`. `text` is the node's final text, copied from version `at - 1`.
- The `note` is mandatory: it is what tells a later agent not to reintroduce the node. If a removal reflects a real decision rather than a cleanup (something considered and rejected), also add a `D` node recording the decision; the registry remembers the ID, the decision carries the judgement.
- The next unused ID in any sequence is one higher than the highest ID ever used in that sequence, counting both the array and the registry.
- Every ID ever used stays on the page. Read an array and the registry together and the IDs form an unbroken `1..N`: a node is either live in its array or present in `retired`, never absent from both. A hole means an ID was lost rather than retired, and `validate-spec.mjs` reports it. Answered open questions are the one exception — a `Q` id is not a spec node, and a question that has been answered simply goes.

## What an agent does with this

- **To act on the spec** (plan, write tests, implement, review): read the single version file you were pointed at and use nodes by ID. Ignore
  `status`, `retired`, and `previous_versions`; the arrays contain exactly the live spec.
- **To revise the spec**: copy the latest file to the next version number, append the copied file's entry to `previous_versions`, set
  `status: "draft"`, apply edits with correct node statuses and notes, move removals to `retired` with `at` and `note`, reset last version's
  `new`/`changed` markers to `ok`, and leave freezing (setting `frozen`,
  `commit`, `reason`) to the human. `open_questions` must be empty before a file can be frozen.
- **To report drift**: a document that records `spec_version: N` was built against `spec.vN.json`. If a node it references is `changed` in a later frozen version, or appears in `retired` with `at` greater than N, flag the document as stale against that node.
- **Never** edit a frozen file, renumber an ID, reuse an ID from the registry, or reintroduce a retired node's content without a human reopening it as a `new` node with a note referencing the registry entry. The single exception is `spec.v1.json` while it is still `draft` and has never been frozen, where IDs may be renumbered freely; see Nodes and IDs.
