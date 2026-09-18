<!-- DRAFT record, T006, 2026-09-18, contested by the adversary, validated, discovery-checked; awaiting the commander's review (DS003, P009). Removed at landing. -->

# State, Freezing and Gates

Source: topic `state-and-freezing` (`../logs/topics/state-and-freezing.json`); commander turns at `0fb7c77a:2991`, `8fdc3b29:5320`, `8fdc3b29:5435`, `8fdc3b29:5436`, `8fdc3b29:7217`, `9b679556:3257`, `9b679556:3259`, `9b679556:3260`, `9b679556:3269`, `9b679556:3271`, `9b679556:3273`, `9b679556:3274`, `9b679556:7325` in `flightcrew-characterization:dev/workspace/history/<session>_<slug>.txt`; researched 2026-09-18 by T006 record-writer. Companion records: `launches-and-runs.md`, `endings.md`.

## Gates

What the commander rejects is the gate switch, not the gate. "there is no gates, only workflows" (`9b679556:3257`), and the reason follows in the same comment: the original agent "built launch.json to manage state, because he was a dumbo (not his fault)... never needed to flip gate switches. it was his idea not mine" (`9b679556:3259`). Flipping switches in a state file was never part of the commander's job.

The word survives for the points where a human decides, and there are three: the plan, the interfaces, and the ending. Not every wave: "human does not gate the waves" (`9b679556:3269`). The three are named in the same answer: "basically all human after that. final gate is to start again or merge. the other two you have correct plan and interfaces" (`9b679556:3271`). What the final gate offers is in `endings.md`.

What happens between workflows: "workflow agents write things. when they finish I check em. then if im happy I say to the orchestrator, yep do the next workflow" (`9b679556:3260`). Running work as dynamic workflows was expected to "abolish most of the 'phasing' state, and command scripting", though the commander put that as a question rather than a ruling (`8fdc3b29:7217`).

How a gate is cleared mechanically is unsettled, and the commander says so while choosing provisionally. They selected the answer "An orchestrator session invokes the workflows in order, stops at each gate, and reports; the human clears the gate in launch.json" (`9b679556:3273`) and commented on it: "this i haven't found an answer for. worthy question though. imma go with the orch session" (`9b679556:3274`). Treat the orchestrator session as the working choice and the mechanism as open.

## Where state lives

In the documents: "State lives in the docs themselves... freezing / approval written in the doc itself gating the next agent" (`8fdc3b29:5320`).

State is not collected up front and held; it settles as work proceeds: "'state is shaken out of the system progressively' is closer and i would probably take it in that form. freezing can be human managed if they can easily access it. workflows handle a huge amount of state natively that the previous build didn't utilise. agent frontmatter handle state (eg hooks) that the previous builder didn't utilise" (`0fb7c77a:2991`).

Two mechanisms the commander names as already carrying state, and expects to be used: the workflow runtime, and agent frontmatter such as hooks (`0fb7c77a:2991`).

## Phase state

Phase state is the second kind of state, and the commander allows it one home: "The other state is phase state. user gates etc. no problems with a a single json page handling this" (`8fdc3b29:5436`). That page is `launch.json`, covered in `launches-and-runs.md`.

What the phases themselves are has never been stated by the commander. Do not take a phase list from the tooling and record it as theirs.

## What freezing means

"we have more than one 'state' the system needs to handle. freezing is one type. a document is 'frozen' it becomes immutable, especially if attached to a commit. this can then be deterministically ensured by locking those files" (`8fdc3b29:5435`).

A document is therefore in one of two conditions: "Freeze or Draft; Draft is editable, Frozen is user based locking" (`9b679556:7325`).

Freezing is the commander's act, not the system's. It is human managed, provided they can reach it easily (`0fb7c77a:2991`).
