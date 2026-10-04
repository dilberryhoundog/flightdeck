<!-- SOURCE material, T002, 2026-09-18. Fully referenced and verified; not a record. The commander ruled on 2026-09-18 (commanders-desk/out-advice/DS002.md) that records are sharp, current-form and timeless, and these are the source they are extracted from. -->

# The Commander's Guidance

Purpose: the pilot aligns with the commander's vision without re-asking. Definitions, architecture statements and decisions with their reasons, in extract with citations.

Researched by: T002 (certified research team, mission M001), records seat, from the `transcript-miner` seat's sweep of ten session transcripts. Research date: 2026-09-18. The pilot independently opened five cited lines and found all verbatim commander turns.

Source: commander turns in `flightcrew-characterization:dev/workspace/history/<session>_<slug>.txt`, cited as `<session>:<line>`. The line is the line the quoted sentence sits on, as `grep -n` returns it, so every citation can be checked with one command. The turn it belongs to is the nearest `[USER]` marker above it. Every quotation was confirmed to fall inside a genuine commander turn and not a task-notification wrapper. Sessions run 2026-09-08 to 2026-09-13.
Source: `advice`, written guidance addressed to the pilot, 2026-09-18.

Everything in quotation marks is the commander's own typing, including its spelling. Two passages in the corpus are not theirs and are excluded here: the commissioned roadmap at `flightcrew-buildout:dev/workspace/plans/flightcrew-features.md`, which is Claude's rendering ordered at `9b679556:2160`, and the pasted web-Claude reply inside the turn at `9b679556:7650` beginning "Yes, and the three rules are right".

## Two name collisions the pilot must not trip on

Neither sense of "pilot" in this repository is the cockpit's pilot, and a pilot reading either source for its own role will find a different job wearing its name.

**In the transcripts, a pilot is a build-unit agent, later renamed scout.** The commander writes about it in their own words exactly twice: "change name of `pilot` agent to `scout` agent" (`9b679556:1080`) and "do we have a scout instead of pilot? if so send out judge" (`9b679556:4647`). The word occurs far more often across their turns, but every other occurrence sits inside a pasted plan schema, agent report or guide rendering rather than the commander's own prose. At `9b679556:7004` the commander offers the role as an example of how a spec should be written, not as a description of the system: "I think this spec should be describing behaviours like this. 'a scout worker is deployed first so that the implementation run can be found working before the rest of the wave continues'".

**In the code, `pilot` is a boolean on a plan unit**, and this is the collision a pilot will actually meet first, because it appears in any `plan.json` they open. At `run/flightcrew-characterization-2` `4fd81d8`, `schemas/plan.schema.json` declares `"pilot": { "type": "boolean" }` on a unit, and `crew/planner.md` gives the rule: "Mark at least one unit in the first parallel wave `pilot: true` — the one exercising the riskiest seam, or, where none stands out, the one whose `checks` cover the most spec nodes. The contracts unit is never the pilot." It is a canary unit, run ahead of a wave so the run can be found working before the rest continues.

The word "preside" returns nothing across the commander's turns. "Room" returns twenty-two occurrences, and every one sits inside quoted guide material rather than the commander's own prose, chiefly the review guide's sealed room for the critic and one rendering of handing a frozen spec to a run and leaving the room. So no commander turn uses either word in the cockpit's sense, and nothing in the transcripts describes a pilot presiding over anything.

## Tests and checks: the sharpest distinction in the corpus

The commander separates tests from checks, gives each a different home, and gives them different stability. Flattening the two is the mistake this record exists to prevent.

The definition, `a9389f8c:3403`: "in my intial conversations checks and tests are different things. tests are pass/fail assertations. checks are definition of done, they overlay a test with a orchestration run compatible output. Im pretty sure a rails project tests aren't fully compatible with orchestration runs. also checks can be things tests aren't. eg a skill.md can't have a pass/fail assertion." The same turn assigns the work: "the test builder should know to build "tests" into project native or testbench. then place checks into run folder."

The gold standard, `a9389f8c:3227`: "if this was rails the checks would be "wrapping" rails natural test/ folder. I think the workflow writer (non flightcrew run) got the setup wrong. the 29 regresion tests should be in ./test/ then there should.ve been check wrappers."

