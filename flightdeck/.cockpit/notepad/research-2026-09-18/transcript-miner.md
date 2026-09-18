# transcript-miner report — T002

Crew report, C018 (general-purpose, Opus), team T002, received 2026-09-18 via the scratchpad. Pilot's verification: five cited lines opened in the transcripts on flightcrew-characterization; all five are `[USER]` turns and the quotes match verbatim (the launch folder tree at 8fdc3b29:3028, "runs should accumulate many retries until they succeed" at 8fdc3b29:180, "An interface is a common language or location, a town square" at 9b679556:7043, "I couldn't SEE my project in the spec" at 9b679556:7003, and the commissioning of flightcrew-features.md at 9b679556:2156, where the commander orders "the ten separate features in a single markdown"). The miner's three method warnings are sound and carry into the record: subagent returns arrive inside `[USER]` blocks and must be filtered; flightcrew-features.md is Claude's rendering of commander decisions, not the commander's prose; one pasted web-Claude exchange is marked. Raw input for the records-writer; not a record.


**Corpus.** Ten transcripts on `flightcrew-characterization:dev/workspace/history/`. `run/flightcrew-characterization-2` is a strict subset of the same blobs (identical hashes, missing only `3b316953`), so nothing was read twice. The tenth file on `flightcrew-characterization`, unnamed in the brief, is `3b316953_flightcrew-core-tests-map-v1.txt` (2026-09-10, targets stage; the commander speaks twice in it and says nothing definitional).

**Citation form.** `<session-id>:<line>` where the line is the `[USER]` marker opening the commander's turn. All files live at `flightcrew-characterization:dev/workspace/history/<session-id>_<slug>.txt`. Dates: `5ad10754` 2026-08-31, `e7fec369` 2026-09-01, `bab64608` 2026-09-03, `a9389f8c` 2026-09-05, `8fdc3b29` 2026-09-08, `bfb87cff` 2026-09-09 07:36, `9b679556` 2026-09-09 09:07, `4f6285bb` 2026-09-09 23:27, `0fb7c77a` 2026-09-09 01:51 (capture time; its content runs latest of the interviews), `3b316953` 2026-09-10.

**Warning on `flightcrew-features.md`.** `flightcrew-buildout:dev/workspace/plans/flightcrew-features.md` is not the commander's prose. They commissioned it at `9b679556:2156` — "write in /plans 1. the ten separate features in a single markdown. each feature section is written as though it was the intention of a spec. 2. your recomended split." It is Claude's rendering of the commander's decisions and carries no verbatim authority. Its definitions are noted below as derived, not quoted.

## 1. Definitions, verbatim

**launch and run — the settled shape.** "Ok, its simple, launch = run, run/awesome-run = run instance, awesome-run/spec/spec.v1.json = spec instance, awesome-run/spec/spec.v2.json = new spec instance, awesome-run/run-assets = assets acumulated over a run." (`8fdc3b29:201`)

The same turn continues: "so this means we need to know what instance residue we need to preserve. heading in to this I understood that we versioned our specs and test-maps. then the importance of a runlog was highlighted to transfer all other 'findings' over to the new instance, this allows us to 'overwrite' alot of the run-assets per instance." (`8fdc3b29:201`)

**launch and run — the later, governing statement.** Typed as a literal tree, this is the commander's own layout and the one every later session builds on (`8fdc3b29:3028`):

```
launch/
  <name>/
    specs/
      interview/
      spec.v1.json
      test-map.v1.json
    runs/run-<n>
      run outputs...
  FLIGHTLOG.md
```

"This might be better all in a single folder, a new launch builds a new feature, a launch instance retries untill it succeeds, no duplicated specs single source of truth. can you rewrite the run defects based upon this model. rename to 'structure problems'" (`8fdc3b29:3028`)

That sentence is the load-bearing one for the brief's claim. A launch is the named piece of work that holds the spec series, the interview material and every attempt; a run is one attempt inside it; the launch "retries untill it succeeds". It is later than `8fdc3b29:201` and supersedes the `mission/` proposal below.

**A superseded intermediate.** "Ok I stand corrected. this looks like the way. except I will change slightly. mission/<name> / spec.v1.json / test-map.v1.json ; launch/ <mission-name>-<n>/ instance-assets... ; FLIGHTLOG.md" (`8fdc3b29:2986`). Here `launch` named the attempt and `mission` named the work. This is earlier than `8fdc3b29:3028`, which folds both into `launch/<name>/` and renames the attempt to `run`. The word **mission** survives only as a casual synonym for a large feature: "a large feature (mission)" (`9b679556:6717`).

**run as retry — the principle that forces the shape.** "Hangon A HUUUUGE principle of orchestrated runs is iterated improvment. abandon failed runs. runs should accumulate many retries until they succeed, rather than one shotting. do we want awesome-run-1, awesome-run-2, awesome-run-3 sitting in launch? do we want three byte identical spec.v1.json files. if spec.v2.json is an iterated evolution of spec.v1.json don't we want it adjacent? what if test-map changes only, do we want a whole new directory to add 2 new tests? do we want our spec sperated from the run assests it drives?" (`8fdc3b29:180`) "we just give a definition of done and a behaviour to build across attempts" (`0fb7c77a:2986`, on outcome discovery).

