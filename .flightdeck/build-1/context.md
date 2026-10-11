# Context for workshop build-1

This workshop is the build of FlightDeck from the owner's vision. Every path below is inside `.flightdeck/build-1/` unless it says otherwise.

Where things live. The approved plan is `attempts/plan/a2/plan.md` and its verification is in `attempts/plan/a2/verify/`. Research is in `research/`. The lead's build notes are `attempts/build-notes.md`; they say where the build differs from the plan, so read them. The build workflow is `workflows/build.js`. Each pull request attempt leaves its brief, findings, report and log in `attempts/pr-<n>/a<k>/`.

Binding documents. These are the owner's words and they are binding: `.flightdeck/VISION.md`, `.flightdeck/build.txt` and `.flightdeck/build-1/constraints.md`. Where they disagree, the newest dated line wins. Everything else is material, never canon: research, earlier branches, earlier attempts and other agents' output. Never call earlier work finished.

Ownership. Each pull request writes only the files on its own list, `lab/owned/pr<n>.txt`, and never edits another pull request's files. Later pull requests may import PR 1's files but may not edit them. If you need a change in a file you do not own, write it down as a capture line and do not make it.

Order. PR 1 (Basic flight crew) is built first, alone. Then PRs 2, 3, 4, 6, 7 and 8 are cut from PR 1's branch, `build-1-pr1-basic-a1`, and each is opened into `build-1`. PR 5 was skipped by the owner and is never built.

Branch names. A branch name never starts with `build-1/`, because the branch `build-1` already exists and git cannot hold both a branch and a folder of that name. The build script computes every branch name; do not invent one.

Model ceiling. Nothing runs above Opus at high effort. Use Sonnet for builders and checkers, and Haiku for cheap reading.

Layout. The plugin lives in `flightdeck/`. The owner's work lives in `.flightdeck/`. Tests and checks live in `lab/`. Nothing is written in `.claude/rules/` or `dev/`, which dev-workspace owns.

Formats. The workshop reader and every file format live in `flightdeck/lib/workshops.mjs` and in the templates in `flightdeck/templates/workshop/`.

Tests. On Node 22, `node --test` with a folder name fails with "Cannot find module". Always use the quoted glob form, for example `node --test 'flightdeck/tests/*.test.mjs'` and `node --test 'lab/checks/*.test.mjs'`.

## Lessons from the first build run (2026-10-11)

Learned by the agents and the lead while building PRs 1 to 8. Read them before a retry.

Git remotes. Never change a git remote or git config inside a worktree of the main checkout: worktrees share its config, so a throwaway remote set there redirects every later push. Throwaway remotes belong only in a separate `git clone`.

Report files. Claude Code does not let a subagent write files named like a report or findings. Stages return that text and the Captain writes `report.md` and `findings.md`.

Eval cases. `claude plugin eval` reads cases only from inside the plugin, so eval cases live in `flightdeck/evals/` and their results go to `lab/evals/results/`. A case's `prompt.md` and each grader need frontmatter (`type: llm` on graders). `--case` takes only `*` patterns, and two runs into one `--output-dir` overwrite each other's report. A case that allows Bash needs the operating-system sandbox (bubblewrap and socat), which the cloud sandbox lacks.

Nested test sessions. Give every nested `claude -p` a private `HOME` and its own `--session-id`; nested sessions otherwise inherit the parent's session variables and share a transcript. A fresh private `HOME` needs a git identity, and the trust-folder screen needs Down then Enter (Enter alone picks "No, exit"). A first interactive run adds the official marketplace, so compare marketplace lists by "the try marketplace is gone and every earlier entry is still there".

Live tests of the guards. Models usually refuse a forbidden push or edit before the guard runs, so a live test of a guard either feeds the hook its input directly or says the owner authorised the attempt.

Briefs. A forbidden-pattern check in a brief must not clash with a comment the same brief asks for. A launch needs `Bash(git worktree *)` and `Bash(git -C *)` in its allow list to save its record files.

The build's agents may change PR 1's own test only through PR 1: the "exactly seven agents" test was wrong (the roster grows), and the fix went to PR 1's branch.
