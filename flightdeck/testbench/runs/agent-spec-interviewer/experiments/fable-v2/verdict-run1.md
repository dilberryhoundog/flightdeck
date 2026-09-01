# Verdict — experiments/fable-v2 chain, run 1 (rubric v2 + draft only)

Model: claude-fable-5. Coverage: every node, no sampling.

- CON fail — QCON.1 C11 mixed clauses; QCON.2 C2 sequences the work.
- IFC fail — QIFC.1: I1; I6, I7, I8 In sides; explorer return id absent from I6 Out while I5, B22 and VER cite one.
- BEH fail — QBEH.2: B4, B6, B11, B13, B14, B16, B23, each with its clauses named.
- DOD fail — QDOD.1 probe orphaned; QDOD.2 SC12 via C6 covers the boundary. QDOD.3 advisory.
- GEN, INT, SCO, EDG, PRI, VER pass. Advisory: QGEN.3 (SC15/C5, C9/D1), QINT.3.

Overall: RETURNED. All seven expected findings present in one pass, every instance. 104s, 31k tokens.
