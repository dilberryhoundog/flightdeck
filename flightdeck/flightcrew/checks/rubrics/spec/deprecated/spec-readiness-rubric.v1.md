# Spec-Readiness Rubric v1.0

**DEPRECATED**

This rubric judges whether a draft specification is ready to freeze. The standard it derives from is the written definition of a spec — the nine domains, their contents, and the contributor invariants — so the questions below ask nothing that standard does not already claim; they only make each claim answerable with a quotation from the draft.

It runs in two parts, in order. The linter is scripted: deterministic and property checks that need no judgment, only the draft and read access to the repository it references. A draft that fails any linter check is returned to its authors unjudged, because judging a structurally broken document wastes the expensive instrument on findings the cheap one already made. Only a linter-clean draft reaches part two.

## Part one — the linter

Every entry is pass/fail by script; the final two report warnings without gating.

- **All nine domain sections present** — each of the nine headings found once; an intentionally empty domain contains the phrase "empty by decision" and a reason.
- **Open questions empty** — the open questions section contains no items.
- **Behaviours numbered without gaps** — identifiers B1…Bn sequential; edge cases E1…En likewise.
- **Scope contains an explicit exclusion** — the out-list has at least one entry.
- **Named code artefacts exist** — every file path, type, function and command name in the interfaces and verification sections resolves in the repository.
- **Verification commands run** — each named command executes in the repository (allowed to fail its assertions on a draft; not allowed to be unrunnable).
- **Every behaviour and edge case is claimed by verification** — each B and E identifier appears at least once in the verification section.
- **A path boundary is stated** — the definition of done names the paths the change may touch.
- **Check class tags present where required** — if the spec declares its product agent-shaped, every behaviour carries exactly one class tag.
- *(warning)* **Impression words** — occurrences of "properly", "gracefully", "appropriately", "clearly", "handles well", "robust" are listed for part two's attention.
- *(warning)* **Length outliers** — any behaviour or edge case over three sentences is listed; long entries are often two decisions.

## Part two — the judged rubric

Rubric version: 1        
Standard: the nine-domains (description) document; the verification addendum where the product is agent-shaped Judge   
receives: this rubric; the standard named above; the draft spec. Nothing else — no interview transcript, no kickoff prompt, no author commentary.  
Material: the draft spec at a stated commit, after a clean linter run.   
Sampling rule: where a block says *sampled behaviours*, take the first, the last, and the three longest by word count; if the spec has seven or fewer, take all.

### GEN — contributor invariants hold

- QGEN.1 (critical) Is the draft free of run-conduct content — tools, agents, gates, displays, model choices? (quote any violating line, or state none found)
- QGEN.2 (critical) Where a domain is empty, is the emptiness stated as a decision with a reason? (quote each such statement, or state no empty domains)
- QGEN.3 (advisory) Is the draft free of duplicate statements — the same requirement expressed in two domains? (quote both instances of any duplicate, or state none found)

Pass: QGEN.1–QGEN.2 yes.

### INT — intent

