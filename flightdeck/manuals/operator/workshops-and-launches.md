---
shelf: operator
sources:
  - .flightdeck/CLAUDE.md
  - .flightdeck/README.md
  - .flightdeck/build-1/README.md
  - .flightdeck/build-1/decisions.md
  - .flightdeck/build-1/questions.md
  - .flightdeck/build-1/constraints.md
  - flightdeck/agents/pilot.md
  - flightdeck/lib/workshops.mjs
  - flightdeck/policies.md
  - flightdeck/skills/team-plans/SKILL.md
  - flightdeck/skills/team-plans/ways-to-fly.md
  - flightdeck/templates/workshop/workshop.md
  - flightdeck/templates/workshop/questions.md
checked: 2026-10-11
---

# Workshops, launches and the chain of command

How a piece of work lives in FlightDeck from first mention to finished, how to start and retry it with this version, and who reports to whom.

Technical words are explained here and listed on the [terms page](../../library/terms.md). Parts of this story that come in later pull requests (the board, the workshop commands, launches, the lab) are not built yet; each section says what you do instead today.

## The four steps of a workshop

A workshop is a piece of work with its own folder of notes, checks and results, kept in `.flightdeck/`. It has four steps.

- Captured: a line in `.flightdeck/workshops.md`, one per piece of work: `- <name>: <the ask in your words> (<date>)`. It waits. Nothing starts.
- Active: a folder `.flightdeck/<name>/` exists. You say "activate <name>" and the pilot makes the folder from the templates in `flightdeck/templates/workshop/`.
- Settled: the card (`workshop.md` in the folder) has a line `settled: <date>`. You say "settle <name>" and the pilot adds that line.
- Promoted: later, and optional. You lift what deserves it (decisions, context lines, checks) into the rules every session reads, such as the root `CLAUDE.md`, `flightdeck/policies.md` or `flightdeck/rubric.md`. There is no command for this yet.

The step is never written down as a status. It is read from what exists: a line with no folder is captured, a folder is active, a card with a `settled:` line is settled. Only you activate, settle or promote a workshop (decision D1 in `.flightdeck/build-1/decisions.md`); agents may capture, never do the other three.

To capture, mention work that is bigger than this sitting; the pilot adds the line and says so. To see the steps, read the pre-flight card at the start of a pilot session, or `.flightdeck/workshops.md`.

## The files of a workshop folder

- `workshop.md`: the card, with a title, `work:`, `done:` and the optional `settled:` line. Agents write it.
- `constraints.md`: your truth for this work, one dated line per item. Only your words go in it: you type them, or the pilot files words you typed in the session, word for word; no agent adds its own lines.
- `context.md`: what an agent working here needs to know, about 40 lines. Agents write it, on the base branch only (for build-1, the branch `build-1`), never on an attempt's branch.
- `verify.md`: how to tell the work is right: `## checks` (commands a script can run) and `## questions` (yes means pass). Agents write it, on the base branch only (for build-1, the branch `build-1`), never on an attempt's branch.
- `questions.md` and `decisions.md`: agents write them. A decision always carries its reason, so you can strike it.
- `attempts/`: one folder per try (`a1`, `a2`, ...). An attempt writes only in its own folder and proposes changes to `context.md` or `verify.md` in its report.

## How a workshop's notes and checks reach only its agents

An agent knows nothing of a workshop unless it is told. When the pilot sends an agent into a workshop, it runs `node <plugin root>/lib/workshops.mjs scope <name>` and pastes the output into the agent's opening text, the first message the agent gets. The output is the workshop's own notes and checks: your `constraints.md`, `context.md` and `verify.md`. An agent sent to another workshop never receives it, and plain chat does not either.

You do not need to do anything. The technical reason it works this way, and why nothing adds it automatically, is in [parts.md](../technical/parts.md).

## Questions waiting for you

When an agent needs you it writes a question in the workshop's `questions.md`: a heading `## q<n>: <question>`, then `why:`, `options:`, `recommended:`, `asked:` and an empty `answer:` line. A question is open while `answer:` is empty. A question with an `ask-later:` line is held back and is not counted as open on the card.

