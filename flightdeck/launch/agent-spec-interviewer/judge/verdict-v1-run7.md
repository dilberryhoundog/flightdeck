# Verdict sheet — run 7 · rubric v2.3 · spec-judge (definition model) · inputs: rubric + draft

## GEN — contributor invariants

- QGEN.1 · yes · none found · C10's tools/model and I6–I8's dispatch contracts are properties of the produced agent; VER's "the provider, not the builder, chooses one record" and "authored before the body and locked against it" are verification provenance, not conduct.
- QGEN.2 · yes · no empty domains · every domain holds nodes; open_questions is empty as the linter requires, not as a domain emptied by decision.
- QGEN.3 (advisory) · yes · none found · C6/B19 and C4/B20 are constraint plus session-checkable behaviour; B16/B25 share a trigger but name different results; ACC's "the body and its installed copy are byte-identical" restates C13 as a gate, which is tracing rather than a second requirement (doubt noted).

Block: pass.

## INT — intent

- QINT.1 · yes · INT: "An agent is available that turns a brief provided description or intention into a self contained, precise spec." · a condition that will be true.
- QINT.2 · yes · INT: "This agent provides a vital link in the build chain that every other role builds, verifies and reviews from." · states the worth.
- QINT.3 (advisory) · no · INT: "The agent probes the intention's landscape with explorer agents and the provider's tacit knowledge with interview questions" · the outcome sentence is implementation-free but this sentence binds the mechanism (explorer agents, interview questions).

Block: pass.

## SCO — scope

- QSCO.1 · yes · SC15: "Searching the repository or the web itself: discovery is delegated to explorer agents that return cited answers." · an expansion a helpful implementer would reach for; SC7 and SC8 are likewise tempting.
- QSCO.2 · yes · none found · SC1–SC5 each name a file, directory, contract or feature.

Block: pass.

## CON — constraints

- QCON.1 · no · C11: "The nine-domains description, the conventions, the verification addendum and the versioning rules are encoded in the body; the agent does not read them at session time." · the second clause is checkable (VER c11-no-standards-read.mjs) but "are encoded in the body" states no limit, rule or check and is not marked unmeasurable; one checkable clause and one not fails. C10's "a run may override the model" is a permission rather than a condition but is read as a rule (doubt noted, not a finding).
- QCON.2 · yes · none found · C2 "exits 0 on the draft that any rubric-judge verdict sheet names" and C6 "writes only under dev/workspace/runs/<spec-name>/" are conditions on artefacts; no constraint sequences the work.

Block: fail (QCON.1).

## IFC — interfaces and contracts

- QIFC.1 · no · instances:
  - I1: "Required: the intention (a paragraph) or a draft spec path whose INT node is the intention; spec template path; spec schema path; project root; the run folder dev/workspace/runs/<spec-name>/. Optional: run log path." · a list of nouns, no braced shape, named format or schema path.
  - I6 In side: "In: one question, the stage it serves (intent | scope | constraints | interfaces | behaviours | verification), optional scope paths." · a comma list of nouns; the dispatch's In side carries no shape.
  - I7 In side: "In: the rubric path and the draft path only" · prose; no shape on the In side.
  - I8 In side: "In: draft path and project root only." · prose; no shape on the In side.
  - I10: braced list but draft_path, version, B, E, C, exit, agent, stage, purpose carry no types, and the named schema is declared new rather than reused.
  - Explorer return identifier: I6 Out has no id field, yet I5 closed_by allows "explorer return" and VER b22 requires "every register problem text names a return id" · an identifier other nodes refer to has no stated format in this domain.
  · reason: five seams are described in prose or untyped and one referenced identifier is unshaped.
- QIFC.2 · yes · none found · I2 names dev/orchestration/schemas/spec.schema.json and spec.template.json, I7 the rubric path, I8 spec-attacker.md, I11 the harness document; B15's "per the versioning rules" names a document rather than a type or shape (doubt noted).

Block: fail (QIFC.1).

## BEH — behaviours

- QBEH.1 · yes · none found · every behaviour names its input and a result observable in files, dispatches or the transcript.
- QBEH.2 · no · instances: B4 (question uniqueness; marker resolves to an asked problem); B7 ("carrying the problem id" is a content clause needing its own check); B9 (marker in the draft and entry in the handoff are two artefacts); B11 (ledger entry plus a second state change); B13 (the reason clause is a content property); B15 (two results; VER checks only the sha256); B23 (registered-and-asked plus a separately prohibited action). · seven behaviours carry two decisions by the check-based test; B14's tail clause read as covered by "git show --stat" (doubt noted).
- QBEH.3 · yes · none found · no impression words in B1–B26.
- QBEH.4 (advisory) · yes · none · each behaviour has a describable violating record.

Block: fail (QBEH.2).

## EDG — edge cases and failure modes

- QEDG.1 · yes · none found · E1–E17 each state the outcome when the case occurs.
- QEDG.2 · yes · E16 (dispatched agent does not return) · unavailable dependency; E13 and E15 are malformed input.
- QEDG.3 (advisory) · yes · none · B1–B15, B18, B21–B24, B26 each appear in an edge's boundary list; D18 covers the rest.

Block: pass.

## PRI — prior decisions and non-goals

- QPRI.1 · yes · none found · D1–D17 are settled choices with reasons or deferrals; D18 is the no-boundary statement QEDG.3 asks for.
- QPRI.2 (advisory) · yes · none found · D8 and D14 carry reasons.

Block: pass.

## VER — verification

- QVER.1 · yes · VER end-to-end proof: the provider plays themselves for one full session through to an attacker return of no findings; the draft is handed alone to the test builder. · invokes the agent whole as its user would.
- QVER.2 · yes · "Checks pre-exist and are locked against the body's builder for the duration of the run" · stated.
- QVER.3 · yes · none found · B5 and B17 are tagged property with the judged rubric as a supplement; all others deterministic.

Block: pass.

## DOD — definition of done

- QDOD.1 · yes · none found · every gate condition traces to VER, C13, SC1, I10 or I11.
- QDOD.2 · yes · agreement · ACC boundary vs SC9, SC12/C6, SC16, SC17, D15: no excluded path lies inside the boundary.
- QDOD.3 (advisory) · yes · none found · each condition names an artefact.

Block: pass.

## Overall

**Returned.** Findings:

- QCON.1 — C11's clause "are encoded in the body" is not a checkable condition and is not marked unmeasurable.
- QIFC.1 — I1, I6 In, I7 In, I8 In are prose seams; I10 is a braced list without types and its schema is new, not reused; the explorer return identifier referred to by I5 and VER (B22) has no stated format in I6.
- QBEH.2 — B4, B7, B9, B11, B13, B15, B23 each carry two decisions by the check-based test.
