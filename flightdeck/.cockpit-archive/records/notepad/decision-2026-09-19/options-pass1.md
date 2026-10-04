# T009 — how the cockpit keeps records (pass 1, option space)

Seat: option-maker. Team T009, mission M001. Scratch. Provisional: written before the auditor's evidence and the scout's guidance land. The recommendation here is a lean, not a verdict.

## The problem in five lines

The pilot forgets everything between sessions and can only learn from files, but in two attempts at writing those files only four have ever landed, all researched from official docs, none about flightcrew itself.
Both failed attempts pushed production ahead of use: documents were written because a source existed, not because a gap had been felt, so the commander became the filter and paid in reading time.
The docspec's per-claim sourcing rule made the prose worse, because the citation is doing the validation work that a team should do.
The commander's own vision is under heavy construction, so anything written now about flightcrew has a short half-life, while anything written about the harness does not.
So the question is not how to write better records; it is what triggers writing at all, what vehicle each kind of knowledge belongs in, and how the pilot ever comes to open the file at the moment it would help.

## The options

Five whole methods. A, B, C, D, E differ in trigger and in vehicle, not in size.

### Option A — shelve record keeping

**Trigger.** None. `records/` freezes at the four harness records. No new records are written until the commander reopens the question.
**Writer.** Nobody. The topic store keeps accruing statements, because the extractor runs cheaply as a by-product of transcript mining, but nothing is distilled from it.
**Sources.** Untouched.
**Form and length.** No new form. The seven drafts stay in the notepad as source material, labelled as such.
**Validation.** Not applicable.
**Currency.** The four harness records are re-researched when the CLI version they cite moves; that is already W020's business.
**How the pilot reads at the right moment.** It does not. Cross-session knowledge travels through the mission file, the latest session log, `quarters/commander/orders.json`, and the cockpit `CLAUDE.md`, all of which the pilot already opens at session start.
**Cost to the commander.** Near zero. One decision, then nothing.
**The honest case for it.** Every record written so far about flightcrew has been judged source material or stub-worthy. The commander says the vision will change a lot soon. A record that is wrong in three weeks costs more than no record, because the pilot trusts `records/` by rule 2 and will act on a stale one without hesitation. Shelving is not doing nothing; it is declining to pay for knowledge whose shelf life is shorter than its production time.
**The honest case against.** The four gaps named in P009 are real and recur. The pilot will keep re-deriving the same answers, and the commander will keep answering the same questions in chat, which is the exact cost this system exists to remove. Shelving also leaves rule 2 standing as a docspec for a practice nobody performs, which is dead weight in an auto-loaded file.

### Option B — on-demand drift records with team-stamped validation

The commander's suggestion, worked out.

**Trigger.** A drift event, named and logged when it happens. A drift event is one of four things: the commander corrects the pilot on something a file could have told it; the pilot asks the commander a question a file should have answered; the pilot or its crew acted on a wrong assumption about the flightdeck system and it was caught; or the same question is answered for a second time across two sessions. Explicitly not drift: a one-off preference, a decision about a mission in flight, a ruling on a proposal, or anything that belongs in `orders.json`. Two events on the same topic, or one event the commander marks as costly, opens a record.
**Writer.** A three-seat team dispatched mid-session by the pilot: a scout that gathers from the wide net, a writer that drafts, a validator that checks the prose against what the scout gathered. Opus for the writer and validator, Sonnet for the scout. The pilot does not write it; the pilot names the gap and verifies the result.
**Sources.** The wide net the commander asked for: source HTML guides, `flightdeck/library/`, manuals, the commander's directives in `orders.json` and `commanders-desk/`, and the topic store — in that order of authority, with the topic store last because a commander's conversational statement is usually a fragment of a principle stated more fully elsewhere.
**Form and length.** Plain register, no citations in the body. Title, one line naming when to open this file, then headed sections of plain statements. Forty lines is the working size, sixty the cap. A record that needs more than sixty lines is two records or is not ready.
**Validation.** The team stamp. The stamp does not live in the prose; it lives in `records/stamps.json`, one object per record path: the record, the drift events that opened it, the sources the scout gathered with their URL or path and date, the team id and the validating seat, the verdict, and the condition that would expire it. The commander reads clean prose and, if they want the receipts, opens the stamp. The record itself carries no source header at all.
**Currency.** Two mechanisms. A stamp names its expiry condition — a URL, a CLI version, a branch and commit, or "when the commander next rules on X" — and a recurring workshop item sweeps stamps whose condition has moved. Separately, any later drift event on a topic that already has a record is a defect in that record and reopens it, in place.
**How the pilot reads at the right moment.** Each record's line in `records/README.md` carries a trigger clause: not what the record contains but when to open it ("before dispatching a run team", "when the commander asks for a launch"). The pilot reads the index, not the records, at session start; the index is the routing table. Where a record backs a rule, rule 2's successor names it.
**Cost to the commander.** Per record: one read of forty lines of plain prose and a yes or no on usefulness. No filtering for relevance, because the drift event already proved the relevance before a word was written. Plus the small standing cost of saying "that was drift" when they correct the pilot.

