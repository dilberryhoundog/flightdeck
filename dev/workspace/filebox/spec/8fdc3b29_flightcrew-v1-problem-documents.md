# 8fdc3b29 — flightcrew v1 problem documents

**Session:** 8fdc3b29-7b30-4f3b-8e8f-07c179ac01ca
**Date:** 2026-09-09
**Transcript:** ~/.claude/projects/-Users-dylangraham-Projects-flightdeck/8fdc3b29-7b30-4f3b-8e8f-07c179ac01ca.jsonl
**Findings:** 8

This session explored and documented the problems with the flightcrew v1 orchestration build. The user worked with an agent to distinguish between source specification, the built system, and the user's vision, generating six problem documents across structure, testing, runner, system, kickoff and crew domains. The recurring friction points reveal how spec work broke down when the agent read beyond stated boundaries, jumped to writing before dependencies were settled, confused investigation with solution design, or mislabeled structural requirements as defects.

## Agent over-read the constitution and inferred architecture it did not prescribe

**Turn 5**

**What the user said**

> Hangon A HUUUUGE principle of orchestrated runs is iterated improvment. abandon failed runs. runs should accumulate many retries until they succeed, rather than one shotting. do we want awesome-run-1, awesome-run-2, awesome-run-3 sitting in launch? do we want three byte identical spec.v1.json files. if spec.v2.json is an iterated evolution of spec.v1.json don't we want it adjacent? what if test-map changes only, do we want a whole new directory to add 2 new tests? do we want our spec sperated from the run assests it drives?

**What the agent did**

In Turn 4, the agent read the constitution documents and concluded that the current folder layout violated the constitution's "setup-and-output split" by placing spec and version series outside the runs. It asserted that "the constitution is silent on shape" but then read that silence as prescribing a specific layout: one specs folder per spec holding its version series, runs named spec-dash-number, and nothing living inside a run that carries setup. The agent turned a principle about run disposability into a specific folder structure.

**Overview**

Specs and source documents often state principles without dictating implementation details. An agent reading a spec must distinguish between what is explicitly required, what is explicitly forbidden, and what is open to design choice. When a spec falls silent on architecture, that silence is data, not an invitation to infer the architecture from first principles. This agent's error was treating "the constitution does not prescribe folder layout" as synonymous with "the constitution prescribes this layout," when the user's question was precisely asking whether the inferred layout was the right one. A spec-writing process must establish what counts as a binding statement versus what counts as open ground, and agents must be trained to read gaps as gaps, not as implicit rules to reverse-engineer.

## Agent wrote scaffold before the structure model was finalized

**Turn 12**

**What the user said**

> 3. "No interviewer role exists on any branch." spec-builder solves this.
> 6. checks/ should live in each run instance as they may have to change/grow as the iterations discover check improvements
> The target model may change what our 'test problems' document sais. we should dig into test problems as well and come back to change this in 6. if it decides something else.

**What the agent did**

In Turn 11, the agent had written the structure-problems.md scaffold and prose in full, then sent it for the user to review. The user marked three corrections to the content, but the third correction flagged a structural dependency: the testing problems document might require changes to this one, so its structure problems prose should not be frozen yet. The agent had written and committed the scaffold before the user had finished settling what decisions the structure model forced on other domains.

**Overview**

In multi-domain spec work, documents often have dependencies. A decision made in one domain can reshape the definitions and problems in another. When an agent is building documents in parallel across domains, it must establish which upstream decisions are final before writing downstream prose. The agent here froze the structure scaffold before the user had confirmed whether the testing model would require structure to change. A spec-building process must map dependencies across its documents and ensure that scaffold or prose in a downstream domain does not freeze until the upstream domain is settled.

## Agent used evidence from the wrong boundary

**Turn 15**

**What the user said**

> 2. what? understand no "run" has ever been a flightcrew run in this repo. they where all CC workflows. we cannot acuse based upon the results. only what has been built. what do you mean "the system cannot carry"? is it more like the blind builder dind't follow the system?

**What the agent did**

In the response before Turn 15, the agent had framed the three-verdict gap as "the system cannot carry ratio and verdict sheet checks" and cited the two maps containing only exit-code checks as evidence that the system was built beneath the three-verdict standard. The user stopped and corrected: the two runs were Claude Code workflows, not flightcrew runs. They cannot be evidence for what the built flightcrew system can or cannot do. Evidence must come from comparing the built source code against the pre-existing specification, not from comparing specifications against the outcomes of test runs that never ran flightcrew.

**Overview**

When building a spec-critique document, the evidence boundary must be established up front: what sources count, what counts as "the system" versus "what users did with it," what a run outcome teaches versus what source code teaches. If that boundary is not stated, agents will infer different boundaries and mix evidence from different scopes. A spec-building process must open with an explicit evidence rule and ensure every finding cites sources that satisfy it.

## Agent used technical jargon without defining terms

**Turn 16**

**What the user said**

> ON the verdicts... I have no idea what this whole passage even means with all these undefined terms "result schema's enum is exit-shaped"

**What the agent did**

In the response before Turn 16, the agent wrote: "the check-result schema allows only pass, fail, error and skipped" and "the result schema's enum is exit-shaped." The user interrupted and said they could not parse the statement. The agent had used technical language (schema, enum, exit-shaped) without defining the terms or explaining what they mean in context, leaving the user unable to know whether to accept the finding or push back on it.

**Overview**

A spec document's audience may not share the author's technical vocabulary. When a spec makes a claim that rests on technical terminology, the terminology must be defined in that document or the document must use plain language to state the same claim. An agent writing a spec must either define every technical term on first use or translate it to language the reader has already been given. This is especially critical when the agent is communicating a gap between what was built and what was specified: if the reader cannot parse the description of what was built, they cannot assess whether the gap is real.

