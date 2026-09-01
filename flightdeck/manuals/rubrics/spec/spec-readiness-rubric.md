# Spec-Readiness Rubric v2.2

This rubric judges whether a draft specification is ready to freeze. The standard it derives from is the written definition of a spec — the nine domains, their contents, and the contributor invariants — so the questions below ask nothing that standard does not already claim; they only make each claim answerable with a quotation from the draft. The standard is the rubric author's source, not the judge's input: every rule a judge needs is written into the question that needs it, and the judge reads the rubric and the draft alone.

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

Rubric version: 2.3  
Standard: the nine-domains (description) document; the verification addendum where the product is agent-shaped. Both are encoded in the questions below and are not handed to the judge.  
Judge receives: this rubric; the draft spec. Nothing else — no standard, no interview transcript, no kickoff prompt, no author commentary.  
Material: the draft spec at a stated commit, after a clean linter run.  
Coverage rule: every behaviour, edge case, constraint, interface and decision is read; there is no sampling. Every question reports every instance it finds, each with its quotation and node id; "none found" is stated only after the whole domain has been read.  
Advisory closure: an advisory whose question id is named and answered by a decision node in the draft is reported as closed by that node and is not raised as a finding.

### GEN — contributor invariants hold

- QGEN.1 (critical) Is the draft free of statements about how the work will be conducted? The result's own properties are not conduct: for an agent-shaped product, the produced agent's tools, model, and the contracts of the agents it dispatches describe the result. Conduct is who does this work, with what tools, agents, gates, displays or model. A verification step that names its actor ("the provider, not the builder, chooses one record") states the provenance of a verification artefact and is not conduct. (quote any violating line, or state none found)
- QGEN.2 (critical) Where a domain is empty, is the emptiness stated as a decision with a reason? (quote each such statement, or state no empty domains)
- QGEN.3 (advisory) Is the draft free of duplicate statements — the same requirement expressed in two domains? A constraint and the behaviour that makes it checkable across a session are not duplicates; a scope exclusion and the constraint that enforces it are not duplicates; a decision that gives the reason for a constraint is not a duplicate. (quote both instances of any duplicate, or state none found)

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

- QCON.1 (critical) Is every clause of each constraint stated as a checkable condition — a limit, a target, a rule — or explicitly marked unmeasurable with a reason? A constraint with one checkable clause and one that is not fails. (quote any vague constraint or clause, or state none found)
- QCON.2 (critical) Are constraints conditions on the result rather than steps to take? An ordering or timing rule belongs in behaviours; a constraint that sequences the work ("before any dispatch") is step-shaped, while a condition on an artefact ("exits 0 on the draft any verdict names") is not. (quote any step-shaped or misplaced constraint, or state none found)

Pass: both yes.

### IFC — interfaces and contracts

- QIFC.1 (critical) Is every seam stated exactly — a signature, schema, format or shape — rather than described in prose? A shape is a braced field list with types, a named format, or a reused schema by path; a comma list of nouns ("one question, the stage it serves, optional scope paths") is prose. Both sides of every call or dispatch carry a shape, and every identifier another node refers to has a stated format in this domain. (quote any described-only seam or unshaped identifier, or state none found)
- QIFC.2 (critical) Does every reference to an existing type or shape say it is reused by name? (quote any reference that leaves reuse open, or state none found)

Pass: both yes.

### BEH — behaviours

- QBEH.1 (critical) Does each behaviour state an observable outcome from outside the system, with its input and its result identifiable in the sentence? (quote any behaviour whose input or result cannot be named, or state none found)
- QBEH.2 (critical) Is each behaviour a single decision — one trigger producing one result? Qualifiers on that result's form are part of it ("appears embedded, with no external request"). Two decisions are present when a clause names a second state change, a separately prohibited action, a second artefact, or a property that would need its own check: if the verification section checks the clauses separately, or checks only one of them, the behaviour carries two. A window ("after X and before Y") is one condition, and an act with the record that constitutes it ("frozen with a commit") is one result. A clause stating what the result must contain is a property needing its own check unless verification names a check that reads it. (quote every behaviour carrying two, naming the clauses, or state none found)
- QBEH.3 (critical) Is each behaviour free of impression words, including any the linter flagged? (quote survivors, or state none found)
- QBEH.4 (advisory) Could each behaviour be falsified — is there a describable result that would violate it? (name any behaviour with no describable violating result)

Pass: QBEH.1–QBEH.3 yes.

### EDG — edge cases and failure modes

- QEDG.1 (critical) Does each edge case state the exact outcome when the case occurs, rather than a concern that it might? (quote any concern-shaped entry, or state none found)
- QEDG.2 (critical) Do the edge cases include at least one uncooperative-world case — unavailable dependency, unauthorized access, or malformed input — and not only boundary values? (quote one such entry)
- QEDG.3 (advisory) Does each behaviour have at least one edge case interrogating its boundary, or a decision stating why it has none? (name any behaviour with neither)

