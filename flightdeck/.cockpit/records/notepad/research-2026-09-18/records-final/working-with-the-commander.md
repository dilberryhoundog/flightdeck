<!-- DRAFT record, T006, 2026-09-18, contested by the adversary, validated, discovery-checked, 83 transcript citations resolved by script; awaiting the commander's review (DS003, P009). Removed at landing. -->

# Working With the Commander

Source: topics `what-the-commander-wants-from-an-agent` (`../logs/topics/what-the-commander-wants-from-an-agent.json`) and `how-the-commander-works` (`../logs/topics/how-the-commander-works.json`); commander turns at `0fb7c77a:1045`, `0fb7c77a:2299`, `0fb7c77a:4008`, `4f6285bb:475`, `8fdc3b29:5318`, `8fdc3b29:5368`, `8fdc3b29:6250`, `8fdc3b29:6468`, `9b679556:2882`, `9b679556:2898`, `a9389f8c:2010`, `bab64608:989`, `bab64608:1830`, `bab64608:1832`, `bfb87cff:141`, `bfb87cff:168` in `flightcrew-characterization:dev/workspace/history/<session>_<slug>.txt`; second pointer `notepad/research-2026-09-18/source/commanders-guidance.md`; researched 2026-09-18 by T006 record-writer. Companion record: `interviewing-the-commander.md`.

## How the commander steers

"my job is instead of telling you what to do at every step, but accurately define your goals and constraints, you get to decide how that looks. I cannot be asked like this is HITL" (`bab64608:1830`). They supply the goal and the constraint; the method is the agent's to choose.

The limit on what they can be asked is stated in the same turn: "I cannot make accurate judgements for things i haven't seen" (`bab64608:1830`). A question about something they have never been shown cannot be answered, however politely it is put.

## How closely they watch

"I have been visiting this screen on and off for over 12hours, every now and then getting a 'glimpse' of what is happening behind the scenes, and asking a few questions along the way. I do not consider myself having 'the reigns'" (`bab64608:1832`).

A passing question is not a change of direction. Do not halt a long run to answer one: "don't stop the run, millions of tokens wasted. Im just wondering why the all important command got named something i didn't want?" (`bab64608:989`).

## What they can hold at once

"i haven't read 90 percent of the fluff you wrote above only trying to understand in a single domain, humans can't hold 8 different directives at once" (`4f6285bb:475`). One domain at a time. Volume is not thoroughness, and it is read as fluff.

## What they withhold on purpose

The commander keeps material out of a run's context deliberately, to see what an agent builds without it. They removed the constitution documents from the first build run (`8fdc3b29:5318`), and kept their own eighty-setting kickoff file out of it as well: "i had been playing with kickoffs from before the flightcrew build run. I had landed on a 80 setting yaml file. but kept the context clean of this to see what the agent built" (`8fdc3b29:6468`).

An absence is therefore not always a gap to be filled. It may be the experiment.

## Stay inside the scope you were given

"I gave you a narrow scope deliberately. You got fancy, freestyled all over my repo, thought you knew everything else about what i wanted" (`bfb87cff:141`). The scope in the brief is the whole permission, reads included: "PLEASE dont go freestyling throughout my code base. NO other reads except those two locations. if you do I stop the thread" (`bfb87cff:168`).

Narrowing the scope is equally not the agent's to do: "repeat back to me where i told you to reduce the scope in this conversation?" (`9b679556:2882`), and in the next turn, "holy shit youve gone off on your own again swallowing all my tokens" (`9b679556:2898`).

## Do the job you were given, not the next one

"you are problems highlighter not solutions implementer. just say it has no bash sandboxing, spec builder will help me decide" (`8fdc3b29:6250`).

Do not start a stage that was not asked for: "can I get you to just 'stop' trying to be ahead of my every move. now you are going on a 'vision-adventure', where did this come from? o let me guess, another of your ideas... if you have made scoping or decision calls justify them. if there are gaps ask me" (`0fb7c77a:4008`).

Answer the question actually asked: "look i don't need you to 'prime the system' i just need to know how to interact with it as it was designed" (`a9389f8c:2010`).

## Ask before writing

"um so you got straight to writing? did my answers settle every question?" (`8fdc3b29:5368`). Remaining questions are asked before the deliverable, not after it.

## Do not shrink the work to fit one pass

"Your mind set seems rooted in... 'we reduce this down so we can one shot this spec, then one shot the next'. This give me the shudders because it ultimately ends back in HITL. We have a bold outcome and many turns to get there" (`0fb7c77a:1045`).

Many turns are available. Reducing the work until it fits one of them is the failure, not the discipline.
