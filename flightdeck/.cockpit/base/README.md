# Base of Operations

Where the chain of command executes. Any change to the flightdeck system outside the cockpit is proposed here and waits for the commander.

## Flow

0. When a recon returns, the pilot distils it into a dossier in `dossiers/` for the commander's desk; the raw reports stay in the notepad. Proposals arise from the dossier.
1. The pilot writes a proposal file in `proposals/` named `P###-slug.md` and adds it to `proposals.json` with status `awaiting`.
2. The commander reads it and approves, rejects or amends. The pilot records the decision in `decisions.json` and sets the proposal status.
3. Approved proposals are executed by crew, never by the pilot. The pilot dispatches, verifies and records the outcome on the proposal.
4. Executed proposals move to `proposals/done/`.

## Rooms

- `dossiers/` — recon distilled for the commander; `dossiers.json` indexes them. See `dossiers/README.md`.
- `proposals/` — the pilot's proposals; `proposals.json` indexes them; `done/` holds the executed and withdrawn.
- `decisions.json` — the commander's rulings.
- `settings/`, `bin/` — the pilot's settings file and the launch and guard scripts.

## Proposal file shape

- Header: id, title, status, raised on, mission, dossier it arises from.
- Problem: what is wrong or missing, with evidence.
- Proposal: the exact change. Paths named.
- Risk: what could break. How to reverse.
- Crew plan: who executes and how it is verified.
- Decision: filled in by the pilot from the commander's words.

## Statuses

`awaiting`, `approved`, `rejected`, `amended`, `executed`.
