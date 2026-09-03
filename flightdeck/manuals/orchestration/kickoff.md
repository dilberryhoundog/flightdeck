# The kickoff

`launch/<L>/kickoff.md` is the document the orchestrator wakes up to: its standing instructions for how to conduct a run of this shape. It is rendered by `fc launch kickoff` (called by `fc launch new` and `fc launch pin tests-map`) from the library under `flightcrew/templates/kickoff/`, never hand-edited, and read by the orchestrator only. Everything that defines correctness stays in the spec. Read by the human at stage 3 before starting the orchestrator; the orchestrator reads the rendered file itself, not this manual.

## The routing test

| document | read by | answers |
|---|---|---|
| the project constitution (CLAUDE.md, with `flightcrew/templates/constitution-fragment.md` merged in) | every session and every worker | how the project always works |
| `kickoff.md` | the orchestrator only | how to conduct a run of this shape |
| the pinned spec `launch/<L>/specs/<S>/spec.vN.json` | orchestrator, test-builder, implementer (its unit's nodes), verifier, critic | what must be true |
| `plan.json` / `plan.md` | orchestrator, human at G1; a worker receives its own unit only, through `fc worker render` | how this run is cut, in what waves, at what cost |

- The test for any line about to be written: who must obey it? Everyone: the constitution. The judges of correctness: the spec. Only the conductor: the kickoff. This run only: the plan, or the dispatch itself.
- A correctness line that exists only in the kickoff is invisible to the verifier and the critic, because neither ever sees the kickoff.
- A conduct line in a worker's dispatch is bloat that competes with the lines that bind; `fc worker render` never copies kickoff text.
- Anything already in the constitution is not repeated in the kickoff; one home per rule.

## The library

- Parts: `base.md`, one `shape-*.md` (`session`, `workflow`, `sessions`), one `task-*.md` (`feature`, `migration`, `audit`, `agent`); assembling a kickoff is picking one of each.
- Named on the command line as `fc launch new <spec> --kickoff base+shape-<s>+task-<t>`; the default is `base+shape-session+task-feature`; `fc launch kickoff --parts …` re-renders with a different choice.
- `shape-session` is the default; `shape-workflow` is chosen only when a wave holds more units than `implementers_concurrent`; `shape-sessions` when a stream of units needs its own context window for hours; in every shape the orchestrator session, the gates, the `fc` commands and the stored returns are identical.
- Each part's first line is `<!-- version: N -->`; the assembled kickoff version is the `+`-joined list of `part@version` (for example `base@1+shape-session@1+task-feature@1`), recorded in `launch.json.kickoff.version`, in `plan.kickoff_version` and in the run-log entry.
- A conduct change is an edit to a part with its version bumped, then `fc launch kickoff`; the rendered file is never edited directly.
- Every correction a human used to make live is a candidate line in a part; the pruning question for every existing line is whether removing it would cause a mistake, or whether a hook now enforces it better than prose.
- A healthy library shrinks in prose as the harness grows in enforcement: correctness lines migrate to the spec template, universal lines to the constitution, enforceable lines to hooks.
- `flightcrew/templates/kickoff/README.md` carries the rules a part must satisfy.

## Anatomy

Eight parts, in an order chosen so that mission and pointers anchor the run, escalation survives a filling context, and prohibitions read as the last word.

| # | part | in flightdeck | what it carries |
|---|---|---|---|
| 1 | mission and pointers | the header block, rendered from `launch.json` | launch path; spec path @ commit or `draft`; tests-map path @ commit or `(none)`; kickoff version; read first: `flightdeck/launch/RUNLOG.md`; prior reports for the same spec or `none`; write plan with `fc plan write`; evidence path |
| 2 | conduct sequence | `base.md` `## Conduct` | the phases in order with the halting gate after each, as numbered steps naming `fc` commands |
| 3 | escalation rules | `base.md` `## Escalate` | the findings that halt the run for a human: spec gap or contradiction, wrong or unsatisfiable locked check, fired abandon trigger, blocked action, reached ceiling; `fc launch escalate <kind> --detail "…"`, then end the turn and propose nothing else |
| 4 | roles and dispatch | `base.md` `## Roles` | each crew agent in backticks, what it receives and what it must not; dispatch caps as defaults the plan may tighten and never loosen |
| 5 | communication | `base.md` `## Communication` | summaries up, never transcripts; returns in their declared shape through `fc return`; raw check output in the evidence, never paraphrased; the evidence page path and when it updates |
| 6 | budgets and stops | `base.md` `## Budgets` | the ceilings live in `launch.json`; the plan states expected cost inside them; exceeding a ceiling is an escalation |
| 7 | output requirements | `base.md` `## Outputs` | one branch per unit `<L>/<unit name>`, every return stored, the evidence page current, `report.md` by `fc launch end`, the run-log stub |
| 8 | prohibitions | `base.md` `## Never` | short and absolute, each with its enforcement twin named beside it |
| — | shape | `shape-<s>.md` | dispatch mechanism, what counts as progress, how the run stops |
| — | task | `task-<t>.md` | how units are cut for this kind of work, what wave 0 owes, the risks worth naming |

- Pointers, not copies: the orchestrator reads the spec from disk so there is exactly one version of the truth.
- Every Never has an enforcement twin: the lock-guard and boundary-guard hooks, `fc locked`, `fc boundary`, the trigger rules in `fc`, `fc launch escalate` as the only route out of a spec conflict.

## Assembly and validation

- `fc launch new` renders the header from the fresh launch, with `tests-map: (none)` and `prior reports:` listing every `launch/*/report.md` whose `launch.json.spec.name` matches, or `none`.
- `fc launch pin tests-map <map>` re-renders so the header carries the map path and commit.
- `fc validate kickoff [path]` exits 2 naming the pointer when a header path does not exist, when the spec commit is neither a 7 to 40 character hex hash nor `draft` under `allow_draft`, when a prior-reports path does not resolve, or when a backticked name under `## Roles` has no `flightcrew/crew/<name>.md`; `tests-map: (none)` is accepted while no map is pinned.
- `fc launch phase plan` refuses while `fc validate kickoff` exits non-zero, so a stale pointer never reaches an orchestrator.

## Writing a part

- Point, never paste: reference files by path and let the orchestrator read them.
- Imperative, specific, sequenced: numbered steps, named commands, named paths; "verify thoroughly" instructs nothing, "run `fc verify` and read the evidence page" instructs one behaviour.
- One home per rule; duplication is two copies to keep synchronised.
- Emphasis is a budget: mark the one or two absolute lines (the halt at each gate earns it); if many lines shout, none does.
- Make halting the marked behaviour: write the halt as its own instruction at each gate; the stop gate and `fc launch gate` back the critical ones.
- Say what to do, not only what not to: the Never list is short and absolute, everywhere else positive instruction names the behaviour wanted.
- Write for the tired orchestrator: front-load mission, gates and escalation, because they must survive compaction.
- Version the change, one change per run where possible, so the run log can attribute the next run's behaviour to it.
- Test a kickoff change the way a constitution change is tested: by whether behaviour shifts on the next run, not by rereading the prose.

## Before sending it

- Every pointer resolves: spec path and commit, tests-map, run log, agent names, evidence path, commands (`fc validate kickoff` exits 0).
- Every line passes the routing test: conduct only; nothing the spec, the plan or the constitution already owns.
- Each gate says what is presented and that the run halts.
- The escalation list covers spec gaps, wrong-check claims, fired triggers, blocked actions and reached ceilings.
- Dispatch rules state what each role receives and what it must not.
- Every Never has an enforcement twin, or a note that it deliberately does not.
- The version is bumped and will be recorded in the plan and the run log.
- It is shorter than the last version, or the reason it is not is written down.

## Anti-patterns

- The everything-document: spec, plan and kickoff merged into one prompt; nothing can be frozen, versioned or routed separately.
- The pasted library: every part thrown at every run; the run obeys the average of the library instead of the rules that bind this shape.
- Correctness smuggled into conduct: a "done means" line only the orchestrator sees.
- The silent kickoff: no escalation section; the orchestrator meets a spec gap and improvises confidently.
- Prose where a hook belongs: "never edit tests" as a sentence with Edit access intact.
- The constitution's twin: half the project constitution repeated and drifting.
- The stale pointer: paths, agent names or commands that no longer exist; kickoff review belongs in the same pass as roster review.
- Gates as suggestions: "check in at sensible points"; gates are named, placed and halting.