- QINT.1 (critical) Does the intent state an outcome — a condition that will be true — rather than an activity to perform? (quote the outcome phrase)
- QINT.2 (critical) Does it state why the outcome is worth having? (quote the reason)
- QINT.3 (advisory) Would the intent still be satisfied by a materially different implementation? (quote the wording that keeps it implementation-free, or the wording that doesn't)

Pass: QINT.1–QINT.2 yes.

### SCO — scope

- QSCO.1 (critical) Does the out-list name at least one adjacent, tempting expansion — something a helpful implementer would plausibly reach for — rather than only remote irrelevancies? (quote that exclusion)
- QSCO.2 (critical) Is every in-list entry a concrete surface, feature or file the work touches, rather than a restated goal? (quote any violation, or state none found)

Pass: both yes.

### CON — constraints

- QCON.1 (critical) Is each constraint stated as a checkable condition — a limit, a target, a rule — or explicitly marked unmeasurable with a reason? (quote any vague constraint, or state none found)
- QCON.2 (critical) Are constraints conditions on the result rather than steps to take? (quote any step-shaped constraint, or state none found)

Pass: both yes.

### IFC — interfaces and contracts

- QIFC.1 (critical) Is every seam stated exactly — a signature, schema, format or shape — rather than described in prose? (quote any described-only seam, or state none found)
- QIFC.2 (critical) Does every reference to an existing type or shape say it is reused by name? (quote any reference that leaves reuse open, or state none found)

Pass: both yes.

### BEH — behaviours

- QBEH.1 (critical) Does each sampled behaviour state an observable outcome from outside the system, with its input and its result identifiable in the sentence? (quote each sampled behaviour; name its input and result)
- QBEH.2 (critical) Is each sampled behaviour a single decision — one condition, one outcome? (quote any behaviour carrying two, or state none found among the sample)
- QBEH.3 (critical) Is each sampled behaviour free of impression words, including any the linter flagged? (quote survivors, or state none found)
- QBEH.4 (advisory) Could each sampled behaviour be falsified — is there a describable result that would violate it? (for each, state that violating result in one line)

Pass: QBEH.1–QBEH.3 yes.

### EDG — edge cases and failure modes

- QEDG.1 (critical) Does each edge case state the exact outcome when the case occurs, rather than a concern that it might? (quote any concern-shaped entry, or state none found)
- QEDG.2 (critical) Do the edge cases include at least one uncooperative-world case — unavailable dependency, unauthorized access, or malformed input — and not only boundary values? (quote one such entry)
- QEDG.3 (advisory) Does each sampled behaviour have at least one edge case interrogating its boundary? (name any sampled behaviour with none)

Pass: QEDG.1–QEDG.2 yes.

### PRI — prior decisions and non-goals

- QPRI.1 (critical) Is each entry a settled decision or a deliberate deferral — something not to re-open — rather than a new requirement in disguise? (quote any requirement-shaped entry, or state none found)
- QPRI.2 (advisory) Does each rejected alternative carry its reason? (quote any reason-free rejection, or state none found)

Pass: QPRI.1 yes.

### VER — verification

- QVER.1 (critical) Does the end-to-end proof exercise the result the way its user would — invoking it whole, not assembling unit results? (quote the proof's steps)
- QVER.2 (critical) Does the section state whether checks pre-exist and are locked against the producing work? (quote the statement)
- QVER.3 (critical, agent-shaped drafts only) Is each behaviour's check class the cheapest that can falsify it — no judged tag where a transcript grep or property check would do? (quote any over-tagged behaviour, or state none found)

Pass: all applicable yes.

### DOD — definition of done

- QDOD.1 (critical) Is every gate condition traceable to an earlier section — nothing appearing for the first time at the gate? (quote any orphan condition, or state none found)
- QDOD.2 (critical) Does the stated path boundary agree with scope's exclusions — nothing excluded by scope lying inside the boundary? (quote both the boundary and any conflicting exclusion, or state agreement)
- QDOD.3 (advisory) Does each condition name an artefact — an exit code, a ratio, a verdict sheet, a delivered file — rather than an activity? (quote any activity-shaped condition, or state none found)

Pass: QDOD.1–QDOD.2 yes.

## Verdict sheet format

Per question: id · yes/no · the quotation or the stated "none found" · reason, one line at most. A question answered without its named quotation or counterexample statement is invalid and fails its block. Per block: pass/fail by the block's rule. Overall: **ready to freeze** if every block passes; otherwise **returned**, with the sheet's failing questions as the findings. Advisory answers are reported to the human in every case and gate nothing. The sheet raises questions and findings only; rewriting the draft belongs to its authors.

## Calibration record

This rubric's verdicts are trusted only while the record below is current; any edit to a question reruns the agreement check before the edited rubric judges a live draft.

Examples: *(three to five graded drafts, at least one known-bad)* · Human grades: *(path)* · Last agreement check: *(date, per-question result)*
