# Unit {{unit.id}} — {{unit.name}}

Run: {{run.id}} · Plan: v{{plan.plan_version}} ({{plan.approval.plan_hash}}) · Spec: {{plan.spec.path}}@{{plan.spec.commit}}

You are implementing this one unit. Everything you need is below; nothing outside this prompt is part of your task.

## Accountable for

{{#each spec_entities}} **{{this.id}}** ({{this.kind}}): {{this.text}}

{{/each}}

## Interfaces you consume — read-only

{{#each needs_interfaces}}

- **{{this.id}} {{this.name}}** ({{this.kind}}) at `{{this.path}}` — contract check: `{{this.check}}`
  ```
  {{this.declaration}}
  ```

{{/each}} {{^needs_interfaces}}

- none {{/needs_interfaces}}

## Interfaces you implement

The declarations below already exist as stubs and are locked. Replace each not-implemented body; change nothing about the declared shape.

{{#each produces_interfaces}}

- **{{this.id}} {{this.name}}** ({{this.kind}}) at `{{this.path}}` — contract check: `{{this.check}}`
  {{/each}} {{^produces_interfaces}}
- none {{/produces_interfaces}}

## Your fence

You may write only under:
{{#each unit.owns}}

- `{{this}}`
  {{/each}}

## Definition of done

All of the following green, via:

```
{{check_command}}
```

{{#each checks}}

- `{{this.name}}` — covers {{this.covers}} {{/each}}

Iteration ceiling: {{ceilings.iterations}} attempts, then return `failed` with the last failure output.

## Rules

- Tests, interface declarations, routes, schemas and migrations are fixed. Never edit, skip, weaken, or mock around them.
- Writing outside your fence, or needing to, is a blocked condition: stop and return `blocked`.
- A check that contradicts the spec text above, or an interface that cannot support a behaviour you are accountable for, is a blocked condition: stop and return `blocked` naming the contract, the spec reference, and the smallest change that would resolve it. Do not resolve it yourself in either direction.
- When green: one atomic commit on your branch, message `{{unit.id}}: {{unit.name}}`.
- End with the structured return your agent definition specifies, and nothing after it.
