# The crew

One markdown file per role. Each file's frontmatter is its identity — `name`, `description`, `tools`, `model`, and the extras the role needs — and its body is the system prompt that role runs under. `flightdeck/flightcrew/bin/fc distribute --apply --target <repo>/.claude` copies every file here that carries frontmatter to `<target>/agents/flightcrew/`, where `<target>` is the harness directory receiving the copies; this README carries none, so it stays behind.

A dispatch is the rendered prompt handed to a role: `fc worker render <unit>` writes the unit dispatch, `fc critic render --pass <n>` the critic's, `fc verifier render` the verifier's, and the spec-stage dispatcher passes the fixed paths listed below.

Roles divide into two chains. The spec chain (`spec-builder`, `spec-judge`, `spec-attacker`) turns an intention into a frozen spec. The run chain (`test-builder`, `planner`, `orchestrator`, `implementer`, `verifier`, `critic`) turns a frozen spec into a finished, proven build. The `explorer` serves both chains and stands outside the split. A launch is the run folder created for one spec at `flightdeck/launch/<L>/`. A role reads only what its dispatch names; the "must not see" column is as binding as the "sees" column, because a role that reads the plan or another role's reasoning stops being an independent witness.

## Roster

| role          | stage                | sees                                                                                       | must not see                                                                                                 | tools                                                       | model   | turns | isolation | returns                                            |
|---------------|----------------------|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|---------|-------|-----------|----------------------------------------------------|
| spec-builder  | idea to spec         | intention or draft, template, schema, run log, explorer returns, judge and attacker output | repository source files other than the template, schema and run log its dispatch names; prior specs; history | Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion | fable   | —     | —         | handoff block                                      |
| spec-judge    | spec review          | the rubric, the draft                                                                      | everything else                                                                                              | Read                                                        | fable   | —     | —         | verdict sheet (markdown)                           |
| spec-attacker | spec review          | the draft, the project                                                                     | everything else                                                                                              | Read, Grep, Glob                                            | fable   | —     | —         | finding lines, or `no findings`                    |
| explorer      | any stage            | the codebase, one question                                                                 | —                                                                                                            | Read, Grep, Glob, Bash                                      | haiku   | 12    | —         | explorer-return                                    |
| test-builder  | targets              | frozen spec, fixture, codebase, the testing manuals at `flightdeck/manuals/testing/`       | plan, implementation, interview                                                                              | Read, Grep, Glob, Bash, Write, Edit                         | opus    | 40    | —         | map path, checks, unverified, spec_findings        |
| planner       | plan                 | spec, tests-map, run log, this roster, explorer returns                                    | worker transcripts                                                                                           | Read, Grep, Glob, Bash, Agent                               | fable   | 30    | —         | plan.json content                                  |
| orchestrator  | whole run            | kickoff, spec, map, plan, returns, prior reports                                           | worker transcripts, interview, critic reasoning                                                              | Read, Grep, Glob, Bash, Agent                               | inherit | —     | —         | conducts; every file it produces goes through `fc` |
| implementer   | contracts, implement | the one dispatch `fc worker render` produced for its unit                                  | other units, the whole plan, the kickoff                                                                     | Read, Grep, Glob, Bash, Write, Edit                         | opus    | 25    | worktree  | worker-return                                      |
| verifier      | verify               | evidence, map, merged branch                                                               | implementer reasoning, stored returns                                                                        | Read, Grep, Glob, Bash                                      | sonnet  | 15    | —         | verifier-verdict                                   |
| critic        | review               | spec at commit, diff since lock, evidence                                                  | plan, kickoff, reasoning, prior findings                                                                     | Read, Grep, Glob, Bash                                      | fable   | 20    | —         | critic-findings                                    |

The implementer is the only role given worktree isolation, and it carries `permissionMode: acceptEdits`, as does the test-builder. The orchestrator carries an `initialPrompt` and holds no `Write` or `Edit`: it writes through `fc plan write`, `fc launch note` and `fc return`.

## Fixed paths a dispatcher passes to a spec session

The spec-stage roles read no manual at session time — their conventions are encoded in their definitions. Paths are repository-relative. Required:

- template, to spec-builder: `flightdeck/flightcrew/templates/spec.template.json`
- schema, to spec-builder: `flightdeck/flightcrew/schemas/spec.schema.json`
- rubric, to spec-judge: `flightdeck/manuals/rubrics/spec/spec-readiness-rubric.md`
- validator, run by spec-builder: `flightdeck/flightcrew/checks/validators/validate-spec.mjs`
- linter, run by spec-builder: `flightdeck/flightcrew/checks/validators/spec-readiness-lint.mjs`
- canonical spec folder, to spec-builder: `flightdeck/launch/specs/<spec-name>/`, where `<spec-name>` is the spec's `name` field, naming the folder created at the first freeze

Optional:

- run log, to spec-builder: `flightdeck/launch/RUNLOG.md`

The canonical folder is where the spec lives across runs, and no run edits the spec file it holds: a launch is given a pinned copy, and the spec-builder's interview subdirectory `interview/` inside that folder is never copied into one.

The run-chain roles receive their paths from the launch's kickoff header block (`flightdeck/launch/<L>/kickoff.md`), which names the launch folder, the pinned spec, the pinned tests map, the run log and the evidence page; every other run-chain input is rendered into the dispatch itself.

## What is not a role

Report assembly is a command, not a role: `fc launch end` renders `report.md` and `evidence.html`, and the SessionEnd hook refreshes them. No report states an acceptance verdict. The outcome given to `fc launch end` is the human's decision.
