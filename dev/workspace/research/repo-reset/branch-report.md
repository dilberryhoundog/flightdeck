# Branch report

Source: background session branch-investigator (3d4031cc), 2026-10-09. Read-only investigation of the flightdeck repo. [V] = verified by the lead running the command, [R] = relayed from a subagent. Text is the session report as sent, unedited.

BRANCH REPORT (flightdeck) — "flightdeck-33" did not resolve, so sending to you, the only local peer. Read-only throughout; no files written by me. [V] = I ran the command myself; [R] = relayed from a subagent, not re-run. Refs are local, no fetch; origin/* may be stale. No tags [V]. One remote: origin (github dilberryhoundog/flightdeck). One stash. Only one worktree (main checkout on cockpit); .claude/worktrees exists and is empty [R]. CONCEPT.md staged on cockpit untouched [V].

OVERALL PICTURE
21 local branches + 11 origin/* refs, one real root commit. Three groups. (1) Early side branches cut 2026-09-01/02 from old main: rubric-testing, engage-crew, constitution-research; 8-19 commits behind main, each holding unique work. (2) The flightcrew line, cut from 025fa75 (2026-09-03; main has since moved 4 commits past it): flightcrew-buildout-v1 -> run/flightcrew-core-1 -> {flightcrew-buildout, flightcrew-core}, then the characterization family, ending at run/flightcrew-characterization-2 (76 commits ahead of main). (3) cockpit, cut from main's current tip 608d380, 47 commits ahead; shares only 025fa75 and older with the flightcrew line. Only main is merged into main [V: `for b in heads; git merge-base --is-ancestor $b main` printed only main]. 6 of the 21 local branches are auto-created worktree-wf_* branches with no unique commits. Local-only (no origin counterpart): run/flightcrew-core-1, run/flightcrew-characterization-1, flightcrew-characterization-2/contracts, flightcrew-characterization-2/roles-workflows-distributed, 6 worktree-wf_*.

BRANCHES
- main 608d380 (09-17). Ahead 2 of origin/main 1f20b49: 608d380 "ignore testbench/runs directory", b3b0a01 control-panel metadata [V]. Top level: .claude .gitattributes LICENSE.txt README.md dev flightdeck library (5 files). .claude/agents 8 files. No dev/branches.
- cockpit 015f8e7 (10-08). Ahead 6 of origin/cockpit 44701db (09-29) [V 0 6]. 0 behind main, 47 ahead [V]. Not in main. The 6 unpushed [V git log origin/cockpit..cockpit]: bea5798 (moves flightdeck/.cockpit/* to flightdeck/.cockpit-archive/*, ~746 pure renames), 4c93e0c (archive truth-suite files, Ds-010), bf58a05 (new flightdeck/.cockpit/constitution.md, empty CLAUDE.md), a82769f (flightdeck/agentic-systems.md), e986031 (49 library/source files, 7 JetBrains PDFs ~0.5-0.65MB, env-vars.md 513KB), 015f8e7 (workspace files). The 41 origin/cockpit commits (09-17..09-29) built the v1 cockpit at flightdeck/.cockpit; on origin it still sits at the old path. 972 files at tip; .cockpit-archive 792 files/3.2MB [R]. dev/workspace 41 files; biggest blob history/9b679556_...txt 1.47MB [V].
- constitution-research 64dc36c (09-03), in sync. 5 ahead / 8 behind main; unique commits: library/constitution/{agentic-principles,orchestration-principles,orchestration-tooling}.md, filebox copies, flightdeck/launch/reference-library/ [R].
- rubric-testing 194c52e (09-01), in sync. 1 ahead / 19 behind. One commit adding 99 files (~757KB) under flightdeck/testbench/runs/agent-*/experiments (model-comparison runs). [V] no other ref has any path containing testbench/runs/agent-. Main now gitignores testbench/runs.
- engage-crew 716fe4b (09-04); origin 8ec2d11; local ahead 1 [V]. 4 ahead / 19 behind main. Adds 28 spec files under flightdeck/launch/agent-types/specs and launch/agent-spec-interviewer, plus .claude/agents. [V] those launch paths exist on no other checked ref. Agent blobs match main's except spec-builder.md [R].
- flightcrew-buildout-v1 ab2cb68 (09-04), in sync; 18 ahead of main; ancestor of all later flightcrew branches. Full "flightcrew v1" build. 0 unique.
- run/flightcrew-core-1 7c5913e (09-10), local only; ancestor of buildout and core; 0 unique.
- flightcrew-buildout 1c81888 (09-15); origin 93e18c5; ahead 7 [V]. 6 of the 7 are also on origin via origin/flightcrew-core. UNIQUE: 1c81888 (adds flightdeck/manuals/spec/spec-altitude.md) [V `git branch -a --contains 1c81888` = this branch only].
- flightcrew-core 27f6969 (09-13), in sync. Diverged from buildout at 1b0a8ba. UNIQUE (with its origin): 27f6969 "Commit the test-builder output of the void flightcrew-core run" [V]. Holds the flightdeck/launch/flightcrew-core tree that buildout deleted in 56bfb87 [R].
- flightcrew-characterization 68681c0 (09-17); origin 56ca431; ahead 1 [V]. UNIQUE: 68681c0 (adds filebox/spec.md and an 8977-line history file) [V]. Otherwise equals run-char-1 content; lacks run-2 work.
- flightcrew-characterization-1/contracts 95a8cae (09-16), in sync. UNIQUE (with origin): 95a8cae, an abandoned run-1 attempt [V].
- flightcrew-characterization-2/contracts b148c10 (local only; same commit as worktree-wf_2fdadce5-244-3 [V]); -2/roles-workflows-distributed fc50711 (local only, merged into run-2); run/flightcrew-characterization-1 d7e2ec5 (local only; tip is the run-2 kickoff commit). All three are ancestors of run-2; 0 unique [V counts].
- run/flightcrew-characterization-2 4fd81d8 (09-16), in sync; 76 ahead of main. UNIQUE (with origin): 4046d1e and 4fd81d8 (run 2 report: 58 of 61 checks green, six defects pinned) [V]. Newest/most complete testbench and flightcrew content [R].
- worktree-wf_2fdadce5-244-1 96610c7, -2 3043f6c (tip is a revert), -3 b148c10 (empty), -4 142a746, wf_835932ae-12f-1 bd636d3, wf_9641b63f-a15-1 56ca431 (empty; = origin/flightcrew-characterization). All local only, all 2026-09-16; each is an ancestor of run/flightcrew-characterization-2; 0 commits outside non-worktree refs [R; empties and same-commit duplicates V].

