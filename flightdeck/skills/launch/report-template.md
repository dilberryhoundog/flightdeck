# Report formats

The formats of the four files a launch writes into its attempt folder, `.flightdeck/<workshop>/attempts/a<k>/`. Plain words, one paragraph per line. Every line of the report carries one of three marks, and the report says what they mean.

## report.md

The pull request body. The title line is `# <workshop> attempt a<k>: <title>`. The second line is: "Draft pull request into <base>. Only you merge it. Marks: [checked] a script ran; [reviewed] an agent judged it; [stated] an agent said so and nobody ran it." A draft pull request is one marked not ready.

Then these sections, in this order:

- `## Try it in five minutes`: first, always. The brief's try steps, each with the imposter's minutes and its mark.
- `## What changed`: the files, one line each.
- `## Checks [checked]`: each command with its exit code, or "skipped" and why.
- `## Verification [reviewed]`: the review, adversary and imposter verdicts, one line each. A verifier that did not run says so.
- `## Findings and decisions`: one line each: who raised it, severity, decision, reason.
- `## Questions for you`: blocks in the `questions.md` format, which the Captain files into the workshop.
- `## Captured for later`: capture lines, `- <name>: <the ask> (<date>)`.
- `## Proposed for this workshop's context.md and verify.md`: lines starting `context:` or `verify:`. Nothing is written for you; you choose.
- `## Models per stage`: one line.
- `## Retry`: "Add a line to .flightdeck/<workshop>/constraints.md (only you write there), then run /flight:launch <workshop> again: the next attempt is a<k+1> on branch <workshop>-a<k+1>, and this one stays until you close it."

Example:

```
# card-age attempt a1: Show how long ago each workshop last ran

Draft pull request into build-1. Only you merge it. Marks: [checked] a script ran; [reviewed] an agent judged it; [stated] an agent said so and nobody ran it.

## Try it in five minutes
1. Run /flight:preflight. The card lists each workshop with "last attempt 2 days ago". (imposter, 1 minute) [reviewed]

## What changed
- flightdeck/hooks/preflight.mjs: adds the age to each workshop line.

## Checks [checked]
- node lab/checks/hard-rules.mjs --base build-1: exit 0
- claude plugin validate flightdeck: skipped, not in this project

## Verification [reviewed]
- review: no gaps against the brief.
- adversary: one medium finding, accepted.
- imposter: followed every step; step 1 was unclear.

## Findings and decisions
- adversary, medium, accept: an attempt with no date shows "NaN days ago". Reason: reproduced with a folder that has no log.md.

## Questions for you
## q2: Should "today" show as "today" or "0 days ago"?

## Captured for later
- card-colour: colour the age red after 30 days (2026-10-11)

## Proposed for this workshop's context.md and verify.md
- verify: the card shows "never" for a workshop with no attempts.

## Models per stage
scope haiku low, brief opus high, build sonnet high, check haiku low, verify sonnet/opus/sonnet high, triage opus high, fix sonnet high, report sonnet medium.

## Retry
Add a line to .flightdeck/card-age/constraints.md (only you write there), then run /flight:launch card-age again: the next attempt is a2 on branch card-age-a2, and this one stays until you close it.
```

## findings.md

A heading, then one line per finding: `- <verifier>, <severity>, <accept|reject|question>: <finding>. Reason: <reason>.`

Example:

```
# Findings for card-age attempt a1
- adversary, medium, accept: an attempt with no date shows "NaN days ago". Reason: reproduced with a folder that has no log.md.
- reviewer, low, reject: the helper could be one line shorter. Reason: taste, not the brief.
```

## log.md

A heading, then the date, branch and base, then one line per stage: `- <label>: seat <seat>, rank Worker, <model> <effort>, <worktree or not>, <result in a few words>`. A worktree is a separate copy of the repository on its own branch. The last line is "Token use per agent is shown in /workflows."

Example:

```
# Log for card-age attempt a1
Date: 2026-10-11. Branch: card-age-a1. Base: build-1.
- scope: seat scope, rank Worker, haiku low, no worktree, block and 1 check found
- build: seat builder, rank Worker, sonnet high, worktree, complete, 1 commit
- adversary: seat adversary, rank Worker, opus high, no worktree, 1 finding
Token use per agent is shown in /workflows.
```

## pr.md

The first line is the title. Then a blank line, then the body (the same text as `report.md`), then the last line: `To open it: gh pr create --draft --base <base> --head <branch> --title "<title>" --body-file <attempt folder>/report.md`. A launch leaves `pr.md` when it is a dry run or when `gh` is not available.

Example:

```
card-age a1: Show how long ago each workshop last ran

# card-age attempt a1: Show how long ago each workshop last ran
(the rest of report.md)

To open it: gh pr create --draft --base build-1 --head card-age-a1 --title "card-age a1: Show how long ago each workshop last ran" --body-file .flightdeck/card-age/attempts/a1/report.md
```
