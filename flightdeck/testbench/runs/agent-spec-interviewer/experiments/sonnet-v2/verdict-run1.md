# Verdict — experiments/sonnet-v2 chain, run 1 (rubric v2 + draft only)

Model: claude-sonnet-5. Coverage: all nodes.

- CON fail — QCON.2 C2. QCON.1 passed (C11 not raised).
- IFC pass — I1 and I6-I8 In read as "typed inputs"; return id not raised.
- BEH fail — QBEH.2: B4, B6, B11, B13, B15, B23.
- DOD fail — QDOD.1 probe. QDOD.2 passed (SC12/C6 not examined).
- GEN, INT (QINT.3 advisory yes, first judge to say so), SCO, EDG, PRI, VER pass.

Overall: RETURNED. 355s, 31k tokens.
