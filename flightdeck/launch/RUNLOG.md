# Run log

## 2026-09-03 · flightcrew-v1 · flightcrew-buildout
spec: flightcrew-v1 v1 @ 5f69a94
kickoff: base@1+shape-workflow@1+task-feature@1
outcome: abandoned
cost: 9 agents · 0 stop blocks · 45 minutes · not recorded
symptom: abandoned at verify — escalation wrong-check: Two locked suite cases cannot be satisfied by any faithful implementation. Suite bin-evidence (T11), case changed-since-lock-lists-each-path-with-added-and-removed-counts: the case appends a leading newline and two comment lines to a fixture that already ends in a newline, so git reports 3 added lines for that path under numstat, -w, -b and --ignore-blank-lines alike, while the case requires the rendered row to carry a 2. Suite constraints (T24), case C1-imports-are-node-builtins-or-relative-inside-scope: the scanner keeps string literals, so the literal '@import "x"' inside the hostile-content fixture of suite bin-evidence reads as a bare import specifier; no script in the four in-scope directories imports one. Both files are locked targets. A third finding is not a check: fc boundary reports .claude/workflows/flightcrew-build.js outside the allowed paths; it was written by the session that drove this build and needs a decision before the boundary can be clean.
seen on: verification
cause: two locked cases asserted values no faithful implementation could produce: T11 expected 2 added lines where git numstat reports 3 for the fixture edit; the T24 import scanner read a string literal as a specifier
fixed on: verification
change: tests-map v2: T11 asserts 3 added lines; T24 scanner anchors import statements at a statement start; every check re-baselined against the built tree
watch: both cases pass at verify in flightcrew-buildout-2 with no implementation change
kept: contracts settled by two fresh refutation rounds before the fan-out; deterministic per-unit gates with a single judging pass at review
promote: C3 one-line success output versus in-process validator lines: settle in spec v2 (fc plan write and fc launch phase print validator ok lines)

One entry per ended run, inserted below this heading newest first by `fc launch end` (through `fc runlog stub`); the mechanical fields are filled from the launch, the diagnosis fields read `<fill>` until a human writes them.
