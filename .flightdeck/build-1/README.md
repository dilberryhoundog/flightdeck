# Build 1

The folder for side build 1 of FlightDeck: the planning residue and the pull request attempts. Written by the lead agent; the owner's documents are `../VISION.md`, `../build.txt` and `constraints.md` here.

- `constraints.md`: the owner's file. Your own words for this build go here, dated, one per line.
- `workshop.md`: the card for this workshop (title, work, done).
- `context.md`: what agents working in this workshop need to know.
- `verify.md`: this workshop's own checks and yes-is-pass questions.
- `questions.md`: open questions for the owner, in the standard format.
- `decisions.md`: the lead's decisions, each with a reason, for the owner to strike.
- `attempts/plan/a2/`: planning attempt 2, the current one, made after the owner's notes of 2026-10-11 by `workflows/revise.js`: `plan.md` (its section 0 says what changed), `verify/` and `review.html`. The files listed next are attempt 1, kept as they were.
- `attempts/build-notes.md`: how the lead ran the plan's build section.
- `attempts/pr-<n>/a<k>/`: one folder per pull request attempt, holding its brief, findings, report and log.
- `review.html`: the plain-language review page for the owner (planning attempt 1). Open it in a browser. Its "Your answer" box builds a reply to paste back to the agent.
- `plan/plan.md`: the final plan the review page is built from. `plan/candidates/` holds the three competing plans it was merged from.
- `research/`: the research reports the plans were built on.
- `verify/`: findings from review, fact check, adversary and human imposter, and `plan-resolution.md` saying what was accepted or rejected.
- `workflows/plan.js`: the dynamic workflow that produced the planning files (25 agents: Opus at high effort for designing, judging and revising; Sonnet for research and checks; Haiku for cheap reading).
- `workflows/build.js`: the dynamic workflow that builds the pull requests.

## Retrying the plan

Tell Claude what to change, or add dated lines to `constraints.md` yourself. Then ask Claude in this repository to run the Workflow at `.flightdeck/build-1/workflows/plan.js` with args `{"outDir": ".flightdeck/build-1/attempts/plan/a2", "attempt": 2}`. The workflow always reads `.flightdeck/build-1/constraints.md`. Attempt 1's files stay where they are, and the new attempt writes its own research, plan, checks and review page into its folder.

## Retrying a pull request

1. Add a dated line starting `PR <n>:` to `constraints.md` saying what to change.
2. Say "retry PR <n>".
3. The build workflow runs with `{run, prs: [<n>], attempt: <k+1>}`. It cuts a fresh branch `build-1-pr<n>-<slug>-a<k+1>` from the current `build-1`, writes a fresh attempt folder and opens a fresh pull request.

Attempt `k`'s branch, pull request and folder stay until you close them. A late PR 1 retry also reruns the later pull requests that use what changed. Branch names never start with `build-1/`, because git cannot hold both a branch `build-1` and a branch `build-1/...`.
