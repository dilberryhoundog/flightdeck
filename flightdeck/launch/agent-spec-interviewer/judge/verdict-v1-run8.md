# Verdict sheet — run 8 · rubric v2.3 · spec-judge (definition model) · inputs: rubric + draft

## GEN — contributor invariants hold

- QGEN.1 · yes · none found · C10 tools/model and D7 "a dispatch names the agent and passes no model" are properties of the produced agent; VER "the provider, not the builder, chooses one record" is provenance, both exempted by the question.
- QGEN.2 · yes · no empty domains · every one of the nine domains holds at least one node.
- QGEN.3 (advisory) · yes · none found · D13 and D19 overlap on standards-change-is-a-revision, but within one domain, which the question does not cover; B4/C8, B19/C6, B20/C4 are constraint-plus-behaviour pairs the question exempts.

Block GEN: pass.

## INT — intent

- QINT.1 · yes · INT "An agent is available that turns a brief provided description or intention into a self contained, precise spec." · a condition that will be true.
- QINT.2 · yes · INT "This agent provides a vital link in the build chain that every other role builds, verifies and reviews from." · states the value.
- QINT.3 (advisory) · no · INT "The agent probes the intention's landscape with explorer agents and the provider's tacit knowledge with interview questions" · binds the mechanism.

Block INT: pass.

## SCO — scope

- QSCO.1 · yes · SC15 and SC13 · expansions a helpful implementer would reach for.
- QSCO.2 · yes · none found · SC1–SC5 each name a file, directory, contract or mechanic.

Block SCO: pass.

## CON — constraints

- QCON.1 · yes · none found · every constraint is a limit, rule or command exit; C10's override clause is checkable by the frontmatter check; C7 is made checkable by c07's declared threshold.
- QCON.2 · yes · none found · conditions on artefacts; no constraint sequences the work.

Block CON: pass.

## IFC — interfaces and contracts

- QIFC.1 · yes · none found · I1, I3, I5, I6, I9, I10 carry braced typed field lists; I4 and I8 Out carry literal line formats; I2, I7, I11 reuse by path. Doubt noted: the "(unchecked)" marker's format lives in B9, but a literal token is its own format.
- QIFC.2 · yes · none found · I2, I7, I8, I11 reuse by path; I10 declares its new name with reason.

Block IFC: pass.

## BEH — behaviours

- QBEH.1 · yes · none found · each behaviour names input and result.
- QBEH.2 · yes · none found · B14's content clause is read by b14's git show --stat; B18 by b18; B3 is a window; B24 and B23 are act-with-record; B7 and B30 are single-result disjunctions; no check splits a behaviour.
- QBEH.3 · yes · none found · no impression word in B1–B33.
- QBEH.4 (advisory) · yes · none · every behaviour has a describable violating record.

Block BEH: pass.

## EDG — edge cases and failure modes

- QEDG.1 · yes · none found · every edge states its outcome.
- QEDG.2 · yes · E16 (unavailable dependency); E13, E15 (malformed input).
- QEDG.3 (advisory) · yes · none · every B1–B33 is in an edge's boundary list except B16, B17, B19, B20, B25, which D18 covers.

Block EDG: pass.

## PRI — prior decisions and non-goals

- QPRI.1 · yes · none found · each entry settles or defers with a reason; D7 and D1 restate I6–I8 and C9 as reasons, not requirements.
- QPRI.2 (advisory) · yes · none found · D8 and D14 carry reasons.

Block PRI: pass.

## VER — verification

- QVER.1 · yes · VER end-to-end proof · the whole agent invoked as its user would.
- QVER.2 · yes · "Checks pre-exist and are locked against the body's builder for the duration of the run" · stated.
- QVER.3 · yes · none found · no judged tag on a behaviour; B5 and B17 property with scripts. Doubt noted: B17 could be deterministic.

Block VER: pass.

## DOD — definition of done

- QDOD.1 · yes · none found · every ACC condition traces to VER, SC1, SC2, I10 or C13.
- QDOD.2 · yes · agreement · ACC boundary vs SC12 (resolves to the same list), SC9 (new schema named in I10), SC16, SC17.
- QDOD.3 (advisory) · yes · none found · every condition names an artefact.

Block DOD: pass.

## Overall

Every block passes. Verdict: **ready to freeze**.

Advisory, gating nothing: QINT.3 (intent binds mechanism); QGEN.3 D13/D19 same-domain overlap; QIFC.1 "(unchecked)" format in B9; QVER.3 B17 could be deterministic.
