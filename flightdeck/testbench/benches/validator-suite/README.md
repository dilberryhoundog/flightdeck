# Spec validation tests

Two commands. One checks the validator; the other checks the specs.

```
node test/run.mjs             # does validate-spec.mjs still enforce what it claims?
node validate-all.mjs <dir>   # do the specs under <dir> pass?
```

Run `test/run.mjs` after changing `validate-spec.mjs`, `schema-lib.mjs` or `spec.schema.json`. Run `validate-all.mjs` after editing any spec, and before freezing one.

## What the suite is made of

`test/fixtures/agent-sample/` holds two golden specs that pass every check with no warnings: `spec.v1.json` is a draft baseline, `spec.v2.json` a frozen revision carrying lineage, a retired entry and non-ok statuses. Between them they reach every branch the validator has.

`test/cases.mjs` is the case table. A case names a golden, mutates one field of it, and states the exact set of rule ids that mutation must raise. Cases are diffs rather than stored files, so a change to the spec shape is made once in a golden and every case inherits it.

`test/run.mjs` writes each mutated golden to a temp directory, runs `validate-spec.mjs` against it, and compares the reported rules and exit code to what the case declared.

## Adding a case

Append an entry to the `cases` array:

```js
{ name: "inv13-short-description", base: "v1", rules: ["invariant-13"],
  mutate: (s) => { s.some_field = "the thing that should be rejected"; } }
```

- `base` is `"v1"` or `"v2"`, whichever golden already has the shape the case needs.
- `rules` is matched **exactly**, not by containment. A case fails if the mutation raises a rule it did not declare, which is what catches an invariant firing on files it has no business rejecting.
- `clean: true` asserts no errors and no warnings; `warns: [...]` asserts each substring appears in a warning line.
- `as` overrides the filename and `dir` the folder, for cases about the filename or the folder itself.

Every coded invariant in `validate-spec.mjs` should have at least one case that fails without it. When adding an invariant, add its case in the same edit.

## Interpreting output

`validate-all.mjs` marks each file `ok`, `warn` or `FAIL`, then prints a count. Errors are violations of the schema or of a coded invariant and must be fixed. Warnings are judgement flags for the attack session and are never fatal, unless `--strict` is passed, which treats them as failures.

| flag | effect |
|--------------|--------------------------------------------------|
| `--quiet` | print only files that fail |
| `--strict` | treat warnings as failures |
| `--for-freeze` | gate every file as if it were freezing now |
