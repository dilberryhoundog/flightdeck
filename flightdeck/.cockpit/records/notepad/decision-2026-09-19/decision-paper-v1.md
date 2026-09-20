# T009 — how the cockpit keeps records

Decision paper. Seat: option-maker, team T009, mission M001. Scratch, not authoritative. Written against the question in `notepad/decision-2026-09-19/question.md`, the commander's advice in DS002 and DS003, the auditor's evidence and the scout's reading of official guidance.

## The problem in five lines

The pilot forgets everything between sessions and can learn only from files, yet of fourteen records drafted in two days the commander kept two, and the four that had landed earlier are the only store in the cockpit ever cited twice.
Both failed attempts wrote before the need was felt, from one thin source, so the commander became the filter and paid in reading time.
Rule 2's per-claim sourcing forced the commander's own conversational fragments into the prose, and the annotations they left in two drafts show what that costs: a required principle reduced to the one clause they happened to quote, spitballing presented as canon, an argument reproduced word for word with its point missing.
Nothing in the cockpit makes the pilot open a record at the moment it would help, so the one record-related failure on the books was a record that existed and went unread.
The commander's vision is under heavy construction, so knowledge about flightcrew has a short half-life while knowledge about the harness does not.

## What the evidence settled before the options were compared

**Drift does not produce records.** All eight drift events the auditor found were repaired by a rule, a dossier line or a memory, and none by a record. The docspec itself was written by drift, after DS002. A drift-triggered record is a method whose trigger has already fired eight times and yielded nothing.

**The records that work are the ones nobody mined.** The four `records/claude-code/` files are the only store with repeat cross-session citation: one caught a false claim, one settled a live dispute. The single draft the commander kept whole, the harness register, has zero commander quotes and is docs-verified. The six drafts running 20 to 70 percent verbatim quote were demoted or dropped. External-fact records survive; commander-mined records do not.

**Official guidance already describes the trigger the commander reached for.** The memory page's list of when to write something down is: Claude makes the same mistake a second time; a review catches something Claude should have known; you type the same correction you typed last session; a new teammate would need the same context. That is the drift definition, from the docs, arrived at independently. The same page routes the output: if the entry is a multi-step procedure, or matters only in one part of the tree, it belongs in a skill or a path-scoped rule, not in the always-loaded file. Vehicle routing is official practice, not an invention of this team.

**The index-plus-topic-files shape is confirmed three times over.** Auto memory, the subagent `memory` field and the multi-agent research post converge on a small capped index listing one line per topic with detail in files opened on demand. The harness caps its own index at 200 lines or 25KB and nags the agent to prune. `records/README.md` plus `records/*.md` is already that shape, and so is the commander's trigger manifest. The structure was never the problem; production was.

**The cost driver is teams, not files.** The research post's 4x tokens against chat, and up to 15x for multi-agent, is the cost of using a team to write a record, not the cost of keeping one. Two teams were spent to land two documents.

**One claim of mine needs tempering.** I said the auto-loaded file does not scale. At 72 lines against an official target of under 200 it is at roughly a third of budget, so the problem is not present today. What is true is the rate: about eight rules in four days, all from drift, and the docs say length reduces adherence before the cap is reached. An imported manifest expands into the same window. The trajectory is the argument, not the current number.

## The options

Each is a whole method: trigger, writer, sources, form, validation, currency, delivery, cost.

**A — shelve record keeping.** No trigger; `records/` freezes at four files; nobody writes; the seven drafts stay in the notepad as source material. Knowledge travels by the mission file, the session log, `orders.json` and `CLAUDE.md`. Costs the commander one decision and nothing after. It cannot go stale and it cannot help. It leaves rule 2 standing as a docspec for a practice nobody performs, in an always-loaded file.

**B — on-demand drift records with team-stamped validation.** A drift event opens a record; a three-seat team writes it from the wide net with the topic store last; plain register, no citations in the body; the stamp lives in `records/stamps.json` with the sources, the validating seat and an expiry condition; a later drift on the same topic reopens it. Delivery by a trigger manifest line. One forty-line read per record for the commander. This is the commander's suggestion taken whole, and the auditor's evidence is that its trigger fires on conduct, not on doctrine, so it would mostly produce nothing.

