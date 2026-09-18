# Missions

`missions.json` is the manifest. It tracks every mission's id, status, file, branch and dates, and names the `current` mission. Statuses: `planned`, `in_progress`, `blocked`, `complete`, `abandoned`.

Each open mission is a markdown file in this directory named `M###-slug.md`. When a mission completes, the pilot moves the file to `completed/` and updates the manifest's `file` path and `closed` date.

## The work split (commander, 2026-09-18)

- **Workshop** (`../workshop/`): little fixes, problems to fix, maintenance. Work done when not out completing epic missions. Back-at-base work.
- **Incubator** (`incubator/`): ideas, not work and not complete missions. Where epic missions are formulated. The pilot looks over it regularly for ideas that combine into an epic mission.
- **Missions** (this directory): the current and horizon epic missions. Kept lean. A mission earns its place; the store stays fresh and sharp. There is no shelf, so a mission that is not earning its place is completed, returned to the incubator as an idea, or abandoned.
- **Completed** (`completed/`): a mission moves here when it completes. Its file records the trophies (wins), the battle scars (losses and mistakes), and whether and how it can be re-activated.

The manifest points at the incubator index and the workshop index.

Mission ids are sequential and never reused.

## Mission file shape

1. Header: id, title, status, branch, assigned by, opened.
2. Orders: what the commander asked for, near-verbatim.
3. Objectives: a checklist. Ticked as done.
4. Crew dispatched: who, when, for what, outcome.
5. Outcome: written at close.
6. Trophies: the wins, written at close.
7. Battle scars: the losses and mistakes, written at close. During the mission this section is `Lessons`, appended as they happen.
8. Re-activation: whether the mission can be re-activated, and what would trigger it. `none` if it cannot.
