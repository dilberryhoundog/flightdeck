# lint-spec suite (T18)

The regression suite of `flightdeck/flightcrew/checks/validators/spec-readiness-lint.mjs`. It proves spec node B26: the linter exits 2 naming the failed rule id for a spec violating each rule of design section 5.14, prints the `warn-impression` and `warn-length` warnings without failing, and exits 0 on the sample spec with `--repo` pointing at the sample project.

```
node flightdeck/testbench/suites/lint-spec/run.mjs
```

The runner follows the testbench suite protocol (spec I9): one `pass  <case>` or `FAIL  <case>: <reason>` line per case, a `covers:` line, a final `<n>/<m> passed`, exit 0 when every case passes and 2 otherwise. It is also run by `node flightdeck/testbench/run-all.mjs`.

## What the suite is made of

Each case copies `testbench/fixtures/sample-project` and `testbench/fixtures/sample-spec` into a fresh temporary git repository (`mkLaunchRepo`), mutates one field of the canonical spec copy so that exactly one linter rule is violated, and runs the linter on the result. The temporary tree is removed at exit.

Most cases drive the linter through `fc lint spec <path> --repo <root>`; two cases run `spec-readiness-lint.mjs` directly, because design section 2 places the rules in that script and the CLI is only its caller.

## How warnings are matched

Design section 5.12 fixes the two output line shapes: `error: <message> — [<rule>]` carries the rule id in brackets, and `warn:  <message>` (two spaces) carries no bracket at all. So the rule id of a warning has no specified place in the line, and a compliant linter may print either `warn-impression` verbatim or a message that only names the concern.

`expectWarning()` therefore accepts a warning line matching the rule id (`warn-impression`, `warn-length`) or the id's stem (`impression`, `length`), case-insensitively. Error lines have no such latitude: `expectRule()` matches the bracketed rule id exactly, and takes a literal token or a RegExp when the message may name any of several ids the rule could reasonably cite.

If a future revision of the design gives warnings a rule bracket of their own, tighten `expectWarning()` to the bracketed form and drop the stem alternative.
