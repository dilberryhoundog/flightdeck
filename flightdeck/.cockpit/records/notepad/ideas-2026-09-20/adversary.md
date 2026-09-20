# T010 adversary — closing pass on pass 9 (frozen)

Seat `adversary`, team T010, mission M001. Final round. Measured 2026-09-20 against the working tree; commands shown. Read-only; nothing written in the repository. Rounds: F (pass 5/6), G (pass 6), H (pass 7), K (pass 8), L here.

## Withdrawn in writing

- **My "not folded" list for the G round is withdrawn as stale.** The option-maker is right that our messages crossed twice. G1, G3, G4, G5, G6, G8 and G9 are closed in pass 8 and I have verified each in pass 9: two tables plus three declarations, 13 of 17 scriptable, frozen files exempted by a store listing with `kind` scoped to live manifests at 42 files, `branch-manifest` corrected to hand-maintained, a row per prefix with minting register and range, 509 plus 9 published, and the `S` reconciliation carried in the body. Nothing is owed on that round.
- **G1's reason stays withdrawn** — `P001` to `P012` are decidable by range under `P101`; the defect was the flat map shape, not the ids, and pass 9 states it correctly at the three-declarations bullet.
- **G9 stays withdrawn** — the three disputed `S` are `crew-manifest.json`'s, frozen; 67 stands.
- **K1 folded, and better than I put it.** R5 now reads "Correcting myself: ... all eleven are tracked in git, so removal is a working-tree change and the text stays in history. Worth doing early because it may answer question 1 cheaply, not because it is time-limited", and stage A has first place back.
- **K2, K4, K5 folded.** The guard's interpreter blind spot is in question 3 and in the orphan-branch section; the pin is gone for a probe with the choice deferred; E4's hidden cost and the stage split are stated, with E2 explicitly held open rather than defended a fourth time.
- **H1 to H5 folded, accurately.** I checked each against the file rather than the disposition.

## L1 — The two-tier ruling and X3 now contradict each other, and a third of the live corpus falls in the gap. High. High confidence.

Quoted, the pilot's ruling as recorded: "report **every** prose field whoever wrote it (pilot prose quotes the commander and no scanner sees the difference) ... The rename table holds only one-to-one renames on pointer fields in live files." Quoted, X3 and the order of change, unchanged: "**X3, one scripted pass** ... **518 edits, not 1230**" and "Any of it before stage A means 518 edits by hand."
Evidence: I split the live occurrences by file type. Of the 505 I can reach, **169 are in markdown** (DS 53, P 55, O 12, S 35, D 12, W 2), 280 in live JSON and 56 in `logs/topics/`. Markdown has no fields at all except a frontmatter block, and the cockpit has frontmatter in exactly five files today. So under the ruling there is **no declared pointer field the script can reach in any markdown file**, and all 169 are reported for review. The JSON 336 split further, pointer against prose.
The ruling is sound and I am not arguing with it. The arithmetic attached to X3 is what breaks: "one scripted pass" and "518 edits" describe a job the ruling forbids for a third of its own corpus. A refactor team reads the order of change, scripts 518, and either overrides the ruling silently or discovers mid-pass that two thirds of the number was never scriptable.
Cure: state X3's two halves and two numbers — a scripted pass over declared pointer fields in live JSON, and a reviewed pass over 169 markdown occurrences plus the JSON prose — and carry both figures wherever 518 currently appears.

## L2 — `by` is not a pointer field, and it is the example the rule's affordability rests on. High. High confidence. (Soft spot (a), answered.)

Quoted: "auto-repair **pure pointer fields only** (`id`, `file`, `ref`, `proposal`, `by`, `superseded_by`) ... all seven of `decisions.json`'s stale out-advice references sit in `by`, a pointer field, so they auto-repair and the prose is only ever read."
Evidence: the twenty-five values of `by` are: `commander` twelve times, carrying no pointer at all; `commander, session 4450a586` three times; `commander, executed by the pilot`; `commander, P010 decision line and session 4450a586`; `commander, P011 decision line`; and seven of the form `commander, commanders-desk/out-advice/DS00x.md`. That is a short pilot-authored prose field that sometimes contains a pointer, not a pointer field. Two of its values contain an identifier inside a sentence.
So **"pure pointer field" is not decidable from the data, and a per-type declaration does not rescue it** — the declaration for `by` would simply be wrong, in the one field the paper uses to prove the rule is affordable. This is the honest answer to the question you asked: the property you can declare is authorship, which the pilot has just ruled governs review rather than the script; the property you need for the script is narrower — a field whose whole value is a single resolvable token.
Cure: rename the tier from "pointer field" to "whole-value reference" and test it as such (`id`, `file`, `ref`, `superseded_by`, `proposal` pass; `by` fails and goes to the reported tier, where its seven references are repaired by a reviewer — still cheap, just honestly placed).