## Agent wrote scaffold before settling core design questions

**Turn 23**

**What the user said**

> um so you got straight to writing? did my answers settle every question?
> what commands would be good to recycle as standalone scripts? and could a standalone script be later absorbed into a larger command surface?

**What the agent did**

In the response before Turn 23, after the user answered the agent's three open questions about the runner, the agent immediately wrote: "The scaffold for the new document is at `dev/workspace/filebox/fc-problems.md`...no prose yet." But the user had not answered the core design question about how the runner and state actually fit together. The user's answers settled "the shape, the origin and the two decisions" but not "how the shape actually runs." The agent had written a full scaffold based on incomplete settling, and the user had to ask clarifying questions about which commands should survive and how scripts could be later absorbed.

**Overview**

A spec scaffold should never be written until the core design questions have been answered. When an agent has open questions that shape what a scaffold will contain, it must wait for those questions to be settled, not write the scaffold and ask for feedback on whether it matches answers that are still being formed. The agent here treated the scaffold as a draft to be reshaped, but spec scaffolds that carry structure and phrasing lock those choices in place and require rewriting when the answers change. A spec-building process must distinguish between the phase where questions are still open and the phase where scaffolds can be written.

## Agent mixed problem-hunting with solution design

**Turns 29-30**

**What the user said**

> pretty sure locked paths lock up all kinds of things like test folders etc. still needed.
> these other questions are confusing, probably indicating that these aren't really problems with the system as built. rather questions of implementation?
> so most of these things you stumbled accross while sifting through other problems. So I havn't been able to conceptualise the problems vs source, constitution or principles?

and

> pretty sure locked paths lock up all kinds of things like test folders etc. still needed.
> you are problems highlighter not solutions implementer. just say it has no bash sandboxing, spec builder will help me decide.
> same with role based hooks, identify if none created, give reasoning.

**What the agent did**

In the response before Turn 29, the agent had listed findings about hooks and permissions, but framed several as open questions: "whether the system would benefit from Bash sandboxing," "whether role-scoped hooks are needed," and "the sandbox and the role-scoped hooks as open questions for the spec-builder." The user corrected the framing twice. First, the user pointed out that these were not "problems with the system as built"—they were open implementation questions. Then in Turn 30, the user redirected the agent's role: not to propose what should be decided, but to identify what is missing or absent and state the reasoning for why it matters.

**Overview**

A spec-critique document has a narrow scope: to identify gaps between source and built system, and to explain why each gap matters. A spec-building agent must not slide into solution design or propose decisions. When an agent encounters an absence (no Bash sandboxing, no role-scoped hooks), it should state the absence and the reasoning for why it was needed, then stop. Whether the gap is a problem, an acceptable trade-off, or a non-issue is for the spec-builder or downstream reader to decide. A spec-building process must maintain a clear boundary between "what is missing from the built system" and "what should be built next."

## Agent offered solution menus instead of problem findings

**Turn 38**

**What the user said**

> This is similar to above. Its not "wich things do you want to implement" we are problem hunting. What does the source say vs what is written? how much heavy lifting can workflows do in the liftoff stage. can they be versioned, can they be iteratively improved. can we suggest a JSON basis that is compatible with web pages later?

**What the agent did**

In the response before Turn 38, the agent had framed the kickoff findings as a set of open decisions: "Should the forms be structured so a page can read it?" and "Confirm whether the rename of the flightcrew checks folder to verify should appear in the document or stay minus." The agent was asking the user to choose between implementation paths (What should a page be able to read? Should we rename the folder?) rather than reporting what the sources say versus what was written. The user stopped and re-stated the scope: the work is to document the gap between source and built, not to build a menu of options for fixing it.

**Overview**

A spec-critique document is investigative, not prescriptive. An agent writing such a document must focus on the question "What does the source prescribe versus what was built?" and stop there. When the agent is tempted to ask "What should we do about this gap?"—should we implement X or Y?—that is a sign the scope has drifted from problem-hunting to solution design. A spec-building process must enforce this boundary by training agents to close their findings with the facts, not with open questions about what to build.

## Agent mislabeled a structural requirement as a system defect

**Turn 41**

**What the user said**

> the key reason for human doing this is that i have to pass `--agent spec-builder` to a session to get the agent. this means I have to invoke.

**What the agent did**

In the response before Turn 41, the agent had grouped the spec-builder's hand dispatch into a category labeled "Roles without the instructions to do their jobs" and "the spec chain and the test-builder have a sentence. So the two roles that begin a launch, the one that produces the spec and the one that produces the checks, are the two roles the system does not know how to start." The user corrected the reading: the spec-builder is not dispatched by hand because the system is broken. It is started by the human with the --agent flag because the spec-builder is a session agent, not a subagent. It requires the user to invoke it because it holds the ask-user-question tool and a subagent cannot ask the human. This is a structural requirement of how the spec-builder works, not a defect of the system.

**Overview**

When critiquing a spec against a source, an agent must distinguish between intentional design constraints and actual gaps. If a source prescribes that a role must be a session agent (because it must ask the human questions), and the built system implements that role as a session agent (requiring the human to invoke it), then that is the design working correctly, not a defect. An agent reading both the design and the implementation must be careful not to label correct-implementation-of-design as a missing piece. This requires understanding not just what the system does, but why the design made each choice. A spec-building process must ensure that agents read design reasoning alongside design specification, so they can recognize when the built system correctly implements a design choice even if the choice looks unusual.

