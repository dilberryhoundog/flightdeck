# Raw explorer report aa5794d7d8d458dd5

Recovered 2026-09-18 by the pilot from the subagent transcript on disk; the hand-back reached the lead only. Unverified raw material; the parent teammate's filed report supersedes it.


Brief (first 200 chars): Read-only research. A snapshot of a git branch has been extracted to /private/tmp/claude-501/run2tree/. Do not write anything anywhere. Do not read /Users/dylangraham/Projects/flightdeck at all.

Task

## Unfinished intent — flightdeck snapshot

### A. Whole unbuilt roadmap (dev/workspace/plans/flightcrew-features.md)
This file is a full spec-shaped backlog for work not yet started (no matching launch exists under flightdeck/launch/ for any of it — only flightcrew-v1 and flightcrew-characterization have run).
1. `dev/workspace/plans/flightcrew-features.md:10` — F1 Launch and run layout: "`flight launch init`... `flight launch run`" — new runner/layout not built.
2. `dev/workspace/plans/flightcrew-features.md:12` — F2 JSON document foundation: every run document to become schema'd JSON with freeze-by-status-field — not built.
3. `dev/workspace/plans/flightcrew-features.md:14` — F3 Runner as leaf tooling: proposes replacing `fc` with a thin `flight` dispatcher over leaf scripts — not built.
4. `dev/workspace/plans/flightcrew-features.md:16` — F4 Kickoff as workflow and arguments: conduct via saved `.claude/workflows/` scripts + JSON arguments doc — not built.
5. `dev/workspace/plans/flightcrew-features.md:18` — F5 Check rail and three verdicts: judge/verdict-sheet mechanism for statistical/judged checks — not built (echoes the "no judge runner" gap below).
6. `dev/workspace/plans/flightcrew-features.md:20` — F6 Roster and separations: new roles (interface-builder, strong-worker, adversary, scribe) not yet in the crew.
7. `dev/workspace/plans/flightcrew-features.md:22` — F7 Dispatch and return contracts: sealed three-layer dispatch rendering, not built.
8. `dev/workspace/plans/flightcrew-features.md:24` — F8 Enforcement that fails closed: Bash sandbox shipped active with deny list, stall recording — not built.
9. `dev/workspace/plans/flightcrew-features.md:26` — F9 Endings performed: integration-branch rebase/land mechanism for "Accept" ending — not built.
10. `dev/workspace/plans/flightcrew-features.md:28` — F10 Diagnosis reaches next run: enforcement that next run refuses to open until previous RUNLOG entry is filled — not built (RUNLOG today is filled by hand only).
11. `dev/workspace/plans/flightcrew-features.md:32-38` — Recommended 3-launch split not begun: "Launch 1 — flightcrew-core", "Launch 2 — flightcrew-conduct", "Launch 3 — flightcrew-verdicts" all listed as future work, none exists in `flightdeck/launch/`.

### B. Scaffolded-but-empty templates (dev/workspace/plans)
12. `dev/workspace/plans/prd.md` (43 lines) — entirely unfilled template, every section is a bracketed placeholder, e.g. line 21: `[Explicitly not doing, out of scope, future considerations]`.
13. `dev/workspace/plans/architectural.md` (39 lines) — entirely unfilled template, e.g. line 3: `[file/module organization, component interaction, patterns identified]`.

### C. Scaffolded-but-empty directories/files
14. `flightdeck/testbench/benches/rubrics/spec/experiments/` — dir holds only `.keep` (94 bytes: "Committed home for rubric-bench experiment chains... never launch results") — no experiment chains committed yet.
15. `flightdeck/testbench/case-map.json` — file is literally `{}`.
16. `flightdeck/testbench/suites/_checks/fixtures/sweep-exempt.json` — file is literally `[]` (mutation-sweep exemption list never populated).

### D. Deferred/not-built mechanism: judge runner for statistical/judged checks
17. `flightdeck/launch/specs/flightcrew-v1/spec.v1.json:661` — "Statistical and judged checks are representable in the tests map but no judge runner is built... Deferred to a later version." (also duplicated in `flightdeck/launch/flightcrew-buildout/specs/flightcrew-v1/spec.v1.json:661` and `flightcrew-buildout-2/specs/flightcrew-v1/spec.v1.json:661`).
18. `flightdeck/launch/specs/flightcrew-v1/design.md:298` — "Statistical and judged checks are representable; no judge runner in v1. No verdict-sheet JSON schema for the spec judge."
19. `flightdeck/testbench/suites/hooks-stopgate/run.mjs:332` — literal fixture text baked into a test: `'sh -c "echo not built yet; exit 1"'` paired with `'fail: the contract is not yet implemented'`.

