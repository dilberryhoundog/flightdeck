# Spec Conventions

These conventions govern every spec in the project. They are rules to check against, not reasoning to absorb: each is one line, each binds someone — a person, an agent helping build, or an agent reading during a run — and each can be answered yes or no about any given spec.

## Schema

- A spec is a folder of immutable version files — `specs/<name>/spec.v1.json`, `spec.v2.json` — committed in the repository beside the code it describes.
- Each version file is complete and self-contained; the highest-numbered `frozen` file is the current spec, and earlier versions exist for history only.
- The file header carries `name`, `version`, `status` (`draft` or `frozen`), a named owner, and once frozen the `commit` it was frozen at and the `reason` the version exists.
- A version file carries its own lineage: `previous_versions` lists every earlier header, oldest first, append-only.
- All nine domains appear, in canonical order: Intent, Scope, Constraints, Interfaces and contracts, Behaviours, Edge cases and failure modes, Prior decisions and non-goals, Verification, Definition of done.
- A domain left empty says so, and says it is by decision.
- Every part of the spec is a node with `id`, `status` and `text`; behaviours carry `B` numbers, edge cases `E` numbers, measurable constraints `C` numbers, decisions `D` numbers, and the schema names the rest.
- Node `status` records change relative to the previous version only — `new`, `ok` or `changed` — and any node not `ok` carries a `note` saying why.
- An ID is issued once, for life from the first freeze: never renumbered, never reused, with gaps left where nodes are withdrawn; while `v1` has never been frozen its IDs may still be renumbered.
- A removed node moves to the file-level `retired` registry with the version it was removed at, its final text and a mandatory note; the registry is append-only and carried in full by every later version.
- Every ID ever used is either live in its array or present in `retired`, never absent from both; an answered open question is the one thing that simply goes.
- One entry states one decision; an entry that needs a second sentence is two entries.
- Files, types, paths and commands are written exactly as they exist in the repository.
- Existing types and interfaces are reused by name; introducing a new name is a declared decision, never a side effect.
- Every Verification entry names the exact command and the exact result that counts as passing.

## Human conventions

- Write for a stranger: every statement must be actionable without asking its author anything.
- State outcomes, never steps: what must be true when the work is done, not what to do.
- Say the exclusions out loud: name the tempting expansions the work must not make.
- Record the why beside every rejected alternative and every deferred improvement.
- Mark taste as taste: a preference written as a requirement will be enforced as one.
- Resolve rather than defer: an open question at freeze is a decision handed to whoever hits it first.
- Own the freeze: no run starts against a draft, and only a human changes the status.
- When the work teaches you something, change the spec before the code changes.
- Keep the conduct of the run out: tools, agents, gates and displays have their own document.

## Agent building conventions

- Interview before drafting: skip the obvious, dig at edge cases, tradeoffs and failure modes the human would not volunteer.
- Never invent a fact: an unknown becomes an open question, not a plausible guess.
- Start fresh and stay narrow: the builder reads the intention or draft, the template and the schema; everything else is found by explorer agents that return cited answers, never bulk context, because self-searching poisons the directives the builder was given.
- Address findings to the human as questions, never as silent edits to the draft.
- Draft only what the answers support; never weaken a requirement to make it easier to state.
- The attacker treats the spec as the object under test: hunt ambiguity, statements implementable two ways, undefined terms, and names that do not exist in the repository.
- The attacker reports findings, not fixes.
- Attack from a fresh context that has never seen the interview.
- Nothing from the conversation that produced the spec enters the file; it must stand entirely alone.
- Building ends at the freeze; a different, clean session executes.

## Agent reading conventions

- The frozen spec is ground truth: no reading agent reopens or re-argues its content.
- Rule zero for silence: resolve against Intent; if Intent does not resolve it, halt and ask — never improvise.
- Cite by ID: plans, tests and findings reference `B` and `E` numbers, not paraphrases of them.
- The out-of-scope list is binding: work that would cross it stops before crossing.
- The verifier maps every `B` and `E` to a check and publishes the unmapped as unverified — silence is not an option.
- The critic reads exactly two things: the frozen spec and the result. Nothing else enters its context.
- The critic reports only what affects correctness against the spec; style is outside its mandate.
- A written non-goal is context, never a finding.
- An entry that cannot be satisfied is reported as a contradiction, not quietly interpreted into something satisfiable.

## Spec hygiene conventions

- A spec moves through its statuses in order — drafted, attacked, frozen — and only frozen specs meet runs.
- Open questions stand at zero when the status turns frozen.
- A frozen file is never edited: a change is a new version file, made between runs, and freezes at a new commit.
- The run log cites the exact spec commit each run was executed against.
- Promote what recurs: a rule appearing across several specs graduates to the project constitution and is then deleted from the specs.
- Never duplicate the constitution: where both speak, the constitution wins and the spec entry is removed.
- Earlier version files are the archive of decision records; none are deleted.
- The spec template evolves through run-log findings, not through invention inside an individual spec.
- Specs grow shorter over a project's life as their recurring content finds permanent homes.

## What a spec is not

- Not a plan: the plan says how and is the orchestrator's to write; the spec says what and exists first.
- Not the kickoff: how a run is conducted — tools, agents, gates, displays — never enters it, and of the two documents only the spec ever reaches the verifier and the critic.
- Not a PRD: persuasion ends before the spec begins; it assumes the decision to build is already made.
- Not documentation of what shipped: a live spec states a target; only the archive of frozen specs records history.
- Not a wish list: every entry is provable by a check or judged at the gate, and an entry that is neither is deleted or moved.
- Not a prompt: it addresses no model, sets no tone, and instructs no one in how to think.

## Agent run conventions

- Spec files are read-only for the duration of a run, enforced by hook rather than instruction.
- Pre-written checks are locked targets: implementing agents cannot edit test files, enforced the same way.
- A contradiction discovered between the spec and reality halts the run at the finding for a human decision; no agent resolves it in either direction.
- The plan states the spec commit it was built against.
- Any change to a test file during the run appears on the evidence display.
- Unverified behaviours are published at the final gate, never discovered after acceptance.
- The gate admits nothing that is not already written in the Definition of done.
- Acceptance writes the spec commit into the run log, and anything the run taught queues for the next freeze.
