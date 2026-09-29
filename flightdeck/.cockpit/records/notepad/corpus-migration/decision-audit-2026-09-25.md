---
type: "Notepad"
unit: "decision-audit"
stamp: ["2026-09-25", "commanders-advocate", "f6216b95"]
work: "M002"
context: ["CO-113", "XD-012"]
---
# Decision audit, 2026-09-25

Audit of the draft decisions XD-007 to XD-012 against the constitution and every commander record. Narrowed on the pilot's word mid-run: the frozen XD-001 to XD-006 were read but are not reported on. Every claim below was checked at the file.

## The record the commander means

**CA-015, third statement** (`records/commander/advice/pilot-records/CA-015.json`): "Each decision unit must represent a single conduct or action the pilot will make, they can also include any other reasoning that may accompany the decision unit. All conduct and actions that comprise the decision must be included to ensure full pilot transparency."

It is the only commander record that asks for reasoning inside a decision. It is not integrated anywhere:

- `base/verify/schema/pilot-decision.json` does not mention it. The schema describes the flags, the approval and the draft count, and says nothing about what a unit must contain. Nothing in the lint can catch it, and `cockpit-lint` passes all twelve decisions clean.
- No decision states its reasoning throughout. Counted by unit, the units that give no reason for the conduct they name: XD-007 three of five, XD-008 three of four live units, XD-009 six of six, XD-010 five of seven, XD-011 six of seven, XD-012 three of four. XD-009 is the worst: not one of its six units says why.
- The second half of the statement, that all conduct and actions comprising the decision must be included, is also unmet where a decision names a target but not the acts that reach it (XD-011, D5.1).

Fix: add the requirement to the schema description and to the decision procedure when it is written, then redraft each decision so every unit reads as one action plus its reason.

## Findings

### D1 — XD-007, pilot tools (answers CO-089)

1. **CA-015 st.3 · lines 15, 17, 19 · drifts.** Three units state conduct with no reasoning: the tool list, the clerk-task rule and the `claude -p` rule. Fix: give each unit its reason, as line 16 and line 18 already do.
2. **CA-015 st.3 / CO-104 · line 15 · drifts.** The unit holds the tool set and four separate mappings (a filing is a write, a manifest row an edit, a file search a glob, a flag search a grep). The commander's note in XD-010 says he cannot deny one action bundled with wanted ones. Fix: split the mappings out or drop them to prose.
3. **CO-109 · line 19 · drifts.** The unit withholds `claude -p` until granted back, which matches the retired CO-109 at `records/commander/orders/retired/CO-109.json`. But `MANIFEST-orders.json` still carries CO-109 as `"status": "active"` with `"path": "CO-109.json"`. The decision reads as contradicting a live order. Fix: set the manifest row to retired with the retired path.

### D2 — XD-008, one decision each (answers CO-090)

1. **CA-015 st.3 · lines 15, 16, 17 · drifts.** No reasoning on any of the three.
2. **Struck unit still in force · line 20 · contradicts.** The commander struck "Every CO, CQ and CI row carries `answered_by` ... (CN: Too much footprint, for little gain)". The conduct is running anyway: 58 commander record files carry an `answered_by` field, and `MANIFEST-orders.json`'s convention states "Every order is answered by a pilot decision (XD), named in the answered_by field once written." Fix: either strip `answered_by` and the convention sentence, or put the conflict to the commander as a dispute before the next draft.
3. **CA-015 · line 18 · drifts.** Three rules in one unit: when an order is answered, that a waiting order is open, and that CA-051 is the test. Fix: split into two units.

### D3 — XD-009, no residue (answers CO-091)

1. **CA-015 st.3 · lines 15 to 20 · contradicts.** All six units are bare assertions with no reasoning and no statement of who acts. This is the clearest case of the unintegrated record.
2. **CA-015 · line 18 · drifts.** One unit carries three separate renames: the dash and a name for Ds007, Ds008, T018, T019; Rq013 to Rq015 becoming XR; P001 to P006 becoming PP. None can be struck alone. Fix: three units.
3. **CA-049 · line 18 · drifts.** CA-049 says all records carry a one to three word name, and its context says records filed before the advice keep bare id file names "until a clerk renames them". The decision schedules the rename only for records under the current prefixes that lack the dash. The bulk of the corpus is still unnamed: CO-085 to CO-111 and CA-003 to CA-047 have neither a `name` field nor a name in the file name. Fix: add a unit scheduling the clerk rename of the whole corpus, or state that the commander has excused it.

### D4 — XD-010, disputes name records (answers CO-111)

