# Plan resolution: verification findings on plan.md

Written by the lead architect on 2026-10-10. Every finding from the four verifiers on `.flightdeck/build-1/plan/plan.md` is listed below with its verifier, severity, decision and a one-line reason. Accepted changes are applied in `plan.md`. Factual claims were checked before accepting: `library/source/claude-code/hooks.md` (agent_id only in subagents, agent_type in `--agent` sessions, SessionStart stdout goes to Claude only, `systemMessage` is shown to the user, `if` matches each subcommand and is best effort, PreModelSwitch exists and blocks `/model` switches), `model-config.md` (maxEffortLevel, availableModels and deniedModels are managed settings), `workflows.md` (an effort cap below xhigh rules out ultracode; only `pipeline(list, fn)` is documented), `agent-view.md` (background sessions move into a worktree before editing), `.flightdeck/build-1/workflows/plan.js` line 75 (contains "fable"), `.claude/agents/adversary.md` (tools Read, Write, Grep, Glob, WebFetch, WebSearch; no Bash), and `dev/workspace/research/repo-reset/interview-record.md` item 3 (the owner named a flightdeck/ folder and a lab/ folder). Totals: 72 findings; 67 accepted, 5 partly accepted, 0 rejected outright.

## Review (24 findings)

- R1, review, high, Run A push protection rests on a holey deny list: accepted; explicit allow list replaces `Bash(git *)`, more deny forms added, and a tested `push-check.mjs` hook that fails closed is registered in build-settings.json.
- R2, review, high, live refusal tests run against the real remote: accepted; scratch clones point `origin` at a throwaway local bare repository, the owner's try uses `--dry-run`, and the push rule fails closed.
- R3, review, high, ceiling hook matches free text and would block Run B: accepted; it now matches only the Agent `model` field and `model:`/`effort:` option literals in scripts, with tests that prose mentioning fable is allowed.
- R4, review, high, officers pass the truth guard: accepted; officers use a separate `flight:officer` agent and `FLIGHTDECK_UNATTENDED=1`, both denied, with hook tests.
- R5, review, medium, file and line totals do not match per-PR sizes: accepted; totals recomputed (about 139 files, 7,800 lines; starter set 82 and 4,450) and shown per PR.
- R6, review, medium, plan breaks its own ownership rule: accepted; PR 6 uses `lab/drills/README.md`, PR 4's run-by-path note lives in its own skill, bundle-answer.txt listed once, and each PR creates `lab/owned/pr<n>.txt`.
- R7, review, medium, latest-attempt rule misreads build-1's nested attempts: accepted; one rule in the shared reader (highest `a<k>` at any depth, grouped by parent), tested with a nested fixture, and planning retries go to `attempts/plan/a<k>/` via `outDir`.
- R8, review, medium, five-minute tries run longer: accepted; each try cut to what fits five minutes with the rest marked "next, optional", and the imposter records minutes per step for the PR body.
- R9, review, medium, project adversary cannot run git and has Write: accepted; integrate writes the diff and changed-file list to scratch files given under "=== The Work ===", and the plugin adversary gets Read, Grep and Glob only.
- R10, review, medium, nested installs share the owner's marketplace name: accepted; renamed marketplace per try, serialised installs, before/after list comparison (no scratch config directory, which would need its own login).
- R11, review, medium, several checks cannot run as written: accepted; exact flags for every nested call, a Sonnet live-check stage with a [stated] fallback, an `--eval-dir` probe, and owner-machine preflight items reported as information.
- R12, review, medium, build.js is never written or tested: accepted; stage 0 writes build.js, push-check.mjs and build.test.mjs (stub compile and halt routing) and commits them; the reply format is defined.
- R13, review, medium, no rank table: accepted; rank table with model tier and influence added to 3.2 and `flightdeck/policies.md`, checked by the hard-rule check.
- R14, review, medium, workshop layout does not map VISION's list or define branch isolation: accepted; mapping paragraph added (plans, reports, findings, `log.md`, decisions, truth, derived state) and branch isolation defined and put to the owner as a question.
- R15, review, medium, rubrics, policies, schemas and librarian missing early: accepted; `flightdeck/rubric.md` and `flightdeck/policies.md` in PR 1, schemas named as files, and the librarian gets its own optional `library-review.js` with the reason it is not wired into PR 4.
- R16, review, medium, dw check fails on PR 1's own CLAUDE.md: accepted; the check covers executable files only and allows prose mentions.
- R17, review, medium, static scan words appear in the checker and tests: accepted; scan limited to structured values, checker and tests excluded by path, tested against plan.js and a planted bad file.
- R18, review, medium, PR 4's try leads with an unverified plugin workflow command: accepted; the try leads with `/flight:launch` and second-opinion is "next, optional" with the run-by-path form.
- R19, review, low, CLI is read-only and not on the owner's PATH: accepted; stated as deliberately small, `flight new` and `flight answer` named as next, and `node flightdeck/bin/flight` given for the owner's terminal.
- R20, review, low, only one page tool and no standing improver team: accepted; both stated as left out on purpose, with second-opinion able to review any page.
- R21, review, low, agent counts wrong and no build cost: accepted; counts corrected per PR and per run, tier mix per PR given, and a labelled rough time and usage guess added.
- R22, review, low, "don't wait for me" option stacks diffs: accepted; option dropped, and a late PR 1 retry is stated to rerun the dependent PRs.
- R23, review, low, owner's main conversation can write constraints.md freely and stage 0 writes lines unseen: partly accepted; the reply is written verbatim and dated and the lines are shown, but no extra yes is asked because the words are the owner's own and a yes step is the approval overhead the owner dislikes.
- R24, review, low, no reason given for leaving `.claude/rules/` empty: accepted; reason and the broken import in `.claude/rules/context.md` stated in 2(b) and on the review page.

