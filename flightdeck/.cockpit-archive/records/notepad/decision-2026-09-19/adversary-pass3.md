# adversary closing pass — T009 decision paper, revision 2 (99 lines)

Seat: `adversary`, team T009, mission M001. Checked against the text.

## F17 to F23

F17 closed at line 77, and the asymmetry between a web record's mechanical currency and a local record's is stated rather than hidden. See P3 and N1 below, which are about the mechanism it now carries.
F18 closed at line 61, with the three clauses in rule 2's own words, and the unasked-for risks entry at line 93 is the right addition — "the pilot still picks the validator, briefs it and reads its verdict" is the honest statement of what that control is worth.
F19 closed at line 67. See P2 and P4.
F20 closed at line 61, moved out of the risks and into the rule.
F21 rejected, and correctly. The commander's objection is to identifiers in a header, README line 5 is identifiers in a header, and line 63 now states the rejection and its reason on the record. My finding falls; I withdraw it.
F22 closed at line 65, both files named, with the stub indexing line added.
F23 closed at line 63. Three states with the stub's literal text, a mixed record carrying both lines with `Source:` first, procedures carrying neither. This closes N4 from my second pass.

## New

**P1 — Approving a trigger line is not approving a procedure, and the paper equates them. S-MEDIUM-HIGH · C-HIGH**
Line 63: procedures "carry neither: their authority is the commander's approval of their manifest line, which is the same authority by a cheaper route." It is not the same authority. Line 83 gives the commander's per-item cost for a procedure as "approve one manifest line", and line 73 says a manifest line "states a condition" and never a summary, so what the commander approves is when to open a file, not what the file says. Meanwhile line 69 has procedures state system facts sourced from the wide net, written by the pilot on the spot, with adversary review only when the pilot judges the matter structural. So the dominant output carries unreviewed content under a claim of commander authority. This is F1 returning in a new place: the specification is now there, but the authority line papers over the one gap the specification left.
What must change: drop "which is the same authority by a cheaper route", and say plainly that a procedure's content is not commander-approved and what stands in its place.

**P2 — Claim-level traceability now lives in a store the cockpit declares non-authoritative. S-MEDIUM-HIGH · C-HIGH**
Line 92: "It is not destroyed: the writer's working notes hold it in the notepad." Line 67 files them "in the notepad with the team's reports". `CLAUDE.md:25`, rule 3: "The notepad is scratch. `notepad/` holds tests, observations, opinions and crew reports. Nothing there is authoritative." So the sole surviving answer to "where did this claim come from" is held in the one store the cockpit says cannot be relied on, and nothing anywhere says the notes are retained for the life of the record they document. The auditor also found notepad material is written once and never reopened.
What must change: either rule 3 gains a named exception for validation working notes, or the notes get a retention clause tying their life to the record's. One sentence either way, and the recovery route at line 92 does not hold without it.

**P3 — The currency hook is a kind of source, so it either over-fires or becomes discretionary. S-MEDIUM · C-MEDIUM-HIGH**
Line 77 re-validates "any local record whose named source kinds have changed since that date — a new commander directive, a library revision, a manual rewritten". The stamp names kinds, not artefacts, by the commander's ruling. So any new directive changes the kind "the commander's directives" for every local record that names it, and a strict reading re-validates all of them, at one Opus seat each. The commander issues directives often — `orders.json` held 37 at last count and advice arrives most sessions — so either the review is expensive in exactly the way this decision exists to avoid, or the pilot decides case by case which records a directive touches, which is another self-assessment and is not in line 89's list.
What must change: say which it is. If it is judged, name it as judged and add it to line 89. A cheaper option is to re-validate only what the review reads anyway, and let the drift trigger carry the rest, which line 77 already has as the second path.

**P4 — Line 67 contradicts itself in four sentences. S-LOW · C-HIGH**
"It opens the sources itself, in full, never the writer's extracts" and then "the writer hands the validator its working notes, each statement against the source passage it came from". The notes are the writer's extracts. The reconciliation is real — used as a map, sources still opened in full — but the sentence as written forbids what the paragraph then requires, and this paragraph becomes text in `procedures/record-keeping.md`, where a later reader will follow one half or the other.
What must change: "never in place of the sources".

## Still open from the second pass

N1 now carries more than it did. Line 77 makes the currency review the whole answer to local-record staleness, and its only cadence remains "at the end of a run or a launch" — an event line 85 concedes has not yet happened. F4's periodic leg, F17's currency and P3's re-validation all wait on it. A second cadence that fires without a launch closes all three.
N2 unmoved: option F is still adopted at line 53 against `CLAUDE.md:9`, "Durable knowledge lives in the cockpit, not in a session", with the clause unnamed in the change list. Line 81 shows the right way to handle exactly this.
N5 unmoved and now sharper: line 73 makes commander approval the only limit on manifest growth, line 69 makes it the one check they see, and line 98 makes overruling it the only measure of classification. Three jobs, one act.
N6 unmoved: the delivery hypothesis at line 94 is measured by the pilot's own log and the pilot's own judgement.
N7 unmoved: the branch rule will sit in the guard, `commander.md:17` and auto memory, with no de-duplication line in the vehicle test.
N8 unmoved: "structural" at line 69 gates the only review procedures get and is the author's call; it belongs in line 89.
N3 is overtaken — the working notes are back, so the paper and the ruling agree again and no disclosure is needed. N9 I withdraw: with the notes filed alongside the team's reports there is a second route to the team, and a team id in the header is not worth the commander's objection to identifiers.

## Verdict

The recommendation stands and is close to done. Seven findings answered in the text, F21 rightly rejected, and the risks section now says three uncomfortable things about the method in the method's own voice, which is the mark of a paper that can be trusted in the parts it does not hedge.
The closing list for the commander is short: P1, because the dominant output should not claim an authority it does not have; P2, because one sentence decides whether the traceability recovery route exists; and N1, because three separate answers now wait on a launch this project has not yet flown.
P4 is a five-word fix. N2 is a consistency debt the paper's own line 81 shows how to pay. The rest are tightening and none of them should hold the paper back.
I would send it after P1, P2 and N1. Nothing here needs another round from me.
