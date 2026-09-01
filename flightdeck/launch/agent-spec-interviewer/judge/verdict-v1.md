# Verdict Sheet — Part Two (agent-spec-interviewer/spec.v1.json)

**Sampling applied (BEH):** 21 behaviours, so sampled = first (B1), last (B21), three longest by word count (B21 ~37w, B6 ~36w, B1/B10 tied ~33w). Distinct sample used: **B1, B6, B10, B21**.

## GEN — contributor invariants hold

- QGEN.1 · yes · "The body's tools value is Read, Write, Edit, Bash, Task, Grep, Glob and its model value is opus; a run may override the model." (C10) · Names tools/model as required frontmatter of the deliverable artefact itself, not conduct of how this spec's work is performed.
- QGEN.2 · yes · none found · All nine domains carry content; none is left empty.
- QGEN.3 (advisory) · no · "The spec-attacker is dispatched in the turn in which a judge verdict of ready to freeze arrives... without a provider message in between." (B12) vs "The attacker follows a ready verdict automatically; no provider approval gates it." (D15) · Same requirement restated in Behaviours and Prior decisions.

**GEN: PASS** (QGEN.1–QGEN.2 yes)

## INT — intent

- QINT.1 · no · "An agent that turns a brief provided description or intention into a self contained, precise spec by extracting the provider's tacit knowledge using interview questions." · States what the agent does (an activity/definition), not a condition that will be true.
- QINT.2 · yes · "This link in the build chain is what every other role builds, verifies and reviews from." · States the outcome's dependency value to other roles.
- QINT.3 (advisory) · "by extracting the provider's tacit knowledge using interview questions" · Names the mechanism (interview questions), coupling intent to one implementation approach.

**INT: FAIL** (QINT.1 no)

## SCO — scope

- QSCO.1 · yes · "Proposing how the specified thing should be built, or leaning toward a solution." (SC13) · An adjacent, tempting expansion for an interviewer agent, not a remote irrelevancy.
- QSCO.2 · yes · none found · Every in-list entry (SC1–SC5) names a concrete file, contract or artefact rather than a restated goal.

**SCO: PASS**

## CON — constraints

- QCON.1 · yes · none found · Every constraint (C1–C12) is a checkable condition (command exit codes, counts, boundary lists) or an operationalised rule.
- QCON.2 · yes · none found · Constraints state boundary/result conditions ("reads only," "writes only," "exits 0"), not procedural steps.

**CON: PASS**

## IFC — interfaces and contracts

- QIFC.1 · yes · none found · Every seam (I1–I11) states an exact path, JSON shape, or field list rather than prose description.
- QIFC.2 · yes · none found · Every `reuse` reference names its source exactly (e.g. I2 → spec.schema.json, I7 → spec-readiness-rubric.md, I8 → spec-attacker.md, I11 → creating-harness-documents-with-agent-runs.md).

**IFC: PASS**

## BEH — behaviours (sampled: B1, B6, B10, B21)

- QBEH.1 · yes · B1: input = "any bundle is written," result = "every problem... cites a return"; B6: input = "an answer bundle that closes a problem," result = "produces its node... sets the problem closed"; B10: input = register/open_questions/linter state, result = "dispatched... without a provider message in between"; B21: input = candidate confidence, result = "written as a node" / "becomes a register problem" · Each sampled behaviour names an identifiable input and result.
- QBEH.2 · no · "Before any bundle is written, a wave of explorer dispatches with stage intent completes, and every problem in the register at that point cites a return from that wave or the intention itself." (B1); "An explorer candidate returned with confidence certain and a pointer is written as a node... in the same turn; a candidate returned probable or guess becomes a register problem and is asked, never written." (B21) · Both carry two condition/outcome pairs joined by "and"/semicolon rather than one decision.
- QBEH.3 · yes · none found · No sampled behaviour contains "properly," "gracefully," "appropriately," "clearly," "handles well," or "robust."
- QBEH.4 (advisory) · B1: violated if a bundle is written before the intent wave completes, or a problem cites no return · B6: violated if closing a bundle leaves no node or the problem still open · B10: violated if the judge dispatches while a problem is open/asked or a provider message intervenes · B21: violated if a certain+pointer candidate is not written as a node, or a probable/guess candidate is written directly as one.

**BEH: FAIL** (QBEH.2 no)

## EDG — edge cases and failure modes

- QEDG.1 · yes · none found · All 17 edges (E1–E17) state the exact resulting outcome of the case, not a hedged concern.
- QEDG.2 · yes · "A dispatched agent does not return: the dispatch is recorded in the handoff's dispatches list with purpose and no result, and the session continues without it." (E16) · An unavailable-dependency case is present, not only boundary values.
- QEDG.3 (advisory) · none found · Every sampled behaviour (B1, B6, B10, B21) has at least one edge naming it as boundary (E4/E5/E7 for B1; E2/E9/E13 for B6; E8/E15 for B10; E7/E17 for B21).

**EDG: PASS**

## PRI — prior decisions and non-goals

- QPRI.1 · no · "Verification of this agent is per check class, and no behaviour is reworded to qualify for a cheaper class." (D5); "Interview questions and open questions are different things: a question is asked about a hole the register already names; an open question is a hole nobody at the table can plug, held until an explorer, the provider or a later session brings the plug." (D17) · Both restate a forward-binding rule/definition rather than reporting a settled decision or a deliberate deferral.
- QPRI.2 (advisory) · none found · Rejected alternatives carry reasons (e.g. D9: "it costs tokens and time and fights editing"; D2: "an interviewer that searches for itself dilutes the directives it was given").

**PRI: FAIL** (QPRI.1 no)

## VER — verification

- QVER.1 · yes · "the provider plays themselves for one full session on a real intention through to an attacker return of no findings, using whichever explorer, judge and attacker agents exist at the time; the produced draft is handed, alone, to the test builder, which derives a tests map covering every B and E without asking the provider a question." · Exercises the whole agent in one real session, not assembled unit results.
- QVER.2 · yes · "Checks pre-exist and are locked against the body's builder for the duration of the run" · States pre-existence and locking directly.
- QVER.3 · yes · none found · No behaviour carries a judged tag; B1–B21 are deterministic/property, and the standalone judged rubric addresses a meaning-question ("did each question ask for something the provider would not have volunteered") the property check's term-list cannot fully settle.

**VER: PASS**

## DOD — definition of done

- QDOD.1 · no · "the body and its installed copy are byte-identical" · This condition appears for the first time at the gate; no earlier section states a byte-identity requirement between the body and its installed copy.
- QDOD.2 · no · Boundary: "dev/orchestration/schemas/interviewer-handoff.schema.json" (acceptance path list) vs exclusion: "Editing templates, schemas, validators, the linter, or the convention documents." (SC9) · The gate's path boundary includes a schema file that scope's out-list excludes touching.
- QDOD.3 (advisory) · none found · Every condition names an artefact (exit codes, a ratio, a verdict sheet with calibration record, a tests map, a path list, a recorded transcript identifier).

**DOD: FAIL** (QDOD.1, QDOD.2 no)

---

## Overall verdict: **returned**

**Failing questions (findings):**
- QINT.1 — intent names an activity/definition, not a stated outcome condition
- QBEH.2 — B1 and B21 each carry two decisions, not one
- QPRI.1 — D5 and D17 are requirement/definition-shaped, not settled decisions or deferrals
- QDOD.1 — "byte-identical" body/installed-copy condition is orphaned at the gate
- QDOD.2 — the acceptance path boundary includes a schema file scope's out-list (SC9) excludes
