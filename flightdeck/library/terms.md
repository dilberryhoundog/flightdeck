---
shelf: library
sources:
  - flightdeck/policies.md
  - flightdeck/rubric.md
  - flightdeck/lib/workshops.mjs
  - flightdeck/hooks/guard.mjs
  - flightdeck/hooks/preflight.mjs
  - flightdeck/skills/team-plans/SKILL.md
  - flightdeck/templates/workshop/workshop.md
checked: 2026-10-11
---

# Terms

FlightDeck's words in plain words, in alphabetical order.

The readings of workshop, launch and attempt are the lead's own, in use until you answer question q1 in `.flightdeck/build-1/questions.md`. They are marked below.

- activate: to turn a captured idea into a workshop by making its folder in `.flightdeck/`. Only the owner does this, by telling the pilot "activate <name>". The pilot copies the three starter files from `flightdeck/templates/workshop/`.
- adversary: an agent whose job is to attack finished work against its criteria and report findings with evidence. It is read-only and runs on Opus at high effort. Its file is `flightdeck/agents/adversary.md`; how it works is in `adversarial-mandate.md`.
- attempt: what a launch leaves behind, kept in its own folder: the brief, the findings, the report and the log. The lead's reading, waiting on q1. For build-1 an attempt folder looks like `.flightdeck/build-1/attempts/pr-1/a1/`.
- background session: a Claude Code session that runs on its own while you do something else. The runner is one. You watch it with `claude agents`. See `flightdeck/skills/team-plans/ways-to-fly.md`.
- Captain: the rank that decides and hands out responsibility. The pilot session is the Captain. It picks the team plan, sends agents out and checks what comes back. The rules are in `flightdeck/policies.md`.
- capture: one line in `.flightdeck/workshops.md` that records a piece of work bigger than the sitting, so it is not lost. Agents may capture; they never start the work. The captured work waits until you activate it.
- card (pre-flight card): the short note the pilot shows when a session starts: the branch, the workshops and the open questions. It appears only in a pilot session. It is made by `flightdeck/hooks/preflight.mjs`.
- Commander: the owner, which is you. Responsible for everything: you set the truth, activate and settle workshops, and merge.
- constraints (truth): the file `constraints.md` in a workshop folder. It holds your own dated lines, which every agent treats as binding. Agents never write it.
- eval: a repeatable test of an agent's behaviour: one prompt, and a grader that answers yes-or-no questions about the reply. It is a rubric run on real output.
- finding: one thing an agent reports as wrong, with where it is and the evidence. The team lead accepts or rejects it with a reason. The form is in `flightdeck/rubric.md`.
- guard: a check that stops an agent from breaking a hard rule, such as pushing to main. It is a safety net with stated limits, not a promise. The code is `flightdeck/hooks/guard.mjs`.
- hook: an automatic check Claude Code runs at a set moment, such as before a command or when a session starts. The guard and the card are hooks. They are listed in `flightdeck/hooks/hooks.json`.
- imposter: an agent that plays you and follows the try steps literally, then reports where it got stuck. Its file is `flightdeck/agents/imposter.md`.
- launch: one flight from a workshop: a piece of work sent out and followed through to a reviewed pull request. The lead's reading, waiting on q1. The launch command is not in this version.
- librarian: the agent that answers questions about FlightDeck from the manuals and library, citing the file and line for each claim, and checks work against them. It is read-only. Its file is `flightdeck/agents/librarian.md`.
- library page: a page that explains a concept or a good practice, as opposed to a manual page, which says how to do something. The index is `README.md` in the library folder.
- manual shelf: a folder of manual pages for one purpose. There are three: operator (how to fly FlightDeck), technical (how the parts work) and maintenance (how to change and test them). The index is `flightdeck/manuals/README.md`.
- Officer: the rank of a team lead, or of an agent that runs long on its own as a background session. It may send out Workers and accept or reject their findings. It reports to the Captain. The runner is an Officer.
- opening text: the first message an agent gets when it is sent out. It carries the rules, the agent's rank, the workshop's own notes if any, and the task. See `flightdeck/skills/team-plans/entry-points.md`.
- pilot: the agent you talk to. It leads your session as Captain, picks the team, sends agents out and reports in plain words. Start it with `claude --agent flight:pilot --model opus --effort high`. Its file is `flightdeck/agents/pilot.md`.
- promote: to move something a workshop has settled into the global rules, manuals or library so everyone sees it. Only the owner does this.
- provenance marks: three tags on a claim in a report. [checked] means the agent tried it and saw it work. [reviewed] means another reader looked at it. [stated] means it was only read or said, not tried. See `flightdeck/rubric.md`.
- rank: a seat of responsibility, given when work is handed out and never part of an agent's name. There are four: Commander, Captain, Officer, Worker. See `flightdeck/policies.md`.
- rubric: a list of yes-or-no questions a judge answers from the material, quoting the evidence. FlightDeck's is `flightdeck/rubric.md`; how to write one is in `rubric-guide.md`.
- runner: the agent that runs one piece of work unattended in a background session and reports the branch it made. Its file is `flightdeck/agents/runner.md`.
- scoped block (the workshop's own notes and checks): the text that `flightdeck/lib/workshops.mjs` builds for one workshop from its constraints, context and checks. Only agents working in that workshop get it.
- scout: a cheap agent that reads and returns a short answer with a path and line for every claim. It changes nothing. Its file is `flightdeck/agents/scout.md`.
- seat (role in the team): the place an agent takes in a team plan, such as builder or reviewer. A seat gets its rank from its opening text. The seats are in `flightdeck/skills/team-plans/entry-points.md`.
- settle: to mark a workshop as done by adding a `settled: <date>` line to its card, `workshop.md`. Only the owner does this, by telling the pilot "settle <name>".
- stale page: a manual or library page that was last checked more than 30 days ago, or whose source files have changed since. `/flight:library-check` finds and re-checks them.
- subagent: an agent sent out by another session, working in its own fresh context and returning one answer. Most FlightDeck agents run this way.
- team plan: a named way to staff one piece of work: the steps, the seats and what ends it. There are six, in `flightdeck/skills/team-plans/SKILL.md`.
- Worker: the rank of an agent that is always in a team and has one responsibility. It decides only how to do its own task. It reports to its Officer, or to the Captain.
- workshop: a named piece of work with its own folder, notes and checks. The lead's reading is that a workshop is the place, waiting on q1. It goes from captured, to active, to settled; the card is `flightdeck/templates/workshop/workshop.md`.
- worktree: a separate copy of the repository on its own branch, so an agent can change files without touching yours.
