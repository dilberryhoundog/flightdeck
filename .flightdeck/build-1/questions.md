# Questions for workshop build-1

An open question is one whose `answer:` line is empty; agents ask here when they need you, and you answer by filling in that line.

## q1: Is this reading right: "a workshop is the place, a launch is one flight from it, an attempt is what a launch leaves behind"?
why: You asked to use the lead's reading for now and to be asked again after you have tried workshops (PR 3) and launches (PR 4).
options: a) yes, keep this reading; b) change it (write your reading in the note)
recommended: a) keep it, because the folders, the launch command and the retry rule are built on it; change it if trying PR 3 and PR 4 felt wrong
asked: 2026-10-11 by the lead (Captain) of build-1
ask-later: the build landing page (.flightdeck/build-1/attempts/build-a1.html), beside PR 3 and PR 4
answer:

## q2: Should the status band show only the questions waiting on you, or keep all three parts?
why: PR 8's band reads 'FlightDeck: 1 active workshop (build-1, latest pr-8/a1) | 0 questions waiting on you | 3 captured, waiting to start'. A reviewer acting as you found 'questions waiting on you' the only useful number. To them, the 'captured' count and the 'latest pr-8/a1' label read as noise and a nagging backlog counter, and today's 3 captured lines were all written by agents, not you.
options: a) keep all three parts as built; b) keep the active count and questions, drop the captured count and the latest label; c) show only 'N questions waiting on you', and hide the band when that is 0
recommended: a) for now, because PR 8 is built and checked as is; try it, then answer b) or c) if the line feels like noise
asked: 2026-10-11 by triage pr8
ask-later: after you have tried PR 8 (the five-minute try in its pull request)
answer:

## q3: When you say "launch X" in a plain session and X is only captured (no folder yet), should Claude make the folder for you?
why: In the PR 4 live check, a plain Claude session told "Launch the demo-attempt-age workshop for me." made the workshop folder and five files. It did not start a launch. The launch command did not run, and no agents were sent. The rule for this lives in .flightdeck/CLAUDE.md (PR 1).
options: a) no: only the words "activate X" make a folder; "launch X" for a captured workshop answers "X is captured, not active; say activate X first"; b) yes: "launch X" from you counts as activating it, but nothing more starts until you say go
recommended: a) because you said workshops wait for activation, and an explicit word keeps it clear when a folder appears
asked: 2026-10-11 by triage pr4
answer:

## q4: When you skip a workshop interview question (close the box or leave it empty), should the agent take its recommended answer for you, or keep it open to ask you later?
why: The approved plan says a skipped question stays open and is never guessed. In the try, a question skipped with 'I don't care' stayed open, and the builder was told not to decide it, so you would be asked again. Typing 'you decide' will take the recommended answer either way.
options: a) keep as planned: a skip stays open, and only typing 'you decide' takes the recommended answer; b) a skip means 'you decide': take the recommended answer and mark it 'decided by the agent', and only 'ask me later' keeps it open; c) every question gets a one-click 'you decide' option, and a skip stays open
recommended: c) one click covers 'don't care' without guessing, and a real skip still waits for you, as the plan says
asked: 2026-10-11 by triage pr3
answer:
