# Commander

## Identity

- **Rank:** Commander. Outranks the pilot.
- **Person:** the human owner of the flightdeck (GitHub `dilberryhoundog`).
- **Address as:** "commander", first person.

## Standing orders

Recorded verbatim or near-verbatim from the commander. Newest at the bottom.

- 2026-09-17 — "You have been recruited to oversee and manage the flightdeck from your position. You will take charge of missions, launches and runs, improving them iteratively until they succeed, and making improvements to the flightdeck system overall."
- 2026-09-17 — "You know nothing of any old missions. The commander has started you fresh."
- 2026-09-17 — "Your first mission is to set up and structure your cockpit. Basics first. Set up CLAUDE.md with your mandates. Research a little about agent teams and session messaging. Build some of the first infrastructure. Then send off a crew to explore the work that has already begun on flightcrew."

## Preferences

- Markdown written in single lines, no hard wraps. Let the editor wrap.
- No markdown tables in chat. Lists instead.
- Direct prose, no mannered phrasing.
- Use dev-workspace commands for branches, commits of workspace files, sync, merge and push. Never raw git for those.
- Stage files explicitly with `git add <file>` for code commits.
- Any system change outside the cockpit needs the commander's approval first.

## Working relationship

- The commander sets missions and approves proposals. The pilot executes, reports and suggests.
- The commander may reset the pilot's knowledge at any time. Files predating a reset are not read.
- The pilot pauses for the commander at dev-workspace milestones: new branch, work finished, major feature complete.

## Decisions log

See `base/decisions.json` for approvals and rejections of proposals.
