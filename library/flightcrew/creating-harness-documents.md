# Creating Harnesses with Agent Runs

A run that builds an agent-shaped artefact — a skill, an agent definition, a harness behaviour — has a verification problem that a run building code does not: the artefact's behaviour only exists when a model exercises it, and the isolated, constrained workers doing the building have no access to any live session history in which such exercise might already have happened. Nothing in their worktree records the artefact being used, because nothing has used it yet.

The principle that resolves this is that an invocation record is not a place but an output. The run does not go looking for records; it manufactures them, by installing the artefact into a minimal fixture and exercising it with fresh probes whose transcripts and outputs become the material every check reads. The machinery that does this — scenarios, runner, checks, rubric, and the records they produce — is the harness, and it is not scaffolding to be discarded: the harness is part of the deliverable, and the run is done when its own harness has run green.

## Invariants

- Harness contents derive from the specification and are authored before, or in isolation from, the artefact itself.
- Scenarios, rubric and calibration examples are locked against the artefact's builder for the duration of the run.
- Probes run on the model the artefact will actually serve; a cheaper probe model tests a different artefact.
- The judge is a fresh context, preferably a different model, and never shares the builder's context.
- The scenario set stays small — a handful per important behaviour — because every probe run spends real budget.
- The gate reads only exit codes, ratios and verdict sheets; a harness that cannot produce those three has not finished being built.

## Shared inventory

Both patterns are assembled from the same pieces; they differ only in who executes them.

- **The artefact under test** — the skill, agent definition or configuration the run exists to build.
- **The fixture project** — a minimal scratch project with just enough real content to make the scenarios meaningful, and the artefact installed into its `../../../../.claude` directory so probes load it the way a real project would.
- **The scenario set** — fixed starting prompts and context, versioned, each tied to the numbered behaviours it exercises, with declared N and pass threshold for statistical behaviours and at least one control scenario where the behaviour must *not* fire.
- **The rubric, with its calibration examples** — the judged class's instrument, per its own guide; stored in the harness, locked with it.
- **Deterministic check scripts** — small programs that read records and exit pass or fail: the artefact loaded, the forbidden tool untouched, the turn budget held, the output schema satisfied, no file outside the fixture changed.
- **The verdict sheet schema** — the fixed shape of the judge's output, so a malformed or quotation-less sheet is rejected mechanically before its content is trusted.
- **The records directory** — where every probe's transcript and outputs land, in a structured form the checks can parse; the manufactured stand-in for a live session history.

Standard pieces, present as always and needing no elaboration: the frozen spec at a named commit, worktree isolation for every building worker, a lock hook over the harness paths, the evidence display the gate's signals land on, and a run log entry at the end.

## Pattern A — probe stages in the workflow script

**What it looks like.** The orchestration script gains stages after the build, and the runtime's own agent-spawning does the probing:

```text
stage 1  build        worker(s) write the artefact into the worktree fixture
stage 2  harness      a separate worker derives scenarios + checks from the
                      spec (rubric may pre-exist); lock hook engages
stage 3  probe        one fresh agent per scenario × N, running in the fixture
                      with the artefact installed; each agent's transcript and
                      outputs are captured as that stage's record
stage 4  determine    a script stage reads the records: greps, schemas,
                      boundaries → exit codes and ratios
stage 5  judge        a fresh agent receives rubric + spec sections + records,
                      returns a verdict sheet; the sheet is schema-checked
gate     accept       exit codes green, ratios over threshold, sheet passes
                      → else re-dispatch the failing stage or halt for a human
```

**What it does.** It verifies the artefact entirely inside the run, using nothing the run did not make. The script holds the loop, so a failing scenario re-dispatches its probe or returns the finding to the builder without the orchestrator's context growing; intermediate records live in the script's hands, and only the gate's three signals reach the session. Because probes are ordinary spawned agents, this pattern scales to as many scenarios as the budget allows and needs no ability to launch nested sessions from inside a worker.

**Pieces to build, beyond the shared inventory:**

- The stage layout above, written into the workflow script, with the gate's conditions stated in it.
- A **probe agent definition**: minimal prompt (the scenario text and nothing else), the fixture as its working directory, tools scoped to what a real user of the artefact would have, model pinned to the artefact's target.
- A **judge agent definition**: receives only rubric, spec sections and records; different or fresh model; output constrained to the verdict sheet schema.
- Per-scenario **N and concurrency caps** declared in the script, and model routing per stage so probes and judge run on their declared models.

## Pattern B — the self-contained headless harness

**What it looks like.** A directory delivered beside the artefact, executable by anyone with the CLI:

```text
harness/
  scenarios/          one file per scenario: prompt + fixture notes + N,
                      threshold, and the behaviours it exercises
  fixture/            the minimal scratch project; artefact installed into
                      fixture/.claude/ by the runner at start
  rubric.md           the judged instrument, with its calibration record
  calibration/        the pre-graded examples the rubric was tuned on
  checks/             deterministic scripts that read records/ and exit 0/1
  run.sh              loops scenarios × N as headless probe sessions with
                      structured output captured into records/
  judge.sh            launches one headless judge session over rubric +
                      records; schema-checks the returned verdict sheet
  records/            the manufactured invocation records (gitignored)
```

**What it does.** It makes the harness a standing artefact rather than an event. The runner exercises the artefact through headless probe sessions against the fixture, capturing each session's structured output as a record; the checks and the judge then read records exactly as in pattern A. The difference is who can invoke it: after the run, the same directory reruns locally against a real setup, fires in CI on every future edit of the artefact, and serves any later run that modifies the skill — the harness outlives the run that built it, which is the point.

**Pieces to build, beyond the shared inventory:**

- The **directory layout** above, with the runner and judge entry points as the only things a caller needs to know.
- A **runner** that installs the artefact into the fixture, loops scenarios by their declared N, invokes each probe headlessly with machine-readable output, and files every record under a scenario-and-run key.
- **Check scripts** written against the record format the runner produces, one concern per script, terse on success.
- A **judge entry point** that assembles rubric plus records, launches the judging session, and refuses any sheet that fails the schema.

The caveat: headless probes are nested invocations, and an isolated worker's permissions, sandbox or network may not allow them. When they do not, the run gates itself with pattern A and still builds and delivers pattern B unexecuted-in-run — verified once by the first human or CI invocation outside the isolation.

## Choosing, and not choosing

The two patterns are complements with one shared inventory: A is how the run verifies itself at scale while isolated, B is the durable form the verification takes afterwards. The default is therefore not a choice but a composition — deliver B always, gate with whichever of the two the environment lets execute, and where both can run, let A's probe stage simply invoke B's runner so there is one harness with two callers rather than two harnesses.

Done, for a run that builds an agent-shaped artefact:

- The harness directory is delivered beside the artefact, complete to the inventory.
- The harness ran green inside the run — exit codes, ratios over threshold, a passing verdict sheet — under pattern A, pattern B, or A invoking B.
- The rubric's calibration record is present and current.
- One probe transcript, chosen at the gate and not by the builder, has been read by a human.