**C — stubs now, records on contact.** Everything in B, plus a stub tier written up front from what already exists, promoted to a full record when drift touches it. Cheap per stub, but the stubs are still written before use, which is the original failure in a smaller package. The commander has already ruled the four stubs in DS003, so this option's stage one is partly settled fact rather than a live choice.

**D — route knowledge by vehicle.** The first question is never whether to write a record but which vehicle carries the knowledge: a constant rule in `CLAUDE.md`, a conditional routine in `procedures/` fired by the imported manifest, a convention in a path-scoped file, a procedure crew perform in a skill, the mission file, the session log, the crew dossier, and `records/` only for durable facts about something outside the cockpit's control. Five of those vehicles deliver themselves; records, weakest on timing, hold what least needs a trigger. Low cost per item. Without a trigger, nothing starts, which is how the cockpit arrived here twice.

**E — vehicle routing with a drift trigger.** The drift event opens a question, not a record. The pilot classifies it and picks the vehicle in one line; only a vehicle of "record" dispatches crew, and everything else is written on the spot. B's form and stamp for records, D's shapes for the rest, a stub available as a record's first state. The method itself lives in `procedures/record-keeping.md`, so the classification is a routine rather than a fresh act of judgement, and the manifest carries the triggers.

## The comparison

**Against the evidence, B and C fail on their own terms.** Their trigger has fired eight times and produced eight rules. Both would be sound methods for a cockpit whose drift was doctrinal; this one's is not, yet.

**A and D both survive the evidence, for opposite reasons.** A is right that flightcrew record production should stop. D is right that the knowledge still has to go somewhere, and names where.

**Only D and E answer delivery, and now with the commander's own mechanism.** The one record-related drift was repaired by rule 4, a standing exhortation to check the records; it has been auto-loaded since day two and no log shows either record it points at being opened since. A general instruction to remember to read is the weakest form of delivery. A trigger manifest is the strong form.

**On the commander's reading cost,** A is zero, D near zero per item, E low and lumpy, B lumpy, C carries an up-front read that DS003 has already absorbed.

**On surviving a large change to the vision,** D and E survive best: a rule is a line, a procedure is rewritten in place, a convention dies with its directory. A survives by having nothing to lose.

## The recommendation

**Option E, with flightcrew record production shelved inside it.** The commander's on-demand trigger is adopted whole and becomes the cockpit's general rule for writing anything down, not only records. What it opens is a question about vehicle, and on the evidence the answer will usually be a procedure. `records/` stays open and expects external-fact records only, which is what its four survivors are. This is A's conclusion about flightcrew records, reached inside D's routing, with B's trigger and stamp kept for the narrow case where a record still makes checkable external claims.

The single sentence: stop writing records about the system and start writing procedures about the job, and let the trigger manifest make both readable at the moment they matter.

## What changes

**Rule 2 becomes a docspec only.** It keeps one topic whole, current form only, the two-year test, every sentence earning its place, and the two styles. It loses the per-claim source requirement and the header pointer, which move to `records/stamps.json`, with the stamp naming what it stamped so a later edit cannot inherit it. It loses the method entirely, which moves to `procedures/record-keeping.md`. It gains one line placing the vehicle test before the six tests, and one line permitting a record to land as a stub, marked, not citable as authority in a crew brief. I would also cut the caps from 100 and 150 to 60 working and 100 hard: the useful records run 20 to 73 lines, and the auditor found three short facts worth keeping in a 93-line draft.

**`procedures/record-keeping.md` is written first,** and is the first thing in the new room. It carries the drift definition in the docs' own four cases, the vehicle test, who writes each vehicle, the stamp schema, and what the commander sees. The trigger manifest gains its first lines. A manifest line states a condition and never a summary: "before dispatching a team" and not "what a launch is", because a summary invites the pilot to think it has already read the file. The manifest gets a hard cap of 40 lines written into the procedure, since the cockpit has no equivalent of the harness's own pruning nag.

