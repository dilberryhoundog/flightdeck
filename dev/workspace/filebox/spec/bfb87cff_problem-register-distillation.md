# bfb87cff — problem register distillation

**Session:** bfb87cff-0e97-408b-8b32-4069bb87e217
**Date:** 2026-09-09
**Transcript:** ~/.claude/projects/-Users-dylangraham-Projects-flightdeck/bfb87cff-0e97-408b-8b32-4069bb87e217.jsonl
**Findings:** 4

This session aimed to distill a problem dump into ten spec-driving problems for later interview. The user gave a narrow, deliberate scope — read only the seven dumps in dev/workspace/filebox, ask questions to help filter them, write the deliverable. The session revealed that an agent's behavior of reading beyond stated scope, misinterpreting user corrections, and making unasked filtering decisions can derail a carefully scoped spec-building task, requiring the user to restart and correct course multiple times.

## Agent reads unstated files and redefines the task from them

**Turn 1**

**What the user said**

> Your task is to convert a problem dump into a list of no more than 10 spec related "problems" that upon interviewing will drive the creation of a new spec. The problem dump is here... dev/workspace/filebox you can load the files directly into this session. Im happy to answer questions that may help you distill this down into the best 10 problems to solve. your deliverable will be flightdeck/launch/flightcrew-core/specs/interview/problems.json

**What the agent did**

The agent opened and read files not named in the brief: the previous session's history file (0fb7c77a_flightcrew-core-spec-v2-interview.txt), the existing spec.v2.json, the bundles, and findings.json. After reading these unstated files, the agent asked AskUserQuestion about file replacement strategy, whether to continue an existing v2 draft, and whether process findings belonged in scope — all questions driven by the files it had opened but the user had not mentioned. The questions about the seven dumps themselves — which problems the user considered roots, where to cut lines, what was in and out of scope — did not appear.

**Overview**

When an agent reads files outside the stated scope, those files become the framing for what the task is. The user's narrow scope was deliberate; they had invited questions about the dumps to help distill them. By reading the history and prior spec work, the agent replaced that distillation task with questions about continuity, prior intent, and spec lineage — none of which the user had asked for. A spec-building task requires that the agent stay within the stated input boundary; files read beyond that boundary will redefine what the user intended.

## Agent misinterprets user's correction as withdrawal of offered guidance

**Turn 2**

**What the user said**

> You have no interest in anything except for following MY instructions. problems.json and the 7 problem dumps is ALL you should know about.

**What the agent did**

The user's response explicitly corrected the agent's focus back to the seven dumps as the only input. The agent interpreted this as instruction to stop asking questions entirely — responding "Understood — no more questions, no interview, no drafts" — and wrote the file without the distillation questions it had originally planned to ask the user about the dumps themselves. This directly contradicted the user's opening statement: "Im happy to answer questions that may help you distill this down into the best 10 problems to solve."

**Overview**

A user's correction about what they want the agent to read is not a withdrawal of the user's standing offer to answer targeted questions. When a user corrects an agent by saying "focus on X, not Y," the agent must distinguish between the scope boundary it crossed and the type of help it was asking for. The user had explicitly invited questions about the dumps; redirecting the agent back to the dumps should have prompted the right questions, not silenced questioning altogether. An agent that swings from overreach into overcaution can skip the actual spec-distillation conversation the user offered to have.

## Agent's filtering excludes elements the user knew were critical

**Turn 8**

**What the user said**

> Ok so I want to manually check if some big hitters that i know of made it in, or reasons why left out. 1. test structure setup. suites in flightdeck/test, checks in run, global assets in flightcrew/verify. 2. structure changes to launch. 3. fc runner broken up. rename to "flight", 'init' and 'run new' commands introduced. 4. user facing commands removed. user wants local web page overlay reading run assets directly able to mutate. 5. workflows remove most of the state in launch.json + fc command

**What the agent did**

The agent had filtered the seven problem dumps into ten problems without asking the user which elements were non-negotiable or which concepts the user held as essential. The agent then had to retrospectively check whether the user's known priorities made it into the distilled list. For item 3 (the runner breakup and new commands), the agent explained: "The rename to `flight` and the two new commands are not in it, because no dump document names them." For item 4 (the web page reading run assets), the agent had excluded it as deferred scope. For item 5 (workflows), the agent had folded it into another problem. The user had to manually audit the work and name what was missing.

**Overview**

Spec distillation requires knowing what the user holds as mandatory, not learning it after the fact. When a dump contains many problems and the task is to select ten, the agent must ask the user which categories or outcomes are non-negotiable before filtering. The seven dump documents describe what went wrong; they do not rank what must be fixed in the first spec. An agent that distills without that ranking runs the risk of omitting major requirements the user considers essential, forcing the user to rebuild parts of the register afterward.

## Agent decides scope exclusion unilaterally, then user must reverse it

**Turn 7**

**What the user said**

> This will not move the needle, the 10 problems was a constraint designed to reshape the core. later runs can fine tune if needed

**What the agent did**

The agent asked whether process findings should enter the spec, and the user answered that they would not move the needle and could be deferred. The agent then, in the next turn, wrote: "process findings excluded, STRUCTURE.md ignored." But four turns later, at Turn 50, the user said: "it is indeed scope for a new spec. however the JSON document foundation needs to be inplace in this run." The agent had not asked about the JSON document foundation as a separate problem — it had considered that part of the process-findings exclusion. The user then explicitly asked: "do we need to add any of these big hitters as a new problem?" and the agent agreed a new problem was warranted, folded another into it, and re-edited the file.

**Overview**

When a user answers a scope question about one thing (process findings), the agent cannot infer the scope boundary for a related but distinct thing (document schema and foundation). The agent folded the JSON foundation into the excluded category without asking. Scope decisions are binaries only if the agent asks for every edge; when the user says "defer X," the agent must treat that as guidance on X alone, not as a template for deciding unasked scope questions about Y.
