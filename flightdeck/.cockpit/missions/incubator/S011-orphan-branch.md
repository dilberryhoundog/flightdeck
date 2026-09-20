# S011 — Cockpit context on an orphan branch with quickfire commits

- **Raised by:** commander, 2026-09-20 (`commanders-desk/out-ideas/orphan-branch.txt`)
- **Heat:** cool; recorded for later by the commander's own note

Separate the cockpit's bulk context (and possibly flightdeck's) from the project repository on an orphan branch, using an ignored cockpit folder, with prebuilt quickfire commits over fixed locations (`commit cockpit`, `commit launch`) as a fast track beside normal commits. `dilberryhoundog/dev-workspace` has a simple working version. A worktree for the pilot is the variant to explore.

Known blockers found by team T010 (`commanders-desk/in-dossiers/DS006-cockpit-paperwork.md`): the write guard hardcodes its allowed roots relative to the repo root while the pilot's settings already export the cockpit path, so the guard misbehaves in a worktree or orphan checkout; stored paths that leave the cockpit stop resolving; Node is not on a bare system path, which bites in the same places. Quickfire commits keyed to locations want stable top-level room names, so they follow the room move.
