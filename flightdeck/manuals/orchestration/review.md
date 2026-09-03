# Review

Independent review at stage 8: a fresh `critic` in a sealed room holding the spec, the diff and the evidence, with a mandate to find fault. Verification answers the questions the spec anticipated; review exists for the ones it did not, and for the judgement calls no check expresses. Read by the orchestrator at stage 8 and by the human at G3. The critic reads no manual; its mandate is encoded in `flightcrew/crew/critic.md` and `flightcrew/templates/critic-dispatch.template.md`.

## Division of labour

| question | answered by | form |
|---|---|---|
| does it compile, lint, conform? | the structural-check hook, `structural[ext]` commands | deterministic, every edit |
| do the numbered behaviours hold? | the pinned tests map through `fc check all`, `T1` through the stop gate | deterministic, at gates |
| did anything outside scope or under a lock change? | `fc boundary`, `fc locked` | deterministic, at gates |
| does the result match the spec's intent; what was missed between the numbers; should this survive a maintainer? | the critic | judgement, fresh context, after the rows above are green |

- The critic runs after the deterministic layers are green: `fc launch phase review` is refused while `evidence/summary.json` is absent, older than HEAD, or carries a fail or error count, or while boundary or locked evidence is non-clean.
- No context grades its own work: the critic is a subagent that receives only its own definition and the rendered dispatch.

## The sealed room

Independence is an input list, not an attitude. `fc critic render [--pass n]` writes `review/pass-<n>.prompt.md`, and the orchestrator dispatches that file and nothing else.

| inside the room | kept outside |
|---|---|
| the pinned spec text at its commit, the sole definition of right | `plan.json` and `plan.md`: the critic judges the result against the spec, not fidelity to an approach |
| the full diff since `lock_commit`, excluding the launch folder | `kickoff.md`: conduct rules are not correctness and bias toward the run's momentum |
| `evidence/summary.json` and the locked-path change list, so judgement starts where determinism stopped | every file under `returns/`: an implementer's reasoning argues for the conclusion under review |
| the return shape | prior pass files and fix chatter: each pass is a fresh room, or it inherits its own last verdict |
| Read, Grep, Glob and Bash, so the critic can open surrounding code and re-run `fc check` itself; running is not writing | Write and Edit: a critic that can edit becomes an implementer with opinions; the frontmatter allowlist makes this true |

- `fc critic render` exits 1 when the phase is not review or when `summary.json` is older than HEAD; the dispatch always describes the current tree.
- Fresh context per pass: a re-review after fixes is a new render and a new dispatch with the new diff, never a continuing conversation.

## The mandate

- Presumption, against agreement: "assume the diff contains at least one gap and look for it"; a neutral "review this" produces approval because approval is the lowest-energy completion.
- Bound, against over-engineering: gaps that affect correctness or the stated requirements; not style, not hypothetical robustness, not improvements; a gap-prompted reviewer reports some even when the work is sound, and chasing every finding produces defensive code and tests for cases that cannot happen.
- The ordered checklist: behaviours implemented; scope held; tests untouched; errors handled, not suppressed.
- The exit: when there are none, the verdict is the literal `no gaps`; a mandate without that sentence manufactures findings by construction.
- Every finding carries an address: `spec_ref`, `file`, `line`, one sentence of text; a finding without an address is not a finding.

## The four finding kinds

| kind | meaning | severity | routed to | by |
|---|---|---|---|---|
| `correctness-gap` | a spec node not satisfied, or satisfied more narrowly than the spec states | blocking | the implementer owning the unit whose `paths` contain the file, with the finding, the spec node and that unit's checks; fix | orchestrator, `fc-review.js` |
| `scope-violation` | a change outside the spec's fence that the boundary could not classify, behaviourally out of scope even on an allowed path | blocking | the same implementer; revert, not debate | orchestrator, `fc-review.js` |
| `spec-conflict` | the diff and the spec cannot both be right, or two spec lines collide when built | stops the run | `fc launch escalate spec-gap --detail "…"`; no fix is attempted; the human decides | orchestrator |
| `observation` | real but out of mandate: a smell, a future risk, a simplification | never blocking | `fc launch note`, the report, the run log's `observations:` line; never dispatched to an agent | orchestrator |

- The taxonomy makes the loop mechanical: the first two kinds route without judgement, the third halts, the fourth is recorded and left alone.
- Findings are stored as returned with `fc return critic <file> --pass <n>` at `review/pass-<n>.json`; the orchestrator filters nothing.
- State changes go to `review/resolutions.json` through `fc return critic --resolve F<n> --commit <sha> [--dispute "…"]`; pass files are never edited; a disputed finding is marked disputed, not deleted.

