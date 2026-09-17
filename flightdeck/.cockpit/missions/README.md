# Missions

`missions.json` is the manifest. It tracks every mission's id, status, file, branch and dates, and names the `current` mission. Statuses: `planned`, `in_progress`, `blocked`, `complete`, `abandoned`.

Each open mission is a markdown file in this directory named `M###-slug.md`. When a mission completes, the pilot moves the file to `completed/` and updates the manifest's `file` path and `closed` date.

`future` holds ideas not yet opened as missions: `{ "title", "raised_by", "raised_on", "note" }`.

Mission ids are sequential and never reused.

## Mission file shape

1. Header: id, title, status, branch, assigned by, opened.
2. Orders: what the commander asked for, near-verbatim.
3. Objectives: a checklist. Ticked as done.
4. Crew dispatched: who, when, for what, outcome.
5. Outcome: written at close.
6. Lessons: what to improve in the flightdeck or the cockpit.
