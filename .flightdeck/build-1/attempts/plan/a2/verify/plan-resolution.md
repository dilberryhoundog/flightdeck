# Planning attempt 2: resolution of verification findings

Written by the lead architect on 2026-10-11. It lists every finding from the four verifiers of `.flightdeck/build-1/attempts/plan/a2/plan.md` (review, fact check, adversary, human imposter), with the decision and a one-line reason. Accepted changes are applied directly to `plan.md`, including its section 0 ("What changed since attempt 1") and its last section. Factual claims were checked against `library/source/claude-code/` before acceptance: agent-view.md ("What carries over when you background", "Settings and provider", "How file edits are isolated"), workflows.md ("Behavior and limits": no file or shell access, no module loading), hooks.md (`additionalContext` phrasing and cap, `SessionStart` on resume, hook environment), permissions.md ("Wrappers": allow rules and leading assignments), worktrees.md and subagents.md (`isolation`, `omitClaudeMd`), and `.flightdeck/build-1/research/harness-core.md` line 127. All of them say what the verifiers quoted.

Totals: 55 findings (review 13, fact check 13, adversary 14, human imposter 15). 51 accepted (four of them as moot because the scope hook is dropped: FC3, FC9, A10, and A11 through FC10), 4 partly accepted (FC6, A5, A7, H1), 0 rejected.

The main change: the scope hook (`SessionStart` and `SubagentStart`, choosing the workshop from `FLIGHTDECK_WORKSHOP` or the branch name) is dropped. A workshop's context and checks now reach agents one way, the opening text, printed by one PR 1 command (`node flightdeck/lib/workshops.mjs scope <name>`); launch workflows and `build.js` get it from a first agent because a workflow script cannot read files. This one decision resolves or removes about a dozen findings.

## Review

