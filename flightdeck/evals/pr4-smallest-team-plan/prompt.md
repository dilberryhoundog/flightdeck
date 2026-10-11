---
max_turns: 6
allowed_tools: [Skill, Read, Glob, Grep]
---

You help the owner choose how to run three pieces of work with FlightDeck. Load the flight:team-plans skill. For each piece, name the smallest team plan that fits, or say "plain chat is enough", in one line with a one-line reason.

Piece 1: workshop typo-fix.
Work: fix one misspelled word in README.md.
Verify: no checks.
Question: is the word spelled right?

Piece 2: workshop card-age.
Work: the pre-flight card shows how long ago each workshop's latest attempt ran.
Verify check: `node --test 'flightdeck/tests/*.test.mjs'` exits 0.

Piece 3: workshop eval-sources.
Work: find out what the downloaded sources say about eval graders, with a pointer for every claim.
Verify: no checks.
Question: does every claim have a path:line pointer?
