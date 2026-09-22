seat: record-miner — T017, mission M002

# Record mining: teams, mistakes and the commander's takes

Scope read: `records/logs/*.md` (9 files), `commander/orders/` units on team/crew/roster/adversary/model/brief/dispatch plus manifest scan, `commander/decisions/De005,De009,De010`, `commander/desk/out/advice/CA001-CA003.md`, all `records/dispatch/cockpit/T001-T017.json` lessons arrays, `records/extracts/topics/teams-and-dispatch.json` and `crews-and-roles.json`, "Battle scars"/"Lessons" of `work/missions/M001-cockpit-setup.md` and `M002-self-sustaining-cockpit.md`. Widened twice on adversary findings, both direct filters over the full room rather than a keyword scan: `commander/orders/` and `commander/decisions/` for permission, write-boundary and guard units (grep, then `De010` added on re-check, source-adversary E15), and every dispatch's `lessons` array for cost terms (`jq` pattern given at section 4). A third pass swept `records/notepad/` (all subdirectories except this seat's own) for seat-level catches that never reached an order or a log line; it found none beyond what the M-lines already carry, using the pattern in section 5's closing note — a grep-based negative, not a claim that none exist. Sections 4 and 5 reference the IDs below (M=mistake, C=commander's take, W=what worked) by short paraphrase to fit the line cap; the full dated line with quote is in sections 1-3. Session logs are summaries and never used to claim something did not happen.

## 1. Mistakes

