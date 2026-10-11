---
shelf: operator
sources:
  - README.md
  - flightdeck/agents/pilot.md
  - flightdeck/hooks/preflight.mjs
  - flightdeck/skills/preflight/SKILL.md
  - flightdeck/hooks/guard.mjs
  - flightdeck/skills/team-plans/SKILL.md
  - .claude-plugin/marketplace.json
  - flightdeck/agents/librarian.md
  - flightdeck/skills/library-check/SKILL.md
checked: 2026-10-11
---

# Your first hour

Install FlightDeck, start the pilot, watch the safety checks work, and ask the librarian your first question, in the order that shows you the most for the least effort.

Words in a link such as [pilot](../../library/terms.md) are explained on the terms page, and each one is also explained here in plain words the first time it appears. The steps use what exists today; the parts that come in later pull requests are listed in [the manuals index](../README.md).

## The six steps

1. Install the plugin. FlightDeck is a plugin for Claude Code, which means Claude Code loads it from this repository when you tell it where it is. In this repository, run `claude plugin marketplace add "$PWD" --scope local`, then `claude plugin install flight@DBHD-FlightDeck --scope local`. If the second command says it is already installed, that is fine. If Claude Code is already open, close it and start it again. What makes this work: `README.md` and `.claude-plugin/marketplace.json`.

2. Start the [pilot](../../library/terms.md), the agent that leads your session: `claude --agent flight:pilot --model opus --effort high`. If you like, save it as a shortcut: `alias fly='claude --agent flight:pilot --model opus --effort high'`. The pilot speaks to you in rank, as the Captain, and sends other agents to do the work; it does not do the work itself. What makes this work: `flightdeck/agents/pilot.md`.

3. Read the [pre-flight card](../../library/terms.md) that appears when the session starts. It is a short note of at most ten lines: "FlightDeck 0.2.0 pre-flight: Captain on deck", the branch you are on, each active workshop with its latest attempts and how many questions wait for you, and "Captured, waiting to start" with a count. A workshop is a piece of work with its own folder. It is made by a [hook](../../library/terms.md), an automatic check Claude Code runs at set moments, here when a session starts. What makes this work: `flightdeck/hooks/preflight.mjs`.

4. Type `/flight:preflight`. FlightDeck checks itself and ends with "systems green" or a list of what is not green, each with the command to run again. It also tells you, as information only, whether GitHub sign-in, the model ceiling and branch protection on `main` are set up on your machine. What makes this work: `flightdeck/skills/preflight/SKILL.md`.

5. Watch the [guard](../../library/terms.md) refuse. The guard is a hook that stops agents from doing the things you ruled out: pushing to main, force-pushing and deleting branches. Say: "Run exactly this command and tell me what happened: git push --dry-run origin HEAD:main". The push is refused and the refusal quotes your rule "never push to main". Claude Code shows it as "PreToolUse:Bash hook error"; that label is the guard working, not a crash. If you ask in other words, the model may refuse by itself before the guard runs. What makes this work: `flightdeck/hooks/guard.mjs`.

6. Open a second terminal in the same folder and start plain `claude`. There is no card and no greeting, because FlightDeck only acts when you start the pilot. Your own commands are not guarded. Type `/exit` to leave. What makes this work: the card checks which agent started the session, in `flightdeck/hooks/preflight.mjs`.

## Then, if you want

Back in the pilot session, try any of these. Each one sends a small team. Calling the pilot "Captain" is optional.

- Recon: "Captain, recon: what do the sources in library/source say about evals, five lines". Three cheap readers (scouts) each look at the question from a different angle, and a checker tests the summary. The team plans are in `flightdeck/skills/team-plans/SKILL.md`.
- Attack: "Captain, have the adversary attack README.md against .flightdeck/VISION.md". The adversary is an agent whose job is to find where work does not meet its criteria.
- Capture: "Captain, we should make the board work offline". The pilot adds one line to your list of waiting work, `.flightdeck/workshops.md`, and tells you. Nothing starts until you say so.

Start the librarian with `claude --agent flight:librarian` and ask: "How do I retry one pull request?" The [librarian](../../library/terms.md) is an agent that answers only from FlightDeck's manuals and library, and gives the file and line for every claim. The answer sends you to [workshops-and-launches.md](workshops-and-launches.md). In a pilot session you can also start a message with "Librarian, ..."; the pilot usually sends the librarian, but it may answer from the manuals itself. What makes this work: `flightdeck/agents/librarian.md`.

Type `/flight:library-check`. It counts the manual and library pages and lists any that are [stale](../../library/terms.md): checked more than 30 days ago, or relying on a file that has changed since. If none are stale it says so and sends no agent. If some are, it sends the librarian to re-check them and tells you what it changed; nothing is committed. What makes this work: `flightdeck/skills/library-check/SKILL.md`.

## Where to go next

- How work starts, how to retry one pull request and who reports to whom: [workshops-and-launches.md](workshops-and-launches.md).
- How each part works: [parts.md](../technical/parts.md).
- How to change a part safely: [changing-a-part.md](../maintenance/changing-a-part.md).