### E. Open defects/observations pinned as "not done" (run-2 report, flightcrew-characterization)
20. `flightdeck/launch/flightcrew-characterization/runs/run-2/report.md:116` — "No scenario set was built (D3): the statistical and judged checks pass empty."
21. `flightdeck/launch/flightcrew-characterization/runs/run-2/report.md:117` — "The run-log entry in `flightdeck/launch/RUNLOG.md` is not stubbed; no `fc launch end` ran in a runner-free run."
22. `flightdeck/launch/flightcrew-characterization/runs/run-2/report.md:118` — "The reviewer's three acts on a fresh checkout and the transcript reading are the human's" (handed off, undone).
23. `flightdeck/launch/flightcrew-characterization/runs/run-2/report.md:100-103` — Defects pinned but unresolved: max-turns missing on explorer/verifier/critic roles; roster mismatch on turn ceilings; spec-judge/spec-attacker missing inputs line; spec-builder body over 60-line limit; G3 approve on an ended launch wrongly succeeds; `validate-tests-map.mjs` reads `--spec` before the pinned map spec, contrary to its own header.
24. `flightdeck/launch/flightcrew-characterization/runs/run-2/report.md:106` — F2 (E5): "run-all charges only new `git status --porcelain` lines, so a write to an already-modified tracked file... is not seen." (known gap, left open).

### F. Open faults from RUNLOG.md / flightcrew-characterization-1 (ten numbered tooling faults, abandoned run)
25. `flightdeck/launch/RUNLOG.md:10` — "the orchestrator has no tool that invokes a workflow, so the workflow shape is unusable" (fault 1 of 10, unresolved at time of writing).
26. `flightdeck/launch/RUNLOG.md:10` — "fc worker render refuses a contracts unit in phase contracts, run-log B27 still open" (fault 2; also in `flightdeck/launch/flightcrew-characterization-1/notes.md:10`).
27. `flightdeck/launch/RUNLOG.md:10` — "a stopped agent cannot be resumed and a fresh dispatch fails on the existing unit branch" (fault 5, unresolved).
28. `flightdeck/launch/RUNLOG.md:10` — "escalation.json holds only the newest escalation" (fault 9) and "fc return has no --stdin and the orchestrator holds no Write" (fault 10).
29. `flightdeck/launch/RUNLOG.md:14` — partial contracts commit `95a8cae` on branch `flightcrew-characterization-1/contracts` "held for the human to salvage or delete, not merged" — explicit unresolved leftover.

### G. Open defects from flightcrew-buildout-2 (accepted-with-reservations, F6–F11 observations)
30. `flightdeck/launch/RUNLOG.md:25` — F6: "changedSince silently skips the committed diff when the base does not resolve... the fix... deliberately leaves the stored lock_commit lenient, which is an error defaulted away rather than surfaced" (acknowledged remaining gap).
31. `flightdeck/launch/RUNLOG.md:29` — F10: "diffSinceLock runs `git diff <base>` against the working tree, which omits untracked files, so a new file created but not yet staged after the lock is absent from the critic's sealed prompt" (open, also carried into `flightdeck/launch/flightcrew-buildout-2/report.md:57` as status `open`).
32. `flightdeck/launch/RUNLOG.md:30` — F11: hook-interpreter check makes `fc doctor --target` exit 2 in a case "B30 does not list" — acknowledged spec gap, unresolved.
33. `flightdeck/launch/RUNLOG.md:23` — spec conflicts explicitly "carried to the next version": B39 vs workflow runtime rejecting `export default`; B27 worker-render/contracts-phase conflict; I14 deny rule blocking the test-builder; stall message Claude Code doesn't display; C3 one-line-output vs validator lines — five named unresolved conflicts pushed forward.

### H. RUNLOG.md structural note (task 4 — full read)
34. `flightdeck/launch/RUNLOG.md` — file contains exactly 3 run entries (flightcrew-characterization/-1, flightcrew-buildout-2, flightcrew-buildout), all fully filled in — no literal `<fill>` placeholders currently present in the log body itself, but line 46 documents the mechanism: "the diagnosis fields read `<fill>` until a human writes them" — i.e. the template guarantees future entries will start as unfilled placeholders that must be completed by a human; this is the enforcement gap that plan item F10 (`flightcrew-features.md:28`) proposes to close but hasn't yet.

### Notes on exclusions
- Excluded fixture noise: `"# todo 0"` strings in `testbench/fixtures/sample-launch/evidence/T*.json` and the ~30 literal `"expect": "fail: not implemented"` lines in `tests-map.v1.json` — these are deliberate red-baseline test expectations, not undone work.
- Excluded prose uses of "future"/"later"/"for now" that were explanatory rather than promissory (e.g. in role/template docs describing steady-state behavior).
- `flightdeck/flightcrew/templates/spec.template.json:66` (`"<decided elsewhere or deliberately deferred>"`) is a generic template placeholder string, not a specific undone commitment — noted but deprioritized.
