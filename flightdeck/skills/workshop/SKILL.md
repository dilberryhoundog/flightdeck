---
name: workshop
description: "Activates a captured workshop, or captures and activates a new rough ask. Cheap scouts read the code first, so you are asked at most five questions, only about your own ideas. Then it writes the workshop's folder: card, context and checks. Only you start it: /flight:workshop <name or rough ask>."
argument-hint: "<name or rough ask>"
disable-model-invocation: true
allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs *), Bash(node ${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs *), Read, Grep, Glob, Edit(.flightdeck/**), Agent, AskUserQuestion
---

# Workshop

A workshop is one piece of work FlightDeck keeps track of. Activating it turns its one line in `.flightdeck/workshops.md` into a folder in `.flightdeck/<name>/` holding the card (what the work is and what done looks like), `context.md` (what agents working there are told), `verify.md` (how to tell the work is right) and `questions.md` (your answers to the interview).

Three plain lines on how it goes. Two cheap scouts (Haiku agents that only read) look at the code first. One adversary (an agent that attacks the ask to find its weakest part) picks the one question that matters most. You answer at most five questions about your own ideas, and the folder is written from your answers.

Only the owner activates a workshop (decision D1). You are the Captain of this session; every agent you send is a Worker. The rules for the questions are in `${CLAUDE_PLUGIN_ROOT}/skills/workshop/interview.md`: read that file before step 4. One worked example is in `${CLAUDE_PLUGIN_ROOT}/skills/workshop/examples/card.md`.

The argument the owner typed is: `$ARGUMENTS`. Every script call below is `node ${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs <subcommand> ...`; it does the file work and is tested, so use it instead of editing the list or the folder by hand.

## Step 1: resolve the argument

Run `node ${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs list --json`. Route on the first line of the argument.

- Its first word (`$0`) is a listed name that is captured and has a file `.flightdeck/<name>.activate.md` waiting: questions were already asked. Go to step 5, and treat the rest of `$ARGUMENTS` (a block starting "FlightDeck answers for workshop <name>") as the reply block. With nothing after the name, step 5 finds no answers and shows the pending bundle again.
- Captured with no such file: go to step 2.
- Active (it already has a folder): say "already active", give the path of its card `.flightdeck/<name>/workshop.md`, suggest `/flight:retry <name>`, and stop.
- Settled: say it is settled and stop.
- Treat the argument as a rough ask only when `$0` is not a listed name. Capture it first exactly as the capture skill does: a name of two to four words (`scaffold.mjs name <ask>` picks one), then `scaffold.mjs capture <name> '<ask>'` with the owner's words unchanged (when the ask holds a single quote, use `capture <name> --ask -` and pass the ask on standard input). Say so in one line ("Captured as <name>."), then go to step 2.
- No argument: ask which workshop (list the captured ones). With no person present, list the captured entries and stop.

## Step 2: two scouts read first

Send two `flight:scout` agents at the same time (their own model is Haiku, the cheap reader). There is no workshop folder yet, so they get no workshop block. Each opening text is, in this order: the global rules block, the scout seat text below (its `Rank:` line first), then the capture line, then the task.

The global rules block, to paste:

`Binding documents, read first: .flightdeck/VISION.md, .flightdeck/build.txt and, for a workshop, its constraints.md; the newest lines win. Hard rules: never push to main or master, never force-push, never delete a branch, never merge a pull request, never write the owner's files. Ceiling: nothing above Opus at high effort. Writing: one paragraph per line, plain words.`

The scout seat text (it is the `## scout` section of `${CLAUDE_PLUGIN_ROOT}/skills/team-plans/entry-points.md`, without its workshop-block line because there is no folder yet):

`Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: where to look and how to read. You do not decide: the question, its scope or what is done with the answer; you change no files and send out no agents.`

`Work outside your brief: report it as a capture line; do not do it.`

`Task: answer one question. Ignore flightdeck/skills/workshop/examples/ and flightdeck/skills/workshop/tests/fixtures/ (made-up examples, not the project's state).`

`Question: <one narrow question>`

`Look in: <paths or areas, or "search the repository">`

`Return: a short answer of at most a screenful, then a Pointers list with one path:line for every claim, each marked certain, probable or guess. "Not found" is a complete answer when every named path was searched.`

The capture line is the manifest line, `- <name>: <the ask> (<date>)`. The two questions, each followed by the ask:

- Scout 1: "Where in this repository does this work live: the files, functions and pages it would touch? Give path:line for each." Look in: "search the repository".
- Scout 2: "How is this kind of change checked here today: tests, check scripts and commands that exist? Give path:line for each." Look in: "search the repository".

Whatever the scouts find goes straight into the draft (step 4) as scout findings. It is never asked of the owner.

## Step 3: the weakest-part challenge

Send one `flight:adversary` agent (its own model is Opus at high effort). Opening text, in order: the global rules block, the adversary seat text below, then the task.

`Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: which findings to raise, their severity and confidence, and when to withdraw one. You do not decide: whether a finding is accepted, the criteria or truth; you change no files.`

`Work outside your brief: report it as a capture line; do not do it.`

`Task: cold mode. You get the finished work and its sources only, never the history of how it was made. Attack it once, from the criteria, and return.`

Under `=== The Work ===` put the manifest line and both scouts' answers inline (there is no diff file). Under `=== The Criteria ===` put: `.flightdeck/VISION.md` and `.flightdeck/build.txt` when they exist; the project's `CLAUDE.md`; and "the ask must be doable, checkable and in the owner's own terms".

Then end with this return line in place of the usual one: "Return exactly one challenge, in the form 'The weakest part of this ask is <X>: what should we do about it?', with two or three lettered options and the one you recommend, with a reason."

## Step 4: write the bundle, then ask

Follow `${CLAUDE_PLUGIN_ROOT}/skills/workshop/interview.md`. Write the bundle with the Write tool to `.flightdeck/<name>.activate.md`: the questions (at most five, one of them the adversary's challenge), then `## What the scouts found`, then `## Draft card`. Then run `scaffold.mjs check-bundle .flightdeck/<name>.activate.md` and fix the bundle until every case passes.

Then choose the mode.

- Live mode, when the question tool (AskUserQuestion) is available and the owner did not ask for a file: ask the questions with it, at most four per call (so five questions take two calls), the recommended option first and marked "(Recommended)". A question the owner skips, dismisses or that closes on a timeout stays unanswered and is never guessed. Then build a paste-back block from the answers (the format is in `interview.md`) and go to step 5.
- File mode, when the question tool is not available (for example `claude -p`) or the owner asked for the questions in a file: print the whole bundle in the reply, say "Answer by filling in the answer: lines in .flightdeck/<name>.activate.md, or paste a reply block with /flight:workshop <name>", show the reply block format, and stop. The workshop stays captured.

If the files cannot be written or the script cannot run in this session, print the bundle anyway and say plainly that nothing was written. Never claim a file exists that was not written.

## Step 5: file the answers

When a reply block came in (this turn, or pasted after the slash command), write it with the Write tool to `.flightdeck/<name>.answers.txt` and run `scaffold.mjs answer <name> --from .flightdeck/<name>.answers.txt`. When the owner filled in the `answer:` lines of the file by hand, skip this step. If there are no answers at all yet, show the pending bundle again and stop.

## Step 6: write the folder

Read the answered `.flightdeck/<name>.activate.md`: the questions, the scouts' findings and the draft card. Compose the spec, a JSON object:

- `title`: short and plain.
- `work`: at most two plain sentences: the ask in plain words and what the answers settled in it. Do not repeat the answers; they live in `questions.md`.
- `done`: one line, from the answers.
- `context`: the scouts' findings and the facts the answers settled, one line each, with its `path:line` where it has one, at most about 40 lines.
- `checks`: a list of `{"command": ..., "passing": ...}`. Only commands that exist in this repository and that a script can run, taken from scout 2 and the done line, each with what passing looks like. None when none exist. Never invent a command.
- `questions`: yes-is-pass questions from the done line and the answers (a question where yes means the work is right). Never add one that asks whether an open question was left undecided.

Write it with the Write tool to `.flightdeck/<name>.spec.json`, then run `scaffold.mjs activate <name> --spec .flightdeck/<name>.spec.json --questions-from .flightdeck/<name>.activate.md`. The script makes `workshop.md`, `context.md`, `verify.md` and `questions.md`, and removes the bundle file and the spec file.

Never write `constraints.md`. Only words the owner typed go there. Never draft truth lines for the owner to accept.

## Step 7: report in plain words

One paragraph per line. Say: the files written; how many questions are still open (skipped ones wait in `questions.md`); "Nothing is committed; commit when you want to keep it."; how to add truth (create `.flightdeck/<name>/constraints.md` with one dated line in the owner's own words); how to retry (`/flight:retry <name>`); and how to settle (write `settled: <YYYY-MM-DD>` as the last line of `workshop.md`, or tell the pilot "settle <name>").

If the project has no `.flightdeck/CLAUDE.md` (a project other than FlightDeck's own), ask once whether to copy the workshop rules from `${CLAUDE_PLUGIN_ROOT}/skills/workshop/flightdeck-CLAUDE.md` into `.flightdeck/CLAUDE.md`, and copy only on yes. With no person present, mention it in one line instead.

## Never

Ask the owner to approve, confirm or review text an agent wrote. Ask what a scout could find. Ask more than five questions. Activate anything the owner did not name. Commit. Push.
