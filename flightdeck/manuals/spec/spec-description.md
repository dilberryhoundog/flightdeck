# The Nine Domains of a Spec

A spec is the single written definition of a piece of work: the document that everyone and everything involved — the people who asked for the work, the agents that plan it, the checks that test it, and the review that judges it — treats as the truth about what the result must be. It is organised into nine domains, each holding a different kind of decision, so that the knowledge a contributor carries has an exact place to land.

Most of what a spec needs already exists in someone's head, where it is applied by instinct and never volunteered. The nine domains are, in effect, nine different prompts for that instinct: each one asks a different question, and a contributor's job is to recognise which of the things they know is being asked for, and to state it precisely enough that a stranger could act on it.

## Invariants

- Every domain appears in every spec; leaving one empty is a decision, recorded as such, never an oversight.
- Every statement is precise enough that a stranger could act on it without asking its author anything.
- Nothing in a spec describes how the work will be conducted — only what the result must be.
- A spec freezes before work begins, and after the freeze it changes only before the work does, never after.
- At the freeze, the count of open questions is zero.

## Intent

Intent states the outcome being pursued and why that outcome is worth having. It is kept deliberately short, because its job is to be held in mind whole while everything else is weighed against it.

**In this domain:** the problem or opportunity motivating the work; the outcome the user or business gets; who it is for; the cost of not doing it; a one-line picture of success.

**What makes it unique:** it is the only domain that answers *why* — every other domain answers some form of *what*. That difference has a consequence: intent is the one part of a spec that no test can confirm and no machine can act on. It is judged, by people, which is why it must be short enough to be judged at a glance.

**How it interacts:** it drives everything. Scope is intent's perimeter drawn in practical terms; when any other domain is silent on a question, intent is the tiebreaker; and at the end of the work, the review of whether the *right* thing was built — as opposed to whether the thing was built right — is a review against intent alone.

## Scope

Scope draws the perimeter of the work: what this effort will change, and just as deliberately, what it will leave untouched. A perimeter is only real when both sides of the line are stated.

**In this domain:** the features, surfaces, files and systems the work may touch; the adjacent features, data structures, platforms and user groups it must not touch; which deliverables are included (the change itself, migration, rollout, documentation) and which are explicitly excluded or deferred; where this phase of work ends and a later one begins.

**What makes it unique:** it is the only domain defined as much by what it denies as by what it asserts. Its negative statements — the things the work will *not* do — cannot be inferred from anything else, because to every other reader an unstated exclusion looks like an invitation. Enthusiasm expands work toward whatever seems helpful; scope is the one domain built to resist that.

**How it interacts:** it is derived directly from intent — the smallest perimeter that still delivers the outcome. Its boundaries reappear at the end of the work as the test of whether anything outside the line was touched, and its exclusion list protects prior decisions by keeping the work away from settled ground.

## Constraints

Constraints are the conditions the result must satisfy no matter how it is achieved. Within this piece of work they are non-negotiable; changing one is a decision made outside the document, not inside it.

**In this domain:** performance ceilings and resource limits; dependency and licensing policy; compatibility targets (platforms, versions, devices); security, privacy and data-handling rules; legal, regulatory and compliance obligations; accessibility standards; budget and deadline; brand, tone and style rules; infrastructure and deployment limits; team conventions that differ from common defaults.

**What makes it unique:** it is the only domain imported from the surrounding world rather than authored for the task — its contents were true before this work existed and will outlive it. That origin gives it a dangerous property: a result can appear to work perfectly while violating a constraint, because constraints are rarely visible in the thing itself. They are the conditions most likely to be broken invisibly, which is why they must be written rather than assumed.

**How it interacts:** constraints shape which interfaces are even permissible, can veto otherwise reasonable behaviours, and — wherever one can be measured — should convert into a named check in verification, so that "non-negotiable" is enforced by something other than memory.

## Interfaces and contracts

Interfaces fix the seams: the exact shapes through which the work will meet everything around it. Once agreed, a seam is a promise, and each side of it can proceed on the promise alone.

**In this domain:** function and method signatures; API endpoints, payloads and error shapes; data schemas and file formats; command-line arguments; events and messages; names, units, encodings and identifier formats; the props and slots of interface components; and the human-facing shapes too — the layout of a report, the fields of a form, the format of a handoff between teams.

**What makes it unique:** it is the only domain whose content *is* agreement. A behaviour or a constraint has value even if only one party knows it; an interface known to one side is not an interface at all. It is also the domain where precision is syntactic rather than descriptive — an interface is either stated exactly or it is not stated.

**How it interacts:** this is the domain that makes parallel work possible: once seams are fixed, separate workers can build their own sides without knowing anything about each other. Behaviours are then expressed in its vocabulary, and each contract earns a check in verification that guards the promise for as long as it stands.

## Behaviours

Behaviours state what the finished work observably does, one statement at a time, each precise enough that two readers would predict the same result from it. Taken together, they are the closest thing the document has to a definition of the work itself.

**In this domain:** input-to-output rules; user-visible flows and their steps; state changes and transitions; validation and acceptance rules for data; business rules — pricing, permissions, limits, rounding; rules about content and wording; ordering and timing rules; the side effects an action produces, such as notifications, records or messages sent.

**What makes it unique:** it is the only domain that enumerates. Everything else in a spec is a statement or a boundary; behaviours are a numbered population, and the numbering matters — each entry is individually true or false about the result, can be individually referenced, and can be individually proven. The count is itself information: it says how big the work actually is.

**What makes a good entry:** stated from the outside (what an observer sees, not how the inside works), one decision per entry, and written so a stranger could construct the test. "Handles images properly" fails all three; "an image linked in the source appears embedded in the output, with no external request when the output is opened" passes.

