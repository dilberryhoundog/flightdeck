---
name: board
description: "Shows the flight board: one local page with every workshop, the work waiting to start and the questions waiting on the owner, with answer boxes, a Copy my answers button and a prompt builder. Also files a pasted 'FlightDeck answers for workshop' block into that workshop's questions.md."
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/render.mjs *), Read, Edit
---

# Flight board

The board is one page made from the files in `.flightdeck/`. It shows every workshop (a piece of work with its own folder of notes, checks and attempts), the work waiting to start, and the questions waiting on the owner. The owner answers there and pastes the result back into chat.

## Show the board

Run `node ${CLAUDE_SKILL_DIR}/render.mjs --root "${CLAUDE_PROJECT_DIR}"`. Then tell the owner, in at most three lines:

1. The page's path and its `file://` link, as the command printed them.
2. The summary line (workshops, work waiting to start, questions waiting).
3. The pull request line, only if pull requests are not shown.

Do not open a browser. Do not read the page back into chat. The page is not kept in git. To refresh it, run the command again and reload the page.

## File answers pasted back

The owner pastes a block whose first line is `FlightDeck answers for workshop <name>: file these into .flightdeck/<name>/questions.md`. File it like this.

1. Open `.flightdeck/<name>/questions.md`. If the file or a named question is missing, say so and file nothing for that question.
2. For each line `q<n>: <value>` whose value is not `(unanswered)`, set that question's `answer:` line to `answer: <value>`, copied exactly as pasted. Use the Edit tool and change no other line. Leave `ask-later:` as it is: an answered question is no longer open or held.
3. If that `answer:` line already holds text, do not overwrite it. Show both answers and ask the owner which to keep.
4. Skip `(unanswered)` lines. Those questions stay open. Never guess an answer.
5. A line `Other notes:` that is not `(none)` is the owner's own message. Act on it like any message. Do not write it into any file unless it asks you to.
6. Render the board again, then say in one line what was filed and where.

## Example board

To see the board without touching real work, run `node ${CLAUDE_SKILL_DIR}/render.mjs --root ${CLAUDE_SKILL_DIR}/tests/fixtures --no-gh --out board.html`. This renders the example project that ships with this skill. Write the page to a file in the current folder (such as `board.html`), never inside the plugin folder.
