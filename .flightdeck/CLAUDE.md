# Workshop rules

These rules load when you touch a file under `.flightdeck/`. They add to the root `CLAUDE.md`.

## Lifecycle

Capture: add one line to `workshops.md`. Anyone may capture, including agents. Activate: create the workshop's folder from the templates in `flightdeck/templates/workshop/`. Settle: add `settled: <YYYY-MM-DD>` on its own line in the card. Promote: move a workshop's result into the plugin. Only the owner activates, settles or promotes a workshop. Agents never do these on their own.

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

Questions go in `questions.md` in the template's format: `## q<n>: <question>` with `why:`, `options:`, `recommended:`, `asked:`, optional `ask-later:` and an empty `answer:`. A question is open while `answer:` is empty. Never guess an answer.

Every decision in `decisions.md` carries a reason: `- <YYYY-MM-DD>: <decision>. Reason: <one line>.`

Attempt output stays in its attempt folder. An attempt is any folder named `a<k>` under `attempts/`.

## State is derived

State is never written as a status. A line with no folder is captured. A folder is active. A card with a `settled:` line is settled.
