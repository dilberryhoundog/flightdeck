# The crew

One markdown file per role. Each file's frontmatter is its identity — `name`, `description`, `tools`, `model`, and the extras the role needs — and its body is the system prompt that role runs under. `fc distribute --apply` copies every file here that carries frontmatter to `<target>/agents/flightcrew/`; this README carries none, so it stays behind.

Roles divide into two chains. The spec chain (`spec-builder`, `spec-judge`, `spec-attacker`) turns an intention into a frozen spec. The run chain (`explorer`, `test-builder`, `planner`, `orchestrator`, `implementer`, `verifier`, `critic`) turns a frozen spec into a finished, proven build. A role reads only what its dispatch names; the "must not see" column is as binding as the "sees" column, because a role that reads the plan or another role's reasoning stops being an independent witness.

## Roster

| role | stage | sees | must not see | tools | model | turns | isolation | returns |
|---|---|---|---|---|---|---|---|---|
| spec-builder | idea to spec | intention or draft, template, schema, run log, explorer returns, judge and attacker output | repository files, prior specs, reference pages | Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion | fable | — | — | handoff block |
| spec-judge | spec review | the rubric, the draft | everything else | Read | fable | — | — | verdict sheet (markdown) |
| spec-attacker | spec review | the draft, the project | everything else | Read, Grep, Glob | fable | — | — | finding lines, or `no findings` |
| explorer | any stage | the codebase, one question | — | Read, Grep, Glob, Bash | haiku | 12 | — | explorer-return |
| test-builder | targets | frozen spec, fixture, codebase, testing manuals | plan, implementation, interview | Read, Grep, Glob, Bash, Write, Edit | opus | 40 | — | map path, checks, unverified, spec_findings |
| planner | plan | spec, tests-map, run log, this roster, explorer returns | worker transcripts | Read, Grep, Glob, Bash, Agent | fable | 30 | — | plan.json content |
| orchestrator | whole run | kickoff, spec, map, plan, returns, prior reports | worker transcripts, interview, critic reasoning | Read, Grep, Glob, Bash, Agent | inherit | — | — | conducts; every file it produces goes through `fc` |
| implementer | contracts, implement | one unit's dispatch | other units, the whole plan, the kickoff | Read, Grep, Glob, Bash, Write, Edit | opus | 25 | worktree | worker-return |
| verifier | verify | evidence, map, merged branch | implementer reasoning, stored returns | Read, Grep, Glob, Bash | sonnet | 15 | — | verifier-verdict |
| critic | review | spec at commit, diff since lock, evidence | plan, kickoff, reasoning, prior findings | Read, Grep, Glob, Bash | fable | 20 | — | critic-findings |

The implementer is the only role given worktree isolation, and it carries `permissionMode: acceptEdits`, as does the test-builder. The orchestrator carries an `initialPrompt` and holds no `Write` or `Edit`: it writes through `fc plan write`, `fc launch note` and `fc return`.

## Fixed paths a dispatcher passes to a spec session

The spec-stage roles read no manual at session time — their conventions are encoded in their definitions — but they cannot start without these. Paths are repository-relative.

- template: `flightdeck/flightcrew/templates/spec.template.json`
- schema: `flightdeck/flightcrew/schemas/spec.schema.json`
- rubric: `flightdeck/manuals/rubrics/spec/spec-readiness-rubric.md`
- validator: `flightdeck/flightcrew/checks/validators/validate-spec.mjs`
- linter: `flightdeck/flightcrew/checks/validators/spec-readiness-lint.mjs`
- run log: `flightdeck/launch/RUNLOG.md`
- canonical spec folder: `flightdeck/launch/specs/<spec-name>/`

The canonical folder is where the spec lives across runs. A launch holds a pinned copy of the spec, never the original, and `interview/` is never copied.

## What is not a role

Report assembly is a command, not a role. `fc launch end` renders `report.md` and `evidence.html`, and the SessionEnd hook refreshes them; no agent writes the report, and no report states an acceptance verdict. The outcome given to `fc launch end` is the human's decision.
