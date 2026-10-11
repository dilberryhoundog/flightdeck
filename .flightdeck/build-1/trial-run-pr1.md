# PR 1 trial run findings, attempt 1

Findings from the owner's first live session with the pilot on pull request 1, held on 2026-10-11. The session ran `claude --agent flight:pilot` in the worktree `.claude/worktrees/build-1` of the main checkout, with branch `build-1-pr1-basic-a1` checked out at commit `4918d9e`. The plugin was read from that worktree's `flightdeck/` folder, version 0.2.0. Written by the pilot (Captain). None of these findings has been triaged, and nothing was changed in response to them.

The checkout changed during the session. The session started on `build-1-pr1-basic-a1` at `4918d9e`, and the pre-flight checks, the plugin listing (seven agents, two skills) and the worktree listing were taken there. Later the same worktree was switched to branch `build-1` and pull requests 1 to 4 and 6 to 8 were merged into it, giving commit `47bcc9e` with eight agents and eleven skills. The pull request branches were then deleted. The running session kept the plugin it loaded at startup. The findings below describe pull request 1's code as loaded; none has been rechecked against `47bcc9e`, and a later pull request may have changed the behaviour (pull request 8 changes the status line, for example). It is not known which of the later file reads happened before the switch and which after.

Each finding says how it was checked. "Ran" means a command was run in the session. "Read" means the file was read. "Not checked" means the claim rests on what the session was shown and nothing more.

## What worked

- Pre-flight: all four checks passed. `claude plugin validate flightdeck` printed "Validation passed". `node lab/checks/hard-rules.mjs` printed "9/9 passed". `node --test 'flightdeck/tests/*.test.mjs'` printed 64 passed, 0 failed. `claude plugin details flight` printed an always-on cost of about 671 tokens. Ran.
- Session-start card: it appeared at startup with the version, the rank, the branch, the workshop's latest attempts, the question count and the captured count. Seen in the session.
- Agents: all seven (`flight:scout`, `flight:builder`, `flight:reviewer`, `flight:adversary`, `flight:imposter`, `flight:runner`, `flight:pilot`) were offered to the pilot as agent types. Seen in the session.
- Team plans: the `flight:team-plans` skill loaded and filled in the real plugin root. The six plan pages, `entry-points.md` and `ways-to-fly.md` exist in `flightdeck/skills/team-plans/`. Ran `ls`; only the front page was read.
- Sending a scout: one `flight:scout` was sent with opening text built in the team-plans order (global rules, `Rank:` line, the build-1 scope block, the capture line, the task). It returned in about 43 seconds with path and line pointers that matched the files. Ran; pointers checked by reading.
- Radio voice: `/output-style flight:radio` printed "Output style set to flight:radio". The style reached the session with the owner's next message and applied from the next reply, with no restart. The owner's interface then showed `flight:radio`. This also shows the command exists, the plugin's style is registered and it works under `--agent flight:pilot`. Seen in the session.
- GitHub sign-in: `gh auth status` succeeded for dilberryhoundog with `repo` and `workflow` scopes. Ran.

## Findings

1. The card's question line is easy to misread. The card printed "open questions: 2 (2 held to ask later)". The pilot read this as "two questions, both held, so none to ask now" and at first reported the count as wrong. The real state was two questions to ask now (q3, q4) and two more held (q1, q2). A wording such as "questions: 2 to ask now, 2 held for later" would not be misread. The line is built at `flightdeck/hooks/preflight.mjs` lines 41 to 42. Read.

2. "Open" is defined two ways. The header of `.flightdeck/build-1/questions.md` (line 3) and `.flightdeck/CLAUDE.md` (line 27) both say a question is open while its `answer:` line is empty, which gives four open questions. `flightdeck/lib/workshops.mjs` lines 100 to 104 count a question as open only when it is unanswered and has no `ask-later:` line, which gives two open and two held. Running `parseQuestions` on the file returned `open: 2, heldForLater: 2` with no warnings, so the parser does what its code says. The scout reported that `flightdeck/tests/core.test.mjs` lines 133 to 137 and 272 to 277 lock in the code's rule; those tests were not opened. Which meaning stands is the owner's decision. Ran and read.