The pipeline, `8fdc3b29:3569`: "Project test/ for appropriate assertive tests -> testbench for any other tests not compatible with a tests folder -> run-1/checks to wrap the tests -> flightcrew/checks (probably should rename to 'verify') for global test wrappers etc." The reason, same turn: "checks are wrappers, they return flightcrew compatible output from a green/red test. single source of truth stays with the project and its own test suite."

Testbench's role, `a9389f8c:3305`: "when using flight deck in a folder with no test/ this becomes a known place for the tests flightcrew needs to work properly."

**Both halves matter.** The project's tests are the stable layer and the single source of truth. The checks are deliberately not stable: "checks/ should live in each run instance as they may have to change/grow as the iterations discover check improvements" (`8fdc3b29:3452`), and verification is one of the three failure axes a retry is allowed to change, the axes being named at `8fdc3b29:206` as "context, verification or tooling for improving the run". A reader who takes the protective framing and applies it to checks will lock the layer the commander designed to move.

The purpose behind it, in the commander's own words at `9b679556:7638`: "Any document or part i want to keep I should build "agent shaped" tests for. Once finished this will provide a foundation that should always exist but doesn't currently, a testable core." Their three rules, from the same turn: "I would not restate the whole exisiting behaviour model. I would rely on existing test for unchanged behaviour. I would define where behaviour differs observably from original."

And on when to change the instrument rather than the work, `9b679556:5985`: "the answer is to change the rubric. it is only new and still in 'development' itself."

## Crews

At `0fb7c77a:1034` the commander writes, with the scare quotes theirs: "FlightCrew" is literally a bunch of agents working together to complete a (flight) mission, so they are important too. Ownership is settled at `9b679556:5650`: "crew/ is the source of truth for flightcrew agents."

## How the commander works, and what they want from an agent

On their own posture, `bab64608:1830`: "my job is instead of telling you what to do at every step, but accurately define your goals and constraints, you get to decide how that looks. I cannot be asked like this is HITL." Same turn, on watching a long run: "I have been visiting this screen on and off for over 12hours, every now and then getting a 'glimpse' of what is happening behind the scenes, and asking a few questions along the way. I do not consider myself having "the reigns"."

On the division of labour, `9b679556:2133`: "I only have a vision for my app, agents are the experts at filtering through walls of text." On dispatch, `9b679556:3965`: "send explorers when ever you want, they are cheap and don't spoil context." On what an agent's primary job is, `0fb7c77a:1049`: "your primary role is to help me create a spec that can drive a build run and leave no questions unanswered for later agents. not untangling messy context sources."

On what counts as enough, asked how long a spec interview should take, `0fb7c77a:2759`: "As long as i takes for no gaps. the size of the work changes. no gaps never changes."

On not running ahead, `bab64608:1767`: "the only advice i could give is instead of running infront of the user present them a list of considerations for their run log once the run ends", prompted by the complaint in the same turn: "you seem to be versioning new runs before the source run is over."

## Written guidance to the pilot, DS001, 2026-09-18

This section is the commander's written direction to the cockpit, not interview material. It is later than every transcript above and governs where they differ.