Pass: QEDG.1–QEDG.2 yes.

### PRI — prior decisions and non-goals

- QPRI.1 (critical) Is each entry a settled decision or a deliberate deferral — something not to re-open — rather than a new requirement in disguise? (quote any requirement-shaped entry, or state none found)
- QPRI.2 (advisory) Does each rejected alternative carry its reason? (quote any reason-free rejection, or state none found)

Pass: QPRI.1 yes.

### VER — verification

- QVER.1 (critical) Does the end-to-end proof exercise the result the way its user would — invoking it whole, not assembling unit results? (quote the proof's steps)
- QVER.2 (critical) Does the section state whether checks pre-exist and are locked against the producing work? (quote the statement)
- QVER.3 (critical, agent-shaped drafts only) Is each behaviour's check class tag the cheapest that can falsify it — no judged tag where a transcript grep or property check would do? The question is about the tag; a judged rubric that supplements a property- or statistically-checked behaviour is not an over-tag. (quote any over-tagged behaviour, or state none found)

Pass: all applicable yes.

### DOD — definition of done

- QDOD.1 (critical) Is every gate condition traceable to an earlier section of this draft — nothing appearing for the first time at the gate? A condition required by a standard still needs its artefact named in verification; a requirement that exists only outside the draft is not an antecedent. (quote any orphan condition, or state none found)
- QDOD.2 (critical) Does the stated path boundary agree with scope's exclusions — nothing excluded by scope lying inside the boundary? Before comparing, resolve every exclusion that refers to another node ("outside the boundary in C6") to the paths that node names, and compare those paths to the boundary. (quote both the boundary and any conflicting exclusion with the resolved paths, or state agreement)
- QDOD.3 (advisory) Does each condition name an artefact — an exit code, a ratio, a verdict sheet, a delivered file — rather than an activity? (quote any activity-shaped condition, or state none found)

Pass: QDOD.1–QDOD.2 yes.

## Verdict sheet format

Per question: id · yes/no · every instance found, each as quotation with node id, or the stated "none found" · reason, one line at most. A question answered without its named quotation or counterexample statement is invalid and fails its block. A question that reports one instance where the draft holds more is incomplete and is reported as such. Per block: pass/fail by the block's rule. Overall: **ready to freeze** if every block passes; otherwise **returned**, with the sheet's failing questions as the findings. Advisory answers are reported to the human in every case and gate nothing. The sheet raises questions and findings only; rewriting the draft belongs to its authors.

## Calibration record

This rubric's verdicts are trusted only while the record below is current; any edit to a question reruns the agreement check before the edited rubric judges a live draft.

Examples: dev/workspace/runs/agent-spec-interviewer/experiments/spec.v1.start.json (known-returned under v2.1: QDOD.1; QDOD.2; QIFC.1 on I1, I6-I8 In sides, explorer return ids; QCON.1 on C11; QCON.2 on C2; QBEH.2 on B3, B4, B6, B9, B11, B13, B14, B15, B16, B23) · Human grades: dev/workspace/filebox/rubric-harness/rubric-v2-proposal.md, calibration section · Bench: dev/workspace/runs/agent-spec-interviewer/experiments/ (v1, six chains, nineteen runs) · Last agreement check: v2 (2026-08-30) three models, rubric and draft only, from the start draft — run 1 agreed on QCON.2, QDOD.1 and QBEH.2 (B4, B6, B11, B23); fable alone found QDOD.2 and the I1/I6-I8 prose seams; QBEH.2 flipped on B3, B9, B15 in later runs. v2.1 edits QBEH.2, QIFC.1, QDOD.2, QGEN.3 and QGEN.1 (verification actor is provenance) in response. v2.1 agreement check (2026-08-30), three models, rubric and draft only, from the start draft: run 1 — fable exact against the expected set; opus exact minus QBEH.2 B3; sonnet exact
minus QCON.1 C11 and the return-id instance; all three found QDOD.2 by resolving SC12 through C6. Run 2 — opus ready; fable one real new QIFC.1 instance (I10 untyped) plus over-splits of B3 and B14 under the check-based test, ready on run 3; sonnet not ready (I10, B14 as fable, C11 late, C10 override clause). Criterion met for opus; fable and sonnet each one run over. v2.2 (2026-08-30) adds the window and act-with-record exemptions to QBEH.2 in response. v2.2 agreement check, fable and opus, rubric and draft only, from the start draft: run 1 — both raised every expected question with every instance including I10 on first sight; the sets differ by one item, B3's content clause (fable: a property needing its own check; opus: part of the window). Run 2 — opus ready; fable found B14's tail clause (the commit contains only the spec file), a genuine second property behind the exempted act, and read ready on run 3. No flips in either chain. Fable 113-123s per run, opus 189-224s. Criterion met
for opus; fable one run over on a real finding. v2.3 (2026-08-30) adds the content-clause rule to QBEH.2 in response; its first test is on two untuned specs (agent-test-builder, agent-orchestrator) with fable and opus.