**spec.** "each node is judged individually keep, change, remove. what ever the following agents need to create the users outcome." (`9b679556:1006`) And on what a spec is for: "your primary role is to help me create a spec that can drive a build run and leave no questions unanswered for later agents. not untangling messy context sources." (`0fb7c77a:1020`)

**spec, the altitude definition.** "I think this spec should be describing behaviours like this. 'a scout worker is deployed first so that the implementation run can be found working before the rest of the wave continues' 'an adversarial reviewer critics the diff against the diff and asks the orchestrator to implement' this gives license to the builder to create that bahaviour through discovery, I feel our spec is a one shot build plan." (`9b679556:7003`)

**spec, the boundary rule.** "the spec describes the work not the sytem ie 'you must lock these files' should never be in a spec." (`4f6285bb:384`)

**interface.** "An interface is a common language or location, a town square." (`9b679556:7043`) The same turn enumerates what is not one: "launch folder is inert the interface is launch.json (or others) · .controlcenter is an inert folder, the interface should be 'flightcrew.yml' · freezing is a language that an interface speaks, not an interface itself · crew each role is a single behaviour · return only speaks to a single agent. not an interface, probably more a constraint than anything".

The list it answers is the commander's own: "INterfaces should be more like. 'launch.json' 'plan.json' 'spec.json' 'flight command wrapper'. is a return schema only a single agent reads an interface? im made this list of NOT interfaces 'launch folder, .controlcenter folder, frozen documents, crew role, returns, suite protocol, run documents, liftoffs (schema yes), vedicts' prove me wrong." (`9b679556:7003`)

**constraint.** "constraints:, agent files, workflows, json documents, hooks, subagentstop, etc things that existed in the world before we built flightcrew" (`9b679556:7003`). Applied as a test three times against drafted constraints: "Not sure this is a constraint??? where did it exist in the world before this system was built" (`9b679556:7255`, against C10, C11, C12) and "No idea what this constraint is??? where in the world did it exist?" (same turn, against C8).

**decision.** "decisions: Small minimal command surface. leverage Claude native harness. compatible with view layer over JSON." (`9b679556:7003`) And: "decisions don't need tests. version 2 is where decisions make their grand appearance, probably based upon problem discovery from version 1 run." (`0fb7c77a:2747`) And: "higher version can also afford more 'decisions' consider them as freebies." (`9b679556:86`)

**liftoff.** "nope wrong. flightcrew/liftoffs/fullmonty.json, quick`n`easy.json, research.json (don't use these names). when I invoke the liftoff i simply copy the json into the orch session. an it kicks off all the workflows, overides, other settings." (`9b679556:4402`) The reason follows in the same turn under Decisions. Placement corrected one turn later: "actually write it to runs/run-<n>/liftoff/fullmonty.json go" (`9b679556:4423`).

**kickoff.** "One more tip make the liftoff interface a json template that names workflows and arguments. then it can hold the multi session shape." (`9b679556:4372`) Earlier, on the kickoff's scope: "could we just say. here is run folder, spec and plan. use workflow x with these few modifiers as our kickoff. then we have omakase dynamic workflows instead? this would abolish most of the 'phasing' state, and command scripting yeah?" (`8fdc3b29:7211`)

**gate.** Definition by denial: "oogwhey (from kungfu panda)... there is no gates, only workflows. 2 facts. - the original agent built launch.json to manage state, because he was a dumbo (not his fault). My task according to the sources was to freeze docs, kickoff runs, pull teeth thrashing out a spec, oversee a test builder, plan in plan mode. write a runlog. never needed to flip gate switches. it was his idea not mine. - workflow agents write things. when they finish I check em. then if im happy I say to the orchestrator, yep do the next workflow." (`9b679556:3253`)

In the same pasted answer block the commander nonetheless selects a gate mechanism: "An orchestrator session invokes the workflows in order, stops at each gate, and reports; the human clears the gate in launch.json. comment: this i haven't found an answer for. worthy question though. imma go with the orch session." (`9b679556:3253`) See §6.

**Where gates fall.** "human does not gate the waves. library/source/orchestrator-pattern/piecing-it-together.html says after the final review. basically all human after that. final gate is to start again or merge. the other two you have correct plan and interfaces." (`9b679556:3253`)

**crew.** "'FlightCrew' is literally a bunch of agents working together to complete a (flight) mission, so they are important too." (`0fb7c77a:1020`) Composition: "crew/ is the source of truth for flightcrew agents." (`9b679556:5646`) Four roles the commander named and accepted: "interface-builder: writes wave-zero seams and halts on a spec–codebase contradiction instead of iterating to green | strong-worker: one retry of a red unit on a stronger tier from a clean state before a human is asked | per-unit adversary: attacks a completed unit before merge for what its checks missed | scribe: assembles the report and log entry and notices when assembly fails" (`9b679556:1006`). Rename: "change name of `pilot` agent to `scout` agent." (`9b679556:1006`)

**workflow.** "Here is the thing, workflows can call workflows (one level deep). so fc-build (don't call it waves) can call fc-verify and fc-review. but they can also stand alone" (`9b679556:4372`). The commander's own constraint text for the runtime: "Claude Code Dynamic workflows: A prebuilt javascript agent dispatch and structured return tool. Called by slash command, input args, schema driven agent returns, custom agent definitions, inbuilt worktrees, model and tier overides, staged agent progression, parallel concurrency, nested workflows (1 level), repeatable and resumable. no filesystem, shell, clock or randomness." (`9b679556:7255`, C4)

