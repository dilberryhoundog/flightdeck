# Rubric v2 proposal

Derived from the first bench (six chains, nineteen judge runs, one start draft, three models, two input sets) and checked against the nine-domains description and the verification addendum. Every change cites the bench evidence and, where it applies, the sentence of the standard it encodes. Nothing here is applied; the rubric is edited by its owner and the version line bumped when it is.

## The principle the standard already states

The addendum defines the judged class as "a rubric derived from the numbered behaviours" where "the judge receives only the specification and the material". For a spec-readiness judge the rubric is the specification and the draft is the material. The nine-domains description is what the rubric derives from, not a second document for the judge. The bench shows what happens when it is handed over anyway: judges treat it as evidence about the draft (QDOD.1 passed on the addendum's authority twice), as extra questions (QCON.2 from its placement rules), and as licence to re-read ambiguous questions each run (QBEH.2 flipped four times with it loaded, never without). The rubric's own header says its questions "ask nothing that standard does not already claim; they only make each claim answerable with a quotation from the draft". v2 takes that sentence at its word and finishes the job: every rule the judge needs is in the question.

## Header changes

- Judge receives: this rubric and the draft spec. Nothing else.
  Evidence: rubric-only fable converged in two runs; with the standard, seven. Opus-4in run 1 and fable-4in run 1 passed QDOD.1 citing the addendum; fable-4in run 2 failed the same sentence. Sonnet main run 4 raised QCON.2 from the standard's placement rule.
- Sampling rule: removed. Every behaviour is judged. Every question reports every instance found.
  Standard: behaviours are "a numbered population ... each entry is individually true or false about the result ... and can be individually proven". Sampling contradicts that. Evidence: QBEH.2 fired on a different behaviour each run in every sonnet chain because three-longest re-selects the successors of each split; QIFC.1 surfaced one instance per run across three fable-4in runs.
- Advisory closure: an advisory answered by a decision node that names the question id is reported as closed by that node and is not re-raised.
  Standard: prior decisions exist so review does not flag "settled decisions as defects — a deferred improvement that is written down is context, while the same one unwritten is a finding". Evidence: QINT.3 fired identically on all nineteen runs after the provider decided to keep the mechanism.

## Question changes

- QGEN.1 reword: Is the draft free of statements about how the work will be conducted? The result's own properties are not conduct: for an agent-shaped product, the produced agent's tools, model, and the contracts of the agents it dispatches describe the result.
  Standard: the invariant reads "Nothing in a spec describes how the work will be conducted — only what the result must be." The rubric's list "tools, agents, gates, displays, model choices" is the author's paraphrase and is what makes the question unanswerable for an agent-shaped draft. Evidence: I6-I8 and C10 failed under sonnet and fable-2in, passed under opus and fable-4in, on identical text.
- QBEH.2 add the test: one decision is one trigger producing one result. Qualifiers on that result's form are part of it; a second state change or a separately prohibited action is a second decision.
  Standard: the passing example is "an image linked in the source appears embedded in the output, with no external request when the output is opened" — a compound sentence the standard calls one decision, because "no external request" qualifies the embedding. B6 (node written, problem closed, no approval question asked) carries two state changes and a prohibition, so it is three under this test; B23 (problem asked, no node until answered) is a result and a prohibition, so two. Evidence: B6 passed eleven readings and failed four on identical text; judges wrote "faces of one rule" and "independently falsifiable" for the same sentence. The bare falsifiability test would also split the standard's own example, so the test must be the one above.
- QCON.2 add: an ordering or timing rule belongs in behaviours, not constraints; a constraint that sequences the work ("before any dispatch") is step-shaped.
  Standard: "ordering and timing rules" are listed under behaviours; constraints are "conditions the result must satisfy no matter how it is achieved". Evidence: sonnet main run 4 found C2 from this rule with the standard loaded; no rubric-only judge raised it. This is the one finding the standard produced that the rubric lacked, and it is real. Lane: absorb.
- QCON.1 add: every clause of a constraint is checkable; a constraint with one checkable clause and one that is not fails.
  Standard: constraints "wherever one can be measured — should convert into a named check". Evidence: C11 "encoded in the body" passed eighteen readings; fable-4in run 3 found the first clause has no check.
- QIFC.1 add: both sides of every call or dispatch carry a shape; every identifier another node refers to has a stated format in this domain.
  Standard: the domain lists "names, units, encodings and identifier formats" explicitly. Evidence: I1 passed fourteen readings; fable found it, then the In sides of I6-I8, then that explorer returns carry no id while I5, B22 and VER cite one.
- QDOD.1 add: the antecedent must be in the draft's own earlier sections. A condition the addendum requires at the gate still needs its artefact named in verification.
  Standard: the gate is "purely assembled" and "forbidden from introducing anything"; the addendum's fourth done condition (one transcript read by a human) is a gate condition whose artefact verification must name. Evidence: opus-4in and fable-4in run 1 passed the probe sentence on the addendum's authority; fable-4in run 2 and every rubric-only judge failed it.
- QVER.3 add: the question is about the behaviour's class tag. A judged rubric that supplements a property- or statistically-checked behaviour is not an over-tag.
  Addendum: "Deterministic checks are never omitted because a judge exists; judges are reserved for questions of meaning" — a judged rubric alongside cheaper checks is the pattern the addendum prescribes. Evidence: sonnet run 2 failed B5 for exactly that pattern; every other reading passed it.
- QGEN.3 add: a constraint and the behaviour that makes it checkable across a session are not duplicates.
  Evidence: C6/B19 and C4/B20 were flagged advisory in eleven readings; the check-claiming convention requires the pair.
- QPRI.2 keep. Fable-2in run 2 found D13 reason-free where every other reading passed it; correct, advisory.

## Verdict sheet changes

- Per question: every instance, each with its quotation and the node id. "None found" only after the whole domain was read.
- Findings name node ids, so a runner absorbs by id and the collector detects flips.

## Calibration record, to fill at freeze

- Examples: experiments/spec.v1.start.json (known-returned: QDOD.1; QDOD.2; QIFC.1 on I1, I6-I8 In, return ids; QCON.1 on C11; QCON.2 on C2; QBEH.2 on B6 and B23 under the new test) and the main draft after absorption (expected ready).
- Human grades: the provider grades each absorbed bench finding real, cosmetic or wrong. Real: QDOD.1, QDOD.2, QIFC.1 (three instances), QCON.1 (C11), QCON.2 (C2), QGEN.1 as reworded, QPRI.2 (D13). Real under the new QBEH.2 test: B6, B23; not B3, B16, B11 (one result with qualifiers). Wrong: QVER.3 on B5.
- Agreement check: three models, rubric v2 and draft only, from spec.v1.start.json. Pass when all three raise the same finding set on run 1 and read ready on run 2 after one absorption. Any flip on unchanged text fails the check.

## Freeze

Bump "Rubric version: 2", fill the calibration record from the agreement check, record the bench folder as the evidence. The v1 text stays in git history; the bench data is the changelog.
