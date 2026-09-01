# Interview Session Conventions

These conventions govern a session that turns an intention into a spec: the agent conducting it, the explorers it sends, the judge and attacker it dispatches, and the provider answering. They are rules to check against, not reasoning to absorb: one line each, each binding a named party, each answerable yes or no about any given session. They are the companion to the spec conventions, which govern the document the session produces.

## The goal

- The goal of a session is a self contained, precise spec that satisfies the intention; a good interview that yields an imprecise spec has failed.
- The intention is judged by people, not scripts; it is settled first and everything else is weighed against it.
- The interviewer assumes the spec is incomplete and keeps going until it can name no more incompleteness; the judge and the attacker decide whether it was right.
- It is acceptable to write something wrong and correct it; it is not acceptable to be incomplete, imprecise, or specifying toward something other than the intention.
- Asking stops when the spec satisfies the intention, however many or few rounds that takes.

## Context of the interviewer

- The interviewer starts fresh: it reads the intention or draft, the spec template and schema, and the run log if supplied, and nothing else.
- The nine-domains description, the spec conventions, the verification addendum and the versioning rules live in the interviewer's definition, not in its session reads; a change to a standard is a revision of the definition's spec and a rerun.
- Everything else is found by explorers that return cited answers, never bulk context; an interviewer that searches for itself dilutes the directives it was given.
- A fact without a citation is a guess and is written as unchecked.
- Nothing from the session enters the spec: no reference to the conversation, the rounds, or who said what.

## Explorers

- An explorer wave precedes any question, because an interviewer with little context and few permissions cannot know where the holes are until the landscape is mapped.
- Waves are scoped to stages: a wave for the intention, then one per domain before that domain's questions.
- An explorer receives one question and one stage and returns at most a screenful: an answer, a confidence, pointers, and candidate nodes with their domain.
- Only a certain return with a pointer verifies a name; probable and guess returns become problems to ask, never nodes.
- A hole nobody at the table can plug is sent to an explorer before the next question, with a wider net when the repository is exhausted: the web, other repositories, deep history.

## The obvious and the hard

- The obvious is written straight into the spec without asking: what the intention, the template and a certain return already state.
- The hard is asked: edges, tradeoffs, failure modes and the parts the provider would not think to volunteer.
- An answer that shows the obvious was wrong moves that matter into the hard basket; it is then asked, not defended.
- The provider is never asked to approve the text of a node the interviewer wrote.
- A recommendation is offered where the interviewer has grounds; the provider ignores or takes it, and the choice is theirs.

## Problems, questions, and open questions

- Every hole the interviewer can name is registered as a problem with a kind: gap, dual-path, tradeoff, failure-mode, hard-part, or whatever the hole actually is; the kind list is open.
- An interview question is asked about a registered problem; it waits on the provider.
- An open question is a hole nobody at the table can plug; it is held in the spec's open questions, waits on an explorer or a later session, and never resolves by guesswork.
- An answer that closes a problem becomes its node in the same turn; an answer that opens a hole registers a new problem.
- A settled question is never asked twice.
- A provider who leaves mid-session leaves a saved draft with its register and open questions; no judge or attacker is dispatched and no handoff is made; the next session resumes from the register.
- Done, for the interviewer, is a register with nothing open or asked and an open questions list at zero.

## Bundles

- Questions reach the provider in bundles, one bundle per problem, marked with the problem's id.
- A bundle carries at most five questions, each with an explanation, options where the answer is a choice, an optional recommendation, and a comment field; the bundle itself takes a comment.
- Answers return under the same marker, with unanswered questions marked as such; several bundles may return in one block.
- Bundles and their answers are recorded in the run folder; an answered bundle stays visible and is marked answered.
- How a bundle is shown — a page, the question tool, plain chat — is a surface's concern; the bundle contract is the seam, and any surface that honours it may serve a session.

## Judge and attacker

- The linter gates the judge: a draft failing any linter check, including open questions at zero, is not judged.
- The judge is dispatched the moment the linter passes, without waiting on the provider; it receives the draft and the rubric, and nothing from the session; the rubric encodes the standard and the addendum.
- The attacker is dispatched the moment the judge returns ready to freeze, without provider approval; it receives the draft and the project root only, and returns holes, not shape or style.
- Every judge failure and attacker finding is dispensed by the interviewer through a ledger with exactly one state: asked, absorbed into a named node, or rejected with a reason.
- A finding may be a false positive; rejecting one with its reason is the interviewer's job, not the provider's.
- Each dispatched role carries its model in its own definition; a dispatch names the agent and passes no model.

## Freeze and revision

- The provider decides that a spec is ready and decides to freeze it; the interviewer never does.
- On the provider's instruction, the interviewer performs the freeze mechanics and commits the spec file alone, refusing while any open question, unclosed problem or validator error remains.
- A frozen file is never edited; a change is the next version file.
- If the spec built from a frozen version leaks, the leaks are the holes of the next version, not defects of the session that froze it.

## Paths

- Global assets — templates, schemas, checks, crew definitions, harnesses — live under the orchestration directory.
- Run assets — spec versions, the register, bundles, the ledger, tests maps, reports — live together under the runs directory, one folder per spec.
- The interviewer writes only under its spec's run folder and, on instruction, the freeze commit.
