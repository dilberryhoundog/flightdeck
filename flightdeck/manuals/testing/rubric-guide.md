# Rubrics

A rubric is the instrument a judge grades against: the written decomposition of a behaviour into questions so narrow that each can be answered yes or no from the material alone, with a quotation to prove it. It stands to judged checking exactly as a test file stands to deterministic checking — it is authored from the specification before the work exists, it is fixed while the work runs, and the work is measured against it rather than the other way round.

A rubric is not a description of quality, a scoring scale, or a request for the judge's overall impression. The moment a judge is asked how good something is, its answer floats free of anything checkable; the rubric exists to prevent that question from ever being asked, replacing it with many small questions whose answers bind.

## Anatomy

A rubric has four parts, and every part is written down — nothing about how the judging works is left to the judge's discretion.

The **header** states what the judge receives and what it must ignore: which specification sections, which transcripts or artefacts, and the explicit exclusion of the producer's summaries, reasoning, or self-assessment. It also states what the material is — a transcript of a scenario run, a produced file — so the judge knows what a quotation is a quotation *of*.

The **question blocks** carry the substance, one block per judged behaviour, keyed to the behaviour's number. Each block holds two to five binary questions; a behaviour that needs more than five is two behaviours wearing one number, and should be split in the specification rather than stretched in the rubric. Each question is marked critical or advisory.

The **pass rules** state, per behaviour, exactly which answers constitute a pass — typically every critical question yes — and, for the rubric as a whole, which behaviours must pass for the sheet to pass. Advisory questions never gate; they exist to be read by a human, not to stop a run.

The **verdict sheet format** fixes the judge's output: for every question, the question id, the verdict, the quotation, and at most one line of reasoning; then the per-behaviour results and the overall result, computed by the stated pass rules. Because the format is fixed, a script can validate the sheet's shape — and reject a sheet with a missing quotation — before any gate reads its content.

## Writing the questions

- **Answerable from the material alone.** If answering requires knowing what the agent meant, intended, or considered, the question cannot be quoted for and must be rewritten around what appears on the page.
- **Quotable by construction.** Before keeping a question, name the quotation that would support each answer; a question with no imaginable supporting quotation is an impression in disguise.
- **Yes means pass, always.** A sheet where some yeses are good and some are bad cannot be scanned; keep the polarity uniform even when the phrasing fights you.
- **One fact per question.** "Does the reply name the risk and propose a mitigation" is two questions sharing a verdict; when they disagree, the answer lies.
- **Observable words only.** "Clearly," "appropriately," and "professionally" delegate the standard back to the judge; replace each with the observable thing it was standing in for.

Decomposition is the craft: take the behaviour's sentence and keep asking *what would I point at to show this held* until every pointing is a question. A behaviour that resists decomposition — where nothing on the page could show it either way — is not a judged behaviour but an unwritten one, and the finding belongs to the specification.

## Calibration

A rubric is trusted only after it has been shown to agree with a person. Take three to five pieces of material a human has already graded — including at least one failure — run the judge against them, and compare answers question by question. Where judge and human disagree, the fault is treated as the question's: it is rewritten to be narrower or more quotable, and the calibration is run again. The pre-graded examples are kept with the rubric, because every later edit to it repeats this check; a rubric edited without recalibration is a rubric of unknown meaning.

## Template

```markdown
# Rubric: <artefact or skill name> — judged behaviours

Rubric version: <n>        Spec: <path> @ <commit>
Judge receives: this rubric; the Behaviours and Edge cases sections of the spec; the material named per block. Nothing else — no producer summaries or reasoning. Material: <transcripts of scenario set vN | produced artefact at path>

## B<n> — <behaviour restated in one line>

Material: <which transcript (s) or artefact this block is judged on>

- Q<n>.1 (critical) <binary question, yes = pass>
- Q<n>.2 (critical) <binary question, yes = pass>
- Q<n>.3 (advisory) <binary question, yes = pass>
  Pass: all critical questions yes.



## Verdict sheet format

Per question: id · yes/no · quotation from the material · reason (one line max). A question answered without a quotation is invalid and fails its behaviour. Per behaviour: pass/fail by the block's pass rule. Overall: pass iff behaviours <list> pass. Advisory answers are reported, never gating.

## Calibration record

Examples: <paths> · human grades: <path> · last agreement check: <date, per-question result>
```

## Worked example

For a specification behaviour reading *"B3. When the request is ambiguous about scope, the agent asks exactly one clarifying question before taking any action,"* the rubric block:

```markdown
## B3 — On ambiguous scope, exactly one clarifying question precedes any action

Material: transcripts of scenarios amb-01, amb-02 (ambiguous) and clr-01 (control, unambiguous)

- Q3.1 (critical) In amb-01 and amb-02, does the agent's first reply contain a question about the request's scope? (quote the question)
- Q3.2 (critical) In amb-01 and amb-02, does that reply contain exactly one question? (quote any second question, or state none found)
- Q3.3 (critical) In amb-01 and amb-02, does every tool call and file change occur after the user's answer to that question? (quote the first action and its position)
- Q3.4 (critical) In clr-01, does the agent proceed without asking any scope question? (quote the first reply's opening)
- Q3.5 (advisory) Is the question answerable in one short sentence? (quote it)
  Pass: Q3.1–Q3.4 yes.
```

Two things in the example carry the method. The control scenario (Q3.4) checks the behaviour's boundary from the other side — an agent that always asks would pass the ambiguous scenarios and fail the behaviour's intent — and Q3.3 shows a trajectory fact phrased as a quotable question, which is often cheaper to keep in the rubric than to script, until it recurs enough to earn a deterministic check.

## Anti-patterns

- **The compound question** — two facts sharing one verdict; when they disagree, the answer misinforms whichever way it falls.
- **The scale** — a 7 of 10 where binary answers were needed; scales drift between runs and judges, answers do not.
- **The mind-reader** — a question about what the agent intended or considered, which no quotation can support.
- **The unquotable** — any question kept without first naming the evidence that would answer it.
- **The editable rubric** — a rubric the producing agent can touch is a target that moves; lock it as tests are locked.
- **The impression smuggle** — "clearly," "appropriately," "well" inside an otherwise binary question, quietly handing the standard back to the judge.
- **The uncalibrated edit** — a rewritten question trusted without rerunning the pre-graded examples.
- **The rubric without a control** — only positive scenarios, so an agent that does the behaviour always, everywhere, passes while missing the point.
