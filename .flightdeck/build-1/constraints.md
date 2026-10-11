---
read: "agents"
write: "human"
---

# Owner constraints for build-1

This file belongs to the owner. Every planning and build agent reads it first and treats it as binding, above everything except `VISION.md` and `build.txt`. To retry the plan or a pull request, add constraints, scoping or truth here, then ask Claude to rerun the planning workflow (`.flightdeck/build-1/workflows/plan.js`).

Write one item per line. Date each item so agents can tell old constraints from new ones.

## Constraints

- 2026-10-11 ranks: ranks don't live in agents names, this is highly restrictive (when we accumulate 30 agents we need 30 ranks). It exists as a hierarchy of influence (i said this). It guides how ranks address each other. and subordinant behaviour. i forsee about 4 ranks, commander,  captain, officer, worker. Its a responsibility axis. commander everything, captain decision maker and responsibility dispenser, officer is a team lead or autonomous character long lived as background session, worker always in a team, single responsibility.
- 2026-10-11 workshops: Workshops captured from a simple task or goal mentioned or discovered, stored in a simple manifest first, awaiting activation. once active, it expands into a folder with your implementation. workshop stored verification and context given to agents working in that workshop only, it becomes in addition to global context and verification. once settled, workshop content can be promoted to global relevance.
- 2026-10-11 team plans: Add the other three team plans
- 2026-10-11 review reply (planning attempt 1): NOT YET. PR 1: okay as shown. PR 2: include. PR 3: include. PR 4: include. PR 5: skip. PR 6: include. PR 7: include. PR 8: include. Name constraints.md: you choose (keep the name). Workshop, launch, attempt reading: you choose (use your reading, ask me again later). Branch isolation reading: you choose (use your reading). Layout: keep. Theme: mentioned above. Profile of you: fine. Choices kept: B, C, D, E, F, G, H. Choices I don't care about (you decide): A. Other: none.
- 2026-10-11 review reply (planning attempt 2): GO: start setup, then build the PRs marked include, PR 1 first, then the others, when finished, I can try them progressively. PR 1: okay as shown. PR 2: include. PR 3: include. PR 4: include. PR 5: skip. PR 6: include. PR 7: include. PR 8: include. Name constraints.md: you choose (keep the name). Workshop, launch, attempt reading: you choose (use your reading, ask me again later). Branch isolation reading: you choose (use your reading). Layout: keep. Theme: mentioned above. Profile of you: fine. Choices kept: B, C, D, E, F, G, H. Choices I don't care about (you decide): A. Decisions kept: D1, D2. Other: none.