You answer by filling in the `answer:` line, or by telling the pilot, which asks the open ones in chat in a bundle of at most five. A question you skip stays open; no agent guesses an answer. The template shows the format of a reply you can paste back: `q<n>: <option letter or text> | note: <text>`.

## Launching work with this version

Launching means sending a team to do a piece of work. In this version you do it by talking to the pilot: say what you want done and it picks the smallest team plan that fits, or says plain chat is enough. Agents are named by their job: a scout reads, a builder builds, a reviewer judges, an adversary attacks and an imposter plays you. The six team plans, in `flightdeck/skills/team-plans/SKILL.md`:

- Recon: three scouts read separate angles, one summary, one claim check. For facts before a decision.
- Build and check: a builder makes the change, then a reviewer, an adversary and an imposter test it. The default when checks can say if it is right.
- Decide: options written from different angles, compared and attacked, then you pick. For matters of taste.
- Spec first: write "done" as checks first, then build to them. For work whose checks do not exist yet.
- Many hands: a team lead splits the work into independent items, each with a builder and a reviewer. For many separate pieces.
- Root cause: separate evidence, one theory each, refuters, stop after three rounds. For failures with an unknown reason.

For work that should run while you do something else, the pilot starts a runner in a background session, a copy of Claude Code that works on its own in its own copy of the repository. The command is in `flightdeck/skills/team-plans/ways-to-fly.md`; watch it with `claude agents`. A one-command launch, `/flight:launch`, is not built yet.

## Retrying one pull request

To retry one pull request, add a dated line starting `PR <n>:` to `.flightdeck/build-1/constraints.md` saying what to change, then say "retry PR <n>" to Claude in this repository. The file is yours: you type the line, or tell the pilot your words and it files them as you said them.

The build runs again on a new branch `build-1-pr<n>-<slug>-a<k+1>` with a new attempt folder `.flightdeck/build-1/attempts/pr-<n>/a<k+1>/`, and opens a fresh pull request. For example, PR 7's second try runs on `build-1-pr7-manuals-a2` with the folder `a2` inside `.flightdeck/build-1/attempts/pr-7/`: the short word is the pull request's name, and the number goes up by one each try. The earlier branch, pull request and folder stay until you close them; nothing is deleted. A late retry of PR 1 also reruns the pull requests that use what changed (source: `.flightdeck/build-1/README.md`).

The general rule is "setup carries over, run output does not": your lines and the workshop's notes and checks are kept, the failed attempt's code is not. The rule and what to avoid are in [retry.md](../../library/retry.md).

## The chain of command

Your words (2026-10-11, `.flightdeck/build-1/constraints.md`) fix four ranks. A rank is a level of responsibility, not a name.

- Commander: everything. That is you.
- Captain: the decision maker and responsibility dispenser. The pilot sits as Captain in your session.
- Officer: a team lead, or an autonomous long-lived character running as a background session. A runner sits as an Officer.
- Worker: always in a team, with a single responsibility. A builder, reviewer or scout sits as a Worker.

Rank is a seat: it is given when work is handed out, in the first line of an agent's opening text, and never part of an agent's name. The same agent can be an Officer in one team and a Worker in another. If an agent gets no rank line it falls back to the one in its own file (`flightdeck/policies.md`).

Escalation climbs one rung at a time: Worker to Officer to Captain to Commander, skipping a rung only when it is absent. A Worker whose task is unclear stops and says so; it never guesses and never asks you. Anything that needs you becomes a question in `questions.md`. The address rule (D2): up the chain by rank, down the chain by job or rank, kept short. Who decides what, escalation and address are the lead's proposal, not your words; strike any of them in `.flightdeck/build-1/decisions.md`.

One reading is also the lead's: a workshop is the place, a launch is one flight from it, and an attempt is what a launch leaves behind. It stays in use until you answer q1 in `.flightdeck/build-1/questions.md`.
