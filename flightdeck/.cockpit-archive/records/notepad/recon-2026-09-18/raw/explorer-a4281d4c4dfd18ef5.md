# Raw explorer report a4281d4c4dfd18ef5

Recovered 2026-09-18 by the pilot from the subagent transcript on disk; the hand-back reached the lead only. Unverified raw material; the parent teammate's filed report supersedes it.


Brief (first 200 chars): Repo: /Users/dylangraham/Projects/flightdeck (git). You are mining branch history for a lineage report on "flightcrew", an agent orchestration system built on Claude Code. Breadth: very thorough.

HAR

## engage-crew (head 716fe4b, forks from main at efd9170)

**Attempted** — Define the core orchestration crew as `.claude/agents/`: flight-assistant, reviewer, spec-attacker, spec-builder, spec-interviewer, spec-judge (commit 8ec2d11: "Introduces definitions for core agents... outlining roles, tools, responsibilities, and interactions within the orchestration process"), plus draft specs for further roles (spec-builder, explorer, interface-builder in 09dab8f) and interview findings/judgment data for the spec-interviewer role (5bb25cb).

**Stalled or abandoned** — No explicit abandonment statement found; the branch simply stops after 716fe4b (2026-09-04), a small input-list tweak to spec-builder ("Update spec-builder inputs to include validator, linter, and rubric paths"). WORKSPACE.md on this branch is the untouched template (Purpose/Status checkboxes never filled in), meaning the human never recorded a purpose or a Complete/Discard status.

**Repaired or carried forward** — The seven agent definitions were explicitly ported to `main` in commit `5300f0d` ("Add agent definitions to main... Brings the seven agent definitions from engage-crew: flight-assistant, reviewer, spec-attacker, spec-builder, spec-judge, test-builder, worker"), and from there into `flightcrew/crew/*.md` on `flightcrew-buildout-v1`.

**Unfinished intent**
- engage-crew's final commit `716fe4b` refined spec-builder's required inputs to add validator/linter/rubric paths and changed the run folder to `flightdeck/launch/specs/<spec-name>/`; the copy actually merged into main (`5300f0d`, dated one day earlier) is the pre-refinement version, still pointing at `dev/workspace/runs/<spec-name>/` and missing the validator/linter/rubric fields. Verified directly: `diff <(git show engage-crew:.claude/agents/spec-builder.md) <(git show main:.claude/agents/spec-builder.md)`. This means engage-crew's last piece of design work never actually reached main/flightcrew-buildout.
- `flightdeck/launch/agent-types/specs/agent-spec-builder/spec.v1.backup.json` exists alongside `spec.v1.json` on this branch — a backup file left in place, suggesting an in-progress edit never cleaned up.

## constitution-research (head 64dc36c, forks at 2269973)

**Attempted** — Build a "constitution" of orchestration doctrine: universal agentic principles plus an orchestration-specific layer (`dev/workspace/filebox/agentic-principles.md`, `orchestration-principles.md`, `orchestration-tooling.md`), and in parallel run a live spec-builder session against a "reference-library" launch (`flightdeck/launch/reference-library/`) — a cited best-practice library for every Claude Code orchestration concept/tool, per `flightdeck/missions/flightcrew-library.md`.

**Stalled or abandoned** — History summary `flightcrew-buildout-v1:dev/workspace/history/e7fec369_reference-library-spec-interview.txt` states directly: "Remaining asked/open problems: placement and deck shipping (P2), source policy kinds and numbers (P3), lens placement in the entry shape (P4), topic-split edge (P6), walkthrough sample size and judge (P7); the AUQ bundle for P2/P3/P4 was interrupted before answers." The reference-library spec was never frozen (spec.v1.json on this branch has no frozen header/status).

**Repaired or carried forward** — The doctrine work fed into the flightcrew-buildout-v1 build: `flightdeck/manuals/` on main/flightcrew-buildout-v1 descend conceptually from this branch's principles files (same "manuals" vs "library" split named in the e7fec369 history summary's "manuals-vs-library split in STRUCTURE.md"). The reference-library idea itself (`flightdeck/missions/flightcrew-library.md`, `shape-library.md`) does not appear to have been picked back up as a launch on flightcrew-buildout-v1 — status unknown/not found there.

**Unfinished intent**
- `flightdeck/launch/reference-library/interview/problems.json` and its `bundles/P1.json`-`P5.json` — the interview register for an unresolved spec; P2/P3/P4 answers were never captured (evidence: e7fec369 history summary). Matters because it's a fully scoped launch (P1 perimeter closed, P5 mooted) that just needs the interrupted AUQ answers to finish.
- `flightdeck/missions/extra-crew-members.md` and `flightdeck/missions/flightcrew-adviser.md` (adviser concept: "produces `Help` files that outline the runs required shape... User can have a conversation about any section to change the shape of the launch") — a conversational-adviser feature that does not appear anywhere in flightcrew-buildout-v1's shipped `fc` command surface; likely dropped scope.

## rubric-testing (head 194c52e, forks at efd9170)

**Attempted** — A single large commit (194c52e, "Add initial draft specs and experiment chains for `fable-v2.3` orchestration agent") dumping a model/rubric comparison bench under `flightdeck/testbench/runs/agent-spec-interviewer/experiments/`: parallel judge chains across claude-opus-5, claude-sonnet-5 and claude-fable-5 on the same spec-interviewer draft, with a `comparison.md` scoreboard of which model's judge found which findings, at what cost (tokens/seconds).

