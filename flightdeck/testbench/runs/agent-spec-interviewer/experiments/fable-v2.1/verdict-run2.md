# Verdict — experiments/fable-v2.1 chain, run 2 (rubric v2.1 + draft only)

Model: claude-fable-5. Coverage: all nodes.
- IFC fail — QIFC.1: I10 handoff fields untyped; its schema is new, so no reusable shape. Real.
- BEH fail — QBEH.2: B3 (after wave / before bundle read as two clauses, one check); B14 (status frozen / commit read as two artefacts). Over-split: a window is one condition; a freeze is a commit per C6.
- All else pass. Advisory: QGEN.3 (B4/C8), QINT.3.

Overall: RETURNED. 101s, 32k tokens.
