---
type: "Manual"
stub: true
style: "record"
stamp: ["2026-09-20", "stub-writer", "4450a586"]
---
# State, Freezing and Gates

## Gates
There are no gate switches in a state file; there are workflows. Three points call for a human decision: the plan, the interfaces, and the ending. The human does not gate every wave. Between workflows, an agent finishes, the human reviews, then approves the next one.

## Where state lives
State lives in the documents themselves, including freezing and approval marks written into a doc to gate the next agent. State settles progressively as work proceeds rather than being collected upfront. The workflow runtime and agent frontmatter (such as hooks) already carry state.

## Phase state
Phase state, including user gates, lives in one json page. What the phases themselves are has not been defined.

## Freezing
A document is either Draft (editable) or Frozen (locked, human-managed).

## Not settled
- The mechanical way a gate is cleared
- The list of phases
