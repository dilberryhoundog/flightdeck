# Judge chain comparison — agent-spec-interviewer spec.v1

Start state for the two experiment chains: experiments/spec.v1.start.json (HEAD e632408 plus I8 reuse pointer). The four-input chain started from the same state at its run 3. Absorber in all chains: the spec builder, absorbing only what each verdict named.

## Chains

- Four inputs (rubric, nine-domains description, addendum, draft), claude-sonnet-5: runs 3, 4, 5 returned; run 6 (rubric + draft only) ready. 10 findings absorbed over four runs. Record: judge/dispatch-report.json.
- Rubric + draft, claude-opus-5: run 1 returned (QDOD.1); run 2 ready. 1 finding absorbed. Record: experiments/opus/chain.json.
- Rubric + draft, claude-sonnet-5: runs 1 and 2 returned; run 3 ready. 7 findings absorbed. Record: experiments/sonnet/chain.json.

## Findings by question across all chains

- QDOD.1 (probe transcript orphaned at the gate): found by every judge on its first sight of the draft. Stable.
- QDOD.2 (ACC boundary vs SC12): sonnet two-input run 1; four-input run 5. Opus never raised it (its copy kept the original SC12 and passed QDOD.2 twice).
- QGEN.1: four-input run 3 (I6-I8 tiers); sonnet two-input run 1 (I6-I8, citing SC10 from the draft itself) and run 2 (C10, after I6-I8 were stripped). Opus passed I6-I8 and C10 twice as contracts on the delivered body.
- QBEH.2: four-input runs 3, 4, 5 (B6; B16; B3); sonnet two-input run 1 (B6, B11, B23) and run 2 (B16, B3). Opus passed B6, B11, B16, B23 twice with a stated reading: compound clauses are faces of one rule.
- QBEH.1 (B1 no input): four-input run 3 only.
- QCON.2 (C2 as a step): four-input run 4 only; the judge cited the standard's placement rule.
- QVER.3 (B5 over-tagged): sonnet two-input run 2 only.
- Advisory QINT.3: every run, all chains, identical.
- Advisory QGEN.3: every four-input run and every opus run; sonnet two-input run 2 answered none found. Opus run 2 added C10/D7 model collision.

## Readings

- Questions with a mechanical test (QDOD.1, QDOD.2, QIFC, QEDG, QCON.1) settle in one run and agree across models and input sets.
- QBEH.2 has no operational test for "one decision" and varied by model: sonnet split five behaviours across chains; opus split none and passed. Sampling by three longest re-selects the successors of every split, so each sonnet run found the next compound sentence.
- QGEN.1 on an agent-shaped draft is ambiguous: the product's own tools and model read as interface facts to opus and as run conduct to sonnet. The standard was not needed to raise it; sonnet cited SC10.
- The standard produced one finding no rubric-only judge raised (QCON.2) and the advisory QGEN.3 on C/B pairs the addendum's check-claiming needs. It did not change the verdict on QDOD or QIFC.
- Cost per run: opus two-input 201-215s, 29-30k tokens; sonnet two-input 250-330s, 31-32k; sonnet four-input 277-356s, 38-39k.
- Two-input judges disclosed the missing inputs in their header on every run.

## Added chains (same start state)

- Rubric + draft, claude-fable-5: run 1 returned (QGEN.1, QIFC.1, QBEH.2 on B16 and B23, QDOD.1, QDOD.2); run 2 ready. 5 absorbed. 110s and 99s per run, ~30k tokens. Record: experiments/fable/chain.json.
- Four inputs, claude-opus-5: run 1 ready, zero findings, on the unmodified start state. 182s, 37k. Record: experiments/opus-4in/chain.json.

## Runs to ready and findings absorbed, by chain

- sonnet, four inputs: 4 runs (last under two inputs), 10 findings
- sonnet, two inputs: 3 runs, 7 findings
- fable, two inputs: 2 runs, 5 findings
- opus, two inputs: 2 runs, 1 finding
- opus, four inputs: 1 run, 0 findings

## Further readings

- Every judge that saw the start draft without the standard failed QDOD.1 (probe orphaned). Opus with the standard passed it, citing the addendum as the antecedent. The standard supplied evidence the draft lacks; the rubric question was written to catch exactly that.
- QDOD.2 (SC12 via C6 excludes the whole DoD boundary) was found by sonnet two-input run 1, fable run 1 and sonnet four-input run 5; not by opus in three sightings.
- QIFC.1 on I1 was raised once, by fable, in fifteen dispatches. The draft's I1 is a prose list in every chain that passed.
- QBEH.2 splits by chain: sonnet five behaviours, fable two (B16, B23; passed B6), opus none. Each model passed the behaviours it did not split with a stated reading. The rubric's "one decision" has no test, so the reading is the model's.
- Time per run: fable ~100s, opus ~200s, sonnet 250-350s; tokens 29-32k on two inputs, 37-39k on four.
- Five chains reached ready on five different drafts. The rubric gate is judge-relative on QBEH.2, QGEN.1 and QIFC.1, and judge-independent on QDOD.1, QDOD.2, QIFC.2, QEDG, QCON.1.

## Sixth chain: fable, four inputs

- Runs 1-6 returned; run 7 ready. 8 findings absorbed: QIFC.1 (I1; I6-I8 In; explorer return ids), QDOD.2, QDOD.1, QCON.1 (C11), QBEH.2 (B6; then B16, B23, B11). ~100-127s and 37k tokens per run. Record: experiments/fable-4in/chain.json.
- Within-chain flips on unchanged text: QDOD.1 passed run 1 (addendum cited as antecedent) and failed run 2; B6 passed QBEH.2 in runs 1-3 and failed run 4; B16 and B23 passed in runs 1-5 and failed run 6.
- Findings no other chain raised: QIFC.1 on I6-I8 In sides and on explorer return ids; QCON.1 on C11. Each is a real gap present in every draft that passed elsewhere.

## Final tally, runs to ready / findings absorbed

- sonnet, four inputs: 4 (last under two inputs) / 10
- sonnet, two inputs: 3 / 7
- fable, two inputs: 2 / 5
- opus, two inputs: 2 / 1
- opus, four inputs: 1 / 0
- fable, four inputs: 7 / 8

## Closing reading

- With the standard in hand, the strongest reader took seven runs to converge; without it, the same reader converged in two. The standard did not distract fable into wrong findings (its IFC and CON findings are correct) but it did not stabilise QBEH.2 or QDOD.1 either, and both flipped on unchanged text.
- QBEH.2 flipped within a chain for the same model on the same sentence four times across the experiment. The question has no test and sampling decides where it lands.
- The rubric questions that never flipped anywhere: QINT.1-2, QSCO, QCON.2 (except once via the standard), QIFC.2, QEDG.1-2, QPRI.1, QVER.1-2, QDOD.3.
