# Flightcrew features and the recommended split

Ten features, one per registered problem, each written as the intention paragraph a spec would open with. Then a recommended split into launches, each with its own intention. The features are the vision; the split is the order it is built in.

## Part 1 — the ten features

### F1. Launch and run layout

A piece of work has one home: `flightdeck/launch/<name>/`, holding `specs/` (the spec series, the tests-map series, and `interview/`) and `runs/run-<n>/` (one folder per attempt, numbered, never reopened). A run points at its spec and map by version and commit and copies nothing. `FLIGHTLOG.md` sits beside all launches with one entry per run, headed by launch name and run number so lineage reads without following pointers. The interval before a spec exists has an address and a scaffold: `flight launch init` opens the launch with a draft spec and its interview folder and stubs the first run; `flight launch run` opens the next numbered run once the previous has ended. An abandoned run's outputs stay in its folder; the launch record names the current run and that run alone is runnable.

### F2. JSON document foundation

Every document a run reads or writes is a JSON file with a schema under `flightdeck/flightcrew/schemas/`, written by the thing that produces it, so a later local page can read a run's state and edit the documents a human owns without a command between it and the files. Markdown under a run is a rendering for a human and is never read back. Freeze is a document's own `status` field, enforced by a hook that reads the file it is about to touch, with no dependence on which run is active. The launch record indexes phase, gates and the current run and holds nothing a document's own field or a workflow's arguments already carry. Locked paths remain for what a status field cannot cover (a test folder, a fixture, a library a check imports) and the map declares what each check depends on so locking a check locks what decides its verdict.

### F3. Runner as leaf tooling

The runner is `flight`: a thin dispatcher over leaf scripts, each runnable by its own path with the dispatcher absent, each taking paths and arguments, writing one artefact and working alone. No command a human types advances a run; a human reads evidence and approves at gates. The leaves that survive are check (with boundary and locked folded in), render (one sealed dispatch per subagent role), merge, validate and lint, `launch init` and `launch run`, and install. Returns are captured by a hook, events are written by hooks, the report and log entry are written by a role, and the phase state is written by the human's gate approval and by the end of the workflow that ran the phase. The spec describes artefacts, enforcement, roles and renderings; it never describes a command's arguments, exit codes or resolution order.

### F4. Kickoff as workflow and arguments

A run's conduct is a saved workflow script under `.claude/workflows/`, invoked by name with a JSON arguments document that has a schema: the kickoff is that arguments document and the script is its executable form. Each phase is a prebuilt workflow started after a gate and ending where a human must decide, so the gate is where a workflow ends. The arguments carry only what survives the routing test as conduct — gates, dispatch rules, default budgets and ceilings, model tiers, review policy, ending policy — and everything else lives in the spec, the plan, the role files and the settings. The arguments document is versioned by git and recorded in the plan and the log entry, and a script refuses arguments it does not understand. The previous run's log entry is carried into the arguments as content, not a pointer.

### F5. Check rail and three verdicts

Testing has one vocabulary: a test is the project's own assertion, owned by the project and never written by a run; a check is the wrapper the tests map names, which runs something and returns a verdict a gate can read; a verdict is an exit code, a ratio against a threshold declared before any trial, or a verdict sheet against a rubric with mandatory quotations. Checks live in the run: `runs/run-<n>/checks/`, written by the test-builder after the spec freeze and before implementation; fixtures and harnesses live in `flightdeck/testbench/`; shared libraries and gates live under flightcrew in a folder not named checks. The map, the result schema and the gates carry all three verdict kinds; a judge produces the sheet and a gate reads it; nothing agent-shaped ends as unverified for want of a mechanism.

### F6. Roster and separations

The crew holds every role the separations need: the interface-builder that writes wave-zero seams and halts on a spec–codebase contradiction, the strong-worker that retries a red unit once on a stronger tier from a clean state, the adversary that attacks a completed unit before merge, and the scribe that assembles the report and log entry and notices when assembly fails, beside the explorer, planner, orchestrator, implementer, verifier and critic. The spec chain (spec-builder, spec-judge, spec-attacker) stays as it is. The spec-builder and the test-builder are session agents the human starts; every other role is a subagent with a sealed dispatch. A role's reach is declared once, in its frontmatter (tools, model, mode, isolation, its own hooks); settings hold only what no role can express, and the install step derives the dispatch list from the crew folder.

