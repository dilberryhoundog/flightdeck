# T001 — Recon team

- **Date:** 2026-09-18, session dcb75456, mission M001, room cockpit
- **Purpose:** recon flightcrew's terrain, history and doctrine; verify every harness claim against official docs; cut candidate epic missions
- **Seats:** 5 teammates, 7 Explore subagents

## Seats

- `runs-recon`, general-purpose, Opus. Reason: judging what a launch and a run look like from the run branches is synthesis. Read: run/flightcrew-characterization-2 and the characterization branches by git plumbing. Returned: launch anatomy, run mechanics, run-2 result, unfinished intent, 17 harness claims; an addendum after reading its explorers.
- `lineage-historian`, general-purpose, Opus. Reason: mining each branch seam for missions is judgement. Read: every branch's commits, plans and history summaries. Returned: five seams, reconciliation, eight candidate missions; revised after reading its explorers.
- `doctrine-recon`, general-purpose, Sonnet. Reason: the doctrine documents are already distilled; clerical reading with a fixed shape. Read: library, manuals, STRUCTURE.md, keep files at three branch points. Returned: the pilot's doctrine briefing with a drift table.
- `docs-verifier`, claude-code-guide, Sonnet. Reason: official-docs lookup. Read: official Anthropic docs. Returned: alignment practices (six sources), three verification batches.
- `mission-cutter`, general-purpose, Opus. Reason: cutting missions with goals and done conditions is synthesis. Read: the four reports by message. Returned: campaign and eight missions.

- Seven `Explore` subagents, Sonnet, spawned by the readers (five under lineage-historian, two under runs-recon): one branch or seam each; hand-backs reached the lead only; raw reports under `notepad/recon-2026-09-18/raw/`.

## Shape

Three readers in parallel; the verifier fetched alignment practices at once and verified claims as each reader landed; the cutter waited for all four. Readers each spawned Explore subagents.

## Outcome

Everything filed and verified under `notepad/recon-2026-09-18/`, distilled into `commanders-desk/in-dossiers/DS001`. The pilot corrected: the tip is the run-2 branch not flightcrew-characterization (pilot's own briefing error); spec-altitude was added after the fork, not deleted; the interfaces rewrite never reached the tip; two remote-lag figures; no local branch named origin. Failures: two reports truncated because briefs said report to `pilot` and the in-team address is `team-lead`; all seven explorer hand-backs went to the lead only, so the readers never saw them until the pilot recovered them from transcripts on disk. The second pass changed both readers' reports materially.

## Lessons

- Address the lead as `team-lead`; give a scratchpad path for long reports.
- Teammate subagents hand back to the lead only. Either the teammate reads directly or the lead plans to relay. Explorer output is not free to the lead's context.
- Sonnet for doctrine reading was adequate but produced two directional misreads of git diffs; blob comparison by the pilot caught them.
- Keep the whole team alive to the end: the second pass was where the value was.
- Explore subagents cost around 100k tokens each; seven of them was a large hidden spend.
