<!-- SOURCE material, T002, 2026-09-18. Fully referenced and verified; not a record. The commander ruled on 2026-09-18 (commanders-desk/out-advice/DS002.md) that records are sharp, current-form and timeless, and these are the source they are extracted from. -->

# Lineage

Purpose: the pilot knows where the work is — which branch holds what, what is contained in what, what has no remote, and what is not merged into its parent.

Researched by: T002 (certified research team, mission M001), records seat, drawing on the T001 recon reports T001 `lineage-historian` (Opus), T001 `runs-recon` (Opus) and T001 `doctrine-recon` (Sonnet), and contested by the T002 adversary seat. Research date: 2026-09-18. Every ref, count, merge base and ancestry claim below was re-verified by git plumbing from `cockpit` at `cc29f63`.

Source: git plumbing over all local and remote refs in this repository, re-run 2026-09-18 at 16:58 local time (`git for-each-ref`, `git merge-base --is-ancestor`, `git rev-list --left-right --count`).
Source: `flightdeck/.cockpit/notepad/flightcrew/topology-2026-09-18.md` — the commander's own account of the split.
Source: `advice` — the commander's corrections.

Remote state moves. Three remote refs appeared during the session in which this record was written. Treat every remote figure here as true at the timestamp above and re-check before acting on it.

## The shape in one paragraph

Flightdeck was scaffolded by hand on `main`, probed on three early branches, then built in one all-in-one agent run on `flightcrew-buildout`. The commander identified core faults, cut `flightcrew-core` as a holding branch to repair them, and found the repair could not start without a test suite to protect what was being kept. That forced a third line, `flightcrew-characterization`, whose product is the suite.

## The common base

Every flightcrew line forks from `025fa75`. **`main` is not an ancestor of any of them.** `git merge-base --is-ancestor main <branch>` returns false for `flightcrew-buildout`, `flightcrew-core`, `flightcrew-characterization` and `run/flightcrew-characterization-2`. `main` carries four commits that sit on no flightcrew line, one of them substantive. The only branch `main` is an ancestor of is `cockpit`. A pilot expecting to fast-forward anything to `main` will not be able to.

## The branches

**`cockpit`** at `cc29f63` (2026-09-18), level with `origin/cockpit`. The pilot's own branch and the post this record is written from. `main` is an ancestor of it.

**`main`** at `608d380` (2026-09-17), 2 ahead of `origin/main`. The hand-built scaffold and the original doctrine: `STRUCTURE.md`, the manuals, the library, the first schemas, a `crew.json` roster and a spec-readiness linter. Last substantive commit `5300f0d` (2026-09-03). It holds four never-opened mission notes at `2269973` and `liftoff.template.yaml`, a discarded answer to the kickoff problem. Its `flightcrew/` is a different system from the tip: two files under `bin/`, and no `hooks/` or `workflows/` at all, against 37 files across those three directories on the buildout. Three crew roles on it, `isolated-worker.md`, `spec-interviewer.md` and `worker.md`, are absent from the buildout and characterization tips, though they survive on `cockpit` and on the early probe branches.

**`engage-crew`** at `716fe4b`, 1 ahead of its remote; **`constitution-research`** at `64dc36c`; **`rubric-testing`** at `194c52e`, the oldest head in the repo. The three early probes, all stopped by 2026-09-04 with no ending document. `engage-crew` built the orchestration chain role by role. `constitution-research` holds the three constitution documents and an interview interrupted mid-question. `rubric-testing` holds the only empirical measurement in the repo. Their difficulty is what forced the all-in-one build.

**`flightcrew-buildout`** at `1c81888` (2026-09-15), 38 ahead of `main` from base `025fa75`, and 7 ahead of `origin/flightcrew-buildout`. The all-in-one build: the `fc` runner, checks, crew roles, six hooks, schemas, kickoff library, three workflow scripts, manuals and a testbench. It ran two launches of itself and hunted its own faults into ten registered problems. Its last two own commits are `56bfb87`, which cut the core launch out of the tree, and `1c81888`, which added `spec-altitude.md` and rewrote the interfaces paragraph. `flightcrew-buildout-v1` at `ab2cb68` is contained in it.

**`flightcrew-core`** at `27f6969` (2026-09-13), 37 ahead of `main`, one commit past its `1b0a8ba` base with the buildout, level with its remote. The holding branch for the repair. Its `spec.v1.json` status reads `draft`: frozen at `852b77c`, then reopened by `ef44303` on 2026-09-11, which is `ef44303`'s own rewrite at outcome altitude and not the later `spec-altitude.md` commit of 2026-09-15. The branch's one own commit is the void run's test-builder output, 47 suites that test the future system the core spec names rather than the system that exists. `run/flightcrew-core-1` at `7c5913e` is contained in it.