**Teams and crews are different things, and the split is the pilot's.** "There is an important distinction between teams and crews. The pilot knows about both, flightcrew doesn't know about teams. The teams belong to you, your dispatch records the teams you dispatch, possibly with sub dispatches in the future... dispatch/flightcrew/ dispatch/cockpit/ dispatch/**. eventually we should converge on various crew departments. The flightcrew agents reserved specifically for that flow, but other agents for eg research teams, repo teams." No transcript discusses this; it is new thinking, and the word team does not appear in any commander turn in the corpus.

**A launch succeeds through convergence, not sequence.** "As im writing this im seeing that a launch succeeds not from a bunch of commands run in sequence, but agent teams all converging on success, like a prebuild (spec and tests and plan), then the build (orch workflows), then review and cleanup (decide done, gather intel, setup next run, or merge and move on)." This too is first stated here and appears in no transcript.

**The pilot presides and does not build.** "You are the pilot that flies the mission. You actually don't do any work, so therefore don't need to ever distract yourself with the finer details. For eg when the core is speced again it will be very different from my first attempt. You will preside over the room where the test agent and the spec-builder and probably an adversary and a few others, will be thrashing out the spec in real time."

**Library and records are different audiences.** "flighdeck/library = global documentation for all stakeholders and interested parties. .cockpit/records = the pilots most important and trusted records to enable them to do their job specifically and in isolation." With the standing instruction: "The intention for you is not to replicate library documents but rather extract key findings and 'record' them as research backed records." The library is the pilot's to maintain, "although other parties may write and read to/from it", because "You have more overview of the system than any other entity."

**Genesis documents are maintained, not archived.** "Systems like flightcrew grow organicly but these types of genesis documents are important to update and maintain over time, especially for a pilot who needs to understand where things are at."

**The order of work.** "the mission is to fitout the cockpit. once that is done we make it self sustaining. then we dig into the missions of building out flightcrew." The commander declines to specify the core work from a distance: "this means the pilot can help here and will probably result in minor direction changes, so I don't want to define exactly from this far out."

**What the test suite is for.** "what we are actually looking for is to have a test suite that protects and defines the underlying infrastructure that can be built upon over time, we want to avoid having to tune the suite everytime a build run is attempted because our testing is too heavy handed. The gold standard here is a standard ol rails test folder. that can travel with flightdeck even when it becomes distributable."

**Branch cleanup.** "clean up branches only if upstream branches replicate their contents. for any others you find that don't satisfy the replicate requirement, write them in a temporary manifest stating their state and why you think they should be cleaned." Superseded the same day, spoken, when the pilot began deleting replicated branches: "don't clean up any branches that haven't had their upstream changes merged higher. this is a merge cleanup instead." The later rule governs. [Pilot's addition at filing, from `quarters/commander/commander.md`.]

**On limits.** Recorded by the pilot the same day from the commander in session: arbitrary limits are bad, so a crew has no fixed cap and every seat is there for a stated reason; and an adversary runs on Opus, because Sonnet takes far longer at adversarial work and sometimes fails outright.

## The control centre, and what the commander has not defined

**The control centre is defined, in the commander's own words, and is spelled the American way.** Searching the British spelling finds nothing, which is how a first pass concluded it was undefined.

What it is and where it lives, `8fdc3b29:5407`: "I have also decided to provide a flightdeck/.controlcenter which can keep active env like LAUNCH_DIRECTORY". What it will become, `8fdc3b29:5439`: "control center yes probably, but eventually it will hold all types of configs (especially when flightdeck absorbes dev-workspace) this can be advanced as needed."

What it is not, and this is the part that governs how it is built. At `9b679556:7046`, in a list distinguishing interfaces from things that merely hold them, the commander writes that .controlcenter is an inert folder and the interface should be "flightcrew.yml", their quotation marks around the filename. The commander opens that same list with the principle: "An interface is a common language or location, a town square", and applies it identically to the launch folder, which "is inert the interface is launch.json". At `9b679556:7006` they name the control centre folder in an explicit list of things that are NOT interfaces: "launch folder, .controlcenter folder, frozen documents, crew role, returns, suite protocol, run documents, liftoffs (schema yes), vedicts".

So the control centre is an inert directory at `flightdeck/.controlcenter`. It holds active environment such as the launch directory and is expected to grow into the system's general configuration store. The interface is not the folder but the file inside it, which the commander names as `flightcrew.yml`.

Two architecture statements sit in the same turns and belong with it. On where the human sits, `8fdc3b29:5409`: "So yeah I like the idea of a runner just not as the major user control surface (that will be local web pages)", with the launch record as "a live doc, that when a web page layers over the top they can get realtime updates, flip gates etc." And the three decisions the commander lists at `9b679556:7010`: "Small minimal command surface. leverage Claude native harness. compatible with view layer over JSON."

What the commander uses but never defines: **steward**. At `9b679556:5647` they instruct "1. do a steward 2. bootstrap it", which is an order to build one, not a definition of what it is. A pilot will meet the term in the core spec's settled decisions and will not find it explained.

What the commander never uses as their own term: **teams**. The word returns thirty-nine occurrences across their turns, and every one sits inside a quoted document title or a pasted rendering, chiefly the title "Orchestrating agent teams in Claude Code", which is the parent title of the genesis guides. The commander never writes it as their own word, so the concept as flightdeck uses it has one source only, the DS001 section above.

What the commander never states in a single sentence: when a **launch** is done, as against when a run ends. The three turns that bear on it, and the warning against assembling them into a definition, are in `launch-and-run.md`.