### Option C — stubs now, records on contact

**Trigger.** Two-stage. Stage one is now: every gap already known gets a stub, written once, cheaply. Stage two is a drift event as in B, which promotes the relevant stub into a full record.
**Writer.** The pilot writes the stubs in one sitting from what is already in the drafts and the topic store; a team writes the promotion, as in B.
**Sources.** Stubs draw only on what already exists in the notepad and topics; no new research. Promotions cast the wide net.
**Form and length.** A stub is at most twenty lines: title, one line on what the topic is, three to six plain statements of what is known now, a short "not settled" list naming what must not be invented, and nothing else. No source header, no citations. It reads as honestly partial. A promoted record is the B form.
**Validation.** Stubs are not validated and are marked `status: stub` in `stamps.json`; the pilot may rely on them but a crew brief may not cite one as authority. Promotions get the full team stamp.
**Currency.** A stub is allowed to be stale in the sense of incomplete, never in the sense of wrong; anything contested is deleted from the stub rather than qualified.
**How the pilot reads at the right moment.** Same index with trigger clauses as B; stubs are flagged in the index so the pilot knows it is reading a sketch.
**Cost to the commander.** One read of roughly a hundred lines total for the four P009 stubs, once. Then B's per-record cost on promotion. This is the commander's own P009 suggestion taken as a whole method rather than as a disposal route for four drafts.

### Option D — route knowledge by vehicle; records only for external facts

**Trigger.** The gap itself, but the first question is never "should this be a record" — it is "which vehicle does this belong in". Records are the answer only for durable facts about something outside the cockpit's control.
**Writer.** Varies by vehicle, which is the point. A rule is the pilot's, written in a line. A path-scoped `CLAUDE.md` is the pilot's. A skill is a crew job. A record is a research team's, as today.
**Sources.** Per vehicle.
**Form and length.** Six vehicles, each with its own shape.
- Operating rules the pilot must never violate go in the cockpit `CLAUDE.md`, which is auto-loaded and therefore the only vehicle with guaranteed delivery. It is a scarce resource and stays short.
- Conventions that apply inside one directory go in a `CLAUDE.md` in that directory, loaded when an agent reads there. This is how a launch-directory convention should reach a run team without any pilot involvement.
- Procedures with steps go in a skill, which the harness surfaces by description at the moment of need. This is the only vehicle with a genuine just-in-time trigger.
- What is true of the mission in flight goes in the mission file.
- What happened and what is next goes in the session log.
- What a seat is for and how it went goes in the crew dossier.
- Durable external facts — the harness, a library's behaviour, a documented tool — go in `records/`, which is what the four surviving records already are.
**Validation.** Per vehicle. Records keep a team stamp as in B. A rule is validated by the commander approving it. A skill is validated by being used.
**Currency.** Each vehicle already has an owner and an update habit under rule 10; records get the stamp expiry.
**How the pilot reads at the right moment.** This is the option's whole argument: four of the six vehicles deliver themselves without the pilot choosing to read anything. Records, the weakest vehicle for timing, are reserved for the knowledge least likely to need a trigger.
**Cost to the commander.** Low per item, but there is a one-off cost: the commander must accept that `records/flightcrew/` may stay close to empty, and that this is a success rather than a failure.

### Option E — vehicle routing with a drift trigger

B and D joined, and the join is load-bearing rather than a split of the difference.

