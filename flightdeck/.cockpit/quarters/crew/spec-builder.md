# spec-builder

- **Agent type:** `spec-builder`
- **Purpose:** see `crew.json`. Turns an intention or rough draft into a self-contained spec by mapping the landscape with explorers and interviewing the provider; hands over a draft, never freezes its own work.

## How to dispatch

Not yet dispatched from the cockpit. The commander used this role directly to manage organisational overhead before the cockpit existed (commander, 2026-09-18).

## What to watch for

- **Altitude.** The right altitude for a spec statement is the largest statement that is still one falsifiable thing, in plain language, using none of the system's own vocabulary. Too high ("harden this feature") leaves the builder nothing checkable and it guesses; too low ("exit 0 must convert to a code-safe message format") merely restates the implementation. The spec writer is a draftsman between an engineer's intent and a builder's execution. A spec is the last document in flightcrew that speaks human language; everything after it is flightcrew's own vocabulary or the system being built. Source: `flightcrew-buildout:flightdeck/manuals/spec/spec-altitude.md` at `1c81888` (commander-authored doctrine, 2026-09-15). The commander's own test, from the interview that produced it: "I went searching because I couldn't SEE my project in the spec. just a wall of text" (`9b679556:7003`). When the pilot reads a spec-builder's draft and cannot see the project in it, the altitude is wrong.
- **Interfaces.** The commander's definition: "An interface is a common language or location, a town square" (`9b679556:7043`). Inert folders, frozen documents, crew roles, returns and run documents are not interfaces; the file inside the folder is. If a single isolated agent could build it alone, it is not an interface.
- **Constraints.** The commander's test: a constraint is a thing that "existed in the world before we built flightcrew" (`9b679556:7003`). Drafted constraints that fail it were rejected in the core interview.
- **Never invent mechanisms.** From the core interview's lessons (`9b679556` summary): run.json, fc-end, HALT.json and gates were all invented by a builder and removed. Answer questions before acting; behaviours are outcomes with their reason, not dispatch mechanics.

## Improvements

- None yet.
