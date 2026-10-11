# Activation questions for workshop card-oldest-question

The ask: the pre-flight card lists the oldest waiting question first (2026-10-11)

Answer by filling in each answer: line below with a letter or your own words, or paste a reply block in chat with /flight:workshop card-oldest-question. Leave an answer empty to skip it; a skipped question stays open and is never guessed.

## q1: What should the card show for the oldest waiting question: its text, its age or both?
why: the card has one line per workshop, so the answer decides how much has to fit on that line.
options: a) its text; b) its age in days; c) both on one line
recommended: c) both on one line, because the text says what is waiting and the age says how long
asked: 2026-10-11 by the workshop interview
answer:

## q2: Should questions held to ask later count as waiting?
why: a held question is not open today, so counting it would change the number the card shows now.
options: a) no, as today; b) yes
recommended: a) no, as today, because you held it on purpose
asked: 2026-10-11 by the workshop interview
answer:

## q3: The weakest part of this ask is that oldest is not defined: should it mean the earliest asked: date or the longest unanswered?
why: the two meanings pick different questions whenever an old question was answered once and then reopened.
options: a) the earliest asked: date; b) the longest unanswered since the last attempt
recommended: a) the earliest asked: date, because every question already carries it
asked: 2026-10-11 by the workshop interview
answer:

## What the scouts found

- The pre-flight card is built from the open questions of every workshop (flightdeck/hooks/preflight.mjs:1)
- Open and held questions are counted by parseQuestions, which keeps each question's text and whether it is open (flightdeck/lib/workshops.mjs:71)

## Draft card

title: Pre-flight card shows the oldest waiting question
work: Make the pre-flight card name the oldest waiting question, so the owner sees first what has waited longest.
done: The card shows the oldest waiting question's text and age on one line.