1. **CA-015 st.3 · lines 15, 16, 18, 21 · drifts.** Four units with no reasoning. Lines 17 and 20 do give it.
2. **CA-047 · line 18 · drifts.** CA-047 also grounds a dispute in a record duplicating another of the same kind in part or full. The unit fixes what a side may be, but nothing in the decision or in `base/verify/schema/pilot-dispute.json` carries the duplicate ground, so no dispute is raised on it. Fix: add a unit carrying CA-047's duplicate ground into the dispute shape.
3. **CO-093, CO-110 · line 13 · cosmetic.** "The rewrite of the nine disputes under draft 1 is done and stands unless a unit below is struck" is session bookkeeping inside a permanent record. Fix: move it to the shift log and keep the page to conduct.

### D5 — XD-011, rooms refactor (answers CO-112)

1. **CA-042 · line 15 · contradicts.** The target list stops at the top level and the second level. CA-042's third sentence names the record rooms too: `records/commander -> orders/, advice/, questions/, ideas/, responses/` and `records/pilot -> decisions/, requests/, dossiers/, disputes/, plans/, procedures/`. `records/commander/responses/` does not exist today, so the refactor as written would leave CA-042 unmet. CA-042 also does not list `work/procedures/`, which exists and whose fate the decision never states. Fix: extend the target to CA-042's record locations and say what happens to `work/procedures/`.
2. **CA-015 st.3 · lines 15, 18, 19, 20, 22 · drifts.** Five units with no reasoning. Lines 16 and 17 give it.
3. **CA-015 · lines 17, 21, 22 · drifts.** Line 17 bundles keeping content, repointing nine kinds of file and a clean lint. Line 21 bundles three seats. Line 22 bundles the dispatch, the dossier and the CLAUDE.md rewrite. Fix: one action per unit.

### D6 — XD-012, decision audit (answers CO-113)

1. **CA-013, CO-100 · line 13 · contradicts.** "The audit is read-only, so the pilot dispatched it on filing this decision rather than waiting for approval." CO-100: every pilot record starts as a draft subject to change. CA-013: full acceptance freezes the record and only then does the pilot proceed. Being read-only is not an exception the commander has written. Fix: strike the sentence and put the early dispatch to the commander, or ask for a standing exception for read-only work.
2. **CO-105, CA-031 · whole page · drifts.** CO-105 requires a dispute filed and the commander told whenever the pilot or crew finds a contradiction; CA-031 says the advocate records the contradictions it finds. The decision routes every finding to a redraft and to the notepad, and never says a contradiction becomes an XX. Fix: add a unit sending contradictions to `records/pilot/disputes/`.
3. **CA-015 st.3 · lines 15, 16, 18 · drifts.** No reasoning. Line 17 bundles two actions, the redraft and the notepad filing.

## The decisions manifest

`records/pilot/decisions/MANIFEST-decisions.json` holds twelve rows for twelve files, every path resolves, and for XD-007 to XD-012 the id, name, status, draft, approval and answered record all match the file. Two small drifts: `"updated": "2026-09-24"` while it carries rows stamped 2026-09-25; and the rows for XD-001 to XD-006 omit `draft` although XD-001 is on draft 3. Both cosmetic. `cockpit-lint` passes all twelve decision files.

## Commander records that bear on these decisions and are fully applied

- CA-015 first two statements, and CO-104: every draft opens its units `+`, names the flag rule in its preamble, and the struck unit in XD-008 stays on the page frozen.
- CO-090: every draft names exactly one record in `answers`, and `pilot-decision.json` caps the array at one.
- CA-049: XD-007 to XD-012 each carry a one to three word `name` in frontmatter.
- CA-048: the extraction marker is on every flag in these pages, `CA:{Extracted: CA-052}`, `CA:{Extracted: CA-055}`.
- CA-055: the commander's CN notes in XD-008 and XD-010 are left inline and not extracted, which is what CA-055 requires.
- CA-050: XD-010 line 21 carries the closing sync whole.
- CA-051: cited and applied in XD-008 line 18 and XD-009 line 19.
- CA-043: XD-011 line 18 sorts manuals into operators and technical as CA-043 defines them.
- CO-108: XD-011 line 19 nests the notepad by mission.
- CA-030, CA-031: the clerk and the advocate are used in XD-011 and XD-012 as the records define them, Sonnet clerk, Opus advocate, standalone.
- CO-089: XD-007 carries the order whole, including the grep grant in the amended statement.
- CA-013 part approval: XD-007 to XD-010 each count their draft up and say they were remade against the commander's updated records, with no claim about which parts he accepted.
- CO-093, CO-110: the drafts are in plain language. No glossary term is approved yet (all 73 bullets in `base/GLOSSARY.md` still carry `-`), so terms such as clerk, seat and dispatch are used on sufferance rather than in breach.