3. The session got no `Rank:` line. The pilot's instructions say its opening text normally starts with a `Rank:` line. The card said "Captain on deck" but no line starting `Rank:` was present, so the pilot used its fallback rank, which is also Captain. Whether the hook is meant to print a `Rank:` line was not checked.

4. Only the plugin's own guard stops a push to main and holds the model ceiling. `gh api repos/dilberryhoundog/flightdeck/branches/main/protection` returned "Branch not protected (HTTP 404)". The managed settings file `/Library/Application Support/ClaudeCode/managed-settings.json` does not exist, so `maxEffortLevel` and `deniedModels` are not set for the machine. Ran.

5. `PreModelSwitch` is not confirmed as a real hook event. `flightdeck/hooks/hooks.json` registers `guard.mjs ceiling` under `PreModelSwitch`. Validation passed and `claude plugin details` lists it, but neither proves the event fires. If it does not fire, a model switch made during a session is not guarded. Read; not checked against the Claude Code documentation.

6. The hard-rules check is weak in the form pre-flight runs it. Pre-flight runs `node lab/checks/hard-rules.mjs` with no `--base`. In that form `dev-untouched` and `claude-rules-untouched` count only uncommitted and untracked files, as the check's own output says, so on a clean tree they pass whatever the branch has committed. The workshop's `verify.md` uses `--base origin/build-1 --owned auto`. Ran.

7. The card does not say the session is in a worktree. It printed the branch only. The session learned it was in a worktree from Claude Code's own environment note. The worktree folder is named `build-1` and the branch is `build-1-pr1-basic-a1`, so the folder name alone points to the wrong branch. Ran `git worktree list`.

8. Capture lines filed from a worktree session land on the checked-out branch. The pilot's rules say capture lines are filed on the base branch. A pilot working in a worktree of a pull request branch that writes `.flightdeck/workshops.md` would write it on that pull request's branch. No capture line was filed in this session, so this was not tested.

9. One line in the root `CLAUDE.md` did not hold in this worktree. It says `dev/workspace/context/tree.md` does not exist and that the import in `.claude/rules/context.md` is broken. In this session dev-workspace's start hook generated the file and it loaded into context. The file is excluded by `.git/info/exclude`, so the tree stayed clean. Whether the file exists in the main checkout was not checked.

10. Two adversary agents are on offer. A plain `adversary` agent type (with Write and web tools) is listed beside `flight:adversary` (read-only), with similar descriptions. It comes from outside the plugin. A pilot could pick the wrong one. Seen in the session.

11. The pilot can send `flight:pilot` as a subagent. Nothing in the agent list marks it as an agent meant only to lead a session. Seen in the session; not tried.

12. The runner start command uses `--bg`. The team-plans front page gives `claude --bg --agent flight:runner ...`. Whether the installed CLI accepts `--bg` or needs `--background` was not checked.

13. The build-1 scope block is over its own size limit. `node flightdeck/lib/workshops.mjs scope build-1` warned that the scoped files total 7,664 characters against a 6,000-character default, and gave all three whole. Every agent sent into this workshop carries that block. Ran.

14. Where the output style choice is saved is unknown. After `/output-style flight:radio`, no `outputStyle` key appeared in `~/.claude/settings.json` or `.claude/settings.json`, and `.claude/settings.local.json` did not exist. Whether a new session starts in the radio voice was not tested. Ran `grep`.

15. `claude plugin details flight` does not list output styles. Its component inventory shows skills, agents, hooks, MCP servers and LSP servers only, so it cannot be used to confirm the radio style is registered. Ran.

16. `preflight.mjs` printed nothing when run by hand with empty input. The card could therefore not be regenerated during the session to compare with the one shown at startup. The input it expects was not looked into. Ran.

17. The pilot ran the four pre-flight checks at the same time. The preflight skill says to run them in order. The results were the same, but the instruction was not followed.

## Open at the end of the session

- q3 and q4 in `.flightdeck/build-1/questions.md` are unanswered and not held. q3 was put to the owner in the session and was not answered. q4 was not put in full.
- The meaning of "open" (finding 2) waits on the owner.
- Findings 5, 12 and 14 need a check against the Claude Code documentation or a live test.
