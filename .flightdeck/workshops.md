# Workshops

Every piece of work FlightDeck knows about, one line each: a line alone means captured and waiting to start; a folder of the same name means active; a settled: line in its card means settled.

- build-1: Build out the humans vision for a claude code agentic accelerator, based upon agentic engineering best practices, employing agentic workflows and a bit of good ol HITL also. (2026-10-10)
- demo-attempt-age: (an example the build made up, not your words; delete this line if you do not want it) the pre-flight card shows how long ago each workshop's latest attempt ran (2026-10-11)
- live-checks-reach-the-hook: make the live tests of the guards actually reach the guard, because the model usually refuses on its own first (2026-10-11)
- runner-report-file: have a background runner write its final report to a file on its branch, so it can be read without attaching to its session (2026-10-11)

## Captured by the build-1 agents

Written by agents during the build of 2026-10-11, waiting for you to activate, merge into other work, or delete.

- pilot-files-answer-blocks: tell the pilot exactly how to file a pasted "FlightDeck answers" block, word for word and with no added dates (2026-10-11)
- page-kit-copy-script: ship a ready-made copy-my-changes script with the page style, so every page an agent makes copies answers the same way (2026-10-11)
- answers-keep-option-text: store the chosen option's words next to its letter on answer lines, so questions.md reads on its own (2026-10-11)
- card-start-command: make the pre-flight card name the real command, /flight:workshop <name>, instead of "activate <name>" (2026-10-11)
- no-example-workshops: decide whether the made-up demo-attempt-age line stays in this list (PR 4's try uses it), and ship no example lines in other projects (2026-10-11)
- template-comments: shorten the long format comments at the top of the workshop templates and explain "base branch" in plain words (2026-10-11)
- green-check-lists-all-tests: add the workshop, board, launch and lab tests to the checks list in CLAUDE.md and to /flight:preflight once those pull requests are merged (2026-10-11)
- launch-permissions: give a first launch the git permissions it needs, so it does not stop on approval prompts (2026-10-11)
- pilot-stops-after-activate: after activating a workshop the pilot should stop and say /flight:launch is next, not start building (2026-10-11)
- readme-after-merge: once the later pull requests are merged, update PR 1's README, CLAUDE.md and ways-to-fly page to name the launches, the librarian, the manuals and the shipped workflows (2026-10-11)
- worktree-cleanup: keep the agents' temporary folders under .claude/worktrees/ out of your way (ignore them in git and offer a cleanup after a launch) (2026-10-11)
- recon-reads-history: let one recon scout read git history, since the default history angle cannot without it (2026-10-11)
- demo-age-from-git: in the demo task, take an attempt's age from its last git commit, not from file times, which a fresh clone resets (2026-10-11)
- climb-hides-test-cases: make the improvement workflow hide the held-back test cases from the agent proposing changes, not only ask it not to look (2026-10-11)
- eval-sandbox-run: run the workshop-scope eval case once on a machine with bubblewrap and socat (or a Mac) to get its first real score (2026-10-11)
- eval-schema-version: check the eval case.yaml schema version (1.0 loads today; the docs mention 1.1) when Claude Code updates (2026-10-11)
- evals-score-zero: look at why the PR 3 and PR 7 eval cases load but score 0.00 in about 15 seconds (keep a trace with --keep-temp) (2026-10-11)
- interviewer-asks-reading-place: have the workshop interview ask where and on what device the result will be read; the interview drill scored it 6 of 8 without that (2026-10-11)
- pilot-sends-librarian: make the pilot always send "Librarian, ..." questions to the librarian instead of answering them itself (2026-10-11)
- rank-line-wording: make policies.md say where the Rank: line sits in an agent's opening text the same way the team plans do (2026-10-11)
- library-review-command: give the library review workflow an owner-started command, /flight:library-review, instead of running it by file path (2026-10-11)
