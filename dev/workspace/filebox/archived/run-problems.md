# Run problems

Defects observed in how a run is identified, located and versioned on disk. Diagnosis only: each entry states what is wrong, the evidence for it, and what follows from it. No remediation is proposed here.

Observed on branch `flightcrew-buildout`, against the two completed runs and the state documents that describe them.

## 1. One piece of work occupies three locations

Building flightcrew v1 was attempted twice. Both attempts pin the identical spec — `flightcrew-v1`, version 1, commit `5f69a94`, file commit `88290d0` — the same frozen bytes. The only difference between them is the tests map: v1 at commit `44aff6b`, then v2 at commit `5cad9b9`. The first ended `abandoned` at 22:43 on 2026-09-03; the second ended `accepted-with-reservations` at 02:47 on 2026-09-04, four hours later.

The artefacts of that single piece of work are distributed across:

- `../../../../flightdeck/launch/flightcrew-buildout` — the first attempt's evidence, returns and report
- `../../../../flightdeck/launch/flightcrew-buildout-2` — the second attempt's, carrying `previous_launch: flightcrew-buildout`
- `../../../../flightdeck/launch/specs/flightcrew-v1` — the spec and both map versions, in neither run

Consequence: no directory contains the work. Reading either run folder gives an incomplete account, and the version series that explains the failure sits outside both.

## 2. A run has no concept of an attempt

`../../../../flightdeck/flightcrew/schemas/launch.schema.json` defines `spec` as a single object and `tests_map` as a single object or null. There is no `attempt` property. The only version-bearing key in a `launch.json` is `schema_version`, which describes the file format.

A launch therefore pins exactly one spec version and exactly one map version for its whole life. A second pass at the same work, under a corrected map, cannot be expressed within it.

Consequence: the unit the system can name is a launch, and the unit the work actually has is a run with attempts inside it. The second is unrepresentable, so it was recorded as two of the first.

## 3. The runner refuses to reuse a run directory

`flightdeck/flightcrew/bin/cmd/launch.mjs:267`:

```js
if (isDir(dir)) throw new UsageError(`launch exists: ${repoPath(ctx, dir)}`);
```

A second attempt cannot occupy the directory the first used. The refusal is unconditional and has no override flag.

The same file records awareness of the consequence at line 300, in a comment explaining why a failed creation cleans up after itself: "rather than leaving a half-built launch folder that the corrected retry then refuses as `launch exists`."

Consequence: the sibling directory was not a choice. Given a failed first attempt, the CLI admits no other shape.

## 4. `previous_launch` is a backpointer standing in for a missing field

`launch.json` carries `previous_launch`, computed automatically as the newest other launch of the same spec. On the second run it reads `flightcrew-buildout`.

The system detected that the two launches were the same work and recorded the relationship, while having no field in which to say they were one run.

Consequence: the relationship exists as a pointer between two peers rather than as containment, so nothing can enumerate the attempts of a run, count them, or order them except by following pointers backwards from the newest.

## 5. Version series cannot live inside a run, so they were hoisted out

A launch pins one spec and one map. A spec that is revised, or a map that is corrected, produces a second file that the pinning launch cannot hold.

`../../../../flightdeck/launch/specs/flightcrew-v1` holds `spec.v1.json`, `tests-map.v1.json`, `tests-map.v2.json` and `design.md`. Each run folder holds only its own pinned copies: the first has `spec.v1.json` and `tests-map.v1.json`, the second `spec.v1.json` and `tests-map.v2.json`.

Consequence: the external folder is where the version series went because the run folder could not hold one. It is a consequence of the pinning model, not an independent design decision.

## 6. The external spec folder was improvised, then documented as canonical

No command creates `flightdeck/launch/specs/<name>/`. `fc launch new` takes a path to an existing spec and errors `no spec at <given>` if it is absent; it only ever reads from that location and writes into the new launch folder.

`../../../../flightdeck/launch/README.md` subsequently describes the location as settled: "the canonical, cross-run home of one spec: `spec.v*.json`, `tests-map.v*.json`, `checks/` for check scripts with no natural project home, and `interview/`, which is never copied anywhere."

Consequence: a shape produced by working around a constraint is recorded as the intended design, and `test-builder.md` now names it as its final fallback for check placement, propagating it into the check-building path.

## 7. Three incompatible run-folder shapes exist across branches

- `../../../../flightdeck/launch/specs/flightcrew-v1` — spec external to every run (`flightcrew-buildout`)
- `flightdeck/launch/agent-types/specs/` — specs grouped under a named folder (`engage-crew`)
- `flightdeck/launch/<run>/spec.v1.json` — spec inside the run, beside `interview/`, `judge/` and `attacker/` (`constitution-research`, `engage-crew`)

