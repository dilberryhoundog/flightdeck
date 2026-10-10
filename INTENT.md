# Intent

Stated by the owner on 2026-10-09.

## What FlightDeck is

- FlightDeck is a Claude Code agentic accelerator: a light layer over Claude Code, pluggable into a project, that deploys agents for advanced agentic workflows using a Claude Code subscription and existing tooling.
- The primary job of the machinery is to take load from the human and transfer it to the agent.
- Claude Code harness content is preferred over bespoke solutions.

## How it is built

- It is built piece by piece. The owner works in a normal session, dispatches teams themselves, and learns while building.
- One component is built at a time. Each component is light and discrete, with minimal overlap with the others.
- Each major component is built on its own branch.
- A half-built system is not used to build itself.

## What main is for

- serving FlightDeck as a versioned plugin
- building out FlightDeck in `flightdeck/`, so it can be imported into the plugin
- testing and improving FlightDeck in `lab/`
- maintaining library content in `library/`
