# The Seven Classes of Check

A check is any executable verification: a thing that runs, examines a result, and returns a verdict no one has to interpret. Checks are how work holds itself accountable in its author's absence, and they come in seven classes, distinguished not by the tools that implement them but by what kind of claim each one is able to prove.

This document maps that territory. The seven classes answer *what a check proves*; the three verdicts answer *what a check returns*; the gating ladder answers *how hard a check stops work*; and the placements answer *where a check lives*. A spec's verification is designed by walking these four questions in order, and the document closes with the order in which the answers are usually assembled.

## Invariants

- Every check returns exactly one of the three verdicts: an exit code, a ratio, or a verdict sheet.
- A gate reads only those three signals; anything else on offer is display, not verification.
- A judged verdict never gates alone; it stands on the deterministic and statistical verdicts beneath it.
- Every statistical scenario set includes at least one control, where the behaviour must not fire.
- A verdict sheet is schema-checked before its content is trusted.
- Wherever probes run, one transcript — chosen at the gate, not by the builder — is read by a human.

## Structural

Structural checks prove that a result is coherent: that it parses, compiles, resolves and holds together as a made thing. They ask nothing about what the result is for.

**In this class:** type checks; the build and its exit code; linters and formatters; import and dependency resolution; schema compilation; for an agent-shaped artefact, the frontmatter parsing and file layout its runtime requires; for a document, that it renders at all.

**What makes it unique:** it is the only class that knows nothing about the task — the same structural checks run whatever the spec says, on this work and the next. That ignorance is its value: it is the cheapest class, the fastest, and the first to fail when something has drifted, which is why it runs earliest and most often.

**How it interacts:** it is the floor of every gate and the natural resident of hooks, firing on every edit without being asked. When it fails, nothing in any other class is worth running yet; when workers build in parallel, it is the first line that catches their seams pulling apart.

## Behavioural

Behavioural checks prove that the result does what was asked, one stated claim at a time. Each exists because a sentence somewhere says the result must behave a certain way, and each answers for exactly that sentence.

**In this class:** unit tests over enumerable inputs; contract tests on agreed seams; the end-to-end acceptance proof that exercises the result the way its user would; reproduction tests that capture a reported failure before it is fixed; for an agent-shaped artefact, deterministic reads of a probe's record — the skill loaded, the forbidden tool untouched, the turn budget held.

**What makes it unique:** it is the only class derived entry-by-entry from the spec — its members carry the spec's own numbering, and its size is the spec's size. No other class can say, of any single stated requirement, "this one holds"; behavioural checks are that sentence-level accountability, which is why coverage of a spec is counted in them.

**How it interacts:** each check is born from a `B` or `E` entry and cites it for life; contract tests guard what the interfaces domain fixed; and the class's end-to-end member is the one check the whole apparatus converges on — the deterministic gate at the bottom of every unattended run.

## Artefact

Artefact checks prove that an output matches a known-good thing, byte for byte or difference by difference. The reference object carries the whole meaning of correct.

**In this class:** golden-output diffs for generated files, reports and transforms; screenshot comparison for anything seen; schema validation of structured outputs at handoffs; render checks for documents and pages; the verdict-sheet schema check that guards a judge's output before anyone reads it.

**What makes it unique:** it is the only class whose assertion is a thing rather than a statement. Every other class encodes correctness as a rule; this one encodes it as an object, which means creating or updating the reference is an act of authorship — a human decision with a reason — and the check itself is reduced to the one operation that cannot be argued with: comparison.

**How it interacts:** its references are frozen by humans and locked like every target; it stands guard at the seams between agents, where structure must survive a handoff; and it lends the judged class its trustworthiness, since a verdict sheet is only admitted after an artefact check has passed it.

## Invariant

Invariant checks prove that a property holds everywhere, not merely in the cases anyone thought to list. They speak about a space of inputs and states, and their subject is the word *always*.

**In this class:** property-based and fuzz tests that generate inputs against a stated law; runtime assertions that bound live state; performance budgets over time, size and count; static analysis and security scanning for whole classes of defect; resource ceilings — memory, spend, turns — that must hold however the work is exercised.

**What makes it unique:** it is the only class quantified over its subject rather than enumerated. A behavioural check says "for this input, this output"; an invariant check says "for all inputs, this property," and so it is the sole class that can catch the case nobody imagined — which is precisely the case that enumeration, by definition, misses.

**How it interacts:** it takes over where behavioural enumeration runs out, and it is where measurable constraints from the spec become executable — a ceiling written in the constraints domain usually lands here as a budget. Its members are often slower, so they cluster at gates rather than in the loop.

## Project rules

Project-rule checks prove the things only this project cares about: the local laws that no general-purpose tool has ever heard of. Each one exists because someone here decided it must, usually after learning why the hard way.

**In this class:** custom deterministic rules — a migration never drops a column without a backfill, an error log always carries the request ID and never the payload; the diff boundary that keeps a change inside its declared paths; licence and header sweeps; spec-validation passes; naming and layout laws particular to this repository or this team's documents.

**What makes it unique:** it is the only class authored from accumulated judgement rather than from the work in front of it. Every other class can be derived from the spec or the artefact; this one is the project's memory made executable — the corrections a veteran kept making by hand until someone wrote them down as a rule that fires without them.

**How it interacts:** its members are the natural graduates of the run log — a correction that recurs becomes a rule, a rule that recurs across specs becomes a hook — and the diff boundary among them is scope's perimeter given teeth. It is the class that grows as a project ages, and the reason old projects catch what new ones cannot.

