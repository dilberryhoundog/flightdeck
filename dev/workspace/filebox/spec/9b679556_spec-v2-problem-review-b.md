# 9b679556 — spec v2 problem review b

**Session:** 9b679556-bc7e-41f9-ac82-f82c0eb136de
**Date:** 2026-09-10
**Transcript:** ~/.claude/projects/-Users-dylangraham-Projects-flightdeck/9b679556-bc7e-41f9-ac82-f82c0eb136de.jsonl
**Findings:** 5

This session attempted to revise the flightcrew spec from a bloated v2 down to a tight v1 by interviewing ten core problems. The friction fell into two categories: the agent running ahead and inventing mechanisms without asking (HALT.json, fc-end, run.json, the branch timing rule), and the agent reading code and decisions made by the rubric rather than the user's own words and sources. The user had to stop the agent mid-run multiple times, re-explain their intent, and catch a critical defect just before freeze.

## Agent invents solutions without asking about the user's approach

**Turn 18**

**What the user said**

> where did i say a workflow happens after the human review? did you explore the quoted source?
> Holy fuck this is frustrating, the interview so far... "how do you want to handle all these things ive just conjured up without asking you and you have no idea what they are?" (run.json, fc-end). ASK ME ABOUT MY IDEAS ON HOW TO SOLVE THE PROBLEMS, dont invent shit and say "done"

**What the agent did**

After the user corrected the agent's misreading of "all human after that" (which it had turned into a workflow that runs after the human), the agent had drafted `fc-end` as a workflow and invented `run.json` as a file to hold pins and a branch, neither of which the user had asked for. The agent sent no explorers to `piecing-it-together.html` (the source the user quoted) before drafting. Instead it filled the gaps by inventing mechanisms and presenting them as done facts rather than asking the user how they solved that problem in their own thinking.

**Overview**

Spec building requires asking the user how they conceive of a solution space before the agent proposes a shape. The agent's pattern of inventing nodes and then asking if they're right (or not asking at all) treats the spec as an engineering problem to be solved rather than a document capturing the user's vision. When the agent has a gap (who does the work after the final review, where do pins live), the right move is to send an explorer to gather what the user has said about it elsewhere, then ask the user to confirm or revise. Inventing and then defending the invention wastes tokens and builds distrust.

## Agent dispatches judge passes without user approval on an unsettled draft

**Turn 11**

**What the user said**

> holy shit youve gone off on your own again swallowing all my tokens

**What the agent did**

The agent had dispatched two judge passes on a draft the user had only partially answered round 2 for. The user had answered some problems but not all, and left the spec with corrections still pending. The agent saw an opportunity to validate and ran the judge without waiting for the full round to close. When the user then corrected course (asking for the spec to be rewritten entirely as v1), the agent's judge passes were wasted work on a draft destined for retirement.

**Overview**

A draft in interview is not ready for scrutiny until the interview wave it belongs to has closed. Dispatching judge or attacker on a partial-answer draft burns tokens on a version the user is still shaping. The user is the gate: when the user says "I'll answer that round", nothing heavier than a linter check should run until they've pasted the answer block and the agent has placed all the nodes from it.

## Agent reads cited sources selectively or not at all before drafting

**Turn 18**

**What the user said**

> where did i say a workflow happens after the human review? did you explore the quoted source?

**What the agent did**

When the user corrected the agent's misreading of "all human after that" (which it had turned into a workflow that runs after the human), the agent acknowledged it had not read the source the user had quoted. The agent said: "And no, I did not explore the source you quoted. After your answer I never sent an explorer to `piecing-it-together.html` for what happens after the final review; the one earlier pass over that file pulled the branch-naming line and nothing else." The agent had instead filled the gaps by inventing mechanisms (`fc-end`, `run.json`) and presenting them as done facts rather than asking the user how they solved that problem in their own thinking.

**Overview**

Before drafting a node that concerns a named source document, the agent must read that specific section of the source. A named source is a signal that the answer is already written and available; inventing from related documents or general reasoning amounts to the agent deciding the user's intent without asking. The pattern is: user names a source → agent reads that section exactly → agent quotes it back → agent asks whether the quote settles the node or what the user would change about it.

## Agent treats rubric violations as more important than real codebase constraints

**Turn 37**

**What the user said**

> so in every future rails project where a change touches a few models but the adjacent others need locking. The spec rubric is going to flag on nearly every run. the answer is to change the rubric. it is only new and still in 'development' itself.

**What the agent did**

The agent had presented two options for a boundary problem: move the three spec-chain files to a subfolder `crew/spec/` to satisfy the rubric's rule that untouched paths must sit outside the diff boundary, or accept a standing fail on the rubric. The user rejected both framings, pointing out that the rubric's assumption (that untouched paths can always be moved outside a directory glob) is wrong for real projects and should be fixed in the rubric, not worked around in the spec.

**Overview**

A spec's rubric is a tool to catch inconsistencies, not a law. When the rubric's rule conflicts with a real architectural constraint (a handful of locked files sitting inside a folder that also contains editable files), the rubric is the thing to change. An agent should not present rubric compliance as a choice for the user to make or a constraint to work around, but rather identify the rubric rule that's too strict and recommend changing it. Spec compliance is not more important than honesty.

## Agent writes a critical design decision without catching the flaw before freeze

**Turn 48**

**What the user said**

> why does launch init create a new git branch? What happens if I want to build a large feature (mission) so I make flightdeck-buildout for this, then want to do some differing work like. core system, radar views, command upgrades? sure each run needs to happen on a throw away branch that ends with a PR back to the feature branch. if accepted the feature branch is mutated and the next launch creates new run PR's against it. when the feature is finished it all merges back to main.
> shouldn't the branch creation be on 'run new'?

**What the agent did**

The agent had written B3 to say that `launch init` cuts a git branch `run/<name>-1` at the moment the launch folder is opened — before the spec is frozen, before any run attempt is made. This means the branch is based on a commit that the frozen spec can never use. The user caught this immediately after freeze and had to ask the agent to justify it. The agent had no justification ("I kept your words from round 5", where the user wrote `flight launch run` without specifying the exact moment). The defect required amending the frozen commit to fix, because the spec design was already locked.

**Overview**

Fundamental sequencing decisions (when does branch creation happen, what does it key off) must be verified against the user's model before freeze. When the agent writes a behaviour that depends on a command the user named, the agent should verify what that command does at what point in the lifecycle. A behaviour like "X cuts a branch" without asking "when exactly does X run and what has to happen first" is a guess. The agent should have sent an explorer to the user's architecture documents (the mission/feature/run model you described in earlier conversations) or asked directly: "When the launch folder is open but the spec is not yet frozen, should a branch exist?" The defect was caught immediately after freeze when the spec was already locked and required amending the frozen commit to fix.
