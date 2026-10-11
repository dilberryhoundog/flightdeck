# Ways to fly

Four ways to run a team plan. Pick the simplest that fits. In this file `<plugin root>` is the plugin's real path, given in `SKILL.md`.

## 1. Subagents from chat

When to use it: most of the time. The pilot (or any session) sends agents one by one or in a group, reads what they return and carries on. Recon and Build and check run this way.

How to start it: talk to the pilot (`claude --agent flight:pilot --model opus --effort high`) and say what you want done. The pilot sends agents with the Agent tool, using the opening text for each seat from `entry-points.md`.

Limits: the agents live and die inside the session; if the session ends, the team ends. Agents sent this way cannot send out agents of their own.

## 2. A dynamic workflow

When to use it: a repeatable team that should run to a script, with many agents at once or a loop until done.

How to start it: the Workflow tool runs a script. Every `agent()` call in it names `model` and `effort`, within the ceiling (nothing above Opus at high effort). A script cannot read files, so a first agent runs `node <plugin root>/lib/workshops.mjs scope <workshop> --json` and returns the block, the checks and the questions; the script puts the block into each later agent's opening text, after its `Rank:` line.

Limits: this version of the plugin ships no workflow scripts; the runnable ones come in a later pull request (launches). Until then the pilot runs a team plan from its page.

## 3. An agent team with a live adversary

When to use it: work where the agents must talk to each other as they go, so the adversary can attack each landing while the builder is still working.

How to start it: agent teams are experimental and work only in an interactive session. Turn them on with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, then ask for the team and name the seats from the team plan. Claude Code's own page is `library/source/claude-code/agent-teams.md` in FlightDeck's repository. The lead of the team sits as an Officer; give the adversary the "adversary live" opening text.

Limits: experimental, so resuming, task coordination and shutdown can misbehave. It is for interactive sessions only, and it costs more than subagents.

## 4. Runners in background sessions

When to use it: one piece of work that should run unattended while you do something else, in its own worktree.

How to start it, from the repository root:

`claude --bg --agent flight:runner --name runner-<workshop> --settings '{"env":{"FLIGHTDECK_UNATTENDED":"1"},"worktree":{"baseRef":"head"}}' "$(node <plugin root>/lib/workshops.mjs scope <workshop>; echo; echo '<brief>')"`

The variable is in `--settings` because a background session does not carry your shell's variables. `FLIGHTDECK_UNATTENDED=1` tells the guards the session is an agent, and `baseRef: head` makes its worktree start from the branch you are on. The first prompt is the workshop's scoped block followed by your brief; start the brief with the runner section of `entry-points.md` if you want its rank line stated (its own fallback is Officer).

The runner sits as an Officer, works in its own worktree, commits by file name and pushes only its own branch. It passes the workshop block on to every Worker it sends. It ends with a report: the branch name, what was done, its questions and its capture lines. Nothing it writes reaches the base branch until the Captain files it.

Watch it with `claude agents`. The Commander may attach to its session and answer its questions; the runner then tells the Captain in its report.

Limits: it cannot ask you in chat, so a question it cannot settle goes into its report. It cannot write the owner's files.