**How it interacts:** behaviours live inside scope's perimeter and speak in the vocabulary interfaces fixed. Each one, as it is written, generates its own boundary questions — which is why edge cases are decided alongside it — and each one maps by number to a check in verification, so coverage of the spec is a list rather than a feeling.

## Edge cases and failure modes

Edge cases record what happens at the boundaries of normal use and when the world does not cooperate. Deciding these outcomes in advance is what separates behaviour that was designed from behaviour that merely occurred.

**In this domain:** empty, zero and missing inputs; oversized and malformed inputs; expired, revoked or absent permissions; unavailable dependencies — the network down, a service unreachable, an asset missing; the same action arriving twice, or two actions arriving at once; interruption and cancellation midway; partial failure and what recovery looks like; the awkward realities of locale, timezone, encoding and device extremes; and for each of these, not just that it can happen, but the exact outcome when it does.

**What makes it unique:** it is the only domain authored adversarially. Every other domain is written by describing what the work is; this one is written by attacking it — asking, case by case, how it breaks. That stance is why it is the domain instinct volunteers last and the one most often hollowed out quietly: an unstated boundary outcome will be resolved by whoever hits it first, in whatever way is easiest, and the result will look finished.

**How it interacts:** it is generated behaviour by behaviour — each behaviour is interrogated for its boundaries as it is written — and its stated outcomes are frequently dictated by constraints, since what happens on failure is where security, privacy and compliance rules bite hardest. Its entries become verification's most valuable checks, precisely because they are the ones nothing else would think to run.

## Prior decisions and non-goals

This domain carries the judgements already made: choices settled before the work began, and improvements deliberately not being pursued. Writing them down converts remembered wisdom into stated ground that cannot be re-argued by accident.

**In this domain:** architectural choices and the records behind them; chosen vendors, libraries and platforms; alternatives that were considered and rejected, with the reason; improvements identified and deliberately deferred; organisational policy that bears on the work; lessons from past incidents; things that work and must not be "improved" in passing.

**What makes it unique:** it is the only domain about the past. Every other domain describes the future result; this one is memory, and its authority comes from outside the document — the decisions were made elsewhere, by processes and people the spec merely reports. It is also the domain that most rewards the contributor with history: the veteran's knowledge of *why things are the way they are* has no other place to land.

**How it interacts:** it saves planning from re-deriving choices already made, and it saves review from flagging settled decisions as defects — a deferred improvement that is written down is context, while the same one unwritten is a finding. Entries that recur across many specs stop belonging to any one of them and graduate into the project's standing rules, after which individual specs no longer repeat them.

## Verification

Verification names how each claim in the document will be proven, in a form that produces an unarguable pass or fail. It converts the document from a description into a target.

**In this domain:** the named checks and which numbered claims each covers; the exact commands to run and what they must return; the reference inputs and known-good outputs to compare against; visual comparisons where the result is something seen; the single end-to-end proof that exercises the whole result the way its user would; measurements where a limit was stated; the manual walkthrough and its rubric, where a human check is genuinely irreplaceable; and, where checks exist before the work starts, the statement that they are fixed and may not be altered by the work.

**What makes it unique:** it is the only executable domain. Its content is not statements about the result but commands and artefacts — things that run, return, and cannot be argued with. Every other domain requires a reader; this one requires a runner, and that is why it is the sole part of a spec that can hold work accountable in the author's absence.

**How it interacts:** it is derived, item by item, from behaviours and edge cases — the numbering is the derivation — while constraints supply its measured limits and interfaces supply the promises its contract checks guard. What it produces, in turn, is the entire substance of the definition of done: acceptance is nothing more than this domain's results, gathered.

## Definition of done

The definition of done is the short final list stating the conditions under which the result is accepted and attention moves on. It exists so that finishing is a determination, not a feeling.

**In this domain:** the checks that must have passed; the evidence that must be presented, in raw form; the confirmation an independent review must have given; the boundary the change must have stayed inside; the artefacts that must have been delivered and the records that must have been updated; who, if anyone, gives the final word; and the tidying that closes the work out.

**What makes it unique:** it is the only domain read as a gate rather than as guidance. Every other domain is consulted throughout the work to shape it; this one is consulted once, at the end, to stop it — and so it must be checkable in minutes, by someone who did none of the work. It is also the one domain forbidden from introducing anything: a requirement that first appears here was missed everywhere it belonged.

**How it interacts:** it is purely assembled — the passing state of verification, the perimeter from scope, the confirmation from review — and its discipline flows backwards through the whole document: knowing that nothing new may appear at the gate forces every requirement to find its proper domain earlier.

## Order of completion

1. **Intent** — first and alone, because every later decision is weighed against it.
2. **Scope · Prior decisions and non-goals** — in unison, because they are one conversation: drawing the perimeter is the act that surfaces what is already settled and what is deliberately being left alone, and each exclusion belongs to one domain or the other.
3. **Constraints** — before any shape is chosen, so that no time is spent on shapes the world forbids.
4. **Interfaces and contracts** — before the work is described in detail, because everything after is expressed in the vocabulary fixed here.
5. **Behaviours · Edge cases and failure modes** — in unison, because each behaviour is interrogated for its boundaries in the moment it is written; deferring the edges to a later pass is how they end up thin.
6. **Verification · Definition of done** — in unison and last, because one is derived from everything above and the other is assembled from the first; written together, a claim that cannot be proven and a proof that gates nothing are both caught before the freeze.

The order is a dependency order, not a rigid procedure: later domains routinely send a contributor back to sharpen an earlier one, and that backward pressure is healthy. What the order forbids is only the forward skip — describing behaviours before the seams exist to express them in, or declaring done before anything is provable.