**Stalled or abandoned** — The branch is exactly one commit past the fork point and has no further activity, no WORKSPACE.md purpose recorded (still the blank template), and no plan file filled in. `comparison.md`'s own closing lines read as an interim lab note rather than a conclusion ("run 6 ready", "run 2 ready" — several chains left with a next run queued but not executed).

**Repaired or carried forward** — Unknown from this branch alone whether its findings directly justified anything, but circumstantially: commit `5845bf1` ("Add `worker` crew role and set every agent to fable") on the shared base landed the same day (2026-09-01) as this branch's head commit, setting every crew agent's model to `fable` — the same model this branch's experiments were scoring. Cannot confirm causation from the branch itself.

**Unfinished intent**
- `experiments/fable-4in-v2.3/chain.json` and `experiments/opus-v2.3/*` — several chains explicitly left at "run N ready" (not yet executed) per `comparison.md`; the comparison table itself notes open questions like QGEN.1 being "ambiguous" between models with no resolution recorded. Matters because the model-selection rationale for `fable` was never written down as a concluded decision anywhere found.

## flightcrew-buildout-v1 (head ab2cb68, forks from main at 025fa75)

**Attempted** — The actual buildout of the flightcrew orchestration system per a frozen spec (`flightdeck/launch/specs/flightcrew-v1/spec.v1.json`, frozen at commit `88290d0`: "54 behaviours, 24 edges, 9 constraints, 14 interfaces, mapped to 29 testbench suites"), built test-first against a locked 29/30-suite testbench (`44aff6b`, `49aff47`), implemented in `5cad9b9` ("fc runner, checks, hooks, crew, templates, workflows, manuals"), then run twice as its own dogfood launches (`flightcrew-buildout`, `flightcrew-buildout-2`) and independently reviewed (`acafec4`).

**Stalled or abandoned** — The first dogfood launch `flightcrew-buildout` ended **abandoned**, per `RUNLOG.md`: "outcome: abandoned... symptom: abandoned at verify — escalation wrong-check: Two locked suite cases cannot be satisfied by any faithful implementation" (T11 changed-since-lock line count off by one due to git numstat behavior on trailing-newline fixtures; T24 import scanner reading a string literal as an import specifier). This was repaired forward within the same branch by freezing tests-map v2 (`9131265`) and rerunning as `flightcrew-buildout-2`, which itself only reached **"accepted-with-reservations"** (commit `19faef3`), not a clean accept — RUNLOG.md lists five carried spec conflicts (B39 vs workflow runtime's `export default`, B27 worker-render refusing the contracts phase, the I14 deny rule blocking the test-builder, a stall message Claude Code doesn't display, and C3 output-format mismatch) plus six numbered observations (F6-F11) of latent defects explicitly deferred rather than fixed (e.g. F8: "fc launch pin tests-map replaces paths.allowed with the map's allowed_paths, discarding any --allow <glob>... so the flag has no effect once a map is pinned").

**Repaired or carried forward** — This branch is itself the carrier: it IS an ancestor of `flightcrew-buildout` (per task framing), so everything here (fc commands, crew, manuals, checks) is the lineage's main trunk going forward.

**Unfinished intent**
- The five spec conflicts named in `flightdeck/launch/RUNLOG.md`'s `flightcrew-buildout-2` entry (B39, B27, I14, stall-message-on-exit-0, C3) — explicitly flagged "carried to the next version," each with a concrete failure mode already diagnosed; matters because these are known, reproducible defects in the shipped v1 system, not speculative.
- Observations F6-F11 in the same RUNLOG entry are un-ticketed defects: F6 (silent `changedSince` skip when `lock_commit` fails to resolve — "an error defaulted away rather than surfaced"), F9 (report.md echoes `notes.md` verbatim, so a human note "can carry the strings B18 forbids... into report.md"), F10 (`diffSinceLock` misses untracked files, so new-but-unstaged files are invisible to the sealed critic prompt), F11 (`fc doctor --target` can false-fail on hook commands whose first token isn't a bare executable). Each names an exact file/line (e.g. `boundary.mjs:245`, `locked.mjs:324`) and is worth checking against later branches for whether it was ever fixed.
- `flightdeck/launch/flightcrew-buildout/notes.md` contains a human-authored note tied to the abandoned run; not read in full (kept to summaries per instructions) but flagged as a likely source of the human's own diagnosis language for "wrong-check."
- The one path-outside-boundary question raised in `733f79f` ("`.claude/workflows/flightcrew-build.js` outside the allowed paths; it was written by the session that drove this build and needs a decision before the boundary can be clean") — resolved procedurally by `c28578e` (excluding the launch's own folder from the clean-tree check) but unclear whether the stray workflow file itself was ever formally allow-listed.

Not found: no `dev/workspace/tasks/**` content beyond `.keep` placeholders on any of the four branches; no filled-in WORKSPACE.md on any branch (all four still carry the blank template); no README/STRUCTURE doc on engage-crew or rubric-testing beyond the generic dev-workspace ones (flightcrew-buildout-v1 and constitution-research are the only branches with flightdeck-specific STRUCTURE/missions content).
