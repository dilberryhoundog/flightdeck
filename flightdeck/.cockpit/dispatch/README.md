# Dispatch

The pilot's teams. A team is the unit of record here, with its agents inside, so team makeup and overall purpose can be read at a glance (commander, 2026-09-18). Teams are the pilot's; crews are flightcrew's, and flightcrew does not know about teams. Seats are recorded inside the team file and nowhere else; `../logs/crew-manifest.json` is the frozen archive of dispatches before this room.

Rooms by what the team serves: `cockpit/` for teams that furnish or run the cockpit (recon, research, workshop); `flightcrew/` reserved for teams that fly launches, which will converge on crew departments (prebuild, build, review and cleanup). Sub-dispatches may nest later.

`dispatch.json` is the index. Each team is `T###-slug.md`. Ids are assigned in the order records are written and never renumbered; a team recorded late says so in its header. A one-shot subagent dispatched outside any team is one line in `dispatch.json` with `"file": null`, not a team file.

## Team record shape

- Header: id, date, session, mission, room, purpose in one line, seat count. A team recorded after it flew says so here and only here.
- Seats: one line per agent, subagents included: name, agent type, model, reason for the seat, what it reads, what it returns.
- Shape: who talks to whom, what runs in parallel, what waits.
- Outcome: what came back, what the pilot corrected, what failed (delivery failures count), what it cost if known.
- Lessons: what to change next time this team is dispatched.