### F7. Dispatch and return contracts

Every subagent receives a sealed dispatch rendered from three layers — the role file, a project template, and the per-unit fill — so what is not a slot cannot reach the worker, and the rendered prompt is a file in the run. Every return consumed downstream has a schema and is validated at the handoff, captured by a hook from the subagent's final message rather than stored by a command. Every human-started role has a recorded invocation. No role file names an input its dispatch does not carry, a command its tools cannot run, or a write its tools forbid.

### F8. Enforcement that fails closed

Every guarantee a run relies on is enforced by something that does not consult the agent. A guard that cannot decide denies with a reason; a recorder that cannot record stays silent and logs; no hook permits by failing. The Bash sandbox ships active with every guarded path in its deny list, so a shell command cannot write what the file guards refuse. A gate exists in every phase in which a role can write. A stall is written into the run's record, shown to the next session, and clears only by a human's hand. Irreversible actions are denied and side-effecting workflows are human-invoked only. The manifest, if kept, asserts both directions.

### F9. Endings performed

An ending is performed, not recorded. Accept: the accepted branches stack onto an integration branch rebased on the parent, the end-to-end proof reruns there, one commit per unit lands, CI says it again, the cost line closes, worktrees are removed and branches deleted, and the spec's status points at the landing commit. Abandon: stop at the finding, freeze the evidence, stub the log entry, clear the ground. Partial: unit by unit, a landing unit standing only on wave-zero contracts. Gate three has a source phase, a destination and a blocker, and no run ends with its final gate pending. There are exactly three endings and the record's words match them.

### F10. Diagnosis reaches the next run

The human's diagnosis has an enforcement twin. An agent never writes a fill field and the system refuses if one does; the next run does not open while the previous entry stands unfilled; the previous entry's diagnosis reaches the next run's arguments as content; a retry differs from the last run by one attributable change and the record can show which; the tests map is never edited inside a run — an agent reports and stops, and the human revises the map after the log is written.

## Part 2 — the recommended split

Three launches in dependency order. Each is a spec of its own with its own runs and log entries; each is small enough that its first run is observed rather than imagined.

### Launch 1 — flightcrew-core: the ground (F1, F2, F3, F6, F8)

Flightcrew's first run under its own tooling opens a launch and a run as folders, holds every run document as JSON with a schema, keeps a frozen document frozen by reading it, and holds every guard against the shell. The runner is `flight`, a thin dispatcher over leaves that stand alone, with two scaffolds that give the interval before a spec exists an address. The crew roster is complete and each role's reach is in its frontmatter, with the install step deriving the settings from the crew folder. Nothing conducts a run yet; everything a conductor needs exists and holds. Outcome: a launch folder can be opened, its documents validated, its frozen things held against every tool, and its roles dispatched with the reach their files declare.

### Launch 2 — flightcrew-conduct: a run under its own power (F4, F7, F9, F10)

The kickoff is a workflow and its arguments; each phase is a prebuilt workflow that ends at a gate; every subagent is dispatched sealed and returns against a schema captured by a hook; endings are performed to clear ground; and the human's diagnosis is defended and carried into the next run's arguments. Outcome: a run of a small fixture spec proceeds gate to gate with the human reading and approving and typing no state command, ends with its ground cleared, and the next run refuses to open until the diagnosis is written.

### Launch 3 — flightcrew-verdicts: the check rail (F5)

One testing vocabulary, checks in the run folder written by the test-builder as a session, three verdict kinds carried by the map, the result schema and the gates, and a judge that produces the sheet. Outcome: an agent-shaped behaviour tagged statistical or judged is verified, not declared unverified.

### Why this cut

Launch 1 is the layer every later launch reads and writes; it changes no conduct, so its first run can be driven by the v1 orchestrator or by hand and still prove its outcome. Launch 2 is the intent's sentence and needs 1 underneath it. Launch 3 changes what a gate reads and is cheapest once gates are workflows. If one launch fails, the log entry names the axis and the next run of that launch differs by one change; the other two are untouched.
