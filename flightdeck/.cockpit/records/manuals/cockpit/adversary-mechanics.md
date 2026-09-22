---
type: "Manual"
stub: true
style: "record"
stamp: ["2026-09-22", "Pilot: Ace", "71b94de4"]
context: ["T010", "T017", "Or067", "Or069", "Or071", "Or074", "Or080", "Or081"]
---
# Adversary mechanics

How the cockpit runs adversaries, settled by the commander's rulings and one measured flight (T017). The findings behind each statement are in `records/notepad/team-builder-2026-09-21/`.

## One body, two postures

There is one adversary seat. What makes it live or cold is the dispatch instruction it is given and the stage at which it is spawned. A seat spawned after the work is frozen cannot hold the flight's history; that timing is the isolation, and it is stronger than any instruction. The commander's stages are setup, live, end and full.

## The live adversary

Dispatched at the first landing, it attacks each artefact at its source as it lands, before anything is built on it. It reports to the lead only; the lead relays once per round to the author and once to the writer of the paper. That is why it does not obstruct: no working seat sees it or waits on it. It is not silent if it is told what has landed; a seat closes a round and stands by unless its brief says to list the folder and take the next unattacked item. It runs one report behind evidence seats that land together, so its findings arrive after the work that leaned on them; the cost is rework on the writer, not interruption. Its queue is ordered by what the product leans on hardest, not by landing order. It attacks a numbered pass only after the writer has acknowledged the freeze, and it is given the pass number and the file's modified time. It re-attacks changed parts only when told which findings a revision answered, and withdraws in writing with a reason. It is kept alive to the end; its best work is withdrawing under challenge, which needs it running when the challenge arrives.

## The tandem

A second adversary body is seated when the evidence arrives faster than one can attack it. The division is declared at dispatch as a rule, by object (one owns the evidence, one the paper), with each seat's own finding prefix and the other's name. Each reads the other's file when idle; that cross-read found the one thing neither found alone, an analysis counted twice. With a pooled task queue the division can be replaced by self-claim from a pool, with a claim rule for the race and a cross-read task on the list.

## The cold reader

The same body spawned after the freeze is acknowledged, from a fixed brief written before the flight with only the path filled in, given the finished product and its sources and nothing of the history. It finds what live rounds miss: one-command facts, citations that name the wrong file, and errors the live adversary's own corrections introduced. It also produces wrong findings, because it generalises from what it can see and nobody attacks it; the live seats, still present, check its findings before the writer takes them. Timing isolates the context but not the disk: the history is kept outside its read boundary by location, and adversary seats carry no agent memory.

## What the pilot does

States the lead's address at dispatch. Freezes only by the writer's acknowledgement. Sends one closed brief per pass naming which rounds it absorbs. Relays unattacked evidence labelled as such, without gloss. Reports a finding to the commander with its status, standing or not yet re-attacked. Reads a seat's state from its transcript. Checks a cold finding at source before acting on it.

## Signals worth emitting

A catch by a seat of another seat's or the pilot's error, at the moment it happens, into the dispatch record; a withdrawal with a one-word reason; the writer's acknowledgement of a freeze. The mistake list of a flight holds only what escaped the team, so who catches what cannot be read from it afterwards.
