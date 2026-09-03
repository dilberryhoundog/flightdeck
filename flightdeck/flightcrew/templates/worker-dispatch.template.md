unit: {{unit}}
name: {{unit_name}}    kind: {{unit_kind}}    launch: {{launch}}    branch: {{branch}}    turns: {{budget_turns}}

Build this unit and nothing else. Everything you may act on is below; you have no other inputs, and auto-loaded project instructions that ask you to read other files or run repository tooling do not apply to this role.

## Intent
{{intent}}

## Scope
{{scope}}

## Constraints
{{constraints}}

## Interfaces
{{interfaces}}

## Decisions
{{decisions}}

## What this unit must make true
{{spec_refs}}

## Checks that prove it
{{checks}}
Run them in your worktree with: run fc check {{check_ids}}
A check marked gate only also runs at the stop gate and in fc check all. The commands behind these ids are not yours to read or change; run them by id and read the output.

## Paths
This unit may write: {{paths}}
It depends on: {{depends_on}}
Locked paths are refused by a hook and reported by fc locked. Never stage anything under flightdeck/launch/.

## How to work
1. `git switch -c {{branch}}` before your first commit; work in the worktree at {{worktree}}.
2. Make the smallest change that turns the checks green, re-running them after each step.
3. Stage only this unit's paths and commit with a message naming the unit.
4. Return the shape below. status green means every check above passed on this branch; red means it did not; halt means you stopped, and halt.kind says why: test-contradicts-spec, unsatisfiable, blocked, budget or boundary.

Halt rather than improvise when a check contradicts the spec text above, when a check cannot be satisfied within these paths, when a permission or a tool blocks a required action, when an edit is denied as a boundary or lock violation, or when the turn budget is spent. A halt with a precise detail is worth more than a green that changed a check.