**steward.** Selected, not defined: "1. do a steward" (`9b679556:5646`). No definitional sentence found in the commander's turns.

**dispatcher / flight (runner).** "rename it to 'flight'. keep as thin dispatcher. leafs also run autonomous. 'launch' command houses all scripts flightcrew uses. - two new commands - 'flight launch init' scaffolds a new launch (including the first run stubbed). - 'flight launch run' scaffolds a new run if the previous is ended. note: alot of the commands that write a single artefact can be absorbed into hook upgrades, workflows and frontmatter." (`9b679556:1006`)

Deferred one round later: "I want to go with the core or basic system. scripts are callable by themselves. flight is defered to a later launch. probably need to be a decision." (`9b679556:7255`, I10)

**control centre.** ".controlcenter is an inert folder, the interface should be 'flightcrew.yml'" (`9b679556:7043`). Contents: "Configurations; flightdeck/.controlcenter/ - flightcrew.yaml; git ignored global system configuration. place holder for later global settings - launch.yaml git ignored launch based system configuration. current_active_launch: <repository-relative launch folder>" (`9b679556:7255`, I6). Origin: "I have also decided to provide a flightdeck/.controlcenter which can keep active env like LAUNCH_DIRECTORY" (`8fdc3b29:5404`).

**check vs test vs target.** "in my intial conversations checks and tests are different things. tests are pass/fail assertations. checks are definition of done, they overlay a test with a orchestration run compatible output. Im pretty sure a rails project tests aren't fully compatible with orchestration runs. also checks can be things tests aren't. eg a skill.md can't have a pass/fail assertion." (`a9389f8c:3402`) The same turn: "the test builder should know to build 'tests' into project native or testbench. then place checks into run folder. these present existing tests as 'checks' for the run. also the term 'targets' is mentioned which im unsure of how it fits into the verification domain."

Placement, stated as a pipeline: "Project test/ for appropriate assertive tests -> testbench for any other tests not compatible with a tests folder -> run-1/checks to wrap the tests -> flightcrew/checks (probably should rename to 'verify') for global test wrappers etc." (`8fdc3b29:3566`)

The commander's own constraint wording for the three verdicts: "Check scripts; For returning verification verdicts from prebuilt tests, one per case. Three verdict options; an exit code, a ratio against a threshold, or a verdict sheet against a rubric." (`9b679556:7255`, C7)

**FLIGHTLOG and RUNLOG.** "FLIGHTLOG goes into the bootstrap, RUNLOG stays where they are." (`9b679556:5646`) Location answer: "flightdeck/launch/FLIGHTLOG.md" (`9b679556:1006`) On where doctrine lives: "manuals = System manuals crews need to regularly do their job. library = Information, records of processes or learning that need to persist over time. particularly for humans" (`5ad10754:1200`)

## 2. Shape and architecture

**The whole intent, in the commander's own paragraph.** "HITL ai engineering, falls short for any large or complex task requiring a humans direct time and attention, an orchestrated agent system can solve this problem. The human can front load their attention and time into a carefully crafted definition of the work, then with an intelligently built automated system beyond that the work materialises through agents repeatedly attempting to discover the deterministic outcome. If the agents fail the user simply tries again bringing the previous failures to improve the definition of the work, the tools used or the agent's assurance of done. This orchestration toolkit is built for a single Claude Code max subscription user, leveraging the inbuilt harness and steering infrastructure Claude provides. If a users idea of a piece of work can be handed over and agents build it for them, this work has been completed." (`9b679556:7255`, INT)

**The earlier outcome sentence.** "An agent orchestrated workflow, that front loads the users knowledge before the build and not during. Outcomes improved by iteration, isolated agents attempting work until deterministically done. Verifiable results, user checkpoints, decomposed work, hard stops and restrictions. All prebuilt into an integrated system underpinned by a single document 'language' that encourages later improvement. The user having advanced as an ai engineer, needs this system to achieve larger scoped and more comlex work, progressing from the standard 'oneshot' chat turns model." (`0fb7c77a:1020`)

**What owns state — freeze.** "we have more than one 'state' the system needs to handle. freezing is one type. a document is 'frozen' it becomes immutable, especially if attached to a commit. this can then be deterministically ensured by locking those files. this doesn't even need a launch var. have a simple script read edits in flightcrew/launch if they have '\"status\": \"frozen\"' then disallow editing, this could apply across all major docs; spec, test-map, plan." (`8fdc3b29:5434`) Same turn: "The other state is phase state. user gates etc. no problems with a a single json page handling this. also it removes the need for isolation gymnastics from fc (flight) trying to ensure only one run folder is active. launch.json names the current run, that is now the active run for the launch, if a run fails, then launch can get a new run attempt as the only runnable branch." (`8fdc3b29:5434`)

Reaffirmed later: "launch.json already hold the latest spec and maps. just it now sits in the launch space not the run space." (`9b679556:3839`) and "pretty sure launch.json is settled as an index." (`9b679556:3911`)

