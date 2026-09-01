# Verdict — experiments/fable-v2 chain, run 2 (rubric v2 + draft only)

Model: claude-fable-5. Coverage: all nodes.

- IFC fail — QIFC.1: I9 has no shape for the dispatch record E10 names; I10 unchecked_names has no element format (B9, E6 rely on it). Doubts noted: I6 "at most a screenful"; I10 fields deferred to a schema not yet written.
- BEH fail — QBEH.2: B9 two state changes on the unchecked branch (marker in draft; entry in handoff). B6, B23 now single.
- All other blocks pass; QDOD.1 and QDOD.2 pass on the absorbed text. Advisory: QGEN.3 (SC15/C5/D2), QINT.3.

Overall: RETURNED. Findings: QIFC.1 (2 instances), QBEH.2 (B9). 135s, 31k tokens. No flips.