The third shape is the one every spec in this repository was actually produced under. `flightdeck/launch/reference-library/` holds `idea.txt`, `interview/problems.json`, `interview/findings.json`, `interview/bundles/P1.json` through `P5.json` and `spec.v1.json`. `flightdeck/launch/agent-spec-interviewer/` holds the same interview shape plus `judge/verdict-v1.md` with runs 3 to 8, and `attacker/findings-v1-run1.md`.

Consequence: the layout that the tooling enforces is the one no spec was made under, and the layout every spec was made under is the one no tooling supports.

## 8. The run-local `checks/` directory existed and was removed by instruction

`../../../../flightdeck/launch/specs/flightcrew-v1/design.md`, in the section directing how the launch folder is produced: "(the existing empty `launch/flightcrew-buildout/checks/` and `specs/` folders are removed first; a `checks/README.md` is not needed)".

The directory was scaffolded and deleted as a build step, which is why it appears in no commit. A search of every tree in the repository's history returns no `flightdeck/launch/<run>/checks/` path.

Consequence: `flightdeck/STRUCTURE.md` describes a launch as "one self-contained orchestrated build run, with its own specs and checks" and shows `example-launch/checks/`, while the only run that had that directory had it removed by a contract written for that run. The state document and the artefact were made to disagree by a one-off instruction that outlived its run.

## 9. The branch convention broke once directory identity broke

The first run's branch is `run/flightcrew-buildout`, matching the default `run/<name>`. The second run's branch is `flightcrew-buildout-v1` — neither the default pattern nor derived from the launch name.

Consequence: once the second attempt became a separate launch, nothing tied its branch to the first attempt's, and the naming convention that would have expressed the relationship was abandoned rather than extended.

## 10. The run log records two runs where there was one

`../../../../flightdeck/launch/RUNLOG.md` holds two entries, both naming the same spec in their headings: `## 2026-09-04 · flightcrew-v1 · flightcrew-buildout-2` and `## 2026-09-03 · flightcrew-v1 · flightcrew-buildout`.

The second entry's reservation — that "the tests map was revised to v2 (T11, T24) by the orchestrator mid-build rather than after the human's log" — is the direct consequence of the first entry's abandonment, and reads in the log as an independent observation.

The planner reads this file before writing a plan for the same spec.

Consequence: the record the system keeps in order to learn from failure presents one failure and its correction as two unrelated runs, and the causal link between them survives only in a `previous_launch` field the run log does not carry.

## 11. `STRUCTURE.md` documents a launch shape that has never existed

`flightdeck/STRUCTURE.md` shows `launch/example-launch/` containing `checks/` and `specs/`. No path containing `example-launch` appears in any tree in the repository's history, and no run folder in any commit contains a `checks/` directory.

The document states its own standard: "This map records directories only. Individual files are deliberately absent so it stays true as files churn."

Consequence: the map is read as a description of the system and is a statement of intent for a shape not built, with nothing marking the difference.

## 12. The CLI treats a spec as an input; the practice treats it as an output

`fc launch new <spec-path>` requires a spec that already exists and is frozen. `fc launch activate` refuses a draft spec without `--allow-draft`. The phase order begins at `targets`, after a spec exists.

Every spec in this repository was grown inside a run folder, starting from an idea. `flightdeck/launch/reference-library/idea.txt` is eight lines of prose stating what to build, the lens it is viewed through, who it is for, what goes wrong without it, and what success looks like. The spec is the output of the interview conducted in that folder, not an input to it.

Consequence: the interval in which a spec is made has no representation in the launch model. It occurs in a folder under `launch/` that no command creates, that no `launch.json` describes, and that ends where the tooling begins.

## 13. There is no recorded starting point

No command creates and names a run folder, and no template seeds one. `fc launch new` creates a launch folder only from an existing frozen spec. Nothing produces an `idea.txt`, a draft `spec.v1.json` from `../../../../flightdeck/flightcrew/templates/spec.template.json`, or an `interview/` directory.

`../../../../flightdeck/flightcrew/crew/spec-builder.md` lists a run folder among its required session inputs, supplied by whoever dispatches it. `flightdeck/STRUCTURE.md` records that `flightcrew/crew/spec-interviewer.md` "is deliberately empty. It is what the next launch builds."

Consequence: both run folders that follow the interview shape have it because the operator already knew the shape. Nothing in the repository states it, creates it, or would reproduce it.