**`flightcrew-characterization`** at `68681c0` (2026-09-17), forked from the buildout at `56bfb87`, 24 ahead of that fork, 1 ahead of its remote. **The finished suite is not here.** It is on `run/flightcrew-characterization-2` at `4fd81d8`, level with its remote, 16 ahead of `flightcrew-characterization` from base `56ca431` and 39 ahead of the buildout. Run 1 was abandoned at implement on ten tooling faults. Run 2 was conducted by hand with no runner and no hooks, landing 58 of 61 checks green, 33 suites and six pinned defects.

## Containment, stated as fact

- `run/flightcrew-characterization-2` contains all six `worktree-wf_*` branches, the two `flightcrew-characterization-2/*` unit branches, and `run/flightcrew-characterization-1`.
- `flightcrew-buildout` contains `flightcrew-buildout-v1`. `flightcrew-core` contains `run/flightcrew-core-1`.
- `flightcrew-characterization` holds one commit that `run/flightcrew-characterization-2` does not: `68681c0`, a workspace-files commit. The run branch is not a strict superset, and a merge will surface this.
- `flightcrew-characterization-1/contracts` at `95a8cae` is one commit past its base and is contained in nothing. It is the salvage-or-delete decision left open by the run-1 log.

**The commander's rule on cleanup, which this record does not pre-empt:** a branch goes only once its changes are merged higher. Containment in another local branch is not that test. Nothing above is a clearance to delete.

## What is unmerged and what has no remote

Not merged into its parent: `run/flightcrew-characterization-2` into `flightcrew-characterization`, which is the whole of run 2 including the finished suite; `flightcrew-characterization` into `flightcrew-buildout`; and `flightcrew-core` into anything.

No remote counterpart at all, as of the timestamp above: `run/flightcrew-core-1`, `run/flightcrew-characterization-1`, the two `flightcrew-characterization-2/*` unit branches, and all six `worktree-wf_*` branches. That is ten local branches against twelve remote refs. Every one of the ten is contained in a branch that does have a remote: nine in `run/flightcrew-characterization-2`, and `run/flightcrew-core-1` in `flightcrew-core`. No content sits in only one place. Every *named work* branch now has a remote; what has none are the run branches and the per-implementer worktree branches. `flightcrew-core`, `rubric-testing` and `flightcrew-characterization-1/contracts` were pushed on the commander's order during this session, which is why an earlier check found them unpushed.

## The three-launch roadmap

`dev/workspace/plans/flightcrew-features.md` is the same blob, `c0162c3f`, on `flightcrew-buildout`, `flightcrew-core`, `flightcrew-characterization` and `run/flightcrew-characterization-2`. It entered at the shared base `1b0a8ba` on 2026-09-11, so it predates the characterization fork and rides on all four flightcrew branches. It is absent from `main` and from `cockpit`. It is not the buildout's alone, and it is not the commander's own prose: it was commissioned from Claude, so quote it as a rendering rather than as the commander's words.

Local ahead of remote: `flightcrew-buildout` by 7, `main` by 2, `engage-crew` by 1, `flightcrew-characterization` by 1. No local branch is behind its remote.

There is no local branch named `origin`, despite one appearing in a branch listing. `git rev-parse --verify refs/heads/origin` fails. What prints as a bare `origin` at `1f20b49` is `refs/remotes/origin/HEAD`, a symbolic ref pointing at `refs/remotes/origin/main`. It is the ordinary remote HEAD pointer and is healthy.

## What the characterization line does and does not carry

The characterization line forks from the buildout at `56bfb87`, not from `flightcrew-core`. It does carry core-spec history: both `852b77c` and `ef44303` are ancestors of it, so the core spec's freeze and its reopening are in its history. What it does not carry is the work that matters for the repair. Neither `1c81888`, the late doctrine, nor `27f6969`, the 47 core suites, is an ancestor of `flightcrew-characterization` or of `run/flightcrew-characterization-2`. The suite therefore describes the buildout state as it stood at the fork commit `56bfb87`, not the buildout tip, which carries one later commit the suite has never seen.

## Two collisions to expect when the trees meet

- `run-all` discovers every suite it finds. The core branch's 47 suites describe a system that does not exist yet; the characterization branch's 33 describe the one that does. Merging the two trees makes `run-all` fail.
- Three checks on the run-2 tip are red for reasons outside any unit's reach. T32 and T37 were red at the run's base because of the run's own setup commits. T44 cannot be turned red by any allowed alteration. All three are the human's decision.

## The core spec's open state

The core `spec.v1.json` status is `draft`. Its test-builder return at `27f6969`, in `runs/run-1/returns/test-builder-map.json`, records exactly nine `spec_findings`, numbered I8, I13, I9, C13, I14, C2, B4, I1 and SC1, and states within that return that the spec linter reported 71 lint-artefacts errors against the void freeze. That figure is the test-builder's recorded finding at that commit, not a tally re-run since.
