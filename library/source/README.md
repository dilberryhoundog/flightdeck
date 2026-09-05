# Source

The material the flightdeck orchestration system was built from, kept beside the system so a later reader can check any rule against the source it came from.

## orchestrator-pattern

Eleven guides on running orchestrated agent work, compiled August 2026. The `.txt` files here are plain-text conversions of the HTML originals, made so an agent could read them in full; the HTML originals are the authority, and where the two disagree the HTML wins. Conversion drops the page styling and leaves headings as bare lines, so the prose is intact and the layout is not.

Read in this order the first time. The first two frame the whole method; the rest go deeper on one part each.

| file                      | what it covers                                                                                                                                  |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `orchestrator-review.txt` | The field review: why orchestration needs quality routed somewhere other than the person, the four pillars, and the sequence for adopting them  |
| `piecing-it-together.txt` | The map: one pass through a single run, every session, document, gate and exit placed in order, and the loops back when a run is abandoned      |
| `spec-guide.txt`          | Writing a spec three agents can act on: the nine domains, how to extract what a developer knows, the readiness pass                             |
| `verification-guide.txt`  | The executable definition of done: what a good check looks like, the catalogue, targets before work, the gating ladder, evidence over narrative |
| `agents-guide.txt`        | The cast: which separations a run's quality depends on, how a role becomes a definition, the design rules and the anti-patterns                 |
| `planning-guide.txt`      | Between the spec and the first dispatched agent: whether to run at all, decomposition, waves, budgets, the one-page plan                        |
| `kickoff-guide.txt`       | The document the orchestrator wakes up to: the library, the anatomy, escalation rules, what belongs here rather than in the spec                |
| `review-guide.txt`        | Independent review: the sealed room, the mandate's two halves, what a finding is, how the loop converges                                        |
| `endings-guide.txt`       | The three endings: abandoning cleanly, what a failed run may leave behind, retrying, partial acceptance, merging                                |
| `run-log-guide.txt`       | The record the setup is iterated against: the three failure axes, the shape of an entry, how findings graduate out of the log                   |
| `run-report-guide.txt`    | What happened, recorded by the thing it happened to: provenance marks, the eight sections, how each claim is judged                             |

## Where these turned into working documents

The guides are the source; the system's own agent-facing versions live under `flightdeck/manuals/`, mapped onto this repository's paths and commands. `flightdeck/manuals/harness/claude-code-facts.md` carries the second body of source material — the Claude Code behaviour the harness relies on, taken from the product documentation and verified against the installed version at the time it was written.
