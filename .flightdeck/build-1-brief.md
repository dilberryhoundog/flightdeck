Written by an agent on 2026-10-10 from the owner's answers in the launching session. Quoted text is the owner's.

You are the lead for side build attempt 1 of FlightDeck, on branch `build-1` of this repository. Your brief is `.flightdeck/build.txt`. The vision you are building is `.flightdeck/VISION.md`. Read both in full first. This message adds what the owner said after writing them; where it and `build.txt` differ, `build.txt` wins.

## Whose words are whose

- `.flightdeck/VISION.md` and `.flightdeck/build.txt` are written by the owner. They are the only documents that bind you.
- Everything else in the repository was written by agents, including `INTENT.md`, `README.md`, `HISTORY.md`, the folder layout and every document on the other branches. Use any of it, change it or ignore it. The owner's comment on `INTENT.md`: "Who wrote INTENT.md? agents, they always get stuff wrong." Its section "How it is built" (one component at a time, built by hand) does not apply to this build.

## What the owner left to you

The owner was asked to specify the items below and answered "let em cook" to each. Decide them yourself and show your decisions on the review page.

- What "working" means for each part. Owner: "im fatigued working it all out upfront. show me something that works great. and fits the goal."
- Where everything goes: the layout of `.flightdeck/`, what lives in `.claude/`, what lives at the plugin root. Owner: "see where they put stuff."
- How a retry works: where the owner's added constraints go, and how a second attempt is kept apart from the first.
- How big the build is. Owner: "if i like it but its too big, I cut it down."
- Three things the vision does not state: how the owner starts a piece of work, where questions waiting on the owner are held, and whether FlightDeck replaces dev-workspace or sits beside it.

## What the owner did state

- The owner must be able to try the result straight away. Owner: "Agent should build it so I can instantly try it out, particularly dogfooding itself."
- A human imposter is an agent that acts like a human. Owner: "great for testing stuff like interview questions." `build.txt` requires your result to be verified by review, by adversary and by human imposter.
- Use dynamic workflows (the Workflow tool) for the multi-agent work. The owner asked for this in their own words: "a complete dynamic workflow based build ... using opus 5.5 as orch and sonnet 5.5 as workers". There is no limit on the number of agents: "do what it takes to get the agents we need." The default workflow size guideline does not apply.
- Models: nothing above Opus at high effort. Sonnet 5.5 is the owner's preferred worker. Use Haiku for file sweeps and other cheap reading.
- The owner on cost and risk: "Im not scared. its retryable, they are only tokens, i might end up with something awesome i don't not forsee."

## Order of work

1. Research and explore. `build.txt` says not to hesitate.
2. Plan.
3. Stop. Produce the review page that `build.txt` asks for: one HTML page covering everything awaiting building, in plain, simple language with no jargon. Commit it to `build-1`, push, and tell the owner where it is. Then wait for the owner. Do not start building until the owner replies.
4. Build, after the owner replies, as `build.txt` describes: several pull requests into `build-1`, the basic one first, each advanced feature in its own pull request so it can be rejected and retried alone.

A workflow cannot pause for a human. Planning is its own workflow run that ends at step 3; building is a later run.

## Facts about this environment

- Earlier work is on other branches of `origin`. `HISTORY.md` lists them. `dev/workspace/research/repo-reset/` holds five reports that index that work (`work-inventory.md`, `branch-report.md`, `concept-trace.md`, `user-intent.md`, `interview-record.md`); `user-intent.md` holds the owner's dated words from past sessions. Reading them is cheaper than rediscovering the branches.
- Downloaded sources are in `library/source/` (Claude Code documentation, Claude developer blog, Anthropic papers, JetBrains guides).
- The rules in `.claude/rules/` describe a `dev-workspace` CLI. It is installed on the owner's machine and may not be installed where you are running. If it is missing, use plain `git` and `gh`.
- Never push to `main`. Never force-push. Never delete a branch. All work lands on `build-1` or on branches that open pull requests into `build-1`. The owner merges the pull requests.
- The owner's writing rules: no markdown tables in chat replies (use lists); write each paragraph as a single line in markdown files, with no hard wrapping; say things literally and directly.
