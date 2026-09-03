# validate-spec suite (T14)

The regression suite of `flightdeck/flightcrew/checks/validators/validate-spec.mjs`. It proves spec node B22: the validator raises exactly the rule ids each case declares, exits 0 or 2 as declared, and reports both golden fixtures clean.

```
node flightdeck/testbench/suites/validate-spec/run.mjs
```

The runner follows the testbench suite protocol: one `pass  <case>` or `FAIL  <case>: <reason>` line per case, a `covers:` line, a final `<n>/<m> passed`, exit 0 when every case passes and 2 otherwise. It is also run by `node flightdeck/testbench/run-all.mjs`.

## What the suite is made of

`fixtures/agent-sample/` holds two golden specs that pass every check with no warnings: `spec.v1.json` is a draft baseline, `spec.v2.json` a frozen revision carrying lineage, a retired entry and non-ok statuses. Between them they reach every branch the validator has.

`cases.mjs` is the case table. A case names a golden, mutates one field of it, and states the exact set of rule ids that mutation must raise. Cases are diffs rather than stored files, so a change to the spec shape is made once in a golden and every case inherits it.

`run.mjs` writes each mutated golden to a temporary directory under the system temp root, runs the validator against it, and compares the reported rules and exit code to what the case declared. The temporary tree is removed at exit.

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
- `args` passes extra flags to the validator, such as `--for-freeze`.

Every coded invariant in `validate-spec.mjs` has at least one case that fails without it. When adding an invariant, add its case in the same edit.

## Output contract under test

The validator prints one `error: <message> — [<rule>]` line per violation, where the rule is a schema keyword or `invariant-N`, and one `warn:  <message>` line (two spaces) per warning; it exits 0, or 2 on any error. The filename warning (`is not spec.v<n>.json`), the folder warning (`does not match folder`) and the invariant-7 heuristic (`concern rather than an outcome`) are warnings, never errors.