## Statistical

Statistical checks prove a tendency: that a behaviour occurs often enough, across repeated trials, to be relied on. They exist for results that are exercised rather than computed, where the same starting point can legitimately end differently.

**In this class:** scenario runs repeated N times against a fixture, with the passing ratio gated on a threshold declared in advance; control scenarios where the behaviour must *not* fire, run to the same discipline; the probes that do the exercising and the records they leave behind; the declared N, threshold and concurrency cap that make each scenario a defined experiment rather than an anecdote.

**What makes it unique:** it is the only class where a single run proves nothing. Every other class treats one execution as one verdict; here the unit of evidence is the distribution, and the check's parameters — how many trials, what ratio suffices — are themselves decisions that must be written before the first trial runs. It is also the class most directly coupled to budget: every trial spends real money, which is why its scenario sets are kept brutally small and every scenario must earn its place.

**How it interacts:** its probes manufacture the records that behavioural checks read deterministically and the judged class scores; its ratios are the second of the three signals a gate admits; and it is the class that makes agent-shaped artefacts checkable at all, since their behaviour exists only when a model exercises them.

## Judged

Judged checks prove qualities that no procedure can compute: whether a response was helpful, a tone held, an explanation landed. A fresh model reads the evidence against a written instrument and renders a scored verdict.

**In this class:** the rubric and its question set; the calibration examples the rubric was tuned on, pre-graded so the judge's alignment can itself be measured; the judge — a fresh context, preferably a different model, that never shares the builder's context; the verdict sheet in its fixed schema, with quotations required so every score points at its evidence; the sampled human read of a transcript the builder did not choose.

**What makes it unique:** it is the only class whose verdict is itself a model's output — and therefore the only class that must be checked before it can check anything. Its instrument is calibrated against pre-graded examples, its sheet is validated mechanically, its quotations are demanded so scores cannot float free of evidence, and even then it is used last: a quality that any lower class can express belongs to that class, and judged membership is reserved for what genuinely cannot be said as a rule, a reference or a ratio.

**How it interacts:** it reads the records the statistical class manufactures and returns the third of the gate's three signals; the artefact class validates its sheet before anyone trusts it; and it never gates alone — it rides on top of green deterministic and statistical verdicts, answering only the question they cannot. It is also this apparatus's border with independent review: the critic judges against the whole spec with an open mandate, while a judged check scores fixed questions with a fixed instrument, and keeping that line sharp is what keeps both useful.

## The three verdicts

Whatever its class, a check returns one of three signals, and a gate reads nothing else.

**The exit code** — the deterministic verdict: pass or fail, with no third state. Spoken by the structural, behavioural, artefact, invariant and project-rule classes. Its law is finality: an exit code cannot be argued with, only investigated.

**The ratio** — the statistical verdict: successes over trials, read against a threshold declared before any trial ran. Spoken by the statistical class alone. Its law is pre-commitment: a threshold set after the results are known is not a threshold.

**The verdict sheet** — the judged verdict: fixed questions, scored answers, mandatory quotations, in a schema a machine validates first. Spoken by the judged class alone. Its law is evidence: a score that cannot point to the line it scored does not count.

## The gating ladder

The same check can bind work loosely or absolutely; the ladder is the set of grips, each trading more setup for less reliance on anyone remembering.

1. **In the prompt** — the check is asked for. It runs if the agent remembers, which under pressure it may not.
2. **As a goal** — the check is a standing condition, re-evaluated after every turn until it resolves or the session is stopped for stalling.
3. **As a deterministic gate** — the check runs as a script that blocks completion until it passes; a run that blocks repeatedly has a problem the check cannot fix, and that repetition is itself a stall signal worth halting on.
4. **By a second opinion** — a fresh context attempts to refute the passing result. This rung sits on the gate, never in place of it, and is where verification hands over to review.

The floor for any unattended run is the third rung, applied to the spec's end-to-end proof.

## The four placements

A check also has an address — who causes it to run — and checks migrate through four of them as they prove their worth.

**Standalone** — invoked deliberately, when wanted: right for cross-cutting sweeps that do not apply to every change. **Embedded** — run automatically by the workflow that produces the thing it checks, so the producer cannot forget it. **Chained** — invoked by another check's completion, so a sequence of verifications runs as one contract. **Enforced** — fired by the machinery itself, hooks on every edit and CI on every change, with no author diligence involved at all.

The promotion signal is repetition: a check being invoked by hand after every change has earned the next address along.

## Order of assembly

1. **Structural** — first and enforced, before any task-specific check exists, because nothing else is worth running against an incoherent result.
2. **Behavioural** — with the spec's freeze, derived entry by entry from its IDs, the end-to-end proof among them; these are the checks the spec's verification domain names.
3. **Project rules · Artefact** — in unison, as the work's outputs and the project's history justify them: the diff boundary and local laws on one side, the frozen references on the other.
4. **Invariant** — where enumeration has visibly run out, and wherever a constraint stated a number.
5. **Statistical · Judged** — in unison and only when the artefact is agent-shaped, because the judge exists to read what the probes record, and neither means anything alone.

As with the spec, the order is a dependency order rather than a procedure: a judged finding routinely sends its author back to sharpen a behavioural check, and a statistical scenario often reveals a missing control the moment it first runs. What the order forbids is the skip upward — judging what was never probed, probing what was never proven coherent, or gating anything on a signal that is not one of the three.
