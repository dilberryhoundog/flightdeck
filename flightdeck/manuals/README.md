---
shelf: index
sources:
  - flightdeck/policies.md
  - flightdeck/agents/librarian.md
  - flightdeck/skills/manual/SKILL.md
  - flightdeck/skills/library-check/SKILL.md
  - flightdeck/skills/library-check/stale.mjs
  - lab/checks/manuals.mjs
checked: 2026-10-11
---

# FlightDeck manuals

Three shelves of pages that say how to fly, how the parts work and how to change them, kept next to the work and checked against the files they describe.

The shelves sit beside the [library](../library/README.md), which holds concepts and best practices rather than how-to pages. Together they are the corpus the librarian presides over.

## The shelves

- Operator: how to fly FlightDeck. Written for you, in plain words.
- Technical: how the parts work, and the register of Claude Code facts they rely on.
- Maintenance: how to change and test a part without breaking the rules.

## Page rules

- One topic per page, about 100 lines, one paragraph per line, no tables.
- Each page describes the current form only: what exists now, not what is planned.
- Each page starts with `shelf:` (its folder), `sources:` (the files it describes) and `checked:` (the day someone last confirmed it against those sources).
- A page is stale after 30 days, or when one of its sources has changed since it was checked. Stale pages are listed by `/flight:library-check`.

## Asking the librarian

In a pilot session, start your message with "Librarian, ..." and the pilot sends the librarian. Or start it alone with `claude --agent flight:librarian`. It answers only from this corpus and the files the corpus cites, gives `path:line` for every claim, and says "Not in the corpus." when a page does not cover the question. It changes no files.

## Making and keeping pages

`/flight:manual <workshop>` has the librarian draft one page from a workshop's files and file it on the right shelf. The page is left uncommitted; keep it with git or delete the file. `/flight:library-check` lists stale pages and has the librarian re-check each one against its sources. Both run only when you type them.

## Operator

- [first-hour.md](operator/first-hour.md): your first hour, from install to your first question to the librarian.
- [workshops-and-launches.md](operator/workshops-and-launches.md): the steps of a workshop, how to launch and retry work, and the chain of command.

## Technical

- [parts.md](technical/parts.md): how each part works, with its files and limits.
- [harness-facts.md](technical/harness-facts.md): the Claude Code facts FlightDeck relies on, each with a verdict and a source.

## Maintenance

- [changing-a-part.md](maintenance/changing-a-part.md): how to change and test an agent, hook, skill, workflow or page, and the correction ladder.

## Not in this version yet

These come in later pull requests. Their manual pages are written once they are merged.

- The flight board: a page to read state and answer questions.
- The commands to capture, activate, retry and promote a workshop (today you ask the pilot).
- Launches: one command to send a team and get back a reviewed pull request.
- The laboratory: drills and evaluations for FlightDeck itself.
- The status band: a line of state above the prompt.