**State, the general principle.** "'state is shaken out of the system progressively' is closer and i would probably take it in that form. freezing can be human managed if they can easily access it. workflows handle a huge amount of state natively that the previous build didn't utilise. agent frontmatter handle state (eg hooks) that the previous builder didn't utilise. humans can 'choose their own adventure' from the start." (`0fb7c77a:2986`)

Earlier and sharper: "State lives in the docs themselves... freezing / approval written in the doc itself gating the next agent." (`8fdc3b29:5317`)

**The human's control surface.** Stated as the top priority of the whole v2 effort: "Before we start I would like to indicate that my highest focus is on getting the JSON underpinings correct as an 'interface' that i can connect to (built later, out of scope here) with a local web server that will become my control surface rather than a CLI. Also I can build agent facing command improvements later the plug straight in." (`0fb7c77a:17`)

"user facing commands removed. user wants local web page overlay reading run assets directly able to mutate." (`bfb87cff:372`) And: "local web page writing to launch.json or spec.json as far more palatable for a user than remembering 15 commands + flags." (`8fdc3b29:5434`)

Origin of the idea: "I wanted a basic system as a foundation, but was going to later build my own runner script, that also spun up a local web server for the 'radar' part of the build, i wanted it called 'flight', it would also eventually integrate dev-workspaces command surface so as to retire that system. this is important as I wanted a smart interface that could have views and scripting layered over the top but not need to have it for the system to run." (`8fdc3b29:5317`)

**What a runner is and is not.** "So yeah I like the idea of a runner just not as the major user control surface (that will be local web pages). I see commands like 'flight launch init <launch name>' that scaffolds a new launch. or 'launch run new' that creates a new run one above the current if that one is in a certain state. mainly though for enabling 'determinstic tools' principle." (`8fdc3b29:5404`)

Diagnosis of the v1 runner: "I can understand why the build run created fc, 'determinstic tools' kinda pushed the agent in this direction for budget management, rendering etc. I also liked the launch.json concept it implemented. although at the launch level not individual run instance level. It can be a live doc, that when a web page layers over the top they can get realtime updates, flip gates etc." (`8fdc3b29:5404`)

**What a workflow is for.** "This looks like the place that a vanilla flightcrew (without a runner) would do most of its 'determinstic output', instead of doing this the builder just bundled it all into the `fc` command and said 'run that'." (`8fdc3b29:7211`) And: "the 'problems' thread that produced this doc sais workflows solve, user gates (workflow ends at a gate), have json var injection, predetermine agent staging, dictate agent return shape, prevent stop. these are all very valid when discussing workflow shape and the shape a run takes. this means phases are prebuilt with workflows and kicked off after gates." (`bfb87cff:404`)

**The end of a run, described by the human who lives it.** "the build workflow runs, if green and review passes it ends a PR is opened. I am informed and I read the reports check stuff out (I don't just look at the PR). if happy I merge, if not a fill in runlog and try again. reject PR delete branch. workflow can clean up worktrees etc." (`9b679556:3681`)

**Branch topology.** "why does launch init create a new git branch? What happens if I want to build a large feature (mission) so I make flightdeck-buildout for this, then want to do some differing work like. core system, radar views, command upgrades? sure each run needs to happen on a throw away branch that ends with a PR back to the feature branch. if accepted the feature branch is mutated and the next launch creates new run PR's against it. when the feature is finished it all merges back to main. shouldn't the branch creation be on 'run new'? Is there now going to be a shitton of extra branches" (`9b679556:6717`)

**Context chaining between the crew.** "chained internal agent context. spec-builder receives and idea, test-builder receives a spec, orchestrator receives spec, tests and kickoff." (`8fdc3b29:5317`)

**Enforcement.** "Sandbox only." (`9b679556:3253`, P8) And: "pretty sure locked paths lock up all kinds of things like test folders etc. still needed." (`8fdc3b29:6236`)

## 3. Decisions with reasons

**Rip out `fc` as the system's centre, keep a thin dispatcher.** "there was never a problem with a command surface. we just found as we went through domains that the command surface dominated every decision and approach. leaving behind a very 'heavy' residue. We discovered with careful thought (that a build agent didn't have) we could acheive nearly all of its behaviours much more efficently and properly elsewhere." (`0fb7c77a:1020`) Reason for tolerating it in v1: "I eventually want a command surface built on later runs, but I want to untangle the system from its dependency on this. This should result in a 'simpler' system that is just as capable, and has a better foundation to build later advancements (like command surface and visual overlays of underlying data)." (`0fb7c77a:17`)

**Rewrite the runner rather than patch it.** "Rewrite in this run (SC4 as drafted)." (`9b679556:3253`, P3)

**Behaviours before checks.** "also build behaviours and edges first then try to find ways to check and verify them. do not do this in reverse (only place behaviours that can be checked) the last build run built an overly complex command surface because it was 'checkable'. more than half of the test suite checks the commands." (`9b679556:15`)

**Introduce a test-builder so the spec need not be self-testing.** "yes agent shaped. check class tag is welcome. in this case Im happy for the test writer to take on the responsibility for producing the tests you need. the previous run had no 'test-builder' so needed to be all-in-one, this caused the spec to prioritse a testable command surface." (`9b679556:86`)

**Liftoffs as JSON recipes, not new workflows.** "the reasoning is tooling is a major failure axis. if a run needs a different tooling setup this can be adjusted easily instead of creating a new workflow." (`9b679556:4402`)

