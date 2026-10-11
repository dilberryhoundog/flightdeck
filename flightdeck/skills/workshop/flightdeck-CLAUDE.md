# Workshop rules

These rules load when you touch a file under `.flightdeck/`. They add to the root `CLAUDE.md`. Copy this file to `.flightdeck/CLAUDE.md` in a project that uses FlightDeck.

A workshop is one piece of work FlightDeck keeps track of, from a one-line idea to a folder with its own context and checks.

## Lifecycle

Capture: add one line to `workshops.md`. Anyone may capture, including agents. Activate: create the workshop's folder from the templates in the FlightDeck plugin, `templates/workshop/`. Settle: add `settled: <YYYY-MM-DD>` on its own line in the card. Promote: lift what deserves it (decisions, context lines, checks) into the global rules, such as the root `CLAUDE.md`. Only the owner activates, settles or promotes a workshop. Agents never do these on their own.

## Commands

The owner runs these; the model cannot start them.

- `/flight:capture <goal>` adds one line to `workshops.md` and makes no folder.
- `/flight:workshop <name or rough ask>` activates a workshop with a short interview of at most five questions, then writes its folder.
- `/flight:retry <workshop>` opens the next attempt folder, with the change named at the top of its brief and the last attempt's findings attached.
- Settle by writing `settled: <YYYY-MM-DD>` as the last line of the card, or tell the pilot "settle <name>".
- `/flight:promote <workshop>` proposes lasting lines from a settled workshop as a draft pull request; add `dry-run` to see it without pushing.

## The list

`workshops.md` has no frontmatter. Each workshop is one line: `- <name>: <the ask in the words it was given> (<YYYY-MM-DD>)`. Names are lowercase letters, digits and hyphens.

Parse rule: only lines starting with `- ` count. The name is the text before the first `: `. The date is the last `(YYYY-MM-DD)` at the end of the line. Everything between is the ask, and it may contain `:`, `|` or brackets. HTML comments and fenced code blocks are ignored.

## The files of a workshop

- `workshop.md`: the card (title, `work:`, `done:`, optional `settled:`). Agents write it on the base branch.
- `constraints.md`: the owner's truth. Only words the owner typed go in. Agents never write it.
- `context.md` and `verify.md`: agents write them, on the base branch only. An attempt never edits them; it proposes a change as a `context:` or `verify:` line in its report.
- `questions.md` and `decisions.md`: agents write them, in the template formats.
- `attempts/`: attempt folders. Only the attempt writes in its own folder.

## Working in a workshop

Read the workshop's `constraints.md`, `context.md` and `verify.md` first, in addition to the global rules. Never edit another workshop.

Questions go in `questions.md` in the template's format: `## q<n>: <question>` with `why:`, `options:`, `recommended:`, `asked:`, optional `ask-later:` and an empty `answer:`. A question is open while `answer:` is empty. Never guess an answer. Never ask the owner to approve text an agent wrote.

Every decision in `decisions.md` carries a reason: `- <YYYY-MM-DD>: <decision>. Reason: <one line>.`

Attempt output stays in its attempt folder. An attempt is any folder named `a<k>` under `attempts/`.

## State is derived

State is never written as a status. A line with no folder is captured. A folder is active. A card with a `settled:` line is settled.
