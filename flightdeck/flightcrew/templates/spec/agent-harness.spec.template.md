# Agent-shaped work spec — [artefact name]

Status: draft

## Intent

What this agent, skill, prompt, hook or instruction file is for, which role invokes it and in which stage of a run, and what a run looks like without it. The result's output will be produced by a model rather than computed by code, so the picture of success is an outcome observed across runs — "workers return the contract complete in the stated fraction of dispatches" — not a single correct answer. Keep it short enough to hold in mind while every behaviour and every judged verdict is weighed against it.

## Scope

The harness files this work may create or change, named exactly, and the files it must not: other roles' documents, the crew manifest, shared hooks, the project's standing instructions. State which deliverables ship with the artefact — its scenario set, its checks, its calibration examples — and which are deferred. Draw the line around behaviour too: what this artefact is responsible for producing, and what it must leave to the role that invokes it or the role it hands off to.

## Constraints

The conditions the artefact must satisfy regardless of how it is written: the tool allowlist and denylist, the model tier, the isolation it runs under, the turn, iteration and spend ceilings, the file-format and frontmatter rules of the harness, the length limit on the document itself, and any wording the harness forbids. Each is a limit with a number or a rule with a check, and each becomes a deterministic check by name in verification.

## Interfaces and contracts

The seams through which the artefact meets the harness and the roles around it, stated exactly: the frontmatter fields and their permitted values; the parameters the invoker supplies and their shapes; the return contract the artefact must produce, field by field; the files it reads and writes and their formats; the hooks it responds to and the events it emits. Reuse the names the crew manifest and the existing harness already use — a parallel name for an existing thing is the classic failure here.

## Behaviours

The numbered, observable outcomes the artefact produces, each written in its natural form with its tolerance stated, and each carrying exactly one check class tag — deterministic, property, statistical or judged — naming the cheapest method that can falsify it. The tag adapts to the behaviour; the behaviour is never reworded to earn a cheaper tag. Typical entries: the return contract validates against its schema on every dispatch [deterministic]; the return names every check it was given, with an exit code each [property]; on the fixed scenario set the worker stops at the iteration ceiling rather than loosening an assertion, in at least k of N runs [statistical]; the one-sentence diagnosis identifies the actual cause of the prior failure [judged]. A behaviour with no tag is an open question.

## Edge cases and failure modes

The outcomes at the boundaries, each tagged like a behaviour: a malformed or missing parameter; a referenced file absent; the model refusing the task; the turn or spend ceiling reached mid-unit; a forbidden tool attempted; the same dispatch arriving twice; an interruption before the return is written. State the exact return for each. Many boundary outcomes are trajectory invariants — facts that must hold over the path the agent took, such as permission sought before the irreversible step or the forbidden tool never called — and those are checked deterministically on the transcript, never by comparison to a recorded ideal run.

## Prior decisions and non-goals

What is already settled: the crew conventions the artefact inherits, the existing roles and templates it reuses rather than duplicates, model-tier choices already made, and lessons from earlier runs of this role. The non-goals: the artefact does not absorb responsibilities of neighbouring roles, and the spec does not pursue the eight named anti-patterns — determinism by deformation, the judge as escape hatch, grading the self-report, the shared room, scores instead of answers, the uncited verdict, the lucky sample, the golden trajectory — each of which, if it appears in a draft, is a finding against the draft.

## Verification

Checks built per class, each named after the behaviour and edge-case ids it covers. Deterministic checks examine the harness and its records — frontmatter validates, hooks fired, the forbidden tool was blocked, no file outside the boundary changed, the transcript contains or lacks a stated event — and read as exit codes. Property checks examine the model's output for required content without demanding its form and read as an exit code naming the missing property. Statistical checks run a scenario set — the fixed starting prompts and context, versioned with this spec and listed here — N times and read as a ratio against the declared k. Judged checks send the transcript or artefact to a judge, an isolated grader that shares no context with the producer, answers binary rubric questions derived from the numbered behaviours, and cites the lines each verdict rests on; the rubric and its calibration examples, graded by a human beforehand, are listed here. A deterministic check is never
dropped because a judge exists, and the end-to-end proof is one scenario run through the whole harness with every class of check applied to its record.

## Definition of done

Every deterministic and property check green, as exit codes; every statistical threshold met on the versioned scenario set, as ratios; every judged rubric passed, as verdict sheets with cited evidence; one full transcript, chosen by the reviewer and not the producer, read by a human with no finding; nothing outside the scope perimeter changed; the artefact, its scenario set, its checks and its calibration examples delivered at the constrained locations. Nothing appears here for the first time.

## Open Questions

Empty at the freeze. Until then, every question the author deferred, every finding the attacker filed, and every behaviour still without a check class tag, verbatim, each phrased as a decision with options.