**Trigger.** A drift event, as defined in B. The event opens a question, not a record.
**Writer.** The pilot classifies the drift and picks the vehicle in one line, which is cheap and reversible. Only a vehicle of "record" dispatches a team; a rule, a path-scoped file or a mission-file line is written on the spot.
**Sources.** The wide net for records; whatever the vehicle needs otherwise.
**Form and length.** B's form for records, D's shapes for everything else. Stubs from C are available as the record's first state when the drift is real but the knowledge is thin.
**Validation.** The `stamps.json` team stamp for records; commander approval for rules; nothing for the rest.
**Currency.** Stamp expiry plus reopening on repeat drift.
**How the pilot reads at the right moment.** Vehicle choice is a delivery decision first and a storage decision second. The index's trigger clause covers the residue that lands in `records/`.
**Cost to the commander.** The B cost on the small number of items that become records, and near zero on the rest, because a rule line or a directory convention is read in seconds.

## The comparison

**On what actually causes the failure so far.** A and D attack the production-ahead-of-use failure at the root, A by stopping and D by making most knowledge cheap to place. B and C attack it with a trigger. Only D and E attack the delivery failure, which nobody has yet attacked and which is the reason a perfect record can still be useless.
**On the commander's reading cost.** A is zero, D near zero per item, E low, B low but lumpy, C carries a one-off hundred-line read up front.
**On the risk of a stale record being trusted.** B and E are lowest, because a drift-triggered record is about something that just cost somebody real time and is therefore live. C is highest among the writing options, because a stub written from the drafts is written before use, which is the original sin in a smaller package. A cannot go stale, but it also cannot help.
**On surviving a large change to the commander's vision.** D and E survive best: a rule is one line to change, a directory convention dies with its directory, a skill is versioned. A survives by having nothing to lose. B and C lose whatever they wrote about flightcrew, though the wide net makes B's output more durable than T006's.
**On how much machinery it adds.** A removes machinery. D removes some and adds a routing habit. E adds a drift log and `stamps.json`. B adds the same. C adds the same plus a stub tier.
**On what it does with the work already done.** A and D let the topic store lie fallow, which wastes the mining but loses nothing already paid for. B and E use the topic store as the last source of authority rather than the first, which is the correction DS003 asked for. C consumes the seven drafts immediately.

## The recommendation (provisional)

**E, with C's stub as a record's first state.** The commander's on-demand trigger is right and should be adopted whole, but a trigger alone leaves the hardest problem untouched: the pilot has to decide to read. Vehicle routing answers that, and it also explains the evidence — the only records that ever survived were about the harness, an external and stable subject, which is exactly the residue D says `records/` should hold.

Rejected, and why. A is not chosen but it is close, and it should be chosen if the auditor's evidence shows that knowledge is already persisting adequately through logs, orders and the mission file; the honest case for A is that it costs nothing and loses little. B alone is rejected only because it stops short of the delivery question. C alone is rejected because the stub is a good state for a record and a bad method on its own, since it writes before use. D alone is rejected because without a trigger the pilot never starts, which is how the cockpit arrived here twice.

## What it would change (sketch, to be settled in pass 2)

Rule 2 loses the per-claim source requirement and the header pointer, which move to `records/stamps.json`; gains a one-line vehicle test ahead of the six tests; keeps one topic whole, current form only, the two-year test, the line caps and the two styles; and adds that a record may land as a stub.
The seven drafts: one register lands, four become stubs under C's shape, two are dropped, per DS003 — but as the first state of a record rather than as a filing decision, and the four are only written if the drift list confirms them.
The topic store keeps running as a mining by-product and becomes the last source consulted rather than the first.

## Risks

The drift event is a judgement call and the pilot is the one making it about its own failures, which is a bad incentive; the log entry is what makes it checkable.
Vehicle routing can become a way to avoid writing anything, with every gap declared "a rule" and the rule never written.
`stamps.json` separates the claim from its evidence, so a record could be edited after stamping and still read as stamped; the stamp needs to name what it stamped.
The cockpit `CLAUDE.md` is the only vehicle with guaranteed delivery, so routing pressure will push everything toward it until it is too long to be read.
If the commander's vision changes as much as they expect, even drift-triggered records about flightcrew may be short-lived, and the option that survives is A.
