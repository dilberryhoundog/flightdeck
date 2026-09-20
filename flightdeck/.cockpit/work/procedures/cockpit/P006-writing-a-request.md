---
type: "Procedure"
unit: "P006"
status: "draft"
trigger: "on-demand"
stamp: ["2026-09-20", "Pilot: Ace", "b27e6c01"]
context: ["De027"]
---
# P006 — Writing a request

Draft: proposed under De027, not yet approved by the commander.

**Trigger.** On demand: whenever a request is written for the commander's desk.
**Roster.** Pilot alone. A request is the pilot's own judgement and is not delegated.
**Context.** `../../../commander/desk/in/requests/MANIFEST-requests.json`; `../../../commander/desk/out/advice/MANIFEST-commander-advice.json`; `../../../base/README.md` for the request file shape and the status vocabulary; `../../../base/verify/schema/request.json` and `commanders-advice.json` for the two frontmatter shapes.

## Steps

1. Write the request as `commander/desk/in/requests/Rq###.md`, taking the next free number from `MANIFEST-requests.json`. Frontmatter to the schema: `status: "awaiting"`, `work` the mission, `context` the dossier it comes from as a one-item list, `stamp` today's date, your callsign and this session.
2. Add its row to `MANIFEST-requests.json`: id, title, status, the dossier, and the path. Set the manifest's `updated` to today.
3. Create the advice file beside the others in the same act, so the commander never has to make a file to answer in. Take the next free `CA###` from `MANIFEST-commander-advice.json` and write `commander/desk/out/advice/CA###.md` with `type: "Commanders Advice"`, `unit` the new identifier, `context` the dossier and every request this file will answer, `status: "awaiting"`, and `stamp` the facts of its creation — today's date, your callsign, this session — because creating the shell is your act, not the commander's.
4. Give the body one `## Rq###` heading per request the file covers, and nothing else. The commander writes under the headings; empty headings are what tell him what is waiting.
5. Add the row to `MANIFEST-commander-advice.json`: id, `answers` listing the dossier and requests, `date` the day you created the shell, and the path. Set the manifest's `updated` to today.
6. When the commander answers, rewrite that file's `stamp` to him — the date he wrote, `commander`, and the session it was given in — and set `status: "answered"`. The stamp names the hand that last wrote the document, so it moves from you to him the moment the body becomes his. Never stamp him as the author of a body he has not written.
7. Record each ruling as a decision in `commander/decisions/`, naming the advice file in the decision's `source`, and set the request's `status` in both its frontmatter and its manifest row.
8. Run `base/verify/cockpit-lint` on the request, the advice file and both manifests before you tell the commander the request is up.

**Leaves behind.** Log line: the request id, what it asks for, and the advice file opened for it. Files touched: `commander/desk/in/requests/Rq###.md`; `commander/desk/in/requests/MANIFEST-requests.json`; `commander/desk/out/advice/CA###.md`; `commander/desk/out/advice/MANIFEST-commander-advice.json`; later, `commander/decisions/`.
