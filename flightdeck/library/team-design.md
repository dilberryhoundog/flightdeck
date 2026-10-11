---
shelf: library
sources:
  - flightdeck/policies.md
  - flightdeck/skills/team-plans/SKILL.md
  - flightdeck/skills/team-plans/ways-to-fly.md
  - flightdeck/skills/team-plans/entry-points.md
  - flightdeck/agents/pilot.md
  - flightdeck/agents/builder.md
checked: 2026-10-11
from: origin/flightcrew-buildout:flightdeck/manuals/orchestration/crew.md (edited)
---

# Team design

How to build a team of agents: which separations matter, how a role becomes an agent file, and where rank fits.

## Roles exist for separations

- A subagent gets only its own definition and what its opening text names, and it returns only what it reports. That isolation is what makes a team worth having.
- The question when designing a team is not how many agents, but which separations the quality of the work depends on.
- Three separations do most of the work. The definer of done is kept apart from the doer, so the builder does not write the checks it is graded on. The judge is kept apart from the judged, so the reviewer and the adversary never see the builder's reasoning. The coordinator is kept apart from the content, so the pilot dispatches and does not build.
- Never fold the builder and the judge into one agent.

## Accountability runs up the chain

- Each agent answers to whoever sent it, for one output in one stated shape.
- Workers do not negotiate with each other. Context passes between them only through files and the results they return, never through side talk.
- A lead accepts or rejects what its Workers report, with a reason. Anything it cannot settle goes up the ladder in `flightdeck/policies.md`: Worker, Officer, Captain, Commander.

## From role to definition

A role is a markdown file. The top part (frontmatter) configures it; the body is the agent's whole instruction, and it knows nothing else about how to behave.

- `name`: the identity the dispatcher uses. Lowercase and hyphens. It names the function and never a rank.
- `description`: written for whoever dispatches. When to use it and what it returns, in one or two sentences, not overlapping with its neighbours.
- `tools`: an allowlist. Leaving it out gives the agent everything, which no role wants. The tools are the role: the scout and the adversary hold Read, Grep and Glob; the reviewer adds Bash to run checks; the builder adds Edit and Write.
- `model` and `effort`: by function. FlightDeck's roster is the scout on Haiku for wide reading; the builder, reviewer, imposter, runner and librarian on Sonnet; the pilot and the adversary on Opus at high effort, because they decide and judge. Nothing runs above Opus at high effort.
- `maxTurns`: the budget for one run, so a stuck agent stops.
- `isolation: worktree`: the builder only, so its edits are in a separate copy of the repository.
- `omitClaudeMd: true`: for the roles that must read their opening text and nothing else, such as the scout, the adversary and the imposter.

The full roster is in the agent files in `flightdeck/agents/`, and the opening text for each seat is in `flightdeck/skills/team-plans/entry-points.md`.

## Rank is a seat, not a name

- Rank is given in the first line of the opening text, as a `Rank:` line. It says who the agent reports to, what it decides and what it does not.
- No file name, `name:` or description holds a rank, because the same agent can be a Worker in one team and an Officer in another. A roster of thirty would need thirty ranks otherwise.
- There are four ranks: Commander, Captain, Officer, Worker. A new agent gets a function name and the standard fallback line from `flightdeck/policies.md`. It does not get a new rank.
- The fallback line applies only when no `Rank:` line is given.

## Design rules

- One job and one definition of done. A body that needs many sections is a role that needs splitting.
- Tools follow the role, never convenience. Every tool an agent holds is a way its role can be bent. Start small and widen only when you have seen the need.
- State the shape of the return, and check it at the handoff.
- Write descriptions for whoever dispatches. Overlapping descriptions send work to the wrong agent, and it looks like the model failing.
- Choose the model by function: wide reading and formatting to a cheap model, judging and deciding to the strongest allowed, and anything a script can check to no model at all.
- Give every agent a budget: `maxTurns` for the agent, and a limit on how many run at once.
- Summarise on the way up: conclusions sized for the lead, with pointers to files for the detail.
- Keep the roster in the repository, so a change to an agent is a reviewed change.

## Ways to fly

There are four ways to run a team plan: subagents from chat, a dynamic workflow, an agent team, and runners in background sessions. They are set out in `flightdeck/skills/team-plans/ways-to-fly.md`.

Choose the simplest one that fits. Agent teams, where agents message each other directly, are experimental and need an interactive session. Use them only when the agents really must talk as they go, such as a live adversary attacking each landing, and accept the extra cost.

## Mistakes to avoid

- The generalist blob: one agent with every tool exploring, building and reviewing in one context. It confirms its own work by construction.
- The reviewer who saw the plan: given the reasoning, it reviews the intention and approves.
- The builder who grades itself: done is declared by the agent that did the work, with no one to refute it.
- Workers passing context to each other: accountability blurs and no one can be said to have failed.
- Agent sprawl: many unmaintained specialists with overlapping descriptions. Keep fewer, sharper roles and retire the rest.
- Inherit-everything tools: no tool list, so every role can do everything.
- The unbounded agent: no turn budget and no cap on how many run, so one stuck agent spends the whole budget unwatched.
- Prompt-only isolation: "do not edit the tests" written in the body of an agent that holds Edit on the tests. Enforce boundaries with tools, guards and worktrees.