**Checks live in the run, not globally.** "checks/ should live in each run instance as they may have to change/grow as the iterations discover check improvements" (`8fdc3b29:3449`) Reinforced: "verification is one of the failure axis. checks are therefore a run instance asset. test-builder agent builds new checks and tests after new versioned spec freeze. builds them into new run attempt." (`8fdc3b29:3566`)

**Checks wrap, never replace, the project's own tests.** "obviously No, checks are wrappers, they return flightcrew compatible output from a green/red test. single source of truth stays with the project and its own test suite." (`8fdc3b29:3566`)

**Single-folder launch layout, for a single source of truth.** "no duplicated specs single source of truth" (`8fdc3b29:3028`). The three-failure-axis reason is given at `8fdc3b29:201`: "this lines up well with the three failure axis principle; look at context, verification or tooling for improving the run."

**Old run folders are history, not canon.** "the buildout branches where built without flightcrew underpining it. kept as history and understanding nothing canonical, ask me you have the tools." (`9b679556:86`) Scope wording: "Out of scope and untouched; the launch README names them as pre-layout history and tooling skips a folder without the new shape." (`9b679556:1719`, D25) Contrast with the earlier-session answer "Deleted from the branch; git history keeps them." (`9b679556:1006`) — see §6.

**Build a judge rather than defer one.** "disagree — build a judge. don't defer." (`9b679556:1719`, D10)

**Keep `plan.md`; locking substitutes for the decision.** "lets keep plan.md. same as above, locking these files will have the same effect as this decision." (`9b679556:1719`, D5) This reverses the commander's own earlier leaning: "Plan - does it need to be markdown? im happy to keep as JSON only." (`9b679556:1006`)

**Reject nodes that are not decisions.** "Not sure this is a decision? fluffy statement at the end. If an agent needs to build these they become behaviours." (`9b679556:1719`, D22) And D20: "Sneaked this one in huh? i said explicitly that 'each node stands on its own merit'. Also this is not spec material... how to write a an individual spec. that is context that rightly dissapears after our session finishes."

**Abandon the v2 draft; restart at v1, keep only the intent.** "with this session, lets wipe the spec and rewrite it as a version 1. in a new build run (keep this folder). Im bogged down sorting existing nodes, so just write the new one as you see fit. instead of stages. I want you to ask question bundles based upon the problems and gaps that need addressing." (`9b679556:2156`) Reason given in the same turn: "It seems like im trudging through mud and all your questions seem so tedious." (`9b679556:2130`)

**Interview by problem, not by stage.** "Ask a bundle of questions per PROBLEM not per stage. for each problem place nodes in any domain needed. try to keep it narrow, otherwise the linter will reveal your largesses." (`9b679556:2881`, repeated verbatim at `9b679556:3027`)

**Rename `fc` to `flight`.** "rename it to 'flight'." (`9b679556:1006`) This reverses the v1-run request: "can you call it `flightcrew` instead of fc?" (`bab64608:972`), which was itself a correction: "what the fuck dude? don't stop the run, millions of tokens wasted. Im just wondering why the all important command got named something i didn't want?" (`bab64608:988`)

**Defer `flight` to a later launch.** "I want to go with the core or basic system. scripts are callable by themselves. flight is defered to a later launch. probably need to be a decision." (`9b679556:7255`, I10) Later than the rename, and it supersedes the "two new commands" plan for this run.

**Fix the rubric rather than the specs it flags.** "so in every future rails project where a change touches a few models but the adjacent others need locking. The spec rubric is going to flag on nearly every run. the answer is to change the rubric. it is only new and still in 'development' itself." (`9b679556:5984`)

**QDOD.2's new reading, with the reason.** "Ok so we can let exclusions inside the boundary go through to the keeper. but instead we check for files we need to work on but are outside of the boundary." (`4f6285bb:220`) Settled at: "'every resolvable scope entry must fall inside the stated boundary' sais both in list and out list are inside the boundary. if something resolves outside the boundary in or out is a finding." (`4f6285bb:264`) The governing reason: "ive just understood DOD.2 boundaries overule everything. is it the specs resposibility to ensure files are locked? if it names the path and then places the path inside the boundary then it has done its job yeah?" (`4f6285bb:384`) And what the question is worth keeping for: "A misspelling catch by DOD.2 is what we want. agent instantly fixes." (`4f6285bb:760`)

**Stop the adversary passes.** "Not another attacker session. these bulk adversaries are costing huge tokens and later runs are less valuable than earlier runs." (`9b679556:6335`) And: "if judge has findings do not run again until i approve." (`9b679556:6325`)

**Tier models to the retry pattern, not to capability.** "I'm pretty sure the implementers are on sonnet -> opus modeling because they get 8 tries each to go green. Fable is only useful if the workflow is trying to one shot the solution. ... But if it's retry until green fable will blow the budget as an implementer." (`bab64608:618`)

**Reversal on testbench placement.** "1. test structure setup. suites in flightdeck/test, checks in run, global assets in flightcrew/verify." (`bfb87cff:372`) then, one turn later, "ok my bad let it stay in testbench." (`bfb87cff:404`)

