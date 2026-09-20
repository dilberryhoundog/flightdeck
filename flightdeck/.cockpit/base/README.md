# Base of Operations

Where the chain of command executes. Any change to the flightdeck system outside the cockpit is proposed here and waits for the commander.

## Flow

0. When a recon returns, the pilot distils it into a dossier in `../commander/desk/in/dossiers/` for the commander's desk; the raw reports stay in the notepad. Requests arise from the dossier.
1. The pilot writes a request file in `../commander/desk/in/requests/` named `Rq###.md` and adds it to `MANIFEST-requests.json` with status `awaiting`.
2. The commander reads it and approves, rejects or amends, in session or in writing at `../commander/desk/out/advice/`. The pilot records the decision in `MANIFEST-decisions.json` and sets the request status.
3. Approved requests are executed by crew, never by the pilot. The pilot dispatches, verifies and records the outcome on the request.
4. Executed and withdrawn requests move to `../commander/desk/in/requests/done/`.

## Rooms

- `bin/` — the scripts the commander and the harness run: the launcher, the SessionStart hook and the write guard. Indexed by `bin/README.md`.
- `settings/` — `pilot.settings.json`, the file the pilot is launched with.
- `verify/` — a JSON Schema per document type in `verify/schema/`, and `cockpit-lint`, which finds a file's schema by its `type` or `kind` and reports one short line when clean. Indexed by `verify/README.md`.
- `store/` — temporary. The stage A path and prefix maps, superseded by `verify/` and pinned for removal as workshop item WS024.

The requests and decisions this room used to hold are now on the commander's desk: `../commander/desk/in/requests/MANIFEST-requests.json` and `../commander/decisions/MANIFEST-decisions.json`.

## Request file shape

- Header: id, title, status, raised on, mission, dossier it arises from.
- Problem: what is wrong or missing, with evidence.
- Request: the exact change. Paths named.
- Risk: what could break. How to reverse.
- Crew plan: who executes and how it is verified.
- Decision: filled in by the pilot from the commander's words.

## Statuses

`awaiting`, `approved`, `amended`, `denied`, `executed`, `withdrawn`, `superseded`, in that lifecycle order. This is the vocabulary `base/verify/schema/request.json` enforces on a request's frontmatter and the one `MANIFEST-requests.json` rows use.