- M01 — 2026-09-18, none (pre-T pilot session, C009-C011 team) — crew defaulted every seat to Sonnet under an over-generalised rule 2 — cockpit-comber (C010) got a judgement task on Sonnet instead of Opus — primary: records/logs/2026-09-18_49f87e44.md (also Or019.json) — "Commander questioned why every crew member today was Sonnet."
- M02 — 2026-09-18, none — cockpit-comber went idle before the docs-scout's message reached it and judged the CLAUDE.md split sound from only two items — thin finding, phase reassigned to a fresh Opus judge (C011) — records/logs/2026-09-18_49f87e44.md — "went idle before the scout's message reached it and judged the split sound with only two items to move; too thin."
- M03 — 2026-09-18, none (C009-C011 team) — pilot shut down all three teammates as their first report landed — lost the second pass and back-and-forth the commander calls the killer function — primary: commander/orders/Or020.json (also records/logs/2026-09-18_49f87e44.md) — "Shutting down teammates as they finish interferes and removes the second pass and the back-and-forth, which is the killer function."
- M04 — 2026-09-18, none (C009-C011 team) — idle results from auditor and red-team truncated twice, at A9 and A12 — had to be resent in full on request, wasted rounds — records/logs/2026-09-18_8e74fffb.md:57 (corrected citation, source-adversary E17; the quote does not appear in 49f87e44.md, where it was previously filed) — "Idle results truncated twice (auditor at A9, red-team at A12); both resent in full on request."
- M05 — 2026-09-18, none — pilot told the commander agent-team tools were not loaded in this session, without checking its own record/claude-code/agent-teams.md — false claim corrected publicly — records/logs/2026-09-18_8e74fffb.md — "I looked for a TeamCreate tool, did not find it, and did not consult my own record. Lesson: check the records before claiming a capability is missing."
- M06 — 2026-09-18, T002 (research team) — two seats shared a name across teams, a dead seat revived when addressed — confusion; recurred at T006 verbatim — records/dispatch/cockpit/T002.json (also T006.json) — "two seats should not share a name across teams; a dead seat revives when addressed."
- M07 — 2026-09-18, T003 — team built before running the critique — every high finding landed against the plan rather than the files, rework — records/dispatch/cockpit/T003.json — "run the critique before building: every high finding was against the plan, not the files."
- M08 — 2026-09-18, T005 — a judgement seat placed on Sonnet was under-powered for the task — recurrence of M01/M02's model-choice mistake — records/dispatch/cockpit/T005.json — "a judgement seat on Sonnet was under-powered; crew rule 2."
- M09 — 2026-09-19, T009 — Or042 was left out of the adversary's brief — two adversary findings fell (invalid) because of the gap — primary: records/dispatch/cockpit/T009.json (also records/logs/2026-09-19_4450a586.md) — "two adversary findings fell because Or042 was left out of its brief."
- M10 — 2026-09-20, T010 — pilot relayed two fast Opus seats' findings live as they arrived instead of freezing the pass under attack — four crossings cost three extra passes — records/dispatch/cockpit/T010.json — "four crossings cost three extra passes."
- M11 — 2026-09-20, T010 — pilot inferred a commander rule from examples in an idea file and ruled on it — wrong ruling issued and walked back — records/dispatch/cockpit/T010.json — "the pilot misread a commander rule from an idea file and ruled on it (Ds); when the commander's rule is inferred from examples, ask what the rule is before ruling."
- M12 — 2026-09-20, T010 — pilot ruled against a commander design (manifest naming) that the commander had given reasons for — overreach into the commander's own decision — records/dispatch/cockpit/T010.json — "a design the commander gave reasons for goes back as options, not as a pilot ruling."
- M13 — 2026-09-20, T011/T013 — pilot redefined the commander's word "paperwork" as reference integrity in a dossier's opening paragraph, so the team built the wrong tool (stage A) — about 1,700 lines of tool code plus 800 of tests built, then set aside and rebuilt as T014's refit — primary: records/dispatch/cockpit/T011.json:36 (records/logs/2026-09-20_b27e6c01.md carries the same substance in different words) — "the pilot's spec was the defect, not the build... nobody downstream could see it."
- M14 — 2026-09-20, T011 — the pilot's "quiet mode" (act quietly, speak only when the commander's input is needed) drifted into deciding without the commander within the hour — commander called it out directly — records/dispatch/cockpit/T011.json — "quiet mode became deciding without the commander within the hour; a commander's question is answered and then the pilot waits."
- M15 — 2026-09-20, T015 — pilot ruled to dedupe identity.md/commander.md content out of the new agent body — commander reversed it; five builder passes, two the pilot's own reversals — records/dispatch/cockpit/T015.json — "the commander reversed the pilot's dedupe ruling: the body is to stand alone eventually."
- M16 — 2026-09-21, T015 — pilot sent the builder two harness claims as settled fact (effort fallback; CLAUDE.md not auto-loading) without measuring first — both wrong or incomplete; two of five passes were the pilot's own reversals — records/dispatch/cockpit/T015.json — "measure before ruling: the pilot twice sent the builder a harness claim as settled... and both were wrong or incomplete."
- M17 — 2026-09-21, T016 — the brief for a teammate named a cockpit root README.md that does not exist — wasted teammate effort chasing a bad reference — records/dispatch/cockpit/T016.json — "the brief named a cockpit root README.md that does not exist; glance at a path before briefing it."
- M18 — 2026-09-20, none (Rq014) — pilot wrote the agent-body build request alone instead of dispatching the mini-spec team the idea file specified — drift named, excused "this time" only — records/logs/2026-09-20_241bff25.md — "the pilot wrote the build request alone and had it attacked afterwards, where the commander's mini-spec.txt says a mini-spec team builds it... Passed this time only."
- M19 — 2026-09-18, none — an unnamed background subagent sorting records misclassified the commander's cc.keep file as scratch and missed content in two source files — caught only because the pilot verified before acting — records/logs/2026-09-18_8e74fffb.md — "It classed cc.keep as scratch; that is the commander's keep file and stays. It missed the 'Implication for the cockpit' section..."
- M20 — 2026-09-17, none — mission M001 declared complete after one pass — commander corrected: rudimentary structure is not a finished cockpit — work/missions/M001-cockpit-setup.md — "Declared the mission complete after one pass. The commander corrected this: the mission had only begun."
- M21 — 2026-09-18, none (S002 split) — seven Explore subagents dispatched at once at roughly 100k tokens each — large hidden token spend — records/dispatch/cockpit/T001.json — "Explore subagents cost about 100k tokens each; seven was a large hidden spend."
- M22 — 2026-09-21, none — launcher refused to start the rebuilt agent body because the running session still held the name "pilot" — session had to be ended to free the name — records/logs/2026-09-20_241bff25.md — "the launcher refused because this session still held the name pilot, so the session is ended to free it."

## 2. The commander's takes on teams

