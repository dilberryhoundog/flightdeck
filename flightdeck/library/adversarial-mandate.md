---
shelf: library
sources:
  - flightdeck/agents/adversary.md
  - flightdeck/skills/team-plans/entry-points.md
  - flightdeck/rubric.md
checked: 2026-10-11
from: origin/cockpit:library/review/adversarial-mandate.md (edited)
---

# The adversarial mandate

How to attack a piece of work fairly: what the attacker must find, what counts as a finding, and the form the answer takes.

## The mandate

An adversary is a critic who doubts that any work is finished. It is given two things: the work, and the criteria the work must meet. Its job is to find where the work does not meet the criteria.

It is finished only when it holds findings, or when it can explain, part by part, why none exist. "I looked and saw nothing" is not an account. "Part A meets criterion 1 because of this line; part B meets criterion 2 because of that line" is.

## What a finding is

A finding concerns correctness or a stated requirement, and nothing else. Style, taste, preference, restructuring, and handling for cases the criteria exclude are not findings. If the criteria do not say it, the adversary may not invent it.

This keeps the attack honest. A critic that may complain about anything always has something to say, and the owner learns to ignore it.

## Severity

Every finding names its severity: high, medium or low. Judge it on one axis with two ends.

- On one end, the number of criteria the finding offends. A flaw that breaks three criteria weighs more than one that breaks one.
- On the other end, the importance you place on each of those criteria for this subject. One broken criterion that the whole work exists to meet can outweigh three minor ones.

Use the axis to decide where the finding sits on the high, medium, low scale. Say why in a few words.

## Confidence

Every finding also names a confidence: how sure you are that a second reviewer with the same task would find the same offence. High means almost certainly. Low means you may be reading something into it.

Severity says how bad the problem is. Confidence says how likely it is to be real. They are separate, and a finding can be high on one and low on the other.

## Evidence

Every finding carries evidence: the passage of the work and the clause of the criteria it fails, both quoted or pinpointed, and the concrete case in which following the work gives the outcome the criteria forbid.

A finding that a second reader cannot reproduce from the evidence alone is not a finding. Withdraw it, or go and find the evidence.

## The answer

Sort findings by severity, then by confidence inside each severity. Number them F1, F2, F3 and so on. The codes are `S-H`, `S-M` and `S-L` for severity, and `C-H`, `C-M` and `C-L` for confidence.

```md
**F1** — **This is a finding**
**S-H** · **C-M**
**FINDING**:
<what is wrong>
**EVIDENCE**:
<the passage, the clause, and the case that shows it>
```

When there are no findings, the answer takes this form instead, and it is a full result.

```md
**NO FINDINGS FOUND**
**REASONS**:
<why none exist, part by part>
```

## How FlightDeck uses it

The mandate is carried by the `flight:adversary` agent, in `flightdeck/agents/adversary.md`. The agent is read-only: it can read and search, and it changes no files.

The adversary starts at once when its opening text holds both headings `=== The Work ===` and `=== The Criteria ===`. The work is given as paths (a diff file, a list of changed files, a branch). The criteria are one per line: the global ones, plus the workshop's own.

If either heading is missing, it replies with one short request for them and does nothing else. This stops it from guessing what to attack.

It runs in one of two modes, and the opening text for each is in `flightdeck/skills/team-plans/entry-points.md`.

- Live mode: the adversary sits in the team from the first landing. On each round it attacks only the parts that changed. When it is shown to be wrong it withdraws the finding in writing, with a reason. Withdrawing under challenge is part of the job.
- Cold mode: the adversary runs at the end, from a fixed brief. It gets the finished work and its sources, never the history of how it was made, and attacks once.

The adversary raises findings. It does not accept them. The lead of the team (the Captain, or an Officer) accepts or rejects each one with a reason, so the critic and the judge of the critic stay separate.

The reviewer reports in a simpler form with the same spirit, set out in `flightdeck/rubric.md`: severity, where, finding, evidence, suggested fix. The adversary's form adds confidence because it is the one agent whose job is to doubt.

## Writing criteria the adversary can use

An adversary is only as sharp as its criteria. A criterion it can quote is one it can fail the work against. "Is it good?" cannot be failed. "Does every claim carry a path and a line?" can.

When criteria are written as yes-is-pass questions, see the rubric guide in this library. That page and this one are two halves of one habit: the rubric says what to ask, the mandate says how hard to push on the answer.

## Mistakes to avoid

- Reporting taste as a finding. If the criteria are silent, so is the adversary.
- Reporting a worry without evidence. Worries go in a note, not in the findings list.
- Stopping at the first finding. The adversary is finished when it has searched every part, not when it has found one thing.
- Defending a finding that has been shown wrong. Withdraw it with a reason and move on.
- Looking up the history in cold mode. The point of cold mode is that the critic meets the work the way a stranger would.
