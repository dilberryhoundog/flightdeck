# Root cause

Find why something fails: separate evidence, one hypothesis each, then try hard to refute every one until a single hypothesis survives.

## When to use

Use it when something fails and the cause is unknown: a flaky test, a wrong number, a behaviour nobody expected.

Do not use it to fix the failure. Find the cause here, then fix it with Build and check. "Find out why it is slow and fix it" is two plans in a row.

## What will tell us the work is right

The one surviving hypothesis, ideally confirmed by a small reproduction. Nothing proves it by tests alone, so the report states its confidence and lists what was refuted and why.

## Phases

1. Evidence: scouts each gather a different kind of evidence (logs, files, data, history), without seeing each other's work. Each returns what it found and proposes one hypothesis, with path:line pointers.
2. Refute: for each hypothesis, one adversary in a fresh context tries to refute it using the evidence and anything else it can read. It returns "survives" or "refuted" with a reason a second reader can check. A reviewer may refute a hypothesis that is cheap to test.
3. Loop: refuted hypotheses and their reasons go to new scouts, who look at other evidence and propose new ones. Repeat until exactly one survives.
4. Stop: after three rounds, stop and report where it stands: any survivor, what was refuted, what is still unknown. Do not start a fourth round.
5. Reproduce (optional): a builder writes a small reproduction in the attempt folder that fails for the surviving cause.
6. Report: the lead states the cause, the confidence, the evidence and what was ruled out.

Opening text for each seat is in `entry-points.md`.

## Seats

- pilot (flight:pilot): Captain, opus high; sets the evidence kinds, runs the rounds and writes the report.
- evidence scout 1, evidence scout 2, evidence scout 3 (flight:scout): Worker, haiku default; each gathers one kind of evidence and proposes one hypothesis.
- refuter per hypothesis (flight:adversary): Worker, opus high; tries to refute one hypothesis.
- reproduction writer (flight:builder): Worker, sonnet high; optional, writes the small reproduction.

## Owner's touch points

Nothing starts until the owner says go. The owner reads the report; if no hypothesis survived three rounds, the owner decides whether to give more evidence or stop.

## Size and cost

About 3 scouts and 1 refuter per hypothesis in each round, at most 3 rounds, so usually 7 to 10 agents and at most about 20. Cost class: medium.