**On manifest line against skill description.** The skill is the official mechanism for delivery by topical relevance and is the better long-run carrier. It is not the right first move here. Skills live outside the cockpit, so a skill is a system change under rule 6 and needs the commander's approval; a skill's body enters context as a snapshot and is not re-read on later turns; and relevance matching is a model judgement rather than a guarantee. The manifest is inside the pilot's write boundary, deterministic, and the commander's own design. Note plainly what it is: a hand-rolled skill description index, one line saying when to open a file, without the harness's matching. When the procedure set stabilises, propose through `base/` that the procedures become skills and the manifest retires. The import mechanism works as expected and this is measured, not read: on CLI 2.1.275, a subdirectory `CLAUDE.md` importing `@proc/triggers.md`, which itself imports `@deeper.md`, delivered both imported files as instruction blocks in two runs — once with the session's working directory inside that subdirectory, and once with the session starting in the parent, where the nested file loads on first read there and its imports arrive with it. Relative paths resolved against the importing file, as documented. Two hops are proven, the documented limit is four, and the manifest needs one. Untested and not relied on: the approval dialog for imports outside the tree, and a fifth hop.

**The seven drafts.** The register lands in `records/claude-code/` as is, per DS003. The four ruled stubs are compressed to fifteen lines working and twenty capped, in plain register with zero commander quotes, by one Sonnet seat working from the drafts and the commander's inline comments, with the pilot verifying against rule 2. The commander does not read them before they land; they have already ruled the content and annotated the drafts by hand, and a second read is the filtering cost this decision exists to remove. The inline comments are the edit list and nothing they contest survives: the failure-axes section is rewritten to say all three axes are required and a retry must declare which failed and how it will improve it; the spitballed passage on how a launch proceeds is dropped; the superseded carry-forward claim is dropped; the three replacement rules are stated with the argument that binds them, that existing tests cover existing behaviour so a spec states only changed behaviour. The two dropped drafts stay in the notepad. No fifth stub is ever written ahead of a drift event, because the four carry the commander's own nomination and a fifth would carry only the pilot's forecast.

**The topic store.** It stays, it is not mined again by a team, and it is demoted to the last source consulted rather than the first, because a conversational statement is usually a fragment of a principle stated more fully elsewhere. The pilot files statements into it in chat as they arrive, which is cheap. No record is ever written from it alone.

**The first three outputs, given the auditor's drift list, are not records.** This is the finding, not a failure of the method. First, `procedures/record-keeping.md`, from the two rejected writing cycles. Second, a dispatch procedure covering three separate drift events — the crew-model over-generalisation, the understaffed judgement task and the premature shutdowns — which are today three conditional rules sitting in the always-loaded file and belong behind a trigger that fires when a team is being formed. Third, a branch and merge procedure, from the deletion the commander stopped by hand. The first genuine record candidate arrives when a launch meets the harness and something documented turns out to be wrong, which is the shape of all four records that have ever worked.

**What the commander must do per item.** For a record: one read of sixty lines or fewer of plain prose and a yes or no on usefulness, with no filtering for relevance, because the drift event proved it before a word was written. For a stub: nothing. For a procedure: approve one manifest line. Standing cost: occasionally saying that a correction was costly, which is the strongest of the four drift signals.

## Risks, and what would make this wrong

The pilot judges its own drift, which is a bad incentive; the log entry is what makes it checkable, and the commander marking a correction costly is the trigger that does not depend on the pilot's self-assessment.
Routing can become a way to write nothing, with every gap declared a procedure and the procedure never written. The check is that a drift event names its vehicle in the log on the day it happens.
The manifest competes for the same window as `CLAUDE.md` and will grow a line at a time. The cap is stated, but nothing enforces it the way the harness enforces its own.
Separating the stamp from the prose means a record can be edited after stamping; the stamp must record what it covered.
Stubs landing unread is a real loosening of rule 2, defensible only because their content is already ruled and they may not be cited as authority. If a stub is ever quoted in a crew brief the loosening has failed.

The condition that would have sunk the delivery half is closed: the import was measured working, nested and at two hops, in both loading paths. What remains is that the manifest's value depends on the pilot obeying a trigger line it has already read, which is a discipline the same as rule 4's and rule 4 failed. The difference is that a condition stated at the moment of action is a weaker demand than a standing instruction to remember; if the manifest is also ignored, delivery has no mechanical answer left and the honest response is A.
It is wrong if a launch produces doctrine drift fast enough that records become the dominant output rather than the residue. The evidence would be three drift events inside one launch that each resolve to a record rather than a procedure, and the method should then be re-weighted toward B.
It is wrong if the pilot's vehicle classification proves unreliable, for which the measure is the commander overruling the choice twice.
It is wrong, and A is right whole, if the commander's construction goes far enough to rebuild the cockpit, at which point even procedures are short-lived and the correct move is to stop writing and keep flying.