**Keep the spec chain as it is.** "ON the spec chain. builder is a session agent. the attacker and judge are invoked by the builder. this is probably the reason why they declare inputs differently. pretty much leave the spec chain as is. it was worked on by me before i started flightcrew buildout." (`9b679556:1006`)

**The v1 agent's decisions are not the commander's.** "D4 is a decision the agent made, not a human. It told the run to keep the prebuilt spec roles instead of creating their own, because I mentioned this in my starting prompt. There are 18 decisions, none of them are mine. treat them as removable or editable rather than MY previous decisions. however the agent wasn't a total idiot they probably made some good judgements." (`9b679556:1006`)

## 4. Taste

**Simplicity as the point of the second attempt.** "This should result in a 'simpler' system that is just as capable" (`0fb7c77a:17`). And: "This run should leave behind a simpler but just as effective system that leverages files and Claude code tooling far more than existing." (`9b679556:424`)

**Native harness over invented mechanism.** "This time the human assumes their intended role and dispenses their knowledge and vision for a simpler more native but just as capable sytem." (`9b679556:424`) And, against invention: "where did i say a workflow happens after the human review? did you explore the quoted source? Holy fuck this is frustrating, the interview so far... 'how do you want to handle all these things ive just conjured up without asking you and you have no idea what they are?' (run.json, fc-end). ASK ME ABOUT MY IDEAS ON HOW TO SOLVE THE PROBLEMS, dont invent shit and say 'done'" (`9b679556:3660`) And: "umm where the F did run.json come from?" (`9b679556:3253`, P10) And: "HALT.json wtf is this? never heard of it?" (`9b679556:3940`)

**Altitude: the spec should read like the project, not like a build plan.** "I went searching because I couldn't SEE my project in the spec. just a wall of text." (`9b679556:7003`) Same turn: "this gives license to the builder to create that bahaviour through discovery, I feel our spec is a one shot build plan. this would mean the spec would take orders of magnitude less time. and I can simple append statements onto our behaviours if we under spec'd it. ... How the agents built it is upto them, I come back if I need."

**Observability as the altitude test.** "um can you see how many behaviours are observable from the outside (ie me)? how many interfaces and contracts are built first for multiple actors?" (`9b679556:6968`)

**Node count as a ceiling on attention.** "yes live nodes. not a hard rule but a target. any more overwhelms the system." (`9b679556:86`) And: "I cannot confirm however each individual node is correct. that costs me too much mental energy." (`9b679556:1006`) And: "i haven't read 90 percent of the fluff you wrote above only trying to understand in a single domain, humans can't hold 8 different directives at once." (`4f6285bb:472`)

**What "done" means.** "As long as i takes for no gaps. the size of the work changes. no gaps never changes." (`0fb7c77a:2747`, Q24) And: "If a users idea of a piece of work can be handed over and agents build it for them, this work has been completed." (`9b679556:7255`, INT)

**What acceptance is for.** "create a valid spec, build tests, kickoff workflows, plan units, utilise agent roles, build units, verify units, adversary units, merge results, review outcome, write results, record events, log the run, cleanup build residue. ... The acceptance is not to end to end test this with some replacement human. but to test that the infrastructure exists for these elements." (`9b679556:424`, Q3)

**The system's first customer is itself.** "'a system whose purpose is to build itself until it can build other things' is exactly what it is. although we can probably drill down further, as this could mean a HITL system. - User ideas and vision front loaded instead of dispensed throughout (approach flip) - System introspects itself so to improve iteratively instead of highest quality single shot. - agent best practice conventions" (`0fb7c77a:2747`, Q23) The same turn marks it as the interview's only real success: "this is the first time i actually feel like you have broken ground."

**Intent is the one non-deterministic thing.** "The intent is the only place that doesn't have to be deterministic in nature. A human says the outcome they want. the spec aligns deterministically with this. The end result is asked 'is this the outcome?' if not you need a better outcome, or a better spec driving agents towards the outcome." (`0fb7c77a:1020`) And: "don't need 'acceptance' criteria in intent. intent is only judged by the user. The determinism comes next." (`0fb7c77a:2986`, Q32)

**Iteration over one-shot.** "this is iterative improvement, 'abandon failed runs', eventually it will outstrip the 'source' as it is improved progressively." (`0fb7c77a:2747`, Q27) And: "decomposing. uses cheap build agent retrying attempts, instead of expensive agents single shotting. visibility is huge, although that will be a separate spec, but need interfaces that aren't 'locked up'" (`0fb7c77a:2986`, Q33)

**Versioning, not restarting.** "major surgery to the intention is not how versioned specs work. they should say, 'Our last outcome was not satisfactory, lets keep the intention and improve the spec, or did our last outcome intention need slight adjusting and therefore we align the spec with this improved intention'" (`0fb7c77a:1020`, Q2) And: "see you cannot adjust intent if you start from 0 everytime." (`0fb7c77a:1491`)

**The interviewer must extract, not consult.** "The convention here is for the users idea's and vision to be probed, thats what I hold and no agent can access unless you 'draw' it out of me. This interview reads like an afraid housemaid, 'what should I do with this master?' 'is this what you want master?', you are fable 5.1, the bigest and best model in the world. your job is to write a spec that fulfils the vision of the user, better than the last attempt. This is so agents neither of us will talk to can have a crack at building it for us. having got my initial intent you should be probing it. asking why and how." (`0fb7c77a:2011`)

