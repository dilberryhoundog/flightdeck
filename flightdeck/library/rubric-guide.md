---
shelf: library
sources:
  - flightdeck/rubric.md
  - flightdeck/templates/workshop/verify.md
  - flightdeck/agents/reviewer.md
checked: 2026-10-11
from: origin/cockpit:library/rubrics/rubric-guide.md (edited)
---

# Rubric guide

What a rubric is, how to write one that binds, and how FlightDeck uses it.

## What a rubric is

A rubric is the list a judge grades against. It breaks a behaviour into questions so narrow that each can be answered yes or no from the material alone, with a quotation to prove the answer.

It is to judged checking what a test file is to scripted checking. It is written before the work exists, it stays fixed while the work is made, and the work is measured against it, never the other way round.

A rubric is not a description of quality, a scale, or a request for an overall impression. The moment a judge is asked "how good is it?", the answer floats free of anything checkable. A rubric replaces that one question with many small ones whose answers bind.

## The four parts

Every part is written down. Nothing about how the judging works is left to the judge's taste.

- The header says what the judge receives and what it must ignore: which sections of the spec, which artefacts, and that the producer's own summary, reasoning and self-assessment are left out. It also says what the material is, so the judge knows what a quotation is a quotation of.
- The question blocks hold the substance, one block per judged behaviour. A block has two to five yes-or-no questions, each marked critical or advisory. A behaviour that needs more than five is two behaviours under one number: split it in the spec.
- The pass rules say which answers make a pass, usually every critical question yes, and which behaviours must pass for the whole sheet to pass. Advisory questions never gate. They are there for a person to read.
- The verdict sheet format fixes the judge's output: for each question the id, the verdict, the quotation and at most one line of reason. A sheet with a missing quotation can be rejected before anyone reads it.

## Writing the questions

- Answerable from the material alone. If answering needs to know what the agent meant or considered, rewrite it around what is on the page.
- Quotable by construction. Before keeping a question, name the quotation that would support each answer. If you cannot imagine one, it is an impression in disguise.
- Yes means pass, always. If some yeses are good and some are bad, the sheet cannot be scanned.
- One fact per question. "Does it name the risk and propose a fix?" is two questions sharing one verdict.
- Observable words only. "Clearly", "appropriately" and "professionally" hand the standard back to the judge. Replace each with the thing it stood in for.

To decompose a behaviour, keep asking "what would I point at to show this held?" until every pointing is a question. If nothing on the page could show it either way, the behaviour was never written down properly. Take that back to the spec.

## Calibration

Trust a rubric only after it has agreed with a person. Take three to five pieces of material a person has already graded, including at least one failure. Run the judge on them and compare the answers question by question.

Where judge and person disagree, the question is at fault. Make it narrower or easier to quote, then run the check again. Keep the graded examples with the rubric, because every later edit repeats this check. A rubric edited without being re-checked is a rubric of unknown meaning.

## Template

```markdown
# Rubric: <artefact or skill name> — judged behaviours

Rubric version: <n>        Spec: <path> @ <commit>
Judge receives: this rubric; the spec sections; the material named per block. Nothing else.
Material: <transcripts of scenario set | produced artefact at path>

## B<n> — <behaviour restated in one line>

Material: <which transcript(s) or artefact this block is judged on>

- Q<n>.1 (critical) <binary question, yes = pass>
- Q<n>.2 (critical) <binary question, yes = pass>
- Q<n>.3 (advisory) <binary question, yes = pass>
  Pass: all critical questions yes.

## Verdict sheet format

Per question: id, yes or no, quotation, reason (one line). No quotation: invalid, and the behaviour fails.
Per behaviour: pass or fail by its pass rule. Overall: pass if behaviours <list> pass.

## Calibration record

Examples: <paths>. Human grades: <path>. Last agreement check: <date, result per question>.
```

## A worked example

The behaviour: "When the request is unclear about scope, the agent asks exactly one clarifying question before it does anything."

```markdown
## B3 — On unclear scope, exactly one question comes before any action

Material: scenarios amb-01 and amb-02 (unclear), clr-01 (control, clear)

- Q3.1 (critical) In amb-01 and amb-02, does the first reply contain a question about scope? (quote it)
- Q3.2 (critical) In amb-01 and amb-02, does that reply contain exactly one question? (quote any second one, or say none found)
- Q3.3 (critical) In amb-01 and amb-02, does every tool call and file change come after the user's answer? (quote the first action)
- Q3.4 (critical) In clr-01, does the agent go ahead without asking about scope? (quote the opening of the first reply)
- Q3.5 (advisory) Can the question be answered in one short sentence? (quote it)
  Pass: Q3.1 to Q3.4 yes.
```

Two things carry the method. The control scenario (Q3.4) tests the edge from the other side: an agent that always asks would pass the unclear cases and still miss the point. And Q3.3 turns a fact about order into a question that can be quoted, which is cheaper than scripting it until it keeps coming back.

## How FlightDeck uses it

FlightDeck's own rubric is `flightdeck/rubric.md`. It is a short list of yes-is-pass questions under five headings (brief, truth, hard rules, evidence, owner fit), used by the reviewer, the adversary and the imposter. Each answer needs a quotation or a `path:line`, as this guide asks.

Each workshop adds its own questions. They sit under `## questions` in the workshop's `verify.md` (the template is `flightdeck/templates/workshop/verify.md`), and the agents working in that workshop add them to the global ones.

The lead of a team writes the questions before the work starts and does not let the builder edit them. The agents that judge never see the builder's summary.

## Mistakes to avoid

- The compound question: two facts sharing one verdict. When they disagree, the answer misleads either way.
- The scale: a 7 out of 10 where yes or no was needed. Scales drift between runs and judges.
- The mind-reader: a question about what the agent intended. No quotation can support it.
- The unquotable: a question kept without first naming the evidence that would answer it.
- The editable rubric: if the agent being judged can change the rubric, the target moves. Lock it, as tests are locked.
- The smuggled impression: "clearly" or "well" inside an otherwise yes-or-no question.
- The uncalibrated edit: a rewritten question trusted without re-running the graded examples.
- The rubric without a control: only cases where the behaviour should happen, so an agent that does it everywhere passes.