- C01 — Or019, 2026-09-18 — "Choose the model for the work" — one Sonnet recommendation was never a rule that all crew be Sonnet.
- C02 — Or020, 2026-09-18 — do not shut teammates down as they finish; the second pass and back-and-forth is "the killer function"; clean up only once the team itself is finished.
- C03 — Or028, 2026-09-18 — "small teams = good, arbitrary limits = bad"; wants an Anthropic-docs verifier seat.
- C04 — Or035, 2026-09-18 — adversary always runs on Opus: "Sonnet doesn't have the CPU power... takes extensively longer and sometimes busts."
- C05 — Or041, 2026-09-18 — teams are the pilot's number one feature; wants dispatch records, a dossier per agent, a crew manifest, named prebuilt rosters for repeat dispatch.
- C06 — CA001.md (Rq005), 2026-09-18 — teams and crews are distinct: "flightcrew doesn't know about teams. The teams belong to you."
- C07 — CA002.md (Rq008), 2026-09-18 — "the team needs strengthening" repeated four times: wants a topic extractor, a record writer, a discovery teammate, a comparer and a validator seat added to the record-mining line.
- C08 — Or054, 2026-09-20 — teams dispatch for internal or external work; "write is more of a role restriction than a location."
- C09 — Or016, 2026-09-18 — purpose framing: "flightcrew is the foundations of an orchestration system from claude code best practices. this is why the cockpit and your role exists."
- C10 — Or066, 2026-09-21 — "adversarial is the axis name, how well does the team review itself" — not a seat kind.
- C11 — Or066, 2026-09-21 — names a fourth team type where the commander enters a teammate's session directly; asks for the best name, "direct interview" or "commander at the seat."
- C12 — Or066, 2026-09-21 — team-builder comes before the mini-spec team; explore team-builder in T010's "in the room" shape.
- C13 — CA003.md (Rq009), 2026-09-19 — doubts pouring time into mining his own statements is worth it right now; prefers records built "on demand" when the pilot drifts or underperforms.
- C14 — Or044, 2026-09-20 — idea files are ideas, not orders: explore with the commander in the room through the pilot's seat, dossier once it settles.
- C15 — records/logs/2026-09-20_b27e6c01.md, 2026-09-20 — objects that a meeting was settling his ideas without him: "trying to settle ideas but is not consulting the idea maker."
- C16 — records/logs/2026-09-20_241bff25.md, 2026-09-20 — on Rq014, names the drift: a mini-spec team should write build requests, not the pilot alone; "passed this time only."
- C17 — Or030, 2026-09-18 — names the "teams built by mining dispatch records" epic mission himself, so congruent teams can be dispatched for particular tasks.
- C18 — Or017, 2026-09-18 — wants a manifest of teammate invocations (type, model, purpose) to see teammate shapes over time, superseded by Or032's team-level dispatch record.
- C19 — Or007, 2026-09-17 — "enforce the cockpit write rule mechanically; permission mode auto" — the write boundary is a hook, not a promise.
- C20 — De003, 2026-09-17 — the write rule decision itself: "Enforce mechanically. Implemented as the PreToolUse guard in the pilot's settings."
- C21 — Or011, 2026-09-18 — "You have my permission to access your .claude folder also for scratchpads etc. consider it a side room to the cockpit" — an explicit access grant, narrow and named.
- C22 — Or055, 2026-09-20 — the write restriction is a manual topic, not a CLAUDE.md line; names rule 12 "Team dispatch quiet mode"; "The guard (P012) is probably next session's work."
- C23 — De026, 2026-09-20 — "write is a restriction of role, not of place"; teams are dispatched for internal or external work and may write to the project, a launch or the cockpit inside a scope the pilot gives; the pilot links the team to the commander and records both.
- C24 — records/logs/2026-09-18_dcb75456.md, 2026-09-18 — on the T011 build going wrong, the commander's own remedy for a team failure was to add a seat: "the commander named the root cause as missing tooling and supplied it (mini-spec, commander-advocate)" — bears directly on the team-builder's case, since adding a missing seat is exactly its Maintenance function.
- C25 — De010, 2026-09-18 — the only record of the commander ruling on a found security defect rather than a boundary in principle: "Pilot's work: fix pilot.sh duplicate check (A1) and guard bypasses (A2); A3, A4, the stale-index batch and the sandbox finding at the pilot's discretion" (source-adversary E15).
- C26 — De004, 2026-09-17 — "Pilot permission mode: auto" — cited separately from Or007 (C19 quotes Or007's own wording of the same rule; De004 is its own decision unit).

## 3. What worked

- W01 — T001, 2026-09-18 — keeping the whole team alive to the end — "the second pass was where the value was."
- W02 — T002, 2026-09-18 — the certified research shape: readers, a writer that re-verifies, an Opus adversary, a docs verifier on raw pages, the pilot ruling.
- W03 — T002, 2026-09-18 — the writer contested the adversary with evidence and saved a correct sentence.
- W04 — T006, 2026-09-18 — the topic store caught a superseded claim the writer had just added, made every quote checkable with one command.
- W05 — T009, 2026-09-19 — the option-maker drafted from the start and revised on incoming reports, saving a round.
- W06 — T009, 2026-09-19 — reusing a live team for follow-on work cost no re-briefing — seats already held the rulings.
- W07 — T010, 2026-09-20 — holding the adversary until the option space was open: it attacked leanings, not half-formed ideas, and its last round found fault only in arithmetic and scope.
- W08 — T010, 2026-09-20 — the option-maker attacking its own paper while idle found three defects before the adversary did.
- W09 — T013, 2026-09-20 — two blind clerical readers and one judge settled in fifteen minutes what four adversary rounds never asked.
- W10 — T014, 2026-09-20 — the commander-advocate mini-spec check found ten drifts in a spec the pilot believed faithful, before anything was built.
- W11 — T014, 2026-09-20 — a builder that stops after every step for the pilot to verify and commit kept each step revertible.
- W12 — Or035, 2026-09-18 — putting the adversary on Opus held for the rest of the record; research found it keeps up where Sonnet busts or is slow.
- W13 — T009/T010, 2026-09-19/20 — relaying the commander's rulings to every seat at once kept the paper aligned and avoided stale-ruling waste.
- W14 — T010, 2026-09-20 — a seat added mid-flight on the commander's lead (assets-scout) paid for itself in one report.
- W15 — Or032/records/logs/2026-09-18_dcb75456.md — the dispatch/ folder recording whole teams with agents inside, not teammate-by-teammate, gave overview of team makeup and purpose, the commander's own idea, confirmed working through the rest of the record.

## 4. Sorted by axis

### Speed
M10, W05, W06, W09, C04

### Coverage
M03, W01, W14, W15, C02, C05, C07

### Quality
M01, M02, M05, M07, M08, M16, M17, M19, W02, W04, W11, W12, C01, C03

### Alignment
M09, M11, M12, M13, M14, M15, M18, M20, W10, W13, C06, C09, C12, C13, C14, C15, C16, C18

### Security
C08, C19, C20, C21, C22, C23, C25, C26 — the round-3 adversary (F23) flagged the earlier one-item count as an artefact of a scope filter (team/crew/roster/adversary/model/brief/dispatch) that structurally excluded the commander's permission and write-boundary statements; the orders and decisions rooms were re-swept for those directly. The round-4 adversary (source-adversary E15) found the first re-sweep still missed one unit inside the report's own declared scope, De010, the only place the commander rules on a found security defect ("guard bypasses", "the sandbox finding") rather than a boundary in principle; De004 is now cited as its own unit rather than folded inside Or007's quotation. Eight items now land here. The decisions-room filter (permission, write, guard, isolation, safety, security terms) returns six units total: De003, De004, De010, De019, De026, De027, all six examined; De019 (the shape of records) and De027 (advice-file and lint rulings) were read and excluded as not security statements, stated here rather than left silent (source-adversary E41). Restated: this is the record's team-topic-plus-permission-boundary subset, not proof security is thin in the cockpit generally — the guard (De003, C20) and rule 12 quiet mode (C22) are mechanical enforcement outside the team topic proper. `cockpit-audit.md`'s independent "security is the uncovered axis" finding (its own F16 shows that reading rests on an axis its own table never defines) should not be read as a second confirmation of this list; both trace to filters, not to an absence in the cockpit.

### Adversarial (how well the team reviews itself)
W03, W07, W08, C10

### No axis
M04, M06, M21, M22, C11 — communication/harness mechanics (seat-name collisions, idle-result truncation, session-name collision) and token cost sit outside all six axes. The round-3 revision undercounted cost; the round-4 sweep (source-adversary E16, `jq '.lessons[]? | select(test("cost|cheap|token|spend|expensive";"i"))'` over all sixteen dispatch units) returns six, not three: T001 "Explore subagents cost about 100k tokens each", T002 "rulings crossing with revisions cost rounds", T006 "lifting boundaries mid-run cost rounds", T009 "reusing a live team for the follow-on work ... cost no re-briefing", T010 "four crossings cost three extra passes", T014 "the cheapest proof that the guidance is enough". T016's "one cheap test seat" is not in a `lessons` array at all — it is `T016.json`'s `roster_note` field, so it is dropped from this count and cited by its real field instead. The six split into two kinds: token spend (T001, T014) against rounds of rework (T002, T006, T009, T010) — lumping them blurs what a cost axis would actually measure, so the seventh-axis question should be read as two candidate axes, not one.

## 5. Sorted by who could have prevented it

### Better roster/seat choice before dispatch
M01, M02, M08, M19, M21

### Better brief
M06, M09, M17, M18

### Better leading during the flight
M03, M04, M05, M10, M11, M12, M13, M14, M15, M16, M22

### Better review after
M20 — the only mistake here. The round-3 adversary (F22) is right that the stronger claim once made in this slot was survivorship: this whole list is mistakes that something caught and wrote down, so "review catches nearly everything" is true by construction and cannot be tested against this data. Corrected below by naming the actual catcher per mistake.

### Who caught it
Population, stated plainly (source-adversary E21, a second survivorship on top of F22's): this census counts only mistakes that reached the M-list — pilot errors serious enough that an order, a log line or a dispatch lesson names them. It cannot show whether well-briefed seats fail at a normal rate, because a seat's own bad execution, caught and fixed inside the same flight, leaves a trace only in a dispatch's `outcome` field, which the M-list was never swept against. That sweep now exists as a separate list right after this census (S01-S08, not M-ids, none renumbered) and recovers eight cases, including twenty-two seat-caught pilot errors that were sitting one level down, filed as W10 or folded into M18's count rather than counted as catches in their own right.

Counted from the M-lines above, each verified at its primary source rather than at this report's own prior rendering (round-4 adversary, source-adversary E11-E14, E17-E18, found four rows filed against the wrong party or the wrong quote). Two counts, kept separate per E19: 22 M-ids, and 23 occurrences (M06 covers two, T002 and T006; the rest are one each). Section 7's per-dispatch table carries 18 of the 23 occurrences, the ones with a T-id; the other 5 (M05, M18, M19, M20, M22) name no dispatch and sit outside that table. The census below is over the 22 ids.

- The commander (7): M01 "Commander questioned why every crew member today was Sonnet"; M03 "Shutting down teammates as they finish interferes... the killer function" (Or020); M11 (T010, "the pilot withdrew its ruling against Ds, having misread the commander's identifier rule", `records/logs/2026-09-20_b27e6c01.md:21`); M14 "quiet mode became deciding without the commander within the hour"; M15 "the commander reversed the pilot's dedupe ruling"; M18, moved here from review seat (source-adversary E11): C16 and `records/logs/2026-09-20_241bff25.md:33` read "corrected by the commander three times: the build request should come from a mini-spec team..."; the commander-advocate's Rq014 run is a `.subagents[]` row in `T015.json`, not a `T014` seat, so the earlier dispatch id was also wrong; M20 "The commander corrected this."
- A review seat (3): M07 (T003's critique found every high finding against the plan); M09 (the adversary's own findings falling exposed the Or042 gap); M12, moved here from commander (source-adversary E12): `records/logs/2026-09-20_b27e6c01.md:21`, "took F5..., F7 (manifest naming returns to the commander, the pilot overreached)" — the adversary's F7 caught it, the commander only ruled on it after.
- Joint, three parts that settle separately (1): M13 — the record's costliest miss and the row the team-builder's case rests on most. Origin: `T012.json`'s outcome, "Both verdicts confirmed the commander's instinct" — he suspected it before either seat reported. Evidence: `T013.json`'s outcome, "Verdict no: what was built does not deliver what the commander advised. 47 advised items against 28 built ... Drift point named: Ds006 line 11" — two review seats did the work. Act: `T011.json`'s outcome, "Set aside by the commander after T012 and T013" — the commander's decision. Source-adversary E26 settles it this way; `adversary.md` F22 named only the act, this census (round 3) named only the evidence, and neither was wrong so much as partial. The count above credits this row once, under "joint", which states that a triad exists without picking one part as the catch.
- The pilot's own verify (6): M02, moved here from "nobody until later" (source-adversary E18): `records/logs/2026-09-18_49f87e44.md:15`, "too thin. Both shut down. Phase 2 reassigned..." — a reassignment inside the same session is a catch, and the pilot was the only party positioned to make it; M04, moved here from mechanical (source-adversary E17): the quote reads "resent in full on request" — a request is a party asking, not a mechanism firing; M05 "did not consult my own record"; M16 "measure before ruling... two of the five passes were the pilot's own reversals"; M17 (glance at a path before briefing it, caught on inspection); M19 "Verified before acting. It classed cc.keep as scratch."
- Mechanical/another seat (1): M22 (the launcher itself refused the duplicate session name).
- Nobody until later, recorded only as a lesson with no catching event (4): M06, moved here from mechanical (source-adversary E42): neither `T002.json`'s lesson nor `T006.json`'s, where the same mode recurred, names a catcher — "caught in-flight by the team" was an inference of the kind E14 already retired for M08; M08, moved here from commander (source-adversary E14): the rule-2 correction happened at `Or019`, before `T005.json` was recorded; T005's own lessons name no catcher, they cite the rule after the fact; M10 (the crossing cost noted after the fact); M21 (the token spend "a large hidden spend," noted post-hoc).

Mode-collapsed view, on request (source-adversary E25): M01, M02 and M08 are one failure mode (a judgement seat placed on Sonnet, closed by crew rule 2). Collapsed, the census runs over 20 modes instead of 22 ids. It does not move the commander's total: M08 already left the commander's column on its own lack of evidence (E14) and M02 already moved to the pilot's-own-verify column (E18), so the only mode-member still crediting the commander is M01, and collapsing the other two into it changes nothing there — the commander stays at 7 either way. The collapse does still lose information within the mode: the three occurrences were caught three different ways (commander, the pilot's own reassignment, nobody until the rule was cited after the fact), and a mode-level table would have to pick one or mark the row mixed. Both views are kept: id-level as the census, mode-level as this note.

The net commander/review-seat totals (7 and 3, plus the one joint row) are close to the prior pass's 8 and 4, reached from a different and now source-checked set of rows (E11 and E12 moved one mistake each in opposite directions). No collective ranking is stated (source-adversary E38, withdrawing the previous close): the population statement above already says this census is biased against review-seat catches, and the S-list right below shows the bias is not small — S07 and S08 alone are a review seat catching ten and twelve pilot errors, which on the same footing as the commander's seven would put review-seat catches ahead of him for this flight. What the population does support: "the commander catches more than any single review seat" holds per seat, because no one review seat in the census reaches seven; "review seats are second" collectively does not, and is not claimed. The one clean joint case, M13, is the shape the commander's fourth team type would formalise — evidence for, not proof of, that design.

### Seat-execution failures and in-flight catches (not M-ids)
Two different questions, kept as two lists with their own counts (source-adversary E40 — the first draft ran both under one heading and one method sentence, which answered neither cleanly). Source class stated per entry: most are a dispatch's own `.outcome` field; two are notepad findings files that a dispatch's outcome does not itself carry (source-adversary E39). None of these are M-ids and none of the M-numbering above is changed by adding them.

**A seat doing its job badly, caught inside the same dispatch** (8):
- S01 — T001, outcome — pilot corrected several factual claims only on the second pass: wrong branch tip, a false "spec-altitude deleted" claim, an interfaces-rewrite claim that never reached the tip, two remote-lag figures, a false "no local branch named origin" claim — "Second pass changed both readers' reports materially."
- S02 — T002, outcome — three seats executing badly in one dispatch, all self-caught: "Adversary withdrew four findings (false framing under a true id; true claim called overreach; correct code claim challenged on a header comment; verbatim quote called fabricated after stopping at the first match). Writer caught its own reversed model-tier claim. Verifier discarded its first pass after the fetch summariser invented a figure." (closes source-adversary E22, which named this exact outcome as the sort's blind spot)
- S03 — T003, outcome — "Second passes found seven pointer breaks from the dispatch rebuild, all fixed."
- S04 — T006, outcome — "The writer's script found one wrong citation in 83 that four passes had not" — four rounds of seat review missed it; a verification script caught it.
- S06 — T009, outcome — "Auto memory and hook enforcement were missing options until the adversary named them" — a gap in the option-maker's paper, caught by the adversary.
- S09 — T016, outcome (added, source-adversary E39) — "The cockpit CLAUDE.md reached it as a nested_memory attachment, not in the system prompt as it claimed. Verified by the pilot on disk." A seat misreported its own system prompt; the pilot caught it by reading the transcript — the cleanest seat-execution failure in the record, in the one dispatch whose entire purpose was to test a seat.
- S10 — T006, outcome, itemised (source-adversary E39) — "Two over-broad supersessions caught and narrowed" within the same team's own drafting pass.
- S11 — T009, outcome, itemised (source-adversary E39) — "one adversary pass (four findings taken, three withdrawn once it saw Or042)" — the adversary withdrew three of its own four findings once the missing order was supplied to it mid-flight.

**A pilot-side error, caught by a seat** (3):
- S05 — T008, outcome — "a seat's identity written by hand into four files and already drifted three times" before fit-critic and trim-critic caught the structural cause and fixed it; the convention was the pilot's, the drift was the seats', the catch was two seats'.
- S07 — T014, notepad file (not the outcome field, source-adversary E39: `T014.json`'s outcome carries only the advocate's final run, not this) — the commander-advocate found ten ranked drifts against the pilot's own spec before anything was built, `records/notepad/refit-2026-09-20/advocate-spec.md`, drift 1: "Stage A is removed; he said keep it ... the one place the spec contradicts an order in plain words." Recorded elsewhere in this report only as W10, under "what worked" — a pilot error a seat catches, filed as a success story rather than a mistake (source-adversary E21).
- S08 — T015, notepad file (not the outcome field, source-adversary E39: `T015.json`'s outcome does not mention this run) — the commander-advocate's second run, twelve more findings against the pilot's own Rq014 build request, `records/notepad/agent-body-2026-09-20/advocate-rq014.md`, F2: "The lint line is the thing the commander said not to do, and his decision is handed back to him as a question." Recorded elsewhere in this report only as the count folded inside M18 (source-adversary E21).

Origin, as distinct from catcher, on the two M-ids source-adversary checked directly (E23, E24): M21 (Explore subagent token cost) is seat-side at origin — `T001.json`'s `subagents` row reads `spawned_by: lineage-historian (5), runs-recon (2)`, two seats chose to spawn them, not the pilot, and nothing in the unit records a brief that told them to; M02 (the thin cockpit-comber judgement) is pilot-side at origin — `T005.json`'s own first lesson, "a teammate that must wait for another's message needs that said in its brief," names a briefing omission, not a seat's own execution failure. Both M-ids stay where they are in the mistakes list and the catcher census above (origin and catcher are different questions), but a reader sorting by whose fault it was, not who caught it, should use this line rather than either list's position.

Notepad sweep for uncaught catches: `grep -rliE "I (was wrong|caught|erred|misread)|withdrawing|withdrawn my|reversed my|retract|my own (mistake|error|defect)|note to self"` over every `records/notepad/` subdirectory except this seat's own, roughly 50 findings files across nine dispatch folders. One genuine hit not already an M-id: `records/notepad/ideas-2026-09-20/paper-final.md:172`, "**Withdrawn:** my ruling against `Ds` (O047 states a rule I misread), and my ruling dropping `MANIFEST-<room>`, which overturned a commander design" — this is the pilot's own self-filed withdrawal of the same two rulings already carried as M11 and M12, not a new mistake, and it corroborates M12's move to the review-seat/commander split above rather than adding a row. No catch turned up that never became an order or a log line. This is a grep-based sweep over a stated pattern, not proof that no such catch exists in prose the pattern does not match.

## 6. Recurrences

- Model choice for judgement work (Sonnet under-powered) recurs at M01, M02, M08 — three occasions before Or035 (adversary always Opus) settled the general case.
- Incomplete briefing (missing a live order, a nonexistent path) recurs at M09 and M17, both named "brief it fully" as the fix.
- The pilot deciding or ruling beyond its role without the commander recurs at M11, M12, M14, M18 — across T010, T011 and the 2026-09-20 build request, each time corrected after the fact.
- Two seats sharing a name across a team recurs at M06, stated as a lesson twice (T002 and T006) without being fixed between them.
- The value of keeping a team alive for its second pass is stated as both a commander order (C02) and an independent team finding (W01, W06) — a rare case of the same lesson landing from both directions.

## 7. Rostered versus improvised

Per-dispatch shape (rostered = named `roster`; improvised = `roster_note` says no roster fits; neither = neither field, all three predate or bypass the roster system), its M-mistakes, and its passes/rework from the dispatch's own `outcome`. T017 excluded, in flight.

- T001 — rostered (recon) — M21 — one extra full pass; two hand-back failures noted in outcome.
- T002 — rostered (certified-research) — M06 — one session; four adversary findings withdrawn, one self-caught reversal, no extra pass. Classified here by the `roster` field's presence, stated plainly as that; `cockpit-audit.md` reads the same field's history as "unresolved between two readings" (whether a `certified-research` roster unit ever existed as a saved file). Both readings are defensible from the same file; the pilot's call, not either seat's.
- T003 — rostered (mini-adversary) — M07 — plan reshaped; second pass found seven pointer breaks.
- T004 — neither/one-shot (recorded retrospectively) — M03, M04 — premature shutdown; two truncated idle results.
- T005 — neither/one-shot (recorded retrospectively) — M01, M02, M08 — thin phase 1 needed reassignment to a second judge pass.
- T006 — rostered (topics-and-records) — M06 (recurs) — two supersessions narrowed; four pilot errors caught by seats; one citation error found on a fifth pass.
- T007 — neither/one-shot (doc-reviewer) — none — one pass; four defects fixed before drafting.
- T008 — rostered (mini-adversary) — none — one pass; both critics converged.
- T009 — rostered (decision) — M09 — 23 findings answered same session; extended with three more passes after approval.
- T010 — rostered (decision) — M10, M11, M12 — eleven paper passes, five adversary rounds, three pilot ruling reversals.
- T011 — improvised (no roster fits) — M13, M14 — whole build (~2,500 lines) set aside by the commander after review.
- T012 — rostered (mini-adversary) — none — one pass; confirmed the commander's instinct.
- T013 — improvised (two clerical readers, one judge) — none (this team found M13) — one pass, fifteen minutes; caught what four adversary rounds missed.
- T014 — improvised (mini-spec/commander-advocate flown first time) — none — seven clean commits; six small fixes after acceptance.
- T015 — improvised (builder plus docs verifier) — M15, M16 — five builder passes, two the pilot's own reversals.
- T016 — improvised (one cheap test seat) — M17 — one pass; bad path in the brief.

Rostered: 8 dispatches, 8 mistake-occurrences (T008, T012 clean). Improvised: 5 dispatches, 5 mistake-occurrences (T013, T014 clean), but also the two most efficient catches in the whole record (T013, T014) and the record's single costliest discard (T011). Neither/one-shot: 3 dispatches, 5 mistake-occurrences concentrated in the earliest two (T004, T005), before crew rules 2 and 6 existed. (Corrected from the first pass, which stated 7 and 6; round-3 adversary F24 — both errors ran in the direction that flattered rostered teams.)

Verdict: **cannot tell**. Confounds dominate the comparison: date (T004/T005's mistakes predate the model-choice and keep-teammates-alive rules that later fixed the same failure mode), team purpose (build dispatches — T011, T015 — carry more rework than review or critique dispatches regardless of roster), and most of all the pilot's own errors (M09-M12, M15-M18 are misreadings, ruled overreach or bad briefs, not team-execution failures, and they land on both rostered and improvised dispatches alike). The record does not support "rostered went better": improvised teams produced the fastest, cleanest catches (T013, T014) as well as the costliest miss (T011), and rostered teams still carried three of the pilot's own ruling reversals in one dispatch (T010). The commander has separately ruled this comparison uninformative: "rostered teams wont be any better because we haven't focused on building rostered team beyond a few place holders. this team will change that" (Or070, 2026-09-21) — today's rosters are placeholders, so the arithmetic above is corrected and left there rather than pressed further.

## 8. Lead duties for this seat

Answered from this flight's own dispatch (T017), not in general, per the commander's Or072.

1. At dispatch, cannot work without: the exact read scope as an enumerated list (question.md gave file paths and globs directly, not a description to interpret), the single write path, and a hard line cap. All three arrived complete in the first message; nothing was missing.
2. While active: send one deliverable per message, each with its own scope and cap, as the two follow-ups did (the rostered/improvised addition, then the adversary revision); when another seat's output bears on mine, name the finding and quote it rather than forwarding its raw file (as the adversary findings were relayed, F22-F29 verbatim); otherwise leave me alone between dispatches — no check-ins needed.
3. Idle with nothing assigned: I hold position and answer only what is asked, per the brief's own "stay available for follow-up questions." That line was sufficient; nothing more was needed from the lead.
4. One cost this flight: my first SendMessage addressed "pilot" and bounced — "'pilot' is this process's own main session... from inside it, address the main conversation as 'main' instead" — one wasted round-trip before the summary reached anyone. A lead's own address for its seats should be stated once at dispatch.
