# Build notes: how the lead ran the plan's build section

Written by the lead (Captain of the build run) on 2026-10-11, after the owner's GO on planning attempt 2. The plan is `.flightdeck/build-1/attempts/plan/a2/plan.md`; its section 5 describes the build. These notes record where the build differs from section 5 and why. Every build agent reads this file.

## The owner's GO changes the waves

- The owner wrote: "GO: start setup, then build the PRs marked include, PR 1 first, then the others, when finished, I can try them progressively." So the build does not stop between Run A, wave 1 and wave 2 for the owner to try and merge.
- PR 1 is built first, alone. Then PRs 2, 3, 4, 6, 7 and 8 are built in parallel, each cut from PR 1's branch (`build-1-pr1-basic-a1`) instead of from a `build-1` that already holds PR 1. Each still opens into `build-1` and owns its own files, so any of them can be rejected alone. Each pull request says "Merge PR 1 first; until then this pull request's diff also shows PR 1's files."
- "Run B" in `build.js` means "PR 1's files exist on the base branch": the gather agent reads build-1's scoped block, checks and rank lines from PR 1's branch, so every later build agent gets build-1's own context and verification, as section 5 intends.
- Each later pull request runs as its own workflow, side by side, because this machine runs only about two agents at a time inside one workflow.

## This is a cloud session, not the owner's terminal

- Stage 0's restart with `build-settings.json` cannot happen here. Build agents run under this session's permissions and follow the hard rules in their prompts. Nested test sessions (the imposter and the live checks) run with `.flightdeck/build-1/workflows/nested-settings.json`, which sets `FLIGHTDECK_UNATTENDED=1`, allows only what a test needs, denies pushes to main, force pushes and branch deletion, and registers `push-check.mjs` as a hook.
- Every nested Claude Code command runs with a private `HOME` inside the scratch folder (checked: `claude -p` works with a private `HOME` here). So test installs never touch any real plugin registry, and parallel pull requests cannot collide. This replaces the plan's renamed-marketplace-plus-compare routine; the marketplace is still renamed in each scratch clone.
- Scratch clones point `origin` at a throwaway bare repository, so nothing a test does can reach GitHub.
- `gh` is not available to this session. Agents push branches; the lead opens each pull request into `build-1` through the GitHub connector, as a draft when anything is still open.
- The `.claude/agents/adversary.md` model line was changed from `fable` to `opus` with `effort: high` by the lead in stage 0.

## Stage 0 probe

- Checked by hand before building: nested `claude -p` sessions work; they work with a private `HOME`; `claude plugin eval`, `validate`, `details` and `test` exist in Claude Code 2.1.296; `push-check.mjs` and `build.js` pass `build.test.mjs` (`node --test .flightdeck/build-1/workflows/build.test.mjs`); per-agent `model`, `effort` and `agentType` worked in both planning runs.
- Not probed separately: whether hooks tell a subagent from the owner's session (`agent_id`), whether `source: "./flightdeck"` loads in place, `enabledPlugins` switching, and `--bg` runner behaviour. PR 1's live checks test these on the real plugin, and the plan's named fallbacks apply where one fails; the pull request says which held.

## Landing

- After all pull requests are built, one landing page `.flightdeck/build-1/attempts/build-a1.html` covers them all: one card per pull request with what it adds, its try steps, results, open findings and how to retry it alone. Questions and capture lines that triage raised on later pull requests are added to PR 1's branch, which owns `.flightdeck/build-1/questions.md` and `.flightdeck/workshops.md`.

## What happened during the build

- PR 1 was built first (16 agents), then PRs 2, 3, 4, 6, 7 and 8 were built as six workflows side by side (13 to 15 agents each), about 103 agents and 13.4 million subagent tokens in all. All seven pull requests are open as drafts into `build-1` (#3 to #9); the landing page is `attempts/build-a1.html`.
- Claude Code refused to let stage agents write `report.md` and `findings.md` ("Subagents should return findings as text, not write report files"). The agents did not work around it. `build.js` now returns that text, and the Captain wrote the files and opened each pull request.
- A review agent set the main checkout's git remote to a throwaway local repository by working in a git worktree (worktrees share the main checkout's config) instead of a separate clone. For a short time some pushes went there. GitHub was never changed. The lead restored the remote and pushed the missing commits as fast-forwards; `build.js` and build-1's lessons now forbid it.
- PR 7's librarian broke PR 1's "exactly seven agents" test. The test was wrong (the owner expects 30 or more agents); the lead fixed it on PR 1's branch and merged PR 1's branch into PR 7's.
- Eval cases: PRs 4 and 6 put them in `flightdeck/evals/`, the plan's named fallback, because `claude plugin eval` reads cases only inside the plugin. The lead moved PRs 2, 3 and 7's cases there too, fixed PR 7's case format and PR 3's test path, and ran the cases once: PR 6's two scored 1.00, PR 3's and PR 7's scored 0.00 (captured to look at), and two need the operating-system sandbox.
- Combined check: all seven branches merged together pass every test, both plugin checks, the hard rules, the sweep drill (21/21) and the remove-part drill (7/7).
- Triage questions (q2 to q4), 21 capture lines and the build's lessons were filed on PR 1's branch, which owns those files.
- The two deny rules in `nested-settings.json` that mixed `*` with `:*` were removed; `push-check.mjs` covers those cases.
- After the build the owner asked for the 21 unit branches (`build-1-pr<n>-<slug>-a1-u<i>`) to be deleted and for the script to stop pushing them. Every unit branch was checked to be fully inside its pull request branch. This session's git access is refused branch deletion on GitHub (HTTP 403), so the owner deletes them. `build.js` now keeps unit branches local (builders commit without pushing; integrate merges the local branches, which worktrees share), so only pull request branches reach GitHub; `build.test.mjs` checks this.