## Fact check (15 findings)

- F1, fact-check, high, nested installs repoint the owner's real marketplace: accepted; renamed marketplace `DBHD-FlightDeck-try-pr<n>-a<k>`, deny rules for removing the real one, list comparison that stops the run on change, and probe item 8.
- F2, fact-check, high, ceiling scanner would deny plan.js (line 75 contains "fable"): accepted after checking plan.js; structured matching only, with a test that the real plan.js is allowed.
- F3, fact-check, high, pre-flight card goes to Claude's context, not the owner: accepted after checking hooks.md; the card is one JSON object with `systemMessage` and `additionalContext`, tested, and the owner confirms visibility on first use.
- F4, fact-check, medium, truth guard misreads agent_id: accepted after checking hooks.md line 779-780; the guard denies whenever `agent_id` is present, the pilot special case and the wrong "judge problem fixed" claim are removed.
- F5, fact-check, medium, shell-started sessions bypass the truth guard: accepted; `FLIGHTDECK_UNATTENDED=1` on every shell-started claude the plan writes, a separate officer agent, and the claim reworded to Edit and Write tools only.
- F6, fact-check, medium, ceiling claims overstate coverage and ignore native controls: accepted; claims reworded, a PreModelSwitch rule added for FlightDeck sessions, and preflight prints the managed `maxEffortLevel` and `deniedModels` lines.
- F7, fact-check, medium, git rule `if` filter and risk text wrong: accepted after checking hooks.md "Bash if matching"; `if: "Bash(git *)"` with parsing of global options and bare pushes, and the risk text corrected.
- F8, fact-check, medium, background sessions write in their own worktree: accepted after checking agent-view.md; officers commit, push and report their branch, and questions reach the base branch through the pilot.
- F9, fact-check, medium, eval runs are isolated and need flags: accepted; self-contained cases, `--scaffold` and `--allow-tools` only where a case says so, `lab/evals/.gitignore` for results, and the availability wording corrected.
- F10, fact-check, medium, multi-stage pipeline null handling unverified: accepted after checking workflows.md; every stage returns a result or `{halt}`, bodies are wrapped in try/catch, and probe item 4 tests the form with a single-function fallback.
- F11, fact-check, low, `.flightdeck/CLAUDE.md` import breaks outside this repo: accepted; rules written directly in `.flightdeck/CLAUDE.md`, and PR 3 copies a template into other projects on the owner's yes.
- F12, fact-check, low, radio style with `--agent` untested: accepted; PR 1 live check added with the fallback of moving the voice into `agents/pilot.md`.
- F13, fact-check, low, duplicated mechanisms: partly accepted; one shared reader in PR 1 and a narrower ceiling check with native controls, but `flight commit` stays because VISION asks for "bulk commit the flightdeck".
- F14, fact-check, low, bin needs shebang and file mode: accepted; shebang, mode 100755 and a test for both added, and the owner's terminal form stated.
- F15, fact-check, low, pilot tools not listed: accepted; explicit tool lists for pilot, officer, adversary and scout, with a test that the pilot's list covers its job.

## Adversary (17 findings)

