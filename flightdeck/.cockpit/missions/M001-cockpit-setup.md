# M001 — Set up and structure the cockpit

- **Status:** in_progress
- **Branch:** cockpit
- **Assigned by:** commander
- **Opened:** 2026-09-17

## Goal

The pilot oversees and manages launches and runs from the cockpit, reporting to and from the commander; improves the flightdeck system by proposing changes up the chain; and keeps the cockpit structured and maintained in service of that. A messy cockpit jeopardises missions. Missions are epic: aim high, do not bog down in details or low-quality mission setup, and follow best practices for long-range agent alignment (a stated goal, a statement of what done looks like). Added 2026-09-18 on the commander's advice.

## What done looks like

- The pilot can be logged on and off, and can call teammates without disrupting other crew. (Achieved 2026-09-18.)
- Notepad, records, quarters, missions and base each have a settled shape, and base is the base of operations.
- The pilot is briefed on flightcrew and on the commander's work so far, and the briefing that matters to a pilot is in `records/` with the commander's approval.
- The terrain is cut into epic missions, each with a goal and a definition of done, approved by the commander and filled out with team findings.
- The commander closes the mission.

## Orders

"Your first mission is to set up and structure your cockpit. Basics first. Set up CLAUDE.md with your mandates. Research a little about agent teams and session messaging. Build some of the first infrastructure. Then send off a crew to explore the work that has already begun on flightcrew."

## Objectives

- [x] Create the `cockpit` branch and carry the cockpit scaffold onto it.
- [x] Write `CLAUDE.md` with the pilot's mandates, layout, session start and session end. Restructured 2026-09-18: CLAUDE.md is folder instructions for any arrival; the pilot's persona lives in `quarters/pilot/`.
- [x] Research agent teams and session messaging; file under `records/claude-code/`.
- [x] Decide the pilot's default instrument (`notepad/claude-code/pilot-choice.md`).
- [x] Pilot identity (`quarters/pilot/identity.md`, `job.md`).
- [x] Commander dossier (`quarters/commander/commander.md`).
- [x] Crew roster and first dossiers (`quarters/crew/`).
- [x] Mission manifest and this file.
- [x] Logs structure with first entry.
- [x] Base of operations: requests queue and decisions record.
- [x] Crew survey of flightcrew returned and filed under `notepad/flightcrew/`.
- [x] First requests raised in `base/` from the survey (Rq001, Rq002, Rq003).
- [x] Cockpit committed and branch pushed (ed132bd, 43538c9 on origin/cockpit).
- [ ] Commander reviews the cockpit.

### Phase 2 — interactivity tools (ordered 2026-09-17)

- [x] Learn the `--settings` flag: what it accepts, file path delivery, precedence, what a settings file can carry. Filed in `records/claude-code/settings-and-launch.md`, tested in `launch-tests.md`.
- [x] Learn ListAgents and SendMessage in practice. Filed in `notepad/claude-code/messaging-observed.md`. Arrival shape still to observe from a real peer.
- [x] Build a first toolset: `base/settings/pilot.settings.json`, `base/bin/pilot.sh`, `base/bin/session-start.sh`. Draft until the commander has invoked it.
- [x] Questions put to the commander and answers recorded (De002 to De006).
- [x] Cross-session message exchanged with `flightdeck-3c` in both directions; wrapper shape recorded.
- [x] Write guard enforcing mandate one, permission mode auto, agent teams flag: all in `base/settings/pilot.settings.json`, tested.
- [x] Mission incubator opened with three sparks.
- [x] Agent teams learned by running one (spark Sp003). First team ran 2026-09-18; observations in `notepad/team-run-2026-09-18/`.
- [x] Team findings actioned on the commander's orders: launcher check (A1), guard rewrite with table test (A2), persona moved to quarters (A12), A3, A4, index and hook batch. Sandbox raised as spark Sp004.
- [x] Toolset tested by the commander invoking the pilot. Sessions 8e74fffb, 49f87e44 and dcb75456 launched by `pilot.sh`; logged on and off across sessions on 2026-09-18.

### Phase 3 — brief, cut, fill (ordered 2026-09-18)