"the stakes are high mate. we fuck around too much with sycofancy, i eventually blow a shitton of tokens on nothing and evetually give up. I cannot write an 80 behaviour spec fully verified and scoped with edges. Im not getting grilled anywhere near enough, roast my shit intent. just for the record, the most recent round of questions is grilling me on the shit YOU wrote. let me babyfy it for you. start with MY crappy outcome intention and grill that." (`0fb7c77a:2298`)

"So only Q23 felt like it was relevant to intent discovery and hardening. The one thing that the whole line up doesn't know and cannot derterministically check is 'what did the user want to build?', your job before you try to lay the groundwork for your flightcrew pals is knowing what i want to build." (`0fb7c77a:2747`)

**Against agents running ahead.** "can I get you to just 'stop' trying to be ahead of my every move. now you are going on a 'vision-adventure', where did this come from? o let me guess, another of your ideas. don't you have a system of intent -> scope + decisions -> constraints etc to follow?" (`0fb7c77a:4007`) And: "holy shit youve gone off on your own again swallowing all my tokens" (`9b679556:2897`) And: "stop. um what do you mean 'the ground'? this is a full blown launch this session was always going to do. where the fuck did you get that idea? repeat back to me where i told you to reduce the scope in this conversation?" (`9b679556:2881`)

**The run log discipline.** "the fundamental principle is for the user to complete a runlog and then that is presented in version 2 and the 'decisions' can be absorbed. the only advice i could give is instead of running infront of the user present them a list of considerations for their run log once the run ends." (`bab64608:1765`) Same turn: "don't stop the run, but some thing to address is you seem to be versioning new runs before the source run is over."

**Never stop an expensive run.** "what the fuck dude? don't stop the run, millions of tokens wasted." (`bab64608:988`) and "just finish the run." (`bab64608:1016`)

**The human defines goals and constraints, not steps.** "See workflows from my end are not what you think. I get a very small glimpse of what is built. i'll give an example... 'which command names would you prefer?' for a run script I had no Idea I was even getting. I cannot make accurate judgements for things i haven't seen. ... my job is instead of telling you what to do at every step, but accurately define your goals and constraints, you get to decide how that looks. I cannot be asked like this is HITL. I have been visiting this screen on and off for over 12hours, every now and then getting a 'glimpse' of what is happening behind the scenes ... So this is the long way of saying, decide your self, but align that with what I have described described." (`bab64608:1826`)

**Explorers are cheap; reading is not the commander's job.** "send explorers when ever you want, they are cheap and don't spoil context." (`9b679556:3964`) And: "I included the problem dump because discovery costs you important context. your primary role is to help me create a spec ... not untangling messy context sources." (`0fb7c77a:1020`) And: "I only have a vision for my app, agents are the experts at filtering through walls of text." (`9b679556:2130`) On what the cheap agents produce: "you are problems highlighter not solutions implementer. just say it has no bash sandboxing, spec builder will help me decide." (`8fdc3b29:6247`) And: "The deliverable after exploration and the extraction of my ideas and perspectives, is to provide a 'problem' document; describing the problem in isolation, why it is a problem, and its affect upon the wider system." (`8fdc3b29:16`) And: "I agree our problem documents should not be defect ledgers. I think 'what the problem is' 'why it is important' and 'how it fits into the larger system' still seem like the structure needed. however each document is a 'set' of problems (what, why, larger) that fit into a single domain" (`8fdc3b29:94`)

**Problems orient questions; they are not a backlog.** "registered 'problems' name nothing, they orient your questions to cover these 'gaps'. The spec condenses exisiting and expands non existing. Our intent is to improve the system so the spec can orient towards that outcome." (`9b679556:424`, Q4) And: "consider problem dumps as reference not a waiting list to be spammed at the user." (`9b679556:86`)

**What a test suite is for — the characterization argument.** This comes from a turn where the commander pastes a web-Claude exchange (`9b679556:7631`). Only the opening and closing paragraphs are the commander's. Opening: "The first build agent, built a highly complex and hard to learn/use fc command as the core of the system because it was (deterministic) testable. they however built a decent core of agents, plans, kickoffs, events etc. so all the tests are red/green for the major thing I want to rip out. This made me think though. I should go through and inventory the system. Any document or part i want to keep I should build 'agent shaped' tests for. Once finished this will provide a foundation that should always exist but doesn't currently, a testable core."

The commander's three rules, stated as a Rails analogy in the same turn: "I would not restate the whole exisiting behaviour model. I would rely on existing test for unchanged behaviour. I would define where behaviour differs observably from original. if this is correct then it applies to a system of harness tools also?"

Closing, the commander again: "As i was checking through behaviours I realised we have been defining behaviours that already exist. and came to think this was rather wasteful and counterproductive. I checked our problem files also. not much really changes from what was built. just the rip out of fc. and the addition of workflows as its replacement, and a change of launch and run." (`9b679556:7631`)

**Late discovery that reframed the whole interview.** "OK game changer incoming. Ive just found these collecting dust... ~/Projects/flightdeck/flightdeck/manuals/spec/spec-description.md ~/Projects/flightdeck/flightdeck/manuals/spec/verification-addendum.md. we had a bunch of troubles in this thread, would these have given you the pathway for when you wanted to be helpful. and also how much would they have chenged the spec and the interview?" (`9b679556:6926`)

