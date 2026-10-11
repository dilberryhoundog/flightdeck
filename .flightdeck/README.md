# What lives in .flightdeck/

This folder holds the owner's work for FlightDeck. The plugin itself is in `flightdeck/`.

- `VISION.md` and `build.txt`: the owner's own documents. Agents read them and never write them.
- `CLAUDE.md`: the workshop rules, loaded when an agent touches a file here.
- `persona.md`: the owner as the imposter agent plays them, built from the owner's dated words.
- `workshops.md`: the list of workshops, one line each.
- One folder per active workshop. `build-1/` is the first. Each holds a card (`workshop.md`), the owner's `constraints.md`, `context.md`, `verify.md`, `questions.md`, `decisions.md` and an `attempts/` folder.

## The lifecycle

A workshop is a piece of work with its own place to keep notes, checks and results.

1. Capture: a line is added to `workshops.md`. The work waits.
2. Activate: you say "activate <name>" and the pilot makes the workshop's folder from the templates.
3. Settle: you say "settle <name>" and the pilot adds a `settled:` line to the card.
4. Promote: you move what the workshop made into the plugin.

Only you do steps 2 to 4. Agents may do step 1.

## How state is read

Nothing stores a status. A line in `workshops.md` with no folder is captured. A folder is active. A card with a `settled:` line is settled.