## The loop and its cap

1. Deterministic layers green: `fc verify` exits 0 and `fc launch phase review` is accepted.
2. First pass: `fc critic render --pass 1`, dispatch the critic, `fc return critic <file> --pass 1`.
3. Fix and re-verify: route blocking findings by kind; re-run `fc verify` in place (the phase stays review); a fix that breaks a check is a fix that did not happen; record each resolution with `--resolve`.
4. One re-review, fresh room: `fc critic render --pass 2` on the new diff; its question is narrower: are the addressed findings addressed, and did the fixes introduce anything new.
5. Stop: verdict `no gaps`, or only observations remain, or the pass count reaches `ceilings.critic_passes`.

- The cap is real: a loop still producing correctness gaps at the cap is not converging; that is an abandon trigger (`fc-review.js` returns a trigger payload; `fc budget` counts `review/pass-*.json` against `critic_passes`), not a reason for another pass.
- One strong pass captures most of the value; the second confirms the fixes; layering reviewers spends budget verification would use better.
- Disputed findings have one adjudicator: the human at G3, reading the finding and the objection side by side; the loop never argues with itself.
- Convergence is designed: bounded mandate, typed findings, fresh rooms, a hard cap, a human adjudicator; remove any one and the loop stalls open or closes on agreement.

## Kinds of pass

| pass | reference document | form in Claude Code | when |
|---|---|---|---|
| spec alignment | the pinned spec | the `critic` with the full mandate, through `fc critic render` | every run; the pass this manual centres on |
| correctness, bug hunt | the code's own claims | the bundled `/code-review` skill in a fresh subagent | every run, before the critic |
| simplification | the diff itself | `/simplify` on the diff before final review | when implementers iterated hard |
| security | defect classes | `/security-review` or a read-only reviewer on the strongest model | anything touching auth, input or the network |
| design and conventions | a checked-in conventions document | a custom skill checking the diff against it | UI or API surface changes |

- Order inside the review phase: simplify, deterministic re-check (`fc verify`), then the spec-alignment critic last, so judgement reviews the final form.
- A pass without a reference document is a style opinion.

## Reviewing the reviewer

- Findings that were real: of the correctness gaps reported, how many did the human at G3 agree were gaps; a low rate means the bound is too loose (run-log entry, fixed on tooling: mandate tightened).
- Escapes: defects found after acceptance that the mandate should have caught; a pattern in one area means the checklist gets a line or the spec template does (fixed on verification or context).
- The critic definition is versioned with the roster and changes through the run log, never mid-run.

## The human's review at G3

- Intent: is this the thing meant, as opposed to the thing the spec managed to say; where they differ the finding is about the spec template and goes to the run log.
- The unverified list: behaviours with no mapped check, quarantined checks, test-file changes, files outside the boundary; acceptance risk lives here, not in the green checks.
- Disputed findings: critic versus implementer, adjudicated here and nowhere else; the ruling often becomes a spec or mandate edit.
- Taste, by spot-check: read the diff of the riskiest unit and the acceptance check end to end, not everything; depth on the worst case beats coverage of the average.
- The cost line: actual against `expected_cost`; acceptance at double the budget is information for the next plan.
- Review evidence, not narrative: the orchestrator's notes are the text produced by the context most invested in the conclusion; read them last, if at all.

## Before dispatching the critic

- `fc verify` exits 0 and `fc launch phase review` was accepted.
- The dispatch is the file `fc critic render` wrote, unedited, with nothing of plan, kickoff or reasoning added.
- The mandate has both halves and the `no gaps` exit (the critic definition and the dispatch template carry them).
- Findings will be routed by kind per the table above, spec conflicts to an escalation.
- The critic's frontmatter is read-only plus shell, strongest model, `maxTurns` set.
- The pass count and `ceilings.critic_passes` are known; the cap firing is an abandon signal.
- The re-review will be a fresh render and a fresh dispatch.

## Anti-patterns

- The briefed reviewer: the dispatch includes the approach "for context"; the room is unsealed.
- The continuing conversation: re-review in the first pass's context; every later pass is cheaper and blinder.
- The helpful critic: a reviewer with Edit that fixes what it finds; the diff at the gate no longer matches what was reviewed.
- Chasing everything: observations treated as blocking; the diff drifts from the spec while satisfying the critic.
- The unreferenced review: no spec in the room; style opinions with the tone of findings.
- The reviewer stack: three critics in sequence, each finding enough to justify itself.
- Narrative acceptance: "addressed all review feedback" taken as closure without `fc verify` and the fresh re-review.
- Review as the only defence: no pre-written checks, so the critic is asked to be the test suite.