## 5. Unanswered or deferred

**Who invokes the workflows between gates.** "this i haven't found an answer for. worthy question though. imma go with the orch session." (`9b679556:3253`, P4 Q2) Chosen provisionally, not settled.

**Roots as an interview device.** "I have no idea about roots. these are not questions I can answer. I have in my mind, behaviours, edges, scopes, constraints, interfaces, intents, decisions." (`0fb7c77a:1020`, Q5)

**Endings policy, sources unresolved.** "Keep by default. comment: i would like to see the sources on this one. one may carry more weight than the other." (`9b679556:3253`, P9)

**The three-verdict model, at first encounter.** "Im not aware of the three verdict model, is that exit 0, 1, 2?" (`8fdc3b29:3566`) Later: "ON the verdicts... I have no idea what this whole passage even means with all these undefined terms 'result schema's enum is exit-shaped'" (`8fdc3b29:4219`)

**What a review workflow is for.** "also im open to a review workflow i just don't know what it would be needed for? how many agents in a review workflow?" (`9b679556:4114`)

**Whether the build is too big.** "can I ask an honest question. is this build too big? should I be splitting this up. for eg test, fc command, liftoff, etc?" (`9b679556:2130`) Answered by commissioning the split document at `9b679556:2156`, but the commander never ratified the recommended three-launch cut in any turn I found.

**Worktrees and the commit-before-open question.** "yeah workflows can automatically open and close worktrees, apparently there was something about commiting before this happened mentioned in a conversation i had, not entirely sure. 1. it was talked about near that conversation extract. 2. was talked about also not sure a concrete decision was made." (`9b679556:3839`)

**The "targets" term.** "also the term 'targets' is mentioned which im unsure of how it fits into the verification domain." (`a9389f8c:3402`) No later turn resolves it.

**Node triage never completed.** At `9b679556:7255` the commander marks all 35 behaviours, all 14 edges, all 8 decisions, verification and acceptance as "(undecided)". Only intent, scope, constraints and interfaces carry comments.

## 6. Contradictions

**"There is no gates" versus a gate mechanism chosen in the same turn.** "oogwhey (from kungfu panda)... there is no gates, only workflows." and, in the same pasted block, "An orchestrator session invokes the workflows in order, stops at each gate, and reports; the human clears the gate in launch.json." (both `9b679556:3253`). The commander also says elsewhere the phase state is "user gates etc." held in launch.json (`8fdc3b29:5434`) and that phases are "prebuilt with workflows and kicked off after gates" (`bfb87cff:404`). The reconciliation the commander offers is that a gate is where a workflow ends, not a switch anyone flips: "workflow agents write things. when they finish I check em. then if im happy I say to the orchestrator, yep do the next workflow." (`9b679556:3253`) The word "gate" survives; the flipping mechanism does not.

**launch = run, versus launch contains runs.** "launch = run, run/awesome-run = run instance" (`8fdc3b29:201`) against the tree at `8fdc3b29:3028` where `launch/<name>/runs/run-<n>` makes launch the container and run the attempt. The later statement governs. The loose usage persists after the decision: "The convention is for a `run` (launch) to happen under the same directory" (`a9389f8c:3617`) and "a launch instance retries untill it succeeds" (`8fdc3b29:3028`), where "launch instance" means what `runs/run-<n>` now holds.

**Old run folders deleted, versus kept out of scope.** "Deleted from the branch; git history keeps them." (`9b679556:1006`, P-interfaces Q2) against "Out of scope and untouched; the launch README names them as pre-layout history and tooling skips a folder without the new shape." (`9b679556:1719`, D25). The second is later in the same session and is the one the commander wrote in their own words after correcting the drafted node.

**Plan as JSON, versus keep plan.md.** "Plan - does it need to be markdown? im happy to keep as JSON only." (`9b679556:1006`) against "lets keep plan.md." (`9b679556:1719`, D5). The second is later.

**Suites in a project test folder, versus stay in testbench.** "suites in flightdeck/test, checks in run, global assets in flightcrew/verify" (`bfb87cff:372`) against "ok my bad let it stay in testbench" (`bfb87cff:404`). One turn apart; the second is the commander's own correction.

**Branch creation on launch init, versus on run new.** The commander proposes both scaffolds at `9b679556:1006` ("'flight launch init' scaffolds a new launch ... 'flight launch run' scaffolds a new run"), then challenges the branch placement: "why does launch init create a new git branch? ... shouldn't the branch creation be on 'run new'?" (`9b679556:6717`) and presses again: "why only 'run' and not 'run new' like i suggested. you just going to vibe that one up too? justify the single 'run' command" (`9b679556:6738`). No resolving statement from the commander was found.

**A thin dispatcher this run, versus deferred entirely.** "rename it to 'flight'. keep as thin dispatcher ... two new commands" (`9b679556:1006`) against "flight is defered to a later launch. probably need to be a decision." (`9b679556:7255`, I10). The second is later and follows the altitude rewrite.

**Not found.** No commander turn in this corpus defines **steward** or **control centre** as terms, states what a **liftoff** is in a single definitional sentence beyond its file shape and invocation, or describes what the system should feel like in terms other than "simpler", "just as capable" and "more native".
