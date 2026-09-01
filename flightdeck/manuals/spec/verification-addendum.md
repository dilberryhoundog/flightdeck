# Verification Addendum: Agent-Shaped Work

This addendum governs verification when the result of the work is itself an agent, a skill, a prompt, or a harness behaviour — anything whose output is produced by a model rather than computed by code. For such work, demanding that every behaviour be provable by a deterministic red/green test is a category error: it does not make the work more testable, it deforms the specification, multiplying clauses until each behaviour is contorted into something a script could check while the actual intent leaks away.

The rule this addendum changes is therefore not *whether* every behaviour is checked — it is. The rule that changes is *how*: each behaviour is written in its natural form, as an observable outcome with stated tolerance, and is tagged with a check class declaring the cheapest method that can falsify it. Verification is then built per class, and a behaviour is never rewritten to move it into a cheaper class.

## Invariants

- Every behaviour carries exactly one check class tag; a behaviour with no tag is an open question.
- A behaviour is never reworded to qualify for a cheaper class; the tag adapts to the behaviour, not the reverse.
- Deterministic checks are never omitted because a judge exists; judges are reserved for questions of meaning.
- A single passing run of a stochastic behaviour is a sample, not a proof; only the declared threshold makes it green.
- A judge grades transcripts and artefacts, never the producing agent's account of them.
- A judge shares no context with the producer, answers binary questions rather than awarding scores, and every verdict cites the evidence it rests on.

## The four check classes

Every check on agent-shaped work falls into one of four classes, ordered from cheapest and most trustworthy to most expensive and most fallible. The order is also the order of preference: a behaviour takes the first class on the list that can genuinely falsify it.

### Deterministic

A script examines the harness or its records and exits pass or fail, identically every time. This class is larger than it first appears, because the harness is code and its records are data: that a hook fired, a forbidden tool was blocked, a skill loaded when invoked, output parsed against its schema, no file outside the boundary changed, no forbidden string appeared, an artefact exists where promised — all deterministic. So is much of *whether something happened*: the transcript and hook log can be searched for a tool call, an ordering, a phrase, even though the run that produced them was stochastic. Producing is random; checking the record of it often is not. Its result reads as an exit code.

### Property

A script examines the model's output for required properties without demanding an exact form. The reply names all three configured risks, in any words and any order; every link resolves; every citation matches a real source when looked up; the summary is under the stated length; the generated file opens without error. Property checks are the natural home of behaviours whose *content* is fixed but whose *expression* is free — which describes most well-written agent behaviours. Its result reads as an exit code with the missing property named.

### Statistical

A scenario is run N times and the behaviour must hold in at least k of them, with N, k, and the scenario fixed in the spec. This is the honest form of red/green for stochastic behaviour: what a deterministic mindset calls flakiness becomes the measurement itself, and a 3-of-5 is a finding, not noise. The scenario set — fixed starting prompts and context — is this class's fixture, versioned with the spec, and small: a handful of scenarios per important behaviour, because each run has a real cost. Its result reads as a ratio against a threshold.

### Judged

An isolated judge reads the transcript or artefact and grades it against a rubric derived from the numbered behaviours. This is the only class that can answer questions of meaning — was the explanation faithful, was the refusal appropriate, was the tone right — and it is deliberately last, taken only when no cheaper class can falsify the behaviour. Its reliability is manufactured, not assumed: the rubric decomposes each behaviour into binary questions; the judge receives only the specification and the material, never the producer's reasoning; every verdict must quote the lines it rests on, so an unsupported verdict is itself a failure; and the rubric is calibrated once against a few examples a human has already graded, so that its verdicts are known to track human judgement before they are trusted alone. Grading outcomes against a written rubric with a separate grader is an established pattern in agent tooling, not an improvisation. Its result reads as a per-question verdict sheet with
citations.

## Trajectory checks

The path an agent takes is checkable, but never by comparison to a recorded ideal: two good runs of the same scenario legitimately differ, so a golden trajectory fails good work and rewards imitation. Assert invariants over the path instead — a tool that must never be called was not called, permission was sought before the irreversible step, the search happened before the claim, the whole run fit inside the stated turn budget. Invariants of this kind are deterministic checks on the transcript, and they capture most of what a golden trajectory was ever wanted for.

## The definition of done, restated

The gate keeps its character — assembled, checkable in minutes, nothing new — but its conditions are stated per class. Done, for agent-shaped work, is:

- Every deterministic and property check green, as exit codes.
- Every statistical threshold met on the versioned scenario set, as ratios.
- Every judged rubric passed, as verdict sheets with cited evidence.
- One full transcript, chosen by the reviewer and not by the producer, read by a human.

The last condition is deliberate and small. The classes above remove the need for a human to check everything; none of them yet removes the value of a human reading one whole run with fresh eyes, because the failure a rubric cannot name is exactly the one a reader notices in a minute.

## Anti-patterns

- **Determinism by deformation** — rewriting behaviours until a script could check them, trading the spec's intent for its testability.
- **Judge as escape hatch** — routing everything to the judge because it accepts anything, leaving schema, boundary and transcript facts ungraded by the scripts that grade them better.
- **Grading the self-report** — a judge shown the producer's summary instead of the transcript, verifying the story rather than the work.
- **The shared room** — a judge that saw the producer's context or reasoning, and now confirms rather than examines.
- **Scores instead of answers** — a 7-out-of-10 where binary questions were needed; scores drift, answers bind.
- **The uncited verdict** — a pass or fail with no quoted evidence, which is a feeling in the shape of a check.
- **The lucky sample** — one green run of a stochastic behaviour presented as proof, with no declared N and threshold behind it.
- **The golden trajectory** — failing a good run for taking a different valid path than the recorded one.
