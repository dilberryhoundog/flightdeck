# Example: what activating a workshop writes

This is an example, not real work. It shows the four files that `/flight:workshop card-oldest-question` writes for a workshop captured as `- card-oldest-question: the pre-flight card lists the oldest waiting question first (2026-10-11)`. The owner answered q1 and q3, skipped q2, and added one note.

## questions.md

The answered bundle, filed word for word. q2 was skipped, so its `answer:` line stays empty and the question stays open.

```
# Questions for workshop card-oldest-question

An open question is one whose `answer:` line is empty; agents ask here when they need you, and you answer by filling in that line.

Other notes (2026-10-11): keep the card short

## q1: What should the card show for the oldest waiting question: its text, its age or both?
why: The card has one line per workshop, so the answer decides how much fits on that line.
options: a) its text; b) its age in days; c) both on one line
recommended: c) both on one line, because the text says what it is and the age says how long it has waited
asked: 2026-10-11 by the workshop interview
answer: c | note: one line is enough

## q2: Should questions held to ask later count as waiting?
why: The card counts held questions separately today, so counting them would change that number.
options: a) no, as today; b) yes
recommended: a) no, as today, because a held question was put off on purpose
asked: 2026-10-11 by the workshop interview
answer:

## q3: The weakest part of this ask is that oldest is not defined: should it mean the earliest asked: date or the longest unanswered?
why: Without one meaning, two agents will build two different cards and neither is wrong.
options: a) earliest asked: date; b) longest unanswered since the last attempt
recommended: a) earliest asked: date, because every question already carries that date
asked: 2026-10-11 by the workshop interview
answer: a
```

## workshop.md

The card. The owner's answers wrote the `work:` and `done:` lines.

```
# Pre-flight card shows the oldest waiting question

work: The pre-flight card (the short summary the pilot shows at the start of a session) lists each workshop with its count of open questions. It should also show the oldest waiting question, meaning the one with the earliest asked: date, as its text and its age on one line.
done: Each active workshop's line on the pre-flight card ends with its oldest waiting question and how many days it has waited, and the card stays within its size limit.

<!-- Only the owner settles a workshop. To settle it, add a line of its own at the end of this file: settled: <YYYY-MM-DD> (the date it was settled). Leave it out while the work is still going. There is no status field; the folder and that line are the status. -->
```

## context.md

What agents working in this workshop are told. Every line comes from what the scouts found or what an answer settled, with its `path:line` where it has one.

```
# Context for workshop card-oldest-question

The card is built by `buildCard` in `flightdeck/hooks/preflight.mjs:47`, and each workshop's line is made by `workshopLine` in `flightdeck/hooks/preflight.mjs:34`.

Questions are read by `parseQuestions` in `flightdeck/lib/workshops.mjs:71`. It counts a question as open while its `answer:` line is empty, and does not count one that has an `ask-later:` line.

Oldest means the earliest `asked:` date (the owner's answer to q3). Questions held with `ask-later:` do not count as waiting (the owner skipped q2, so today's behaviour stays until it is answered).
```

## verify.md

How to tell the work is right. The check is a command that already exists in the repository; the questions are worded so that yes means pass.

```
# Verification for workshop card-oldest-question

How to tell this work is right. Checks a script can run come first.

## checks

<!-- Format of one check: - `<command>`: <what passing looks like>. The command is the first thing in backticks on the line. -->

- `node --test 'flightdeck/tests/*.test.mjs'`: exits 0

## questions

<!-- Format of one question: - <a question where yes means pass>. A reviewer, adversary or imposter answers each one yes or no. -->

- Does the card show the oldest waiting question's text and age on one line?
- Is the oldest question the one with the earliest asked: date?
- Does the card still fit its size limit with several active workshops?
```

## Why each file looks as it does

`questions.md` keeps the owner's answers word for word and keeps the skipped question open, so nothing is guessed. `workshop.md` holds only what the work is and what done looks like, in plain words. `context.md` holds facts with pointers so agents do not search for them again. `verify.md` lists only a check that really exists, and asks its questions so that a plain yes means the work is right. There is no `constraints.md` because that file holds only the owner's own typed words, and the owner has not written any yet.