- A-F1, adversary, high, ceiling guard blocks the plan.js retry and probably Run B: accepted; same fix as R3 and F2, with tests on the real plan.js and build.js.
- A-F2, adversary, high, PR 1's static check fails by design: accepted; same fix as R17.
- A-F3, adversary, high, owner cannot see the pre-flight card: accepted; same fix as F3.
- A-F4, adversary, medium, truth guard rests on a wrong agent_id claim and lets officers write owner files: accepted; same fix as R4, F4 and F5.
- A-F5, adversary, medium, PR 6 and PR 4 edit PR 1 files: accepted; same fix as R6.
- A-F6, adversary, medium, proposed truth lines and promotion diffs ask the owner to approve agent text: accepted; proposed truth lines dropped (only words the owner typed go into constraints.md) and promotion now opens a draft pull request the owner merges or closes.
- A-F7, adversary, medium, Run B flown by the pilot repeats the owner's named mistake: accepted; every build run is a plain workflow from a plain session, and dogfooding happens through the board, the guards and the demo launch.
- A-F8, adversary, medium, Run A clerk and PR 1 both add questions.md: accepted; in Run A the fix stage writes questions into the PR 1 branch, and the clerk touches questions.md only in Run B.
- A-F9, adversary, medium, imposter sessions lack Bash permission: accepted; nested sessions get `--settings <build-settings.json>`, and a [stated] step counts as not tried and opens the PR as a draft.
- A-F10, adversary, medium, PR 1 carries lab content: partly accepted; eval cases, lint and personas other than the commander moved to PR 6, but PR 1 keeps the hard-rule check because it protects the owner's hard rules, and the commander persona moved to `.flightdeck/persona.md`.
- A-F11, adversary, medium, no logs and no branch isolation for workshops: accepted; `log.md` per attempt written by the script, and branch isolation per attempt defined and put to the owner as a question.
- A-F12, adversary, medium, custom ceiling hook ignores native maxEffortLevel and availableModels: partly accepted; the hook is narrowed and preflight offers the managed settings, but stage 0 does not write them because they are managed settings in a system location the owner should choose to install.
- A-F13, adversary, medium, many claims have no library support: accepted; section 3.0 tags each claim [library], [live docs], [tested] or [probe], and the multi-stage pipeline and `./flightdeck` local install are added to the probe.
- A-F14, adversary, low, seven PRs built at once: accepted; Run B is split into waves, with the starter set first and optional PRs only after a try.
- A-F15, adversary, low, numbers presented as settled: accepted; all lead-chosen numbers listed in 2(h) as changeable defaults that never fail a check.
- A-F16, adversary, low, launch and smoke commands name no model: accepted; `--model opus` on the owner's launch and the pilot quick start, `--model haiku` or `--model sonnet` on nested calls.
- A-F17, adversary, low, ranks do not show influence: accepted; same fix as R13.

## Human imposter (16 findings)

- I1, human-imposter, high, plugin at the repo root clutters the top and ignores the owner's flightdeck/ and lab/ folders: accepted after checking interview-record item 3; the plugin moves into `flightdeck/` (marketplace source `./flightdeck`), with a probe and a fallback to the root layout and a keep-or-change picture on the review page.
- I2, human-imposter, high, too big to build at once and PR 1 not basic: accepted; starter set (PRs 1 to 4) built by default, PRs 5 to 8 tick-to-include, PR 1 trimmed of eval cases, lint, ownership-only tooling beyond the hard-rule check, and three of the six recipes.
- I3, human-imposter, high, guards bite in plain chat: accepted; the card shows only in pilot sessions, the git and truth rules apply only to agents, and 3.11 now says exactly what plain chat gains.
- I4, human-imposter, high, static check turns invented numbers into failures: accepted; only the five hard rules fail, everything else is a PR 6 warning, and the defaults are listed in one box.
- I5, human-imposter, medium, guard and agentType facts probed too late: accepted; stage 0 probes hook fields for `--agent`, subagent and workflow agents with a scratch plugin before building, with stated fallbacks.
- I6, human-imposter, medium, no time or cost estimate: accepted; a labelled rough guess per run, what happens at a usage limit, and the waves as stop points.
- I7, human-imposter, medium, stage 0 asks too much of the owner: accepted; one copy-paste restart block, the one approval click named, and the reply filed verbatim by the lead.
- I8, human-imposter, medium, persona unchecked and scratch installs may repoint the real one: accepted; persona shown in full on the review page for correction, and scratch installs use a throwaway marketplace name.
- I9, human-imposter, medium, six recipes invented and shipped: accepted; PR 1 ships Recon, Build and check and Decide; the other three are keep, rename or drop on the review page.
- I10, human-imposter, medium, workshops are not branch isolated: accepted; the reading (each attempt on its own branch, no long-lived workshop branch) is stated and put to the owner as a question.
- I11, human-imposter, medium, too many coined nouns and constraints.md is not called truth: partly accepted; a glossary of at most ten words and plain words elsewhere, and the file opens with "Your truth for this work", but the name stays (plan.js and build-1 already use it) with a rename question on the review page.
- I12, human-imposter, medium, plan reads as a wall of text: accepted; section 1 broken into short points and section 8 specifies the review page (picture first, decision cards, defaults box, two-minute reply).
- I13, human-imposter, low, roleplay too thin: accepted; rank table listed, in-character greeting and card title, and one "more or less theme" question.
- I14, human-imposter, low, PR 8 and PR 5 on by default: accepted; both off by default, and the band described as an optional extra outside VISION (renamed from "cockpit band" to "status band").
- I15, human-imposter, low, interview never challenges the ask: accepted; one question in every bundle is the adversary's weakest-part challenge, and the interview check confirms it.
- I16, human-imposter, low, "the commander denies, he does not decide" quoted as if the owner's: accepted; quote marks removed and labelled as an earlier agent session summary; other quotes checked against user-intent.md, interview-record.md and owner-truth.md.