- R1 (medium) workshop activation not marked `disable-model-invocation`: accepted. `/flight:workshop` now sets it, the hard-rule check lists capture, workshop, launch, retry and promote, the `pr3-workshop-fires` eval is removed and the climb target moves to the team plans skill.
- R2 (medium) PR 4 ships the demo workshop folder (activates it, blocked by the guard, wrong file count, makes PR 2's try untrue): accepted. PR 4 ships no workshop folder; the owner activates `demo-attempt-age` as the first step of PR 4's try; the guard exempts `flightdeck/templates/`.
- R3 (medium) settle and promote are one command: accepted. Settle is a `settled:` line the owner writes or asks the pilot to write; `/flight:promote` is a later, optional step that refuses an unsettled workshop.
- R4 (medium) the band cannot import the shared reader: accepted. The band carries its own copy of three reading rules in `mods/status-band/lib/read.js`, tested on PR 1's fixtures; PR 8 is now 8 files.
- R5 (low) "plays the Commander" and "usually Captain" would fail the rank-word test if copied into descriptions: accepted. Descriptions say "plays the owner" and name no rank; rank words appear only in bodies, policies, team plans and opening text.
- R6 (low) seat opening described as four lines but written as one: accepted. It is one rank line everywhere.
- R7 (low) Run A rank lines cannot come from `entry-points.md`: accepted. Run A uses this plan's 3.2 text held in the script; `build.test.mjs` checks a `Rank:` line in Run A and Run B prompts.
- R8 (low) address rule contradicts first-hour examples; report line cannot apply to workflow agents: accepted. Address is now "up by rank, down by job or rank, keep it short"; no report line; workflow agents need no address.
- R9 (low) agent counts per pull request wrong: accepted. Corrected to 12 to 15 agents (17 for PR 1) and Sonnet 7 to 9.
- R10 (low) PR 6's eval check would select nothing: accepted. Stated that PR 6 ships `pr1-*` cases and its eval check runs `pr1-*`.
- R11 (low) "ask me again later" has no trigger: accepted. The question is asked on the Run B wave 1 landing page and the clerk then removes its `ask-later:` mark.
- R12 (low) review page re-asks answered pull request lines: accepted. The page shows the owner's attempt 1 answers as given and the reply panel starts filled with them.
- R13 (low) PR 2's copy button uses a PR 3 command: accepted. The button copies the plain line `activate <name>`, which the pilot understands with PR 1 alone.

## Fact check

- FC1 (high) `FLIGHTDECK_UNATTENDED` and `FLIGHTDECK_WORKSHOP` as shell prefixes may not reach a `claude --bg` session: accepted (verified, agent-view.md lists the variables a background session keeps and says a settings `env` block applies). `FLIGHTDECK_WORKSHOP` no longer exists; `FLIGHTDECK_UNATTENDED` goes in a `--settings` `env` block; probe 10 starts a real `claude --bg` session; the runner gets its block in its first prompt.
- FC2 (medium) branch inference cannot reach a builder in a subagent worktree: accepted (verified, worktrees.md). Branch inference, `workshopFor` and its tests are dropped.
- FC3 (medium) "no double injection" for workflow agents unsupported; session variable could leak another workshop's block: accepted. Made moot by dropping the hook; "that workshop only" now holds because only the sender adds a block.
- FC4 (medium) capture and owner-only rules live only in the lazily loaded `.flightdeck/CLAUDE.md`: accepted (verified, harness-core line 127). They are now in `agents/pilot.md` and the root `CLAUDE.md`, and the capture rule opens every seat's text.
- FC5 (medium) file-mode activation half-builds the folder: accepted. The pending bundle lives in `.flightdeck/<name>.activate.md`; the workshop stays captured until the answers are pasted; state and workshop tests cover it.
- FC6 (medium) hook context phrased as commands can be surfaced instead of used: partly accepted (verified, hooks.md). The hook is gone, but the block is still framed as information, and the live check now includes an imperative constraint line ("capitals, ending with OVER") to show a constraint is followed.
- FC7 (medium) default rank has no carrier for agents that skip `CLAUDE.md`: accepted (verified, subagents.md `omitClaudeMd`). Each agent body has one fallback rank line; section 7 reworded; the live check sends a scout without seat text.
- FC8 (low) allow rules do not match past a variable prefix: accepted (verified, permissions.md "Wrappers"). Nested sessions get the variable from `nested-settings.json`; the allow rule is plain `Bash(claude -p *)`; probe 12 checks it, with a wrapper-script fallback.
- FC9 (low) `SessionStart` reruns on resume and duplicates the block: accepted as moot. The scope hook is dropped; the card is short live status and regenerating it on resume is intended.
- FC10 (low) "keeps constraints whole" fails when constraints alone pass the cap: accepted. The block is no longer hook context, so no 10,000-character cap applies; it never cuts a file and prints a warning line over the 6,000-character default.
- FC11 (low) librarian sentence would fail the rank-word test if put in the description: accepted. The sentence goes in the agent body.
- FC12 (low) mechanisms the owner's notes do not need (`promoted:` marks, `promote:` markers, `by`/`from` fields, branch inference, Q2 report line): accepted. All removed; the promoter proposes targets in the draft pull request.
- FC13 (low) no parse rule for the manifest line: accepted. Parse rule stated in 2(b); fixtures with `:`, `|` and brackets in the ask.

## Adversary

- A1 (high) workflows and `build.js` cannot call `scopeBlock` or read `verify.md` (no file access, no module loading): accepted (verified, workflows.md "Behavior and limits"). A first Haiku agent runs the `scope` command and returns `{block, checks, questions}` through a schema; the launch and build tests stub that agent.
- A2 (high) PR 1's guard would deny the PR 4 builder writing the demo `constraints.md`, and agents would activate a workshop: accepted. PR 4 ships no workshop folder; the owner activates the demo; templates are exempt; the risk is listed.
- A3 (medium) section 0 understates which kept choices changed: accepted. Section 0, section 2 and the review page now list B, C, D, E and F with the note that forced each.
- A4 (medium) ask-later turned into "hidden until the owner asks": accepted. Named moment (Run B wave 1 landing page); `ask-later:` now names when; the board shows such questions in a folded list.
- A5 (medium) "about 4 ranks" hardened into exactly four and a blocking test; ban widened to descriptions: partly accepted. "Exactly" and the count test are removed and the wording follows the owner; the hard test covers only file name and `name:`; descriptions without rank words stay as the lead's stated choice, untested, because a description is part of how an agent is presented.
- A6 (medium) subordinate behaviour invented and shown as settled; contradicts the owner hopping on background sessions; brief and triage made Officers; lone agents default to Worker: accepted. The behaviour rules are marked as the lead's proposal in `decisions.md`; the Commander may speak to an Officer directly; brief and triage are Workers; an agent the Captain sends is in the Captain's team.
- A7 (medium) PR 1 grew beyond "okay as shown" mainly for the scope hook: partly accepted. The hook is dropped, so PR 1 grows only by what the notes force (about 48 files and 2,300 lines, not about 50 and 2,600), and the review page says plainly that PR 1 changed. The hook was not moved to PR 3, because it was dropped altogether.
- A8 (medium) the build relies on half-built FlightDeck while saying it does not: accepted. The build session switches the flight plugin off through `enabledPlugins` (probe 11, with a stated fallback); the one dependence on merged PR 1 code (the `scope` command, with a `cat` fallback) is stated plainly.
- A9 (low) the fixed report line and the words "seat" and "u3": accepted. No report line, no numbering; the review page uses "role in the team" for seat.
- A10 (low) the session variable could give another workshop's agents the wrong block: accepted as moot. The variable and the hook are gone.
- A11 (low) constraints over the cap cannot stay whole: accepted (same as FC10).
- A12 (low) mods, `claude plugin test` and `claude plugin details` claims lack a source mark: accepted (verified absent from the library). Marked [live docs] in 3.0, 3.1 and 3.14 and confirmed in stage 0.
- A13 (low) section 1 understates what plain chat gains: accepted. Section 1 and 3.11 list the descriptions, the ceiling check, the git and truth rules for subagents, and the card hook that prints nothing outside a pilot session.
- A14 (low) settling forces a paid promotion run: accepted (same change as R3).

## Human imposter

- H1 (high) PR 1 is no longer "okay as shown": partly accepted. The scope hook is dropped and nothing advanced rides in PR 1; the manifest and the two small templates stay in PR 1 because attempt 1's PR 1 already held the workshop templates and the pilot needs them to activate with PR 1 alone; the review page states the growth and why.
- H2 (high) scoped context mechanism is invented machinery (three paths, branch guessing, cut-off, unproven hook): accepted. One path, explainable in one line: whoever sends an agent into a workshop hands it that workshop's notes and checks in its opening text. A hook can come later as its own pull request.
- H3 (medium) Officer stretched onto one-shot seats: accepted. Build runs: Captain plus Workers; Officer only for team leads and long-lived background sessions.
- H4 (medium) "Captain is the only rank that talks with the Commander live" contradicts the owner: accepted. The Commander may speak to an Officer in its session; the Officer acts and tells the Captain.
- H5 (medium) invented report line and seat numbering: accepted. Replaced with one address line in `policies.md` (decision D2).
- H6 (medium) Q1 and Q2 grill the owner on agent-made options: accepted. Both removed from the review page and recorded as decisions D1 and D2 in `decisions.md` for the owner to strike; the only question carried is the one the owner asked to be asked later.
- H7 (medium) "ask me again later" has no trigger: accepted (same as R11).
- H8 (medium) settle and promote squashed; `promote:` markers are upkeep: accepted (same as R3 and FC12).
- H9 (medium) "recipes" renamed the owner's "team plans": accepted. "Team plan" throughout; the skill folder is `flightdeck/skills/team-plans/`.
- H10 (medium) manifest line is a record scheme with fields: accepted. One plain line: name, ask, date.
- H11 (low) `demo-attempt-age` is agent-invented: accepted. Labelled on the review page and in the plan as an example the lead made up that the owner can delete.
- H12 (low) defaults map agent to rank: accepted. They are fallback lines used only when the opening text gives no rank; each team plan names the rank of each seat.
- H13 (low) activation writes three empty files: accepted. Only the card, `context.md` and `verify.md` are written; the others are created on first write.
- H14 (low) review page too long and jargon-prone: accepted. It leads with what changed and the picture; probes, usage, left-out items and sizes sit in a folded details part; listed jargon gets plain words.
- H15 (low) the plan was not yet verified: accepted. This resolution records the verification; the review page is built only from the revised plan.
