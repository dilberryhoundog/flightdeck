Failure modes

1. [The philosophy](#philosophy)
2. [Reading the tables](#reading)
3. [Context](#context)
4. [Verification](#verification)
5. [Coordination](#coordination)
6. [Knowledge](#knowledge)
7. [Platform](#platform)
8. [Attention](#attention)
9. [Health metrics](#metrics)
10. [The failure review loop](#loop)
11. [The series on one page](#series)
12. [Sources](#sources)

# Failure modes

Running agent teams, part six of six, and an index to the series.

By now nearly every failure has a named mechanism somewhere in parts one to five. This page connects each failure to the trace it leaves, the structure that prevents it, the check that detects it, and the move that recovers from it. It is less a list of warnings than an index into the system.

The same learning loop that runs through every part, applied to failure. A failure that never enters the loop recurs forever.

## The philosophy

### Every failure must leave a trace

The human no longer watches transcripts. So a failure that leaves no mark in a dispatch record, the ledger, the escalations register or the signals will recur indefinitely, unseen. The test for every failure on this page is: **what would I see in the records?** If the answer is nothing, that is a gap in the machinery, not merely a risk.

### Prevention, then detection, then recovery

Each failure gets three answers, in order of preference:

- **Prevention:** a structural lock, a body stance, a staging rule or a doctrine grant that makes the failure hard to commit.
- **Detection:** a hook, schema check, audit or metric that catches it when it happens anyway.
- **Recovery:** a re-route, a revert or a superseding entry that undoes it.

Prompts appear nowhere in that chain, by design. "Tell the agent not to" is the weakest defence available, and part two's documented lead failures show why.

### Failures are fuel

A detected failure is a signal; signals become machinery items; machinery items become a hillclimb, a doctrine change, a new lens card or a hook. A system that fails visibly and feeds its failures back improves. One that fails quietly only accumulates them.

### The human is a failure surface too

Re-deciding, typing context into sessions, gating everything and ignoring the register are failures with traces, and they get the same treatment as agent failures. The attention axis below is not an afterthought; it is what the whole system exists to protect.

## Reading the tables

Each axis has one table. Every row gives the failure, the **trace** it leaves in the records, then **prevention**, **detection** and **recovery**, and the part that defines the mechanism. Your earlier work settled on three axes (context, verification, tooling); five parts later, tooling has become platform, and three more axes have emerged: coordination, knowledge and attention.

## ContextWhat an agent knows, or wrongly knows.

| Failure                     | Trace                                                                 | Prevention                                               | Detection                                               | Recovery                                          | Part |
|-----------------------------|-----------------------------------------------------------------------|----------------------------------------------------------|---------------------------------------------------------|---------------------------------------------------|------|
| Lead overreach              | Lead tool calls on work product; few dispatches per session           | Lock doing; make dispatch cheap                          | `PreToolUse` denials logged                             | Dispatch the work; record the attempt as a signal | 2    |
| Lead sifting                | Many reads by the lead outside records                                | Budget looking; quarantine via explorers                 | Read counts per session                                 | Hand the search to an explorer                    | 2    |
| Message-volume leak         | Long final messages in team notifications                             | Reporting contract in the shared core                    | Report schema; message length check                     | Tighten the core; hillclimb it                    | 3, 5 |
| Goal drift after compaction | Work diverging from the objective in later reports                    | Fresh contexts per phase; objective in every entry point | Synthesiser or verifier checks output against objective | Re-stage with fresh agents                        | 2, 3 |
| Shared-core fade            | Reports missing required parts late in long sessions                  | Hook injection at start                                  | Report schema failures rising with session length       | Re-inject after compaction                        | 5    |
| Staging contamination       | Verifier or adversary present during the build in the roster timeline | Verifiers and adversaries join fresh                     | Roster timeline check in the dispatch record            | Re-run the check with fresh agents                | 2    |
| Telephone game              | Entry points containing pasted content                                | Inputs by reference only                                 | Entry point length; content-not-path check              | Rewrite the entry point with paths                | 3    |

## VerificationWhether "done" is true.

| Failure                      | Trace                                              | Prevention                                                 | Detection                                          | Recovery                                    | Part    |
|------------------------------|----------------------------------------------------|------------------------------------------------------------|----------------------------------------------------|---------------------------------------------|---------|
| Self-preferential bias       | The same agent producing and judging               | Separate, fresh verifiers; judge on a different model      | Roster and model check                             | Re-verify with a fresh agent                | 1, 2, 5 |
| Agentic laziness             | Partial work declared done; thin coverage sections | Coverage section required; loop until done shapes          | Coverage gaps per dispatch; `TaskCompleted` checks | Dispatch the uncovered remainder            | 3, 4    |
| Critics herding              | Reviewers' verdicts converging on the first one's  | Independent verdicts before any discussion                 | Agreement rate across reviewers suspiciously high  | Re-run critics in isolation                 | 4       |
| Drifted or uncertified judge | Rising human overrides on a rubric                 | Certification protocol; `recertify_on` triggers            | Override rate per rubric                           | Suspend and recertify                       | 1       |
| Eval overfitting             | Train score rising while test stays flat           | Train and test split; never paste failures into the prompt | Hillclimb's own train-versus-test check            | Revert the change                           | 1       |
| Reward hacking               | Implausible jumps in eval scores                   | Answers kept structurally out of reach                     | Reading a sample of graded transcripts             | Fix the leak; discard the run               | 1       |
| Unclear oracle               | Dispatches that never end, or end on opinion       | Oracle-first routing                                       | Dispatch duration by shape                         | Re-route to eval-driven to build the oracle | 4       |

## CoordinationWhether agents work in unison.

| Failure                           | Trace                                                     | Prevention                                        | Detection                         | Recovery                                                   | Part |
|-----------------------------------|-----------------------------------------------------------|---------------------------------------------------|-----------------------------------|------------------------------------------------------------|------|
| Duplicated work                   | Overlapping findings across reports                       | Boundaries naming neighbours' territory           | Synthesiser flags overlaps        | Tighten boundaries; entry-point defect signal              | 3    |
| Partner imbalance                 | Idle consumers or backed-up queues in the roster timeline | Starting ratios in the shape; task-list claiming  | Idle and queue ratios             | Add or retire partners mid-phase                           | 3, 4 |
| Lost peer exchanges               | Decisions in later work with no ledger entry              | Peers coordinate, reports record                  | Dispatch completeness check       | Ask the agent's successor to reconstruct from its report   | 3    |
| Misrouting                        | Routing friction signals; reopen triggers firing          | Oracle question and axes; investigate when unsure | Re-route rate                     | Re-stage under a superseding routing entry                 | 4    |
| Oversized shapes and runaway cost | Cost per dispatch far above the shape's norm              | D-003; turn caps; token budgets                   | Cost by shape                     | Shrink the shape; reopen D-003 if small shapes miss things | 4, 5 |
| Lead stops early                  | Open tasks or unreported agents at session end            | Stop condition                                    | `Stop` hook reading the task list | Resume and finish, or record the gap                       | 2    |

## KnowledgeWhether persisted truth stays true and lean.

| Failure                | Trace                                                    | Prevention                             | Detection                          | Recovery                                   | Part |
|------------------------|----------------------------------------------------------|----------------------------------------|------------------------------------|--------------------------------------------|------|
| Ledger rot             | Global entries contradicted by the code                  | Scope tags; supersede rather than edit | Freshness audit                    | Supersede and archive                      | 1    |
| Relitigation           | The same choice re-decided across dispatches             | Reopen triggers; precedent lookup      | Duplicate decisions in the ledger  | Point to the precedent; tighten its scope  | 1    |
| Unresolved assumptions | Assumption entries open at workshop close                | Assumptions are debts                  | Close check                        | Verify, revert or carry forward explicitly | 1    |
| Doctrine bloat         | Doctrine past its length budget; adherence falling       | Budget; promote downward into tests    | Audit violations rising            | Merge, push into tests, retire             | 1    |
| Residue never mined    | Promotion candidates never surfacing                     | Workshops end by surfacing candidates  | Promotions per closed workshop     | Run the mining shape                       | 1, 4 |
| Sprawl                 | Bodies, lenses or shapes with near-duplicates or no uses | Governance: gaps before additions      | Usage counts per body, lens, shape | Merge or retire                            | 4, 5 |

## PlatformWhen the ground moves.

| Failure                             | Trace                                                | Prevention                                  | Detection                                            | Recovery                            | Part |
|-------------------------------------|------------------------------------------------------|---------------------------------------------|------------------------------------------------------|-------------------------------------|------|
| Outdated operating manual           | Tool or permission friction signals after an upgrade | Native-first doctrine; periodic doc check   | Drill failures                                       | Update the manual through promotion | 2    |
| Teammates lost on resume            | Lead messaging agents that no longer exist           | Reports complete enough for a successor     | Failed message deliveries                            | Re-invoke from the last report      | 2, 3 |
| Plan approval mistaken for a gate   | Plans approved without review in the record          | Separate reviewer for real plan gates       | Shape check: high-stakes shapes need a reviewer seat | Add a review phase                  | 2    |
| Allowlists strip coordination tools | Teammates unable to message or claim tasks           | Drill after any tool list change            | Tool friction signals                                | Restore the tools                   | 5    |
| Silent hook or frontmatter failure  | Enforcement that should fire never does              | Drills that deliberately trigger each check | Zero denials where some are expected                 | Fix the field or hook; re-drill     | 5    |

One community reference notes that misspelled frontmatter fields fail silently; hence drills that deliberately trigger each check, rather than trusting configuration.

## AttentionThe human's side, and what the system exists to protect.

| Failure          | Trace                                                       | Prevention                                                  | Detection                              | Recovery                                                 | Part |
|------------------|-------------------------------------------------------------|-------------------------------------------------------------|----------------------------------------|----------------------------------------------------------|------|
| Escalation creep | Open escalations per week not falling                       | D-001; grants in doctrine; lead filters                     | Register volume                        | Ask of every closure: would a grant have prevented this? | 1    |
| Decision fatigue | Closures with "no decision" piling up, or long-open entries | Recommendations required; calling cards show demand         | Age of open entries                    | Close ghost towns; write rules from taken options        | 1    |
| Re-prompting     | Context typed into sessions                                 | `initialPrompt`; persisted state for "what's next"          | Count of typed prompts                 | Treat each as a bug report; fix the state or the body    | 2    |
| Over-gating      | Human approvals on decisions doctrine could grant           | Decisions versus truths; lead gates global ledger promotion | Share of gates that were rubber stamps | Convert to a grant                                       | 1    |
| Register neglect | Calling cards accumulating unanswered                       | One inbox, ranked by demand                                 | Visits per open escalation             | Review the register on a cadence                         | 1    |
| Chat as record   | Rulings repeated across sessions                            | Lead transcribes inputs as you give them                    | Repeated rulings on the same question  | Record it once; point to it                              | 3    |

## Health metrics

Traces make a small dashboard possible. Every number below comes from records the system already keeps, and a periodic triage dispatch can compute them and present them in a dossier; no dashboard product needed.

| Metric                           | Source           | Healthy direction                  | What it watches                               |
|----------------------------------|------------------|------------------------------------|-----------------------------------------------|
| Open escalations per week        | Register         | Falling                            | Doctrine maturity; D-001's reopen trigger     |
| Prompts typed by the human       | Session records  | Falling to near zero               | Whether the machinery supplies what it should |
| Repeat signals across dispatches | Dispatch records | Falling                            | Machinery items going unaddressed             |
| Coverage gaps per dispatch       | Dispatch records | Falling, or always acted on        | False completeness                            |
| Judge override rate              | Truth            | Low and stable                     | How close each rubric is to suspension        |
| Re-route rate                    | Ledger           | Falling                            | Routing quality                               |
| Cost per dispatch by shape       | Dispatch records | Stable or falling at equal quality | D-003 and right-sizing                        |
| Idle and queue ratios            | Roster timelines | Near balance                       | Partner imbalance                             |

## The failure review loop

1. **Detected** by a hook, schema check, audit, drill or metric.
2. **Recorded as a signal** of the right kind, by the agent that hit it or the check that caught it.
3. **Aggregated** in the dispatch record, with repeats across earlier dispatches marked.
4. **Raised as a machinery item** when it repeats, with its instances attached.
5. **Fixed** through the right shape: eval-driven for bodies, lenses, templates and the shared core; audit for doctrine; a focused build for hooks and scripts.
6. **Verified** by the metric that caught it, which keeps watching.

It is the same promotion and learning loop that runs through every part of the series, applied to failure.

## The series on one page

| Part                                                                    | Core idea                                         | Key mechanisms                                                                                       |
|-------------------------------------------------------------------------|---------------------------------------------------|------------------------------------------------------------------------------------------------------|
| [1. Persisted truth](https://claude.ai/artifact/2YCn8jqFiaAbjcPqkBCsrr) | Ask once, record once, enforce without the human  | Tests as foundation; truth, doctrine and ledger tiers; escalations register; workshops and promotion |
| [2. The locked lead](https://claude.ai/artifact/4TQX4owNzn3SsCgmF83MZX) | Make the team the path of least resistance        | Lock doing, budget looking, cheap dispatch; `initialPrompt`; staging; body and entry point           |
| [3. Handoffs](https://claude.ai/artifact/4ihFHRC3JfNHMBESQNeDbM)        | Every handoff has a shape and a survivor          | Eight-field entry points; six-part reports; signals; dispatch and dossier; workflows for phases      |
| [4. Routing](https://claude.ai/artifact/4prVozsRBNTpq52EFQbUyG)         | Ask what the oracle is first                      | Oracle branches and axes; four families of shapes; D-003; shapes as skills                           |
| [5. The lineup](https://claude.ai/artifact/UgGHyCjTFez6FG67xZJa2U)      | Derive bodies from seats by stance                | Eight bodies; hook-injected shared core; lens cards; per-body enforcement                            |
| 6. Failure modes                                                        | Every failure leaves a trace, and traces are fuel | Six axes; prevention, detection, recovery; health metrics; the review loop                           |

**The thread through all six:** the human stops prompting and starts improving the machinery. Each part moves a recurring human act (deciding, reminding, checking, staging, choosing) into something an agent does or a machine enforces, and each records enough that the next improvement can be found without reading a transcript.

## Sources

- [A harness for every task: dynamic workflows in Claude Code](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/), Anthropic. Agentic laziness, self-preferential bias and goal drift.
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams), Claude Code docs. Lead overreach, early stopping, resume limits, plan approval.
- [Automating eval design and hillclimbing with Claude](https://claude.dev/blog/automating-eval-design-and-hillclimbing/), Anthropic. Overfitting, reward hacking, reading graded transcripts.
- [Subagent frontmatter](https://www.developersdigest.tech/guides/subagent-frontmatter), Developers Digest. Misspelled frontmatter fields failing silently.
- Parts one to five of this series, for every mechanism referenced in the tables.

The six axes extend your original three. The tables, metrics and review loop are synthesis to trial.

Running agent teams, part six: failure modes. Drafted 1 October 2026.
