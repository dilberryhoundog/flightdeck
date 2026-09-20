# Base of Operations

Where the chain of command executes. Any change to the flightdeck system outside the cockpit is proposed here and waits for the commander.

## Flow

0. When a recon returns, the pilot distils it into a dossier in `../commanders-desk/in-dossiers/` for the commander's desk; the raw reports stay in the notepad. Requests arise from the dossier.
1. The pilot writes a request file in `../commanders-desk/in-requests/` named `Rq###.md` and adds it to `MANIFEST-requests.json` with status `awaiting`.
2. The commander reads it and approves, rejects or amends, in session or in writing at `../commanders-desk/out-advice/`. The pilot records the decision in `MANIFEST-decisions.json` and sets the request status.
3. Approved requests are executed by crew, never by the pilot. The pilot dispatches, verifies and records the outcome on the request.
4. Executed and withdrawn requests move to `../commanders-desk/in-requests/done/`.

## Rooms

- `../commanders-desk/` — dossiers in, requests in, advice out. Indexed by `../commanders-desk/in-dossiers/MANIFEST-dossiers.json` and `MANIFEST-requests.json` here.
- `MANIFEST-decisions.json` — the commander's rulings.
- `settings/`, `bin/` — the pilot's settings file and the launch and guard scripts.

## Request file shape

- Header: id, title, status, raised on, mission, dossier it arises from.
- Problem: what is wrong or missing, with evidence.
- Request: the exact change. Paths named.
- Risk: what could break. How to reverse.
- Crew plan: who executes and how it is verified.
- Decision: filled in by the pilot from the commander's words.

## Statuses

`awaiting`, `approved`, `rejected`, `amended`, `executed`.
