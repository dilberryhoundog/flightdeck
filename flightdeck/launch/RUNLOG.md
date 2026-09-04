# Run log

## 2026-09-04 · flightcrew-v1 · flightcrew-buildout-2
spec: flightcrew-v1 v1 @ 5f69a94
kickoff: base@1+shape-workflow@1+task-feature@1
outcome: accepted-with-reservations
cost: 0 agents · 0 stop blocks · 243 minutes · not recorded
kept: draft (orchestrator): contracts settled by two fresh refutation rounds before the fan-out; deterministic per-unit gates with one judging pass at review; the run's own record produced by the commands, not by hand
reservation: the tests map was revised to v2 (T11, T24) by the orchestrator mid-build rather than after the human's log; the ending command was corrected during this run to exclude the run's own folder from its clean-tree check; spec conflicts carried to the next version: B39 versus the workflow runtime (the shipped workflow scripts pass the suite but end with export default, which the runtime rejects), B27 worker render refusing the contracts phase the kickoff dispatches in, the I14 deny rule that would block the test-builder, the stall message on exit 0 that Claude Code does not display, and C3 one-line output versus validator lines from pin, phase plan and plan write
observations:
- F6: changedSince silently skips the committed diff when the base does not resolve, so a launch whose stored lock_commit fails to resolve makes fc boundary and fc locked report only the working tree and exit 0 as clean; the fix validates a --base argument (boundary.mjs:245, locked.mjs:324) but deliberately leaves the stored lock_commit lenient, which is an error defaulted away rather than surfaced.
- F7: fc worker render now writes returns/<unit>.prompt.md beside printing, while I8 lists returns/ as the store for agent returns and B48 says the critic prompt carries no text from any file under returns/; the prompt file carries the same spec node lines the critic prompt carries, so B48's literal wording is unsatisfiable by construction, though every reader (loadLaunchData, validate-all, fc launch end partial) filters on .json so nothing breaks functionally.
- F8: fc launch pin tests-map replaces paths.allowed with the map's allowed_paths, discarding any --allow <glob> given to fc launch new (I1), so the flag has no effect once a map is pinned.
- F9: report.md prints notes.md verbatim under Orchestrator notes, so a note recorded with fc launch note can carry the strings B18 forbids ('ready to merge', 'should be accepted', 'accept this run') into report.md outside quoted check output.
- F10: diffSinceLock runs git diff <base> against the working tree, which omits untracked files, so a new file created but not yet staged after the lock is absent from the critic's sealed prompt while fc boundary counts it as changed.
- F11: The new 'target hook interpreter' check spawns '<first token> --version' for every hook command in settings.json; a hook command whose first token is not an executable on PATH (an environment assignment, a quoted variable, a tool without --version) is reported unresolved and makes fc doctor --target exit 2 even though B30 does not list that condition.

## 2026-09-03 · flightcrew-v1 · flightcrew-buildout
spec: flightcrew-v1 v1 @ 5f69a94
kickoff: base@1+shape-workflow@1+task-feature@1
outcome: abandoned
cost: 9 agents · 0 stop blocks · 45 minutes · not recorded
symptom: abandoned at verify — escalation wrong-check: Two locked suite cases cannot be satisfied by any faithful implementation. Suite bin-evidence (T11), case changed-since-lock-lists-each-path-with-added-and-removed-counts: the case appends a leading newline and two comment lines to a fixture that already ends in a newline, so git reports 3 added lines for that path under numstat, -w, -b and --ignore-blank-lines alike, while the case requires the rendered row to carry a 2. Suite constraints (T24), case C1-imports-are-node-builtins-or-relative-inside-scope: the scanner keeps string literals, so the literal '@import "x"' inside the hostile-content fixture of suite bin-evidence reads as a bare import specifier; no script in the four in-scope directories imports one. Both files are locked targets. A third finding is not a check: fc boundary reports .claude/workflows/flightcrew-build.js outside the allowed paths; it was written by the session that drove this build and needs a decision before the boundary can be clean.
seen on: draft (orchestrator): verification
cause: draft (orchestrator): two locked cases asserted values no faithful implementation could produce: T11 expected 2 added lines where git numstat reports 3 for the fixture edit; the T24 import scanner read a string literal as a specifier
fixed on: draft (orchestrator): verification
change: draft (orchestrator): tests-map v2: T11 asserts 3 added lines; T24 scanner anchors import statements at a statement start; every check re-baselined against the built tree
watch: draft (orchestrator): both cases pass at verify in flightcrew-buildout-2 with no implementation change
kept: draft (orchestrator): contracts settled by two fresh refutation rounds before the fan-out; deterministic per-unit gates with a single judging pass at review
promote: draft (orchestrator): C3 one-line success output versus in-process validator lines: settle in spec v2 (fc plan write and fc launch phase print validator ok lines)

One entry per ended run, inserted below this heading newest first by `fc launch end` (through `fc runlog stub`); the mechanical fields are filled from the launch, the diagnosis fields read `<fill>` until a human writes them.
