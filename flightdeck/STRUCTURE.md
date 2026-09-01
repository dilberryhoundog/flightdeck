# FlightDeck Structure

FlightDeck is an orchestration workflow tool for agentic software building, early in its life and intended to eventually replace the dev-workspace system. This document maps `flightdeck/` — the scaffold directory FlightDeck installs into a project, the way dev-workspace installs `dev/`.

## Agent Invariants

- This map records directories only. Individual files are deliberately absent so it stays true as files churn.
- Every folder that needs describing carries a `.keep` file whose name states that folder's default task and whose body describes it.
- A `.keep` file is permanent, not a placeholder. It stays after the folder fills with real contents.
- `library/` is not part of this scaffold. It sits beside `flightdeck/` at the repository root and does not travel with an installed deck.

## Vocabulary

- **FlightDeck** — the tool itself. Written `flightdeck/` when the scaffold directory it installs is meant.
- **keep file** — a `<task>.keep` file naming and describing the default task of the folder holding it.
- **deck** — a single installed `flightdeck/` scaffold within a project. A project may hold more than one.
- **launch** — one self-contained orchestrated build run, with its own specs and checks.
- **manuals vs library** — `manuals/` is what the crew reads to do its job; `library/` is information and records that persist over time, written for humans.

## The tree

```txt
flightdeck/
├── blackbox/                          archive — globally accessible hangars and launches
├── flightcrew/                        orchestration — orchestrated agentic building
│   ├── bin/                           runners — runnable scripts needed for every launch
│   │   └── worker/
│   ├── checks/                        checks — universal check harnesses for every launch
│   │   └── validators/
│   ├── crew/                          agents — the lineup called upon every launch
│   ├── schemas/
│   │   └── worker/
│   └── templates/
├── hangar/                            workspace — main agent loop working directory
├── launch/                            runs — orchestrated build runs, self contained
│   └── example-launch/
│       ├── checks/
│       └── specs/
├── manuals/                           documentation — system manuals the crew reads regularly
│   ├── rubrics/
│   │   └── spec/
│   │       └── deprecated/
│   ├── spec/
│   ├── testing/
│   └── versioning/
├── missions/                          ideas — ideas decomposed, captured here
├── radar/                             visuals — visualisation tools
│   ├── decks/
│   └── panels/
└── testbench/                         tests — harnesses reusable across the git branch
    ├── benches/
    │   ├── rubrics/
    │   │   └── spec/
    │   │       └── fixtures/
    │   └── validator-suite/
    │       └── fixtures/
    └── runs/
```

## Keep files

Each folder that needs describing holds a `<task>.keep` file — `archive.keep`, `orchestration.keep`, `runners.keep`, `checks.keep`, `agents.keep`, `workspace.keep`, `runs.keep`, `documentation.keep`, `ideas.keep`, `visuals.keep`, `tests.keep`. The filename names the default task the folder serves, and the body describes it in a line or two.

Unlike a conventional `.keep`, these are not disposable markers for an empty directory. They persist alongside real contents, so `flightcrew/checks/checks.keep` sits next to the scripts it describes. Read them first when working in an unfamiliar folder: several carry rules that are not inferable from the tree, such as `testbench/tests.keep` reserving `runs/` for local test results and requiring merge protection on the folder.

## Branch note

`launch/agent-types/specs/` exists on the `engage-crew` branch and holds twelve v1 agent-type specifications — the crew roles FlightDeck builds for itself. It is absent from `main` and so from the tree above.

`flightcrew/crew/spec-interviewer.md` is deliberately empty. It is what the next launch builds.
