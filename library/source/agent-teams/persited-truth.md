Persisted truth

1. [The human's altitude](#altitude)
2. [Plain old tests](#tests)
3. [Three tiers at a glance](#tiers)
4. [Truth](#truth)
5. [Doctrine](#doctrine)
6. [Decision ledger](#ledger)
7. [Escalations register](#register)
8. [How the tiers interact](#interaction)
9. [The workshop](#workshop)
10. [Promotion and pruning](#promotion)
11. [The audit loop](#audit)
12. [Enforcement hooks](#hooks)
13. [Left to later sections](#later)
14. [Sources](#sources)

# Persisted truth

Running agent teams, part one of six. The others cover the locked lead, handoffs, routing, the lineup and failure modes.

Agent teams make the human the bottleneck in a new way. The agents no longer need steering turn by turn, but they keep needing answers: what did we decide, what does good look like, what am I allowed to do. Persisted truth is how those answers get asked once, recorded once, and then enforced without you.

Read it like rock: the lower a layer, the slower it moves and the more it is trusted without checking. Each layer constrains the ones above it. Material moves downward only through promotion.

## The human's altitude

The trap this design avoids is the human writing truth directly. It feels responsible, and it buries you in the weeds: every rule hand-drafted, every decision personally made, every interpreted output personally checked. That is HITL with paperwork.

The alternative splits the burden at both ends. At the top, agents train their own decision making through a ledger they control, shaped by a short body of doctrine you maintain. At the bottom, certified apparatus judges interpreted documents so you don't have to read them all. Between those, you sit at the altitude where a frontier model actually needs a person: shaping doctrine, certifying judges, and promoting what agents have learned. You stop authoring truth line by line and start curating the system that produces it.

**The test for every mechanism on this page:** does it move a recurring human act (deciding, checking, reminding) into something an agent can do or a machine can enforce? If it adds a human act instead, it needs a very good reason.

## Plain old testsMachine executable. Not a tier of truth; the floor they stand on.

Tests, templates and schemas are not given a new name here, because they don't need one. They are the cheapest truth there is: a machine enforces them, they never drift, and nobody has to remember them. Every class of decision that can be pushed into a test, a template or a schema is a class of decision that will never be re-made.

Your leverage as a human is greatest here per minute spent. Encourage templates and schemas aggressively:

- **Templates** remove structural decisions. A report template means no agent decides what a report contains, and no reviewer argues about it.
- **Schemas** remove format decisions and make output machine checkable. Dynamic workflow agents can return schema-validated JSON, which turns a handoff into something a script can reject.
- **Tests and assertions** remove correctness arguments wherever correctness is deterministic.

The three tiers above only exist for what cannot be expressed this way. The standing instruction to every tier is **promote downward**: whenever a rubric criterion, a doctrine entry or a ledger decision can become a test, schema or template, it should, and the higher entry should then link to its enforcer.

## Three tiers at a glance

| Tier                | Answers                                                    | Written by                                           | Gated by                                             | Bound by           | Example                                                                                  |
|---------------------|------------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|--------------------|------------------------------------------------------------------------------------------|
| **Truth**           | What does good look like when no test can say?             | Agent drafts, human shapes                           | Human certifies                                      | Spec, tests        | A rubric for what makes a research dossier trustworthy, with a certified judge           |
| **Doctrine**        | How should agents decide, and what is already decided?     | Promoted from the ledger, or written by the human    | Human only                                           | Truth              | "Prefer Claude Code native functionality over roll your own"                             |
| **Decision ledger** | What did we decide here, why, and when may it be reopened? | The lead, recording its own and teammates' decisions | Nobody per entry; the lead gates promotion to global | Doctrine and truth | "Use a workflow fan-out for this audit, not a team, because findings don't cross-depend" |

Notice the gating column. Only two tiers carry human authority, and both are small and slow moving. The tier that changes daily belongs to agents. That is the whole reason you stop re-deciding: most decisions never reach you, and the ones that matter come to you once, as a promotion.

## TruthJudged officially. Rubrics and evals, co-shaped by agent and human, certified by the human.

Truth is the oracle for everything tests can't reach: research quality, harness behaviour, documents that get interpreted rather than executed. It is also the tier where your retained knowledge gets out of your head for good. Every time you look at an output and think "no, that's wrong because…", that sentence belongs in a rubric. If you lean into this tier, the knowledge you currently re-supply in chat becomes a permanent project asset.

### Rubric anatomy

A rubric is one file per kind of output, kept with the global records.

```
---
id: R-dossier
version: 3
status: certified        # draft | calibrating | certified | suspended
applies_to: lead dossiers for the human, all workshop shapes
judge: sonnet            # never the model whose output is judged
gold_set: truth/evals/E-dossier-gold/
agreement: 18/20 on 2026-09-21
recertify_on: rubric edit | judge model change | 3 human overrides
links: spec template v2, template T-dossier
---

## C1 Findings are traceable
pass: every finding cites a report path or evidence path that exists
fail: any finding asserted without a source, or citing a missing file
anchors: gold/007 (pass), gold/012 (fail: cites a deleted report)

## C2 Anything awaiting the human points to the register
pass: each item awaiting a ruling appears as a register id with one line
fail: a request for a ruling appears only in narrative, outside the register
anchors: gold/003 (pass), gold/015 (fail)

## C3 Confidence is stated and earned
...
```

| Field                   | What it holds                                                        | Why it's there                                                                                                                        |
|-------------------------|----------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `status`                | Lifecycle state                                                      | Only `certified` rubrics are trusted without human review. A `suspended` rubric sends its outputs back to you until recertified.      |
| `applies_to`            | Which outputs and shapes it judges                                   | Lets the lead load only relevant truth into a workshop.                                                                               |
| `judge`                 | The model the judge runs on                                          | Certification is for a rubric and judge pair. Change either and it must be re-earned. The judge never runs on the model being judged. |
| `gold_set`, `agreement` | Calibration evidence                                                 | The meaning of "certified": the judge agreed with your labels this often, on this date.                                               |
| `recertify_on`          | Triggers that suspend trust                                          | Stops a rubric quietly going stale.                                                                                                   |
| Criteria                | Checkable claims with pass and fail conditions, plus anchor examples | Anchors are what make a judge consistent. A criterion with no anchors is a vibe.                                                      |

### Eval anatomy

An eval is a folder kept alongside its rubric. It serves two purposes: a **gold set** certifies a judge, and a **case set** measures a harness or agent you are hill-climbing.

```
truth/evals/E-dossier-gold/
  README.md          what this set measures, which rubric it certifies
  cases/
    001/input.md     the output being judged (or a pointer to it)
    001/label.md     human verdict per criterion + one sentence per fail
    002/...
  split.md           which cases are train and which are held-out test
  results/
    2026-09-21.md    judge verdicts vs labels, disagreements listed
```

The one-sentence explanations in `label.md` are the most valuable thing on this page. They are your retained knowledge in written form, and they are what the agent mines when it drafts or sharpens a rubric.

### What makes an eval worth trusting

Anthropic's eval design guidance names four properties of a good eval, and each is a check you can run before certifying anything:

- **Cases mirror real work.** Sample the tasks you actually care about, not the ones that are easy to generate or easy to grade. For this system, the real work is sitting in workshop residue.
- **Stronger models and more thinking score higher.** If they don't, the cases are ambiguous or the judge is miscalibrated.
- **There is headroom.** The strongest model at highest effort should score well below perfect, or you can't tell whether a change helped. A case that fails on every run, however many repeats, is usually impossible or ambiguous rather than hard. A good case is one two experts would grade the same way, where everything the judge checks is stated in the task.
- **Run-to-run variance is low.** High variance usually means ambiguous cases, a judge that disagrees with itself, inconsistent configuration, or leftover state from an earlier run leaking the answer.

Choose hard cases because a person judged them hard, not because today's model happens to fail them. Model capability is jagged, and sampling only its failures measures one model's weak spots rather than what matters. A useful rule: you must be able to say why a case is hard before it goes in.

### Certification protocol

1. **Gather cases in priority order.** Real transcripts first (workshop residue), then recorded failures (your corrections and judge overrides), then five to ten cases you write by hand, then cases synthesised from those. Each deliberately hard case carries one line saying why it is hard.
2. **Approve the inputs.** An agent lays every case out on a simple review page, and nothing proceeds until you confirm the set is representative.
3. **Choose the cheapest grader that fits.** If the output space is constrained, use a programmatic check: exact match, a label from a fixed set, a schema, a passing test. That is promoting downward, and it removes the judge entirely. Only open-ended output gets a judge.
4. **Write the rubric as checkable claims,** not a one-to-five scale. The judge reads the input, the output and the claims, and returns a verdict per claim with its reasoning. The judge must run on a different model from the one producing the output.
5. **Label the gold set.** The judge grades a sample and you mark where you would have graded differently, one sentence each. Each disagreement either sharpens the rubric or corrects your label. Always read a sample of graded transcripts before believing a judge; mis-grading is among the commonest ways an eval goes wrong.
6. **Run the diagnostics.** Grade the same output twice and confirm the verdict doesn't change. Check for timeouts, errors and truncated answers so infrastructure noise isn't mistaken for quality. Check headroom.
7. **Certify.** Record agreement with your labels, the consistency result and the date in the rubric's header. Its verdicts are now trusted without review.
8. **Feed overrides back.** When you overrule a certified judge, that case joins the gold set, and the `recertify_on` count suspends the rubric when overrides pile up.

For taste criteria, or when comparing a change against a baseline, use pairwise judgment: the judge sees both outputs in random order, without being told which is the baseline, and picks the better one. The dynamic workflows post makes the same point, that comparative judgment is more reliable than absolute scoring.

### Hillclimbing against truth

Certified truth is what makes interpreted documents improvable without you. Agent bodies, entry points, skills and harness prompts are all text, cheap to change and revert, which makes them ideal hillclimbing surfaces. The disciplines that stop the system fooling itself:

- **Split the cases.** A train set the improver may read, and a test set it never sees. If train rises while test stays flat, that's overfitting, and the change is reverted.
- **One change per round,** kept only if both train and test improve, reverted if either drops.
- **Noise before signal.** Before the first round, confirm the eval's run-to-run noise is smaller than the smallest improvement you'd act on. If not, add repeats or cases.
- **Never paste failures into the thing being improved,** and keep answers structurally out of the model's reach.
- **When the score stalls, sort the failures by cause** instead of making another edit. This is where flawed cases and wrong graders get caught.
- **Pick attributable, well-scoped targets.** The score must move because of the surface being changed. If an eval is saturated, optimise cost at equal quality instead.

Claude Code's `claude-api` skill ships `build-eval` and `hillclimb` commands that apply these principles as guided workflows, with approval pauses for inputs and grader. Under native-first doctrine, those are the starting point before building a custom eval runner.

## DoctrineAgent conduct, human controlled. Promoted from the ledger.

Doctrine is borrowed from military usage: the body of principles that lets a subordinate act correctly when no specific order covers the situation, distilled from lessons learned and maintained centrally. That matches this tier exactly. Doctrine does not describe the project; it describes how agents in this project decide.

It holds two kinds of entry:

- **Principles** say how to decide. "Prefer Claude Code native functionality over roll your own."
- **Standing decisions** say what is already decided. "Persistence is Postgres." "Auth stays session-based."

The design point that matters most: **every doctrine entry states what it grants, not just what it forbids.** A rule that only restricts makes agents more cautious and more likely to escalate. Doctrine that explicitly grants authority makes them decisive, and decisiveness is what takes load off you. Your native-first rule is a grant in disguise: it lets the lead adopt any native mechanism without asking.

### Doctrine entry anatomy

All doctrine lives in one place, because the lead loads all of it at the start of every session. That is also why it has a length budget.

```
## D-007 Prefer Claude Code native functionality
kind: principle
statement: When Claude Code ships a native mechanism for a need (subagents,
  agent teams, hooks, dynamic workflows, task list, cross-session
  messaging), use it before building a custom one.
intent: Native features improve without our maintenance. Every custom layer
  is one more thing the lead has to reason about.
grants: The lead may adopt, swap between, or retire in favour of any native
  mechanism without escalating.
bounds: No custom equivalent of a native feature without a ledger entry
  showing the native one failed a stated need.
exceptions: Experimental features whose documented limits break a workshop
  (for example, no session resumption for in-process teammates). Record
  the limit in the ledger when invoking this.
origin: L-W03-012, L-W05-004
enforcer: none, audited
reopen: A relied-on native feature is deprecated, or two workshops log the
  same native-feature failure.
reviewed: 2026-09-30

## D-012 Persistence is Postgres
kind: standing decision
statement: All persistent application state lives in Postgres.
intent: One operational surface; the team already runs it well.
grants: Agents may add tables, indexes and migrations without escalating.
bounds: No new datastore (Redis, SQLite, files as state) without escalation.
origin: human, 2026-08-14
enforcer: test tests/arch/test_no_other_datastores.py
reopen: A workload measured to need something Postgres can't serve.
reviewed: 2026-09-30
```

| Field        | Purpose                                                                                                                                 |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| `kind`       | Principle or standing decision. Principles guide judgment; standing decisions remove it.                                                |
| `statement`  | The rule, in one or two sentences an agent can apply.                                                                                   |
| `intent`     | The why. This is what lets an agent generalise to cases you never imagined, and spot when applying the letter would defeat the purpose. |
| `grants`     | Decisions this entry authorises without escalation. The field that makes agents decisive.                                               |
| `bounds`     | What it forbids, and what crossing the line requires.                                                                                   |
| `exceptions` | Known legitimate departures, so agents don't escalate them every time.                                                                  |
| `origin`     | The ledger entries it was promoted from, or "human" with a date. Provenance for when it turns out wrong.                                |
| `enforcer`   | The test, schema or hook that enforces it, if any. "None, audited" means the audit loop checks it.                                      |
| `reopen`     | The evidence that would justify revisiting it. Without this, agents relitigate; with it, they must cite the trigger.                    |
| `reviewed`   | Last time a human looked at it. Old dates are pruning candidates.                                                                       |

### How doctrine reaches agents

Teammates load the project's `CLAUDE.md`, MCP servers and skills automatically, but not the lead's conversation. So a short digest of doctrine (statement and grants only) belongs in `CLAUDE.md` or a file it imports, and every agent gets it with no brief needed. The full entries, with intent and exceptions, stay in the doctrine file for the lead and the auditors. How truth and ledger entries reach agents is covered in part three, handoffs.

### The length budget

Doctrine competes for attention. Adherence decays as the list grows, and the dynamic workflows post acknowledges Claude misses some rules even when they're in `CLAUDE.md`, recommending per-rule verifiers for exactly that reason. Set a budget, around one printed page or 25 entries, and treat hitting it as a signal to merge, push entries down into tests, or retire. A doctrine entry that has gained an enforcer can often shrink to a single line in the digest.

## Decision ledgerAgent controlled. Responds to doctrine, constrained by truth.

The ledger is where agents record the choices they make, so the next agent, or the next session, doesn't make them again. It is the agents' own training ground: patterns that recur here are where new doctrine comes from. Each workshop has its own ledger, and there is one global ledger for promoted entries.

### When to write an entry

Write an entry when an agent chooses between viable options and a future agent could plausibly choose differently. That is the whole test. Not every action is a decision: running the tests is not; choosing to skip a flaky test suite is. Two kinds of entry cover the cases:

- **Decision.** A choice made, with its reasoning.
- **Assumption.** Something taken as true without verification, so work could proceed. Assumptions are the entries most likely to cause trouble later, which is why they're marked.

Choices an agent is not authorised to make don't go in the ledger. They go to the human through the [escalations register](#register), and your ruling comes back into the ledger as a decision.

### Ledger entry anatomy

```
### L-W07-014  decision  active
statement: Use a dynamic workflow fan-out for the dependency audit, not an
  agent team.
options: agent team of 4 | workflow fan-out | single session
why: Findings don't need cross-talk. A workflow gives each package a clean
  context and returns schema-checked output the lead can merge.
doctrine: D-007 (native first), D-003 (cheapest shape that satisfies the verifier)
truth: R-audit-report v2
reversibility: high; rerun as a team if synthesis shows cross-dependencies
reopen: synthesis finds more than two findings that depend on each other
evidence: reports/audit-plan.md
author: lead, 2026-10-01
promote: candidate; applies to any audit-style workshop
```

| Field           | Purpose                                                                                                                                           |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| id              | `L-<workshop>-<n>`. The workshop prefix keeps provenance even after promotion.                                                                    |
| kind, state     | Decision or assumption. State is active, superseded or reverted. Entries are never edited, only superseded by a new entry that names the old one. |
| `options`       | What else was considered. Without this, a future agent can't tell a considered choice from a default.                                             |
| `why`           | The reasoning, in a sentence or two.                                                                                                              |
| `doctrine`      | Which entries authorised it. A decision citing no doctrine is either trivially within an agent's remit, or it should have been an escalation.     |
| `truth`         | Which rubrics or evals constrained it.                                                                                                            |
| `reversibility` | How costly undoing it would be. Low reversibility with thin doctrine coverage is the profile of a decision that should have escalated.            |
| `reopen`        | The evidence that would justify revisiting. This field is what stops relitigation.                                                                |
| `evidence`      | Paths to the reports or data behind it.                                                                                                           |
| `author`        | The agent that made the decision, which may be a teammate even though the lead writes the entry.                                                  |
| `promote`       | The author's view on whether this generalises beyond the workshop. Read at close.                                                                 |

### Reopening

An agent that disagrees with an active entry may not simply decide differently. It writes a new entry citing the old entry's reopen trigger and the evidence that the trigger has fired. If no trigger has fired, the disagreement is recorded as an assumption or a signal in its report, and work proceeds on the existing decision. The same protocol applies to doctrine, except that the reopen goes to the human as an escalation.

### Who writes

The lead is the single writer of a workshop's ledger. Teammates make decisions too, but they report them, flagged as decisions in their reports, and the lead records them with the teammate named in `author`. One writer keeps entries consistent, avoids conflicting appends from parallel agents, and puts every decision past the agent that can see the whole picture. Your rulings on escalations are written the same way, as decisions citing the escalation's register id.

### Two ledgers: local and global

Each workshop keeps its own ledger. One global ledger holds entries promoted out of workshops.

- **Local ledgers** hold everything decided in that piece of work, including scaffolding choices that only matter there. They are where agents learn, and most entries never leave.
- **The global ledger** holds decisions that passed the promotion test. They bind every future workshop until superseded.

A promoted entry keeps its original id, so its provenance survives, and gains three fields:

```
promoted: 2026-10-03, by lead
scope: audit-style workshops      # where it applies
sampled: human, 2026-10-04        # present only if the human sampled it
```

Precedence is simple: a local entry may refine a global entry for its own workshop, but never contradict it. Contradicting a global entry is a reopen, citing that entry's trigger.

### Reading the ledger on demand

A ledger only saves effort if reading it is cheaper than re-deciding. If it costs more context than the decision it records, agents will ignore it. So it is never loaded whole.

- **The global ledger is read as an index:** id, one-line statement and scope. Full entries are fetched by id when a choice touches them.
- **The current workshop's active entries are read in full.** Superseded and reverted entries are history and are never loaded.
- **Precedent is found by scope, not by search.** An agent facing a choice checks the index for entries whose scope matches the work, rather than sifting the whole ledger.
- **Agents other than the lead don't read the ledger at all.** The lead puts the relevant entries into each agent's entry point, which part three covers.

### Assumptions must resolve

Assumption entries are debts. Before a workshop closes, each one is verified (superseded by a decision citing evidence), falsified (reverted, with its consequences recorded), or explicitly carried forward as an open assumption. An assumption is never promoted as if it were a decision.

### The ledger across a workshop's life

1. **During the work,** the lead records decisions and assumptions as they happen, including those reported by teammates.
2. **As patterns appear,** entries likely to generalise are marked `promote: candidate`, while the context for judging that is fresh.
3. **Before close,** every open assumption is resolved or carried forward explicitly.
4. **At close,** candidates go through the promotion test and the conflict check, and the lead promotes the survivors to the global ledger. You sample.
5. **Recurring candidates** across workshops become doctrine proposals for you to accept, edit or reject.
6. **Afterwards,** the audit loop checks global entries for freshness, and superseded ones move to the archive.

## The escalations register

The ledger is the agents' memory. Escalations are your inbox. Mixing them would make you dig through agent decisions for the few that need you, so escalations get their own register: **one global register**, so there is a single place to look across every workshop, with each entry tagged by its workshop.

### Register entry anatomy

JSON, because calling cards are simply an array that grows.

```
{
  "id": "E-014",
  "workshop": "W07",
  "raised": "2026-10-01T10:12",
  "raised_by": "adversary (security lens)",
  "question": "Should replayed sessions be rejected or re-authenticated?",
  "options": [
    { "id": "A", "summary": "Reject outright",
      "impact": "Users on flaky networks get logged out" },
    { "id": "B", "summary": "Force re-authentication",
      "impact": "Smoother, one extra round trip" }
  ],
  "recommendation": { "option": "B", "why": "Same security outcome, less user pain" },
  "blocks": "Finishing the session-handling hardening",
  "status": "open",
  "visits": [
    { "at": "2026-10-02T09:40", "agent": "builder",
      "doing": "session middleware", "action": "waited" },
    { "at": "2026-10-03T14:05", "agent": "builder",
      "doing": "session middleware", "action": "took B",
      "why": "reversible, needed to finish the middleware" }
  ],
  "closed": null
}
```

### Lifecycle: open, then closed

- **Open.** Raised with options, a recommendation, and what it blocks. A recommendation is required: it makes ruling cheap.
- **Calling cards.** An agent that comes back and finds it still open adds one line: when, who, what it was doing, what it did. If it took an option to proceed, the card says which and why. The escalation stays open regardless.
- **Closed.** You close it with a ruling, or with "no decision". The `closed` field holds the time, the ruling, a note, and the doctrine entry if you wrote a rule.

Reading it is the human's judgement, not a rule set. Six calling cards on one escalation say "act now". A ghost town after two weeks says it didn't need you, and you close it without a decision. A card where an agent took an option shows you why, and you may turn that into a rule.

### How it connects

- **Before raising,** an agent's report says what it wants to escalate. The lead, as single writer, checks the register: an existing match gets a calling card, not a duplicate. That is how demand accumulates in one place.
- **Your ruling** becomes a decision in the relevant workshop ledger, citing the register id, so agents learn from it the normal way.
- **An option an agent took** to proceed is an ordinary ledger decision, recorded under the usual rule.
- **Dispatch records** list the escalations raised or visited during the run; **dossiers** point to any still waiting on you.

### Escalation policy: keeping the register small

Nothing keeps escalations from multiplying unless it is written down, and decision fatigue is exactly HITL creeping back. The defences, in the order they act:

1. **Doctrine grants are the main valve.** An agent may escalate only when no doctrine entry grants the decision and the choice is irreversible, out of scope, or a matter of taste with no rubric. Everything else is decided and logged. This threshold is itself a doctrine entry, so it is yours to tune.
2. **The lead filters.** Agents propose escalations in reports; the lead raises them. If doctrine grants the lead the decision, it decides and logs instead.
3. **Duplicates become calling cards,** so one question is one entry however many agents hit it.
4. **Every closure asks one question:** would a grant or a rule have prevented this escalation? If so, write it. Each closed escalation should shrink the next week's register.
5. **Volume is a signal about doctrine, not about you.** A growing register means grants are missing. Track open escalations per week; it should fall as doctrine matures.

```
## D-001 Escalation threshold
kind: principle
statement: Escalate only when no doctrine entry grants the decision and the
  choice is irreversible, out of scope, or taste with no certified rubric.
intent: The human's attention is the scarcest resource in the system.
grants: Any reversible, in-scope choice may be decided and logged without asking.
bounds: Every escalation carries options, a recommendation, and what it blocks.
  Check the register first; add a calling card rather than a duplicate.
reopen: Open escalations per week stop falling for a month.
```

## How the tiers interact

### Downward: an agent facing a choice

Whenever an agent has a choice to make, it consults the layers from the bottom up and stops at the first one that settles it:

1. **Tests, schemas, templates.** If a test or template already decides it, there is nothing to decide.
2. **Truth.** If a rubric or the spec constrains the output, choose an option that satisfies it.
3. **Doctrine.** If a principle or standing decision covers it, apply it. The `grants` field says whether the agent may proceed alone.
4. **Ledger precedent.** If an active entry in this workshop, or the global ledger, already made this choice, follow it unless a reopen trigger has fired.
5. **Decide or escalate.** If nothing settles it: decide and log it when the choice is reversible and within the agent's remit; escalate when it is irreversible, out of scope, or a matter of taste with no rubric.

### Upward: how the system learns

- **Ledger to doctrine.** When similar decisions recur across workshops, the lead proposes a principle. When the same escalation recurs, that's a missing grant.
- **Ledger to tests.** When a decision can be checked mechanically, propose a test or schema and link it as the enforcer.
- **Overrides to truth.** When you overrule a judge, the case joins the gold set, and repeated overrides trigger recertification.
- **Conflicts to reopens.** When doctrine and truth disagree in practice, for example doctrine permits an approach the rubric fails, that's an escalation to you, not something agents resolve.

## The workshop: an instance of work

A workshop is a bounded instance of work that sits beneath the global records. The global tiers (truth, doctrine and the global ledger) live above all workshops. Each workshop holds its own ledger, the reports its teams leave behind, and the lead's dossiers. Only promoted material crosses from a workshop up into the global tiers.

The model is a branch, applied to knowledge. Work happens locally, residue stays local and minable, and only reviewed material merges into the global tiers. Tests already work this way through git, so the model is consistent all the way down. It is what keeps a new session lean: it starts from filtered, globally relevant truth rather than everything every team ever wrote.

There is also a Claude Code reason to need something like this. Teams are ephemeral: a session has exactly one team, the team config directory is removed when the session ends, and in-process teammates are not restored by `/resume` or `/rewind`. Something durable has to sit outside the team. Keep that durable layer as your own structure, not inside Claude Code's team directories, whose config holds runtime state and is overwritten on update.

### Principles any workshop structure should satisfy

How workshops are laid out on disk, and how sessions enter and leave them, is setup and deliberately not covered here. These are the properties the structure needs, whatever it looks like:

- **Global and local are separate,** and promotion is the only path between them. If a workshop can write global records directly, the leanness guarantee is gone.
- **Every workshop has its own ledger,** and entry ids carry the workshop's id, so provenance survives promotion.
- **Residue stays, indexed.** Reports, failed approaches and explorer findings are never loaded by default, but they are minable. A light index lets a future explorer find relevant residue without anyone reading all of it. The dynamic workflows post shows why this pays off: past sessions are a source you can mine for the corrections you keep making.
- **Every workshop ends by surfacing promotion candidates.** Someone must own raising them, or they never surface. Ledger entries marked as candidates, recurring patterns, and judge overrides are the raw material.
- **Abandoned work follows the salvage rule** from the orchestrator guides: setup may be promoted, output never.

## Promotion, demotion and pruning

Promotion is what keeps a new session lean: only globally relevant, filtered material reaches the global tiers. Its filter is a single question.

**The promotion test:** would a fresh session in a different workshop decide worse without this? If not, it stays as residue. The dynamic workflows post applies the same idea when mining sessions for rules, adversarially checking each candidate by asking whether it would have prevented a real mistake.

| From                            | To                        | Who gates           | How                                                                                                              |
|---------------------------------|---------------------------|---------------------|------------------------------------------------------------------------------------------------------------------|
| Workshop ledger                 | Global ledger             | Lead; human samples | At close, the lead applies the promotion test and runs the conflict check. You review a sample, not every entry. |
| Ledger patterns                 | Doctrine                  | Human               | The lead drafts a full doctrine entry with origin links. You accept, edit or reject in a batch from the queue.   |
| Corrections, overrides, residue | Truth                     | Human certifies     | The agent drafts or sharpens a rubric; you label gold cases; certification protocol as above.                    |
| Any tier                        | Tests, schemas, templates | Normal code review  | Promote downward whenever possible, then link the enforcer.                                                      |

### The conflict check

Two workshops can propose contradictory promotions. Before anything reaches you, an agent checks each candidate against the global ledger, doctrine and other pending candidates. You should be gating a resolved proposal, never refereeing a collision.

### Demotion and pruning

Promotion only adds. Without demotion, the global tiers slowly become the polluted context workshops were meant to prevent. Three mechanisms keep them lean:

- **Supersession archives.** A superseded global entry moves to `archive/` rather than staying live.
- **A pruning pass** after every few closes proposes merges, retirements and entries that have gained enforcers and can shrink.
- **The doctrine budget** forces the trade: a new entry beyond the budget means an old one merges, moves into a test, or retires.

## The audit loop

Doctrine entries marked "none, audited" and long-lived global ledger entries need periodic checking, or they drift from the code. The dynamic workflows post describes the right shape for rule adherence: one verifier agent per rule, each in a clean context, followed by a skeptic that filters false positives. Applied here:

- **Doctrine adherence:** one verifier per audited doctrine entry checks recent ledger entries and diffs; a skeptic confirms real violations.
- **Ledger freshness:** one verifier per global ledger entry checks whether it still describes the codebase; stale entries are proposed for supersession.
- **Truth health:** rubrics past their review date, or near their override limit, are flagged for recertification.

It runs as its own small workshop, so its findings follow the same promotion path as everything else.

## Enforcement hooks

Prompts ask; hooks enforce. These are the structural guarantees that make the tiers trustworthy. Agent teams add team-specific hook events: `TaskCompleted` runs when a task is being marked complete, and exiting with code 2 prevents completion and sends feedback; `TeammateIdle` works the same way when a teammate is about to go idle.

| Hook                   | Check                                                                                                                | What it guarantees                                                                                      |
|------------------------|----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| `PreToolUse` on writes | An agent writing to doctrine, or changing a rubric's status                                                          | Human gating is structural. Agents propose through promotion; only you edit the human-controlled tiers. |
| `PreToolUse` on writes | An agent inside a workshop writing to the global ledger directly                                                     | Promotion stays the only path from local to global.                                                     |
| `PreToolUse` on writes | Any agent other than the lead writing to a ledger, or the lead writing to a ledger other than the current workshop's | One writer, and decisions land in the right ledger.                                                     |
| `TaskCompleted`        | Task tagged decision-bearing, but no new ledger entry references it                                                  | Decisions get recorded at the moment they're made.                                                      |
| `TeammateIdle`         | Teammate going idle without leaving a report                                                                         | Work leaves residue, so nothing a teammate learned vanishes with its context.                           |

Synthesis note: the hook events are documented Claude Code features; the specific checks are my design and need scripting against your own layout.

## Left to later sections

This page defines what persists and where. The remaining parts cover who uses it and how:

- **The locked lead:** its tool restrictions, what it receives at session start, and whether it needs a dedicated agent body.
- **Handoffs:** how ledger and truth entries are injected into briefs, what reports contain (including problem and improvement signals), and the dossier's shape.
- **Routing:** which team shapes a workshop can take, and how the lead chooses.
- **The lineup:** which agents write to which files on this page.
- **Failure modes:** including how each tier fails when neglected.

## Sources

- [A harness for every task: dynamic workflows in Claude Code](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/), Anthropic, June 2026. Source for the workflow patterns, per-rule verifiers with a skeptic, mining sessions for rules, comparative judgment, and the goal drift and self-preferential bias failure modes.
- [Automating eval design and hillclimbing with Claude](https://claude.dev/blog/automating-eval-design-and-hillclimbing/), Anthropic, September 2026. Source for the four properties of a good eval, adversarial sampling, case sourcing order, grader choice and diagnostics, pairwise judging, and the hillclimbing disciplines.
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams), Claude Code docs. Source for team lifecycle and limits, what teammates load, and the team hook events.
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), Anthropic Engineering, June 2025. Background on the orchestrator-worker pattern this whole series assumes.
- The orchestrator workflow guides from our earlier conversation: spec and kickoff separation, the run log, and the salvage rule.

Everything not attributed above, including the tier model, doctrine anatomy, ledger structure, workshop principles, the mapping of eval practice onto certification, and hook designs, is synthesis from this conversation and should be treated as a proposal to trial, not documented practice.

Running agent teams, part one: persisted truth. Drafted 1 October 2026.
