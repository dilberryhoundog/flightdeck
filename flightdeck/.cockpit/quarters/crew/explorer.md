# Explorer

- **Agent type:** `Explore`
- **Tools:** read-only search. No Agent, no writes.
- **Purpose:** sweep many files or directories and return a conclusion. Locates; does not audit.

## How to dispatch

Give an ordered list of areas to cover, a breadth setting ("medium" or "very thorough"), a do-not-read list (always includes the cockpit), the report format, and a length cap.

## Observed

- 2026-09-17 — Mission M001. Dispatched to survey flightcrew, launch, testbench, manuals, agents, archives and git history. Returned a 100-line structured report covering all eight areas, respected the do-not-read list, and flagged ten issues with evidence. Strong.

## Improvements

- Worth it: an ordered area list plus a length cap. The report came back structured exactly as asked.
- Next time ask for branch-level surveys with commit ranges named, since the interesting work sat on unmerged branches.
