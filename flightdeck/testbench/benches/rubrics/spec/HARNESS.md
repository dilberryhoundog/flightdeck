# Rubric Bench

A repeatable test harness for a readiness rubric. It answers one question: given one draft and one rubric, do different judges converge on the same findings in the same number of runs, and if not, which rubric questions are responsible.

## Goal

A rubric that stands alone, on which every model tier converges on the same findings in the same number of runs. Tier anomalies are recorded and accounted for, not hidden.

## Components

- Start state: one draft spec, frozen as `experiments/spec.v1.start.json`, copied into every chain. Every chain begins from byte-identical text.
- Chains: one per (model, input set). Input sets are `two` (rubric + draft) and `four` (rubric + standard + addendum + draft). Three models at their default effort. Six chains cover the grid; add more chains, never more variables per chain.
- Runner: an agent that dispatches the judge, absorbs its findings into that chain's copy, revalidates, and rejudges until the verdict reads ready. The runner absorbs only what the verdict names and carries nothing between chains.
- Records: `experiments/<chain>/chain.json` (prompt, inputs, model requested and observed, one entry per run), `experiments/<chain>/verdict-run<n>.md` (the sheet), `experiments/<chain>/spec.v1.json` (the chain's draft as it ends).
- Collector: `collect.mjs` reads every chain and emits `experiments/data.json` with the question × chain matrix and detected flips.
- Renderer: `render.mjs` turns `data.json` into `rubric-bench.html`, the visualisation and tuning page.

## Layout

```
<runs-folder>/
  experiments/
    spec.v1.start.json          the common start state
    <model>/                    two-input chain, e.g. opus/
    <model>-4in/                four-input chain, e.g. opus-4in/
      spec.v1.json              the chain's draft (mutates as findings are absorbed)
      chain.json                the record
      verdict-run<n>.md         one sheet per run
    data.json                   collector output
    rubric-bench.html           renderer output
    comparison.md               prose reading, hand-written
```

## chain.json

```json
{
  "model_requested": "opus",
  "model_observed": "claude-opus-5 (transcript)",
  "inputs": ["<rubric path>", "draft"] | ["<rubric>", "<standard>", "<addendum>", "draft"],
  "start": "experiments/spec.v1.start.json",
  "prompt": "the dispatch prompt verbatim, with <project root> in place of the absolute prefix",
  "absorber_note": "The builder absorbs only what each verdict names; nothing carried from the other chains.",
  "runs": [
    {
      "run": 1,
      "sample": ["B1", "B23", "B6", "B10", "B11"],
      "verdict": "returned" | "ready to freeze",
      "failing_blocks": ["GEN", "DOD"],
      "findings": [ { "id": "QDOD.1", "text": "what the judge said", "disposition": "absorbed: <nodes touched>" } ],
      "advisory": ["QINT.3 mechanism"],
      "note": "anything the runner observed",
      "duration_ms": 201120,
      "tokens": 29867
    }
  ],
  "result": "ready to freeze after 2 runs; 1 finding absorbed"
}
```

Finding `text` should name the node ids involved (B6, C11, I1) because the collector detects flips by matching node ids against earlier runs' samples.

## Runner protocol

1. Create the chain folder, copy `spec.v1.start.json` to `spec.v1.json`, write `chain.json` with an empty `runs` array.
2. Dispatch the judge with the chain's prompt. Two-input prompts end with `Open only these two files.` Four-input prompts list all four paths. Never pass a model parameter that the chain does not declare.
3. After each return: verify the model in the session transcript (`~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl`, field `model`) and record it as `model_observed`. UI labels can show the parent session's model instead.
4. Write `verdict-run<n>.md` and append the run to `chain.json`.
5. If returned: absorb every finding the verdict names into this chain's `spec.v1.json`, and only those. Record each disposition. Run the validator and linter; both must pass before the next dispatch.
6. If ready: set `result` and stop.
7. A chain the provider stops is recorded as stopped with its run count; a dispatch already in flight when the stop arrives is recorded, not discarded.
8. Each dispatch is one run; never dispatch without the provider having asked for the chain to continue, and never dispatch two runs of the same chain at once.

## Absorption rules

- Absorb what the verdict names, in the smallest edit that answers it. A split stays a split; a missing shape gets a shape; an orphaned gate condition gets its antecedent in the section the rubric names.
- The same defect on a node the verdict did not name is absorbed only when it is the identical defect (the same clause on I8 as on I6 and I7); record it in the disposition.
- Never absorb from memory of another chain. If a finding in chain A is obviously present in chain B's draft, chain B's judge has to find it.
- A finding the provider rejects is recorded as `rejected: <reason>` and not absorbed; the next run shows whether the judge re-raises it.

## Reading the page

- Runs to ready and findings absorbed: convergence per chain, hatched bars for four inputs.
- Question × chain matrix: a question raised by every chain measures the draft; one raised by one chain measures the judge.
- Run by run: the sequence of findings, red outline where the collector detected a flip.
- Flips: nodes a chain passed and later failed on unchanged text. Any flip disqualifies the question's wording until it carries a test.
- Cost: seconds and tokens per run by model and input set.
- Stability: the tuning axis. Mechanical questions should reach full agreement; judgement questions are the ones to rewrite.
- Lanes: absorb (standard found what the rubric did not), harden (divergence on the same text), integrate (what the top tier alone saw).

## Rebuilding

```
node collect.mjs <runs-folder>
node render.mjs <runs-folder>/experiments/data.json --out <runs-folder>/experiments/rubric-bench.html
```

Question metadata (block, short name, mechanical or judgement) lives in `render.mjs` under `QUESTIONS`; update it when the rubric changes.

## Next-round metrics

Agreement per question, flip rate, instances per finding, sample coverage, finding realness (provider-graded), end-state distance between chains' ready drafts, advisory recurrence after a decision, cost to ready per chain. The first four can be computed from `chain.json`; realness and end-state distance need a grading pass and a node-level diff.

## Tuning order, from the v1 to v2.1 benches

Models read the same rubric differently, and the differences repeat. Two models tune a rubric, on two axes.

1. Tune with fable and opus together, from the same start state. Fable is the discovery axis: the strongest literal reader, flat run time as the rubric grows, and the source of every instance rule and every test the rubric gained. Opus is the leniency axis: a question opus passes and fable fails is a question missing its resolution step, not a model miss. QDOD.2 needed "resolve the referenced node to its paths" before opus found it; once written, opus found it on sight.
2. Score both against `expected_run1` and iterate on the rubric until their run-1 sets agree. A question they still split on after an edit is the next edit.
3. Judge with opus once they agree. Fable's cost is spent on tuning; a tuned rubric is one opus reads the same way, at a third of fable's price per finding in tuning turns and with no discovery needed at the gate.
4. Leave sonnet out of rubric testing and judging. Its run time rose 250s to 430s across v1 to v2.1 while fable's stayed 89-135s and opus's 200-275s; the rise tracks rubric length, and its late catches (C11 a run behind, both times) look like the reader checking out of a rubric that has grown past what it can hold. Alignment it reaches is not worth the clock.
5. Rerun the fable-opus agreement check after any rubric edit; the profile is the per-model pattern in `scored.missed` and `scored.extra` across versions.

## Lint fixes and QDOD.1

Part one requires a path boundary at the gate; part two's QDOD.1 requires every gate condition to have an antecedent. A boundary added to acceptance alone satisfies the linter and fails the judge. When lint-fixing a start state, name the boundary paths in scope (the deliverable files) and verification (the harness directory) at the same time.

## From the two-spec bench (untuned drafts, rubric v2.3)

Record: `two-spec-bench.md`. Chains under `runs/agent-test-builder/experiments/` and `runs/agent-orchestrator/experiments/`.

- The rubric generalised. Every question tuned on the first spec (QIFC.1 shape test, QBEH.2 check-based test, QDOD.2 resolution step, QGEN.1 provenance exemption) produced no fable-opus disagreement on new material. Disagreement appeared only on questions the first spec never exercised: QPRI.1 (rules in decision form), QBEH.1 (unnameable results), QVER.3 on a product that is plainly an agent but never declares it, QCON.1 on a rationale clause inside a constraint. They split on the same axis as before.
- Score absorber residue separately. On the orchestrator, every finding in both chains' final runs was on text the absorber wrote while splitting. A chain measures the rubric and the absorber together; mark each finding as on-original or on-absorbed text so the rubric's convergence is not charged with the absorber's rewrites. Absorb by splitting into the smallest single-clause behaviours; a rewritten behaviour that still has two clauses is the next run's finding.
- Run caps. Fable 4, opus 3 on a rough draft; the last run is recorded, not absorbed. Beyond that the findings are residue, not discovery.
- Start states must be linter-clean before run 1, with shape-only edits (open questions to deferrals, per-id claims, boundary paths in acceptance and in scope and verification). Keep any pre-lint sheet as run 0, unabsorbed; it is model data, not a chain step.
- The judge body enforces its inputs. Under v2 the spec-judge opens only the rubric and the draft and declines the standard and addendum when handed them. A four-input comparison needs a one-off agent with the four-file rule inlined, never the gate body.
- Opus flips exist. On the pre-lint test-builder opus raised QIFC.2 and QBEH.3 and dropped both on the linted draft with the text unchanged. Its profile is stable on the leniency axis, not flip-free.
- Candidate rubric lines from this bench, not applied: QVER.3 applies when the intent names an agent, session or role as the product, declared or not; QPRI.1 a decision stating a rule on the product's conduct is a requirement unless a constraint or behaviour carries the same rule.