- [x] Team T001 assembled 2026-09-18: five seats on the commander's revised rule 6 (`dispatch/cockpit/T001.json`).
- [x] Pilot briefed on flightcrew and the commander's work so far; reports filed in `notepad/recon-2026-09-18/`, each verified.
- [ ] Recon of the library and manuals summarised for a pilot (`notepad/recon-2026-09-18/doctrine-recon.md`, ready); commander approves; promoted to `records/flightcrew/`.
- [ ] Terrain cut into eight candidate epic missions with goals and definitions of done (`notepad/recon-2026-09-18/mission-cutter.md`, ready); commander approves which earn a place.
- [ ] Approved missions filled out with team findings.
- [ ] Teams integrated as the pilot's first feature (ordered 2026-09-18): team dispatches recorded as JSON per room (`dispatch/MANIFEST-dispatches.json`); every agent dispatched has a filled dossier under `quarters/crew/{flightcrew,team,general}/`; `quarters/crew/MANIFEST-crew.json` is the manifest of every teammate across every crew; favourite setups stored as named rosters in `dispatch/MANIFEST-rosters.json` for repeat dispatch. Done 2026-09-18 for every agent flown in session dcb75456; rosters for the four team shapes flown.
- [ ] The pilot has an agent body (ordered 2026-09-18): the role scoping (fly the mission, do no work, manage teams, preside over the room) and the session-start procedure live in an agent definition launched as the session agent, so CLAUDE.md stays general and crew in the cockpit never mistake themselves for the pilot. Harness fact already verified today: `initialPrompt` fires for a session started with `--agent`.
- [x] Doctrine discovery and integration: T002's five documents ruled source material (Ds002); T006 built the topic store and seven records (Ds003); the commander's advice on Ds003 led to decision team T009 and the record-keeping method (Ds004, Rq010 approved 2026-09-20). Rq009 executed as amended: harness register and four stubs landed, two drafts stay in the notepad. Flightcrew records are now written on demand.
- [x] Record-keeping method adopted (ordered 2026-09-19, approved 2026-09-20): rule 2 and `records/README.md` rewritten (one header line: `Source:`, `Validated:` or `Stub:`), drift events route to a vehicle, currency by periodic review.
- [x] Procedures room scaffolded (Or042) and the five starting cockpit procedures approved (Rq011, De025): `procedures/` with the manifest imported into `CLAUDE.md`, confirmed live. The pilot extracts further procedures from live work (Or043). Flightcrew branch empty by order.
- [ ] Guard the unmerged branch: raised as Rq012 on 2026-09-20, awaiting the commander.

### Phase 4 — the cockpit's paperwork (ordered 2026-09-20, Or044; settled in Ds006)

- [x] The commander's out-ideas explored by team T010 with the commander in the room; identifier set ruled (Or046 to Or049); dossier Ds006 on the desk.
- [ ] Stage A built by the route the commander chooses (Rq013): prefix table, zone and field map, reference checker, rename tool with dry run. Proving run: the 24 references left by the advice rename.
- [ ] The identifier pass as one reviewed, reversible commit: DS to Ds, requests P to Rq, O to Or, D to De, S to Sp, W to WS; procedures numbered from P101; `C` retired.
- [ ] Refactor team with a designer (Or044), chartered from the commander's answers to Ds006: stage B (schema store in `base/`, document shapes, strict-subset frontmatter, `kind` field in live manifests), the four unfinished manifests, the frontmatter convention on real documents, then rooms.
- [ ] Carried from the idea files: a line in `CLAUDE.md` on searchability and metadata conventions; every ID kind named in `CLAUDE.md`.

## Crew dispatched

- 2026-09-17 — harness-guide (`claude-code-guide`): research agent teams, session messaging, subagents. Returned. Filed.
- 2026-09-17 — explorer (`Explore`): survey flightcrew, launch, testbench, manuals, agents, archives, git history. Returned. Filed as `notepad/flightcrew/survey-2026-09-17.md` with digest `state-2026-09-17.md`.
- 2026-09-18 — explorer (`general-purpose`, Sonnet, unnamed subagent): sort `references/` into official, scratch and mixed. Returned. Plan verified; it misclassed `cc.keep` and missed two embedded scratch passages.
- 2026-09-18 — first agent team T004 (Sp003), commander's order; and the CLAUDE.md review team T005. Both recorded in `dispatch/`.

- 2026-09-18 — recon team T001 (phase 3), commander's order: five teammates.
- 2026-09-18 — research team T002, commander's order: five teammates; five records drafted, dossier Ds002.
- 2026-09-19 — decision team T009, commander's order: record keeping (Ds004), then the procedures room scaffold, rule 2 wording check and four stubs (Ds005). Five seats.
- 2026-09-20 — idea exploration team T010, commander's order (Or044): four seats of the `decision` roster plus assets-scout; paper through eleven passes, five adversary rounds, dossier Ds006.
- 2026-09-18 — mini adversary team T003, commander's order: two Opus critics on the day's cockpit work and the plan. Topology briefed from the commander's account in `notepad/flightcrew/topology-2026-09-18.md`.

## Outcome

Pending.

## Battle scars (lessons, appended as they happen)

- Declared the mission complete after one pass. The commander corrected this: the mission had only begun. Rudimentary structure is not a finished cockpit. Do not call a mission done; the commander does.

- `dev-workspace new` refuses a dirty tree. To carry uncommitted files onto a new branch: `git stash push`, `dev-workspace new <name>`, `git stash pop --index`.
