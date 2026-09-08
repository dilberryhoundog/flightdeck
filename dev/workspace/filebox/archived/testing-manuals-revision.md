# Testing manuals revision — check, test, target, and where checks live

Draft revision for `../../../../library/terms.md`, `flightdeck/manuals/testing/testing-description.md` and `flightdeck/manuals/testing/testing-conventions.md`. Each change is given as an anchor and a replacement block. Nothing here is applied.

## The defects being fixed

1. **A check is defined as returning pass or fail** in `terms.md` and in the conventions preamble, which contradicts the three-verdict model those same documents rely on. A ratio is not pass or fail, and neither is a verdict sheet.
2. **No term distinguishes a check from a project's own test.** The manuals were written as though every check is authored for the spec by the test-writer. A project that already has a test suite has no place in the model, and the check that adapts such a suite to a run has no name.
3. **The filesystem home of a check is stated once, in passing.** `testing-description.md` announces that "the placements answer *where a check lives*" and then defines placement as who invokes a check, never as a directory. The only statement of the directory rule is the first line of the conventions' Schema section.
4. **`target` reads as a fourth kind of artefact** alongside check, class and verdict, when it is a status a check holds.

---

## 1. `../../../../library/terms.md`

### Anchor

The first four lines of the `### Testing` block:

```
+ check — any executable verification, test or otherwise, that returns pass or fail
+ target — a check that exists before the work and is locked against it
+ gate — the point where check results decide whether work stops or continues
+ class — one of the many kinds of check, distinguished by what it proves
```

### Replacement

```
+ check — any executable verification a gate can read: it runs, examines a result, and returns one of the three verdicts
+ test — a project's own pass/fail assertion, owned by the project, possibly predating any spec and outliving every run; a check may invoke one, and many checks have none to invoke
+ target — the status a check holds once it exists before the work and is locked against it, not a separate artefact
+ check gate — the point where check results decide whether work stops or continues
+ class — one of the seven kinds of check, distinguished by what it proves
```

The `verdict` line already reads "an exit code, a ratio, or a verdict sheet" and needs no change. `class` moves from "many" to "seven" so the term matches the class list it names.

---

## 2. `../../../../flightdeck/manuals/testing/testing-description.md`

### 2.1 The framing paragraph

**Anchor** — the second sentence of the second paragraph:

```
The seven classes answer *what a check proves*; the three verdicts answer *what a check returns*; the gating ladder answers *how hard a check stops work*; and the placements answer *where a check lives*.
```

**Replacement:**

```
The seven classes answer *what a check proves*; the three verdicts answer *what a check returns*; the gating ladder answers *how hard a check stops work*; the placements answer *what causes a check to run*; and the homes answer *where a check's files live*.
```

The sentence that follows, "A spec's verification is designed by walking these four questions in order", becomes "these five questions".

### 2.2 The placements heading

**Anchor:**

```
## The four placements

A check also has an address — who causes it to run — and checks migrate through four of them as they prove their worth.
```

**Replacement:**

```
## The four placements

A check has an invocation address — what causes it to run — and checks migrate through four of them as they prove their worth. The address is independent of the home: a check in any of the three homes below may hold any of these four addresses.
```

### 2.3 New section — insert after "The four placements", before "Order of assembly"

```
## The three homes

A check's home is the directory its files live in, and it follows ownership rather than invocation. Three homes exist, and a check sits in exactly one.

**The project's own tests** — wherever the project already keeps them. These are not checks. They are the project's pass/fail assertions, they predate the spec, they outlive the run, and no run writes them or freezes them. A check may invoke one; that is the whole of the relationship.

**The spec's checks** — in a directory named for the spec, which is to say inside the run the spec belongs to, with fixtures and golden outputs committed beside them. This is the home of everything the test-writer authors from the frozen spec: the behavioural checks carrying the spec's own numbering, the artefact references, the scenarios and rubric an agent-shaped artefact needs. They freeze with the spec and are locked for the run's duration.

**The project's permanent checks** — the ones every spec needs, graduated out of individual specs by the promotion rule. Project-rule checks arrive here first and most often, being the project's memory made executable. A project with a natural home for them uses it; a project without one uses the deck's own harness directory, which holds harnesses and never results.

Two classes have no test to invoke and are therefore always wholly the spec's: statistical and judged. An agent-shaped artefact has no assertion a project test suite could hold, so its probes, scenarios, controls, rubric and calibration examples are authored for the spec and live with it.

A check that invokes a project test owns everything the gate reads — the spec IDs it covers, the baseline, and the verdict — while the test it invokes stays the project's. The adaptation is the check's whole job, and it is not redundant: a native test names no spec ID, records no baseline, and returns a format no gate admits.

Results are not a home. A verdict belongs to the run that produced it and is written as evidence, never back into the directory the check lives in.
```

