unit: {{unit}}
name: {{unit_name}}    kind: {{unit_kind}}    launch: {{launch}}    branch: {{branch}}    turns: {{budget_turns}} (the agent turns allotted to this unit)

Build this unit and nothing else. Everything you may act on is below, and auto-loaded project instructions that ask you to read other files or run repository tooling do not apply to this role.

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
In full, from the root of your own worktree: ./flightdeck/flightcrew/bin/fc check {{check_ids}} --launch {{launch}}. The leading ./ matters, because it runs the copy inside your worktree rather than the main checkout outside it, and nothing puts fc on PATH. Select the launch with the --launch flag after the command; a command that begins with an environment assignment is refused.
A check marked gate only is one of the ids above and is run here like the rest; it is also re-run by the run's own gate. The commands behind these ids are not yours to read or change; run them by id and read the output.

## Paths
This unit may write: {{paths}}
It depends on: {{depends_on}}
Those units are already merged into the branch you start from; you may read their files. A file you need from one of them that is not there is a halt of kind blocked.
Write only under the paths listed above. An edit denied as a lock or a boundary is a halt, not something to work around. Never stage anything under flightdeck/launch/.

## How to work
1. `git switch -c {{branch}}` before your first commit; work in the worktree you were started in and report its absolute path as `worktree` in your return.
2. Make the smallest change that turns the checks green, re-running them after each step.
3. Stage only this unit's paths by name — git add <path> <path> — never git add -A and never anything under flightdeck/launch/. Commit with a message naming the unit, using a quoted heredoc delimiter (git commit -F- <<'MSG'); an unquoted delimiter and brace expansion are refused inside an isolated worktree.
4. Return the shape under the Return heading below. status green means every check above passed on this branch; red means it did not; halt means you stopped, and halt is then an object with exactly the keys kind and detail, kind being one of test-contradicts-spec, unsatisfiable, blocked, budget or boundary, and detail the specific reason.

Halt rather than improvise when a check contradicts the spec text above, when a check cannot be satisfied within these paths, when a permission or a tool blocks a required action, when an edit is denied as a boundary or lock violation, or when the turns above are spent. A check is never edited to make a unit green.

## Return
{{return_shape}}
