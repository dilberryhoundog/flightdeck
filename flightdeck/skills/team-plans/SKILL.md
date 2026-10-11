---
name: team-plans
description: "How to fly a piece of work with a team: six team plans (Recon, Build and check, Decide, Spec first, Many hands, Root cause), the opening text for each role, and the ways to fly (subagents, workflows, agent teams, background runners). Use when choosing how to send agents on a piece of work."
---

# Team plans

A team plan is a named way to staff one piece of work: the steps, the seats, what ends it and what it costs. Read this page first, then open the page of the plan you pick.

## First question: what will tell us the work is right?

Ask this before anything else. The answer is one of four things: tests or checks a script can run; a rubric a reader can apply; an eval that could exist but does not yet; or only the owner's taste (or an open question).

Pick the smallest team plan whose answer fits, and say why in one line. Say "plain chat is enough" when one agent can do it. More agents cost more; add them only for stakes, size or cross-talk the work really has.

## The six team plans

- [Build and check](build-and-check.md): the default. A builder makes the change, then a reviewer, an adversary and an imposter test it in fresh contexts. Use when checks or a rubric can say if it is right.
- [Recon](recon.md): three scouts read separate angles, one summary, one claim check. Use for facts before any decision.
- [Decide](decide.md): options written from different angles, compared, attacked, then the owner picks. Use when the answer is a matter of taste.
- [Spec first](spec-first.md): write "done" as checks first, let the owner glance, then build to them. Use when the checks do not exist yet.
- [Many hands](many-hands.md): a team lead splits the work into independent items, one builder and one reviewer each, then joins them. Use for many separate pieces.
- [Root cause](root-cause.md): separate evidence, one hypothesis each, refuters, stop after three rounds. Use when something fails for an unknown reason.

The opening text for every seat is in [entry-points.md](entry-points.md). The four ways to run a plan are in [ways-to-fly.md](ways-to-fly.md).

## Plugin paths

Claude Code fills in `${CLAUDE_PLUGIN_ROOT}` in this file only, so these are the real paths. The other pages write `<plugin root>` for this path.

- The reader: `${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs`
- The scope command: `node ${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs scope <workshop>`. With `--json` it prints `{block, checks, questions, warnings}`.
- The policies (hard rules and ranks): `${CLAUDE_PLUGIN_ROOT}/policies.md`
- The rubric: `${CLAUDE_PLUGIN_ROOT}/rubric.md`
- The workshop templates: `${CLAUDE_PLUGIN_ROOT}/templates/workshop/`

## The opening text

The first message an agent gets is built in this order:

1. The global rules: the binding documents first (`.flightdeck/VISION.md`, `.flightdeck/build.txt`, the workshop's `constraints.md`), then the hard rules, then the ceiling in words.
2. The seat's `Rank:` line from [entry-points.md](entry-points.md).
3. The workshop's scoped block (the output of the scope command), only for an agent working in that workshop. Never give one workshop's block to an agent working in another.
4. The line "Work outside your brief: report it as a capture line; do not do it."
5. The task.

A global rules block you can paste:

`Binding documents, read first: .flightdeck/VISION.md, .flightdeck/build.txt and, for a workshop, its constraints.md; the newest lines win. Hard rules: never push to main or master, never force-push, never delete a branch, never merge a pull request, never write the owner's files. Ceiling: nothing above Opus at high effort. Writing: one paragraph per line, plain words.`

## Start a runner

A runner is one piece of work run unattended in a background session, in its own worktree:

`claude --bg --agent flight:runner --name runner-<workshop> --settings '{"env":{"FLIGHTDECK_UNATTENDED":"1"},"worktree":{"baseRef":"head"}}' "$(node ${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs scope <workshop>; echo; echo '<brief>')"`

Watch it with `claude agents`. [ways-to-fly.md](ways-to-fly.md) says why each part is there.

## Ranks

The Captain leads (the pilot session, or the lead of a build run) unless a team plan names a team lead, who sits as an Officer. Every other seat is a Worker in the lead's team. Each seat's rank comes from its `Rank:` line in [entry-points.md](entry-points.md), not from the agent's name. The ranks are listed in `${CLAUDE_PLUGIN_ROOT}/policies.md`.
