# Reference library spec — [library name]

Status: draft

## Intent

What the library is for and who consults it: the roles, runs and humans that will open an entry and act on what it says. State the cost of not having it — practices applied from memory and re-derived on every run — and give a one-line picture of success, such as "any named concept resolves, from the index alone, to its sources and their orchestration reading." Keep it short enough that every entry can be judged against it at a glance.

## Scope

The topic list is the perimeter. Name every topic the library covers, grouped where practices are inseparable, and name the adjacent topics it deliberately leaves out. Draw the same line around sources: which kinds are in (primary documentation, published guidance) and which are out (secondary commentary, forums, anything older than a stated date). State which deliverables ship — entries, register, index — and which are deferred to a later phase. The lens is itself a scope statement: an entry covers a practice as it bears on orchestrated runs, and the practice's general treatment is outside the line.

## Constraints

The conditions imported from outside the library: source policy (licensing, confidentiality, recency cutoff, citation format), the per-topic source budget and time-box that define when research has stalled, house rules for entry length and language, storage location and file naming, and any tooling the run may not use. Write each as something checkable — a limit carries a number, a rule carries the test that enforces it.

## Interfaces and contracts

Three seams, fixed before any topic is researched so that separately produced work already fits. The entry template: the exact headings and fields every topic's finished artefact carries, including a field for the orchestration reading and a field for unresolved questions. The register schema: one canonical record per source — id, title, author, url, date published, date checked — and the id form by which an entry cites it. The index: how topics are listed and how each points to its entry. State each of these syntactically, as a schema or a skeleton file, not as a description.

## Behaviours

The numbered questions every entry must answer, each written as what an acceptable answer contains rather than what the answer is, so that a stranger could check any entry against it. Typical entries: the entry names the practice's origin with a register citation; the entry states the practice's orchestration reading — what it replaces from human-in-the-loop work and what failure it guards against in a run; every claim about the practice carries a register id. Number the register's and index's own behaviours here too — a source appears once, every cited id resolves, every topic in scope is listed.

## Edge cases and failure modes

The outcomes when sources do not cooperate, decided before anyone hits them: no source found for a topic; two sources that contradict each other; a source that still resolves but no longer says what was cited; a topic that turns out to be two; a source behind a login or paywall; a practice with no orchestration reading. State the exact return for each — usually "recorded in the entry's unresolved field with the register ids concerned" — and never an inference presented as a finding.

## Prior decisions and non-goals

What is already settled and must not be re-researched: concepts the project has already defined, sources already chosen as authoritative, positions already taken. The improvements deliberately not pursued: the library does not evaluate or rank practices, does not recommend between them, and does not become a tutorial. Lessons from earlier library runs about where entries drifted belong here until they graduate into standing rules.

## Verification

Named checks with an unarguable pass or fail, each mapped to the behaviour numbers it covers: every entry validates against the template; every register record validates against the schema; every id cited in an entry resolves to a record; every record is cited by at least one entry; every url resolves; the index lists every topic in scope and nothing outside it. One check needs a human and is written as such: a sampled walkthrough confirming that each cited source says what its entry claims, with the sample size and rubric stated. The end-to-end proof is a reader resolving a named concept to its entry, its sources and its orchestration reading from the index alone.

## Definition of done

Every named check passed with its output presented; the sampled source walkthrough passed at its rubric; the independent review returned no open finding on lens or scope; every topic in scope has an entry and each entry's unresolved count is reported; nothing outside the scope perimeter was written; the entries, register and index are delivered at the constrained locations. Nothing appears here for the first time.

## Open Questions

Empty at the freeze. Until then, every question the author deferred and every finding the attacker filed, verbatim, each phrased as a decision with options.