## L3 — Commander-authored markdown sits in a live room and the rule is silent on it. High-medium. High confidence. (Soft spot (c), with teeth.)

Quoted: the two-tier rule is specified entirely in terms of JSON field paths — "`id`, `file`, `ref`, `proposal`, `by`, `superseded_by`" and "freeze `orders.json.text`".
Evidence: `commanders-desk/out-advice/CA001.md` to `CA003.md` are the commander's own written instructions — O034 records them as "Written instructions on DS001" — and they live in a live room, not a frozen one. Between them they carry nine identifiers: CA001 has `DS001`, `P004`, `P005`, `P006`, `P007`; CA002 has `DS002`, `P008`; CA003 has `P009`. CA001's body opens with `## DS001` as a heading.
That is the fork nobody has named, and it sits in the room this whole paper is about. Freeze them as commander-verbatim and the commander's advice permanently cites documents that no longer exist under those names. Repair them and the pilot has edited the commander's written words — the thing `orders.json.text` exists to forbid.
There is a clean resolution and it needs saying rather than assuming: in the advice files the identifiers are **citations, not statements** — a heading naming the dossier being answered and a list of the proposals arising — which is the same distinction pass 9 already draws inside `orders.json` between a verbatim statement and a live pointer. On that reading they are repairable. But it is a ruling, and an unstated one is how a reviewer gets it wrong in either direction.
Cure: name the advice files explicitly in the field map, with the ruling that their identifiers are citations and repairable, and say so in the dossier so the commander can overturn it if that is not how they read their own file.

## L4 — Stage A needs no YAML parser, but the way it avoids one matters. Medium. High confidence. (Soft spot (b), answered.)

The answer to the question is yes, comfortably, and for a reason worth writing down. A reference checker works on **raw text**: an identifier is a string, and finding `Ds001` in a line needs no knowledge of whether that line is inside a frontmatter block. Field-level work is only needed for JSON, and `json` is in the Python standard library on `/usr/bin/python3` — the module the auditor found missing was `yaml`, not `json`. Where frontmatter genuinely must be addressed by field, the declared subset makes `^unit:` a line-prefix match inside `---` fences, which is a regex, not a parser.
The trap is the one adjacent to it. If stage A is python3 and stage B is Node, and stage A ever parses frontmatter, the cockpit acquires **two strict-subset readers in two languages that must agree exactly** — which is the divergence argument that removed psych as a runtime pre-check, arriving from the other side. Stage B's reader is the one the fixture set pins.
Cure: one line in stage A's description — it parses JSON and scans text, and parses no frontmatter; the single subset reader lives in stage B and is the only thing the fixtures pin.

## L5, L6 — two residues

The `decisions.json` audit is closed and the paper still calls it open: line 21 reads "quoted commander words inside them are not, and they are **marked for audit before the figure is final**". I scanned every quoted span in `decision` and `subject` across all twenty-five rows: three rows carry quotations (D018, D021, D024) and **no identifier appears inside any of them**. All 24 are repairable, the figure is final, and the audit can be recorded as done rather than pending. Low, high confidence.
`518` still stands where the corrected figure belongs, at X3 and at two places in the order of change, against the headline's "509 are repairable and 9 are not" — and per L1 it now needs to be two numbers, not one. Low, high confidence.

## Verdict

**Fit to distil.** Across five rounds every finding is folded or answered, three of mine are withdrawn on the option-maker's or the pilot's evidence, and the leanings rest on measurements the seats have each reproduced. Pass 9 is the first pass where I could find nothing wrong with a leaning — only with arithmetic and scope attached to leanings that are right.

**Residuals the dossier must carry as open, none of which blocks distilling:**
- **X3's scope and its number.** The two-tier ruling makes a third of the live corpus unscriptable; the dossier should carry two figures, a scripted pointer-field pass and a reviewed pass of 169 markdown occurrences plus the JSON prose, rather than the single 518 (L1, L6).
- **What the script's tier actually tests.** "Pure pointer field" fails on `by`, the rule's own affordability example; the testable property is a whole-value reference (L2).
- **Commander-authored markdown in a live room.** CA001 to CA003 carry nine identifiers and no rule covers them; the proposed ruling is that advice-file identifiers are citations and therefore repairable, and the commander should be given the chance to say otherwise (L3).
- **The unanswered commander questions themselves**, unchanged: question 3 blocks starting, and questions 4 and 5 gate stage B.
- **E2 for stage B**, explicitly held open by the option-maker, which is the right disposition and should reach the commander as open rather than as a leaning.
