# Testing Conventions

These conventions govern every check in the project — every executable verification that returns a pass or fail. They are the companion to the spec conventions and share their form: one rule per line, each binding a named party, each answerable yes or no about any given check, suite or gate.

## Schema

- A check belongs to a spec, and its files live in a directory named for that spec.
- Every check names the `B`, `E` or `C` entries it proves, and the name survives refactors.
- The mapping runs both ways — from any spec ID to its checks, and from any check to its IDs — without reading code.
- Fixtures and golden outputs are committed beside the checks that use them.
- Every spec's check set contains at least one end-to-end proof that exercises the result the way its user would.
- Unit passes alone never gate acceptance; the end-to-end proof does.
- One check proves one thing; a check that proves two is split.
- The command that runs a spec's checks is written in that spec's Verification domain, exactly.
- Quarantined checks live in one named place, visibly outside the gate.

## Check shape conventions

- A check returns something the agent reads inside the loop: an exit code, a summary line, a diff.
- Terse on success — silence or one line; specific on failure — the failing case and where.
- Deterministic: same input, same verdict, every time.
- Fast enough to run at every iteration; a check too slow for the loop is declared a gate-only check and runs there.
- Traceable: every verdict cites the spec IDs it speaks for.
- Lockable: nothing about a check can be changed by the work it judges.
- A check that flakes is quarantined the day it flakes; a flaky gate is worse than no gate, because it looks like one.

## Human conventions

- Humans freeze the targets; no run starts against an unfrozen check set.
- Review the checks with the care given to code: a wrong target is worse than a wrong implementation, because everything downstream aligns to it.
- Updating a golden output or fixture is a human decision, made between runs, committed with its reason.
- Quarantining a check, and restoring one, are human decisions, logged.
- Read raw output at the gate, never a summary of it.
- Read the unverified list first, not last.
- When a check and the spec disagree, fix the spec, then the check, then re-freeze — in that order.
- Accept no narrative in place of a verdict, however convincing.

## Agent building conventions

- The test-writer works from the frozen spec and nothing else; it never sees the implementation, its plan, or the interview.
- Write the checks before the work exists; a check written after describes what was built, not what was wanted.
- Derive at least one check from every `B` and `E`; where none can be derived, report the ID as untestable rather than approximate it.
- Spec imprecision discovered while writing a check is reported against the spec, never absorbed into the check.
- Assert outcomes, not internals: a check that knows how the result works breaks when the how changes and proves nothing while it doesn't.
- Prefer the spec's own examples as fixtures.
- A golden output is generated once, inspected by a human, then committed as a target.
- Building ends when the mapping is complete and the unverified list is written; the checks freeze with the spec.

## Agent run conventions

- Check files, fixtures and goldens are read-only to implementing agents, enforced by hook rather than instruction.
- The run's floor is a deterministic gate on the end-to-end proof; nothing ends while it fails.
- Fix causes, never symptoms: no skips, no suppressions, no loosened assertions, no mocking around the hard part.
- A check that contradicts the spec or cannot be satisfied halts the run at the finding for a human; no agent resolves it in either direction.
- Iterate on a failing check; on a stall, report the stall rather than work around the check.
- Run the named commands exactly as written; a variant is a finding, not an initiative.
- Structural checks run at every edit; behavioural checks at every gate.
- A verdict is final within the run; disputing one is halting material, not negotiating material.

## Evidence conventions

- Every verdict reaches the gate as four things: the exact command, the exit code, the raw output lines, and the commit it ran against.
- Coverage is shown as a list of IDs with checks and IDs without — never as a percentage.
- What was not checked stands as prominently as what passed: unverified IDs, quarantined checks, skipped suites.
- Any change to a check file, fixture or golden during the run appears on the display, whatever caused it.
- Cost sits beside correctness: iterations against the gate, agents spawned, spend.
- Artefact checks attach the artefact or its diff, not a description of it.
- A summary may sit above raw output, never instead of it.
- "Tested thoroughly" and its relatives are not evidence and are not admitted.

## Testing hygiene conventions

- A check invoked by hand after every change has earned a permanent home: embed it, chain it, or hook it.
- Promotion mirrors the spec's: a check every spec needs graduates to a hook or a constitution-level command, and leaves individual specs.
- Quarantine is a waiting room, not a graveyard: every quarantined check carries a date, and either returns or is retired.
- Retire checks with the behaviour they prove; an orphaned check is deleted with a note, never left passing over nothing.
- A changed golden is a new freeze: a new commit with a stated reason.
- Speed is budgeted deliberately: gate checks may be slow, loop checks may not.
- A check that keeps missing what review later finds is a verification-axis entry in the run log, and the suite changes before the next run.

## What a check is not

- Not review: a check proves stated behaviours; judgement of intent, scope and taste belongs to the critic.
- Not observability: displays inform the human, checks bind the run — a result only a human can interpret is a display.
- Not a coverage percentage: coverage here is two lists, covered IDs and uncovered ones; a number says nothing about either.
- Not documentation: a check proves the target; it owes no explanation to future readers.
- Not a style opinion: conventions belong to hooks and linters; a check that fails on taste is shelved in the wrong place.
- Not proof of intent: every check can pass while the work is the wrong work; that question is answered against Intent, by people.
