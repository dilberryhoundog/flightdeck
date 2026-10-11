# The activation interview: rules for the bundle

When the owner activates a workshop, FlightDeck asks a few questions before it writes the workshop's folder. The questions are collected in one file, the bundle, which is `.flightdeck/<name>.activate.md`. While that file exists the workshop is still only captured (a line in `workshops.md`, no folder).

## What a bundle holds

A bundle has at most five questions, asked once, in one go. Fewer is better. If three questions are enough, ask three.

Each question is about the owner's own ideas: what done looks like to them, what matters most, what to leave out, what they would hate, their taste. These are things only the owner knows.

Exactly one question is the adversary's challenge. The adversary is an agent that attacks the ask to find its weakest part. Its question is worded "The weakest part of this ask is X: what should we do about it?" and comes with its options.

## The format of one question

Every question is a block in this shape (the same shape as `questions.md`):

```
## q<n>: <the question, in plain words>
why: <one line on why the answer matters>
options: a) <text>; b) <text>; c) <text>
recommended: <letter>) <the option and a one-line reason>
asked: <YYYY-MM-DD> by the workshop interview
answer:
```

Give two to four lettered options. Name a recommended answer every time, with its reason, so the owner can accept it with one choice. Number the questions q1, q2, q3 in order with no gaps. Leave `answer:` empty.

## The whole file

In order: the title `# Activation questions for workshop <name>`; the line `The ask: <the manifest ask> (<date>)`; one line telling the owner how to answer; the question blocks; then `## What the scouts found`, one line each with its `path:line`; then `## Draft card` with `title:`, `work:` and `done:` lines. Only the question blocks are kept at activation, in `questions.md`. The scouts' findings go into `context.md`, the draft card goes into `workshop.md`, and the bundle file is removed.

## What never to ask

- Never ask the owner to approve, confirm or review text an agent wrote. No "does this look right", "approve this draft", "is this card OK". The owner's answers are the source of the card, so the card is not put up for a yes.
- Never ask what a scout could find in the repository: where the code lives, which tests exist, how a page is built. The scouts look first, and what they find is written straight into the draft.
- Never ask for a rule the project's `CLAUDE.md`, `.flightdeck/VISION.md` or `.flightdeck/build.txt` already settles.
- Never ask more than five questions, and never ask the same thing twice in different words.

## A skipped answer stays open

If the owner skips a question, closes the box or does not reply to it, its `answer:` line stays empty. It is never guessed and never filled in with the recommended option. Skipped questions are filed in `questions.md` and counted on the pre-flight card as waiting questions, so the owner can answer them later.

## How answers become files

- The answer about what done looks like becomes the card's `done:` line, and yes-is-pass questions in `verify.md` (a question where yes means the work is right).
- Checks that a script can run come first in `verify.md`, only if they really exist in the repository.
- Facts the answers settle, and what the scouts found, become lines in `context.md`, each with its `path:line` where it has one.
- The answered bundle blocks become `questions.md`, word for word.
- Nothing from an answer goes into `constraints.md`. That file holds only words the owner typed there. If the owner asks for their own words to be filed there, they are filed word for word.

## Live mode and file mode

Live mode: the session has a question box (the AskUserQuestion tool) and the owner did not ask for a file. Ask the questions in the box, at most four at a time (five questions take two rounds), with the recommended option first and marked "(Recommended)". Then turn the answers into the reply block below and file it.

File mode: the session has no question box (for example `claude -p`), or the owner asked for the questions in a file. Print the whole bundle in the reply, explain how to answer, and stop. The workshop stays captured. The owner answers by filling in the `answer:` lines of the file, or by pasting the reply block back with `/flight:workshop <name>`.

## The reply block

The first line names the workshop. Then one line per question, then one line for any other notes:

```
FlightDeck answers for workshop <name>: file these into .flightdeck/<name>/questions.md
q1: <option letter or your own words> | note: <text>
q2: (unanswered)
Other notes: <text>
```

Write `(unanswered)` for a question being skipped. The `| note:` part is optional. Write `Other notes: none` when there is nothing to add.