UNIQUE-WORK RISKS (found on no other-named branch)
- cockpit 6 local-only commits + 41 commits shared only with origin/cockpit; main 2 local-only commits.
- buildout 1c81888; characterization 68681c0; engage-crew 716fe4b plus its 3 earlier commits (only on engage-crew/origin); rubric-testing 194c52e; constitution-research 5 commits; characterization-1/contracts 95a8cae; flightcrew-core 27f6969; run-char-2 4046d1e/4fd81d8. Several of these exist only locally AND are unpushed (cockpit 6, main 2, buildout 1c81888, characterization 68681c0, engage-crew 716fe4b).
- Branches with zero unique commits: the 6 worktree-wf_*, run/flightcrew-characterization-1, -2/contracts, -2/roles-workflows-distributed, run/flightcrew-core-1, flightcrew-buildout-v1 [V survey: `git rev-list <tip> ^<all other-named refs>` = 0].
- STASH stash@{0} "units built on unverified contracts (discarded)" (on flightcrew-buildout-v1, 2026-09-04): 1-line spec-builder.md change plus untracked-files commit with 64 files (fc runner, validators, hooks, crew, templates, workflows; 7.6k lines) [V file count 64]. None of the 64 blobs match any committed blob on any branch under any path [R]. Exists only via refs/stash.

OVERLAPS
- flightdeck/flightcrew, testbench, launch: v1 < buildout=core (flightcrew); core has most testbench/launch (184/203 files); run-char-2 has the newest testbench/flightcrew [R].
- Flightcrew branches lack main's 4 newest commits (5300f0d "Add agent definitions to main", 1f20b49, b3b0a01, 608d380) [V git log flightcrew-buildout..main].
- library/ differs per line: main 5 files, v1 17, buildout/core 18 (.html guides), cockpit 54 (adds library/source).
- "Constitution" exists three ways: library/constitution (constitution-research), dev/workspace/filebox/orchestration-principles*.md (cockpit), flightdeck/.cockpit/constitution.md (cockpit, new). Different documents.
- Old cockpit lives at flightdeck/.cockpit on origin/cockpit but at .cockpit-archive on local cockpit.
- .claude/agents: main/cockpit 8 files; engage-crew same blobs except spec-builder.md; buildout 10 [R].

ODDITIES
- dev/branches/ exists on NO ref [V loop over all refs]. No archives anywhere, so no archive/branch mismatch; project rules describing it describe something absent from git.
- Same-commit duplicates [V]: each in-sync local/origin pair; 2/contracts = wf-244-3; origin/flightcrew-characterization = wf_9641b63f.
- A stray ref named `origin` equals origin/main (1f20b49) in for-each-ref [V].
- Misleading names: run/flightcrew-characterization-1 tip is the run-2 kickoff. Revert pair 014e2ec/3043f6c on the run-2 line [R].
- Never pushed: all of -2/contracts, -2/roles-workflows-distributed, run-char-1, run/flightcrew-core-1, worktree-wf_* [V branch -a].
- Large blobs >500KB: history .txt files (1.47MB, 1.13MB, 0.99MB), 7 JetBrains PDFs, env-vars.md [V].
- Correction to a premise: cockpit is not unrelated to the flightcrew line; shared ancestor 025fa75. It descends from current main [V merge-base cockpit main = 608d380].
- Subagents wrote scratch files into the withdrawn scratchpad (lead/report-*.txt, lead/tmpA/, lead/common-brief.md) before your change; left in place and not relied on.

OPEN QUESTIONS
- Real state of origin: `git ls-remote origin` (read-only network) or fetch (excluded).
- PRs/issues tied to branches (history has "Merge pull request #1" for buildout-v1): GitHub MCP list_pull_requests.
- Whether engage-crew/rubric-testing content was superseded by later flightcrew/ files: needs a content read, not done.
- Whether the stash is still wanted: owner decision.
- Whether pushing cockpit (rename of .cockpit to .cockpit-archive) is intended.

VERIFYING CLEANUP-RELEVANT CLAIMS
- Not merged: the merge-base --is-ancestor loop above [V].
- Unique commits: `git branch -a --contains 1c81888 | 27f6969 | 68681c0 | 95a8cae | 4fd81d8 | 716fe4b | 194c52e` [V]; counts via `git rev-list <tip> ^<each other-named ref>` [V].
- Worktree branches empty of unique work: same rev-list against non-worktree refs [R; partly V].
- Stash content absent: blob-hash compare of `git ls-tree -r stash@{0}^3` vs `git ls-tree -r <ref>` [R].
- dev/branches absent: `git ls-tree -r --name-only <ref> -- dev/branches` over all refs [V].

I stay available for follow-ups.