### 2.4 Order of assembly

**Anchor** — item 2:

```
2. **Behavioural** — with the spec's freeze, derived entry by entry from its IDs, the end-to-end proof among them; these are the checks the spec's verification domain names.
```

**Replacement:**

```
2. **Behavioural** — with the spec's freeze, derived entry by entry from its IDs, the end-to-end proof among them; these are the checks the spec's verification domain names. Where the project's own tests already prove an entry, the check for it invokes that test rather than restating it, and the entry is covered once.
```

---

## 3. `../../../../flightdeck/manuals/testing/testing-conventions.md`

### 3.1 The preamble

**Anchor:**

```
These conventions govern every check in the project — every executable verification that returns a pass or fail.
```

**Replacement:**

```
These conventions govern every check in the project — every executable verification that returns one of the three verdicts.
```

### 3.2 Schema — three rules to add

The section opens with "A check belongs to a spec, and its files live in a directory named for that spec." Add these three lines after it, keeping the one-rule-per-line form:

```
- A project's own tests are not checks and are never written, moved or frozen by a run.
- A check that invokes a project test owns the spec IDs, the baseline and the verdict; the test owns only the assertion.
- A project test a check invokes is locked for the run's duration by the check that names it.
```

The third rule closes a hole the current conventions leave open. `Check files, fixtures and goldens are read-only to implementing agents, enforced by hook rather than instruction` locks the check, but if the assertion the check depends on sits in a project test the implementer may freely edit, the lock is defeated at one remove. Locking follows invocation: a named test enters `locked_paths` alongside the check that names it, and returns to the project's ownership when the run ends.

### 3.3 Agent building conventions — two rules to add

**Anchor** — the existing rule:

```
- Derive at least one check from every `B` and `E`; where none can be derived, report the ID as untestable rather than approximate it.
```

Add after it:

```
- Prefer invoking a project test that already proves an entry over restating its assertion as a new check.
- Where an entry cannot hold a pass/fail assertion at all, verify it by ratio or verdict sheet rather than recording it unverified.
```

The second rule matters for agent-shaped work. A skill, a prompt or an agent definition has no assertion a unit test could carry, and the current conventions offer only "report the ID as untestable". The statistical and judged classes exist precisely so that such an entry is checkable, and an entry reachable by probe and rubric is not untestable.

### 3.4 Testing hygiene — one rule to sharpen

**Anchor:**

```
- Promotion mirrors the spec's: a check every spec needs graduates to a hook or a constitution-level command, and leaves individual specs.
```

**Replacement:**

```
- Promotion mirrors the spec's: a check every spec needs graduates to a hook or a constitution-level command, leaves individual specs, and moves to the project's permanent home.
```

This names the destination the promotion rule already implies, and ties the hygiene section to the three homes.

---

## Consequences elsewhere

Applying the above leaves three statements in the system disagreeing with it. Each is a separate decision, not part of this revision.

**`../../../../flightdeck/flightcrew/crew/test-builder.md`, step 2** currently reads: "Write each check as a suite in the first of these that applies: the directory your dispatch names, else the existing test directory the project's checks already live in, else `flightdeck/launch/specs/<spec-name>/checks/`."

Under the three homes, the middle branch conflates two things: a project's existing *tests* are not a home for the spec's *checks*, and writing a check into them makes it project-permanent before it has earned promotion. The precedence that matches this revision is the dispatch's choice, else the spec's own directory, else the deck's harness directory — with the project's existing test directory read for tests worth invoking rather than written to.

**`../../../../flightdeck/testbench/tests.keep`** states the harness directory's rule correctly and is the only place the convention is written. Nothing in the crew definitions points an agent at it, so an agent building checks has no route to the rule it needs.

**The tests-map schema** carries `kind` with the seven class values and `class` with four verification classes. Two fields, two vocabularies, overlapping values. Whether these are one field or two is worth settling before the next spec freezes a map against them.
