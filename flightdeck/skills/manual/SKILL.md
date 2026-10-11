---
name: manual
description: "Drafts one manual page from a workshop's files (card, context, checks, decisions, latest report) with the librarian and files it on the right shelf (operator, technical or maintenance). Owner-started: /flight:manual <workshop>."
disable-model-invocation: true
argument-hint: <workshop>
allowed-tools: Read, Glob, Grep, Write, Edit, Bash(node ${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs *), Bash(node lab/checks/manuals.mjs*), Bash(git status*), Bash(git log *)
---

# Manual

Draft one manual page from a workshop's files and file it on the right shelf. You are the Captain in this run: the librarian drafts, you write the file. Plain words, one line per item, no tables. Never ask the owner to approve the text; the owner sees the page with `git status` and keeps it or deletes it.

## Steps

1. The workshop name is the argument: `$ARGUMENTS`. If there is none, list the folders in `.flightdeck/` that hold a `workshop.md` (the active workshops), one per line, and stop.
2. If `.flightdeck/<name>/workshop.md` does not exist, say "<name> is not active, so it has no files to write a manual from" and stop. If the card has no `settled:` line, say in one line "<name> is not settled yet, so this page describes work in progress", and carry on.
3. Get the workshop block: `node "${CLAUDE_PLUGIN_ROOT}/lib/workshops.mjs" scope <name>`.
4. Send `flight:librarian` with this opening text, in this order.
   - The global rules: `Binding documents, read first: .flightdeck/VISION.md, .flightdeck/build.txt and, for a workshop, its constraints.md; the newest lines win. Hard rules: never push to main or master, never force-push, never delete a branch, never merge a pull request, never write the owner's files. Ceiling: nothing above Opus at high effort. Writing: one paragraph per line, plain words.`
   - The rank line: `Rank: Worker. Reports to: the Captain (the session that ran /flight:manual). You decide: the shelf, the page name and the wording, inside the page rules. You do not decide: scope, done, verification or truth; you change no files and you send out no agents.`
   - The workshop block from step 3.
   - The capture line: `Work outside your brief: report it as a capture line; do not do it.`
   - The task: the plugin root is `${CLAUDE_PLUGIN_ROOT}`. Read the workshop's card, `context.md`, `verify.md`, `decisions.md` and its latest attempt's `report.md` if there is one. Check the corpus first. If a page on this topic exists, propose an edit to it instead of a new page. Otherwise draft one page for the shelf that fits: operator (how to use it), technical (how it works) or maintenance (how to change and test it). Return the shelf, the file name (lowercase words joined by hyphens, ending `.md`) and the full page text with its header: `shelf:`, `sources:` (the workshop files and the code the page describes, each a real path) and `checked:` set to today. The page describes the current form only, one paragraph per line, about 100 lines at most. On operator pages, put file paths in `sources:` and keep at most one `path:line` per paragraph.
5. Choose the shelf root. If the project has `flightdeck/.claude-plugin/plugin.json`, it is `flightdeck/manuals/`. Otherwise it is `.flightdeck/manuals/`. Write the page to `<shelf root>/<shelf>/<file>`, or apply the proposed edit. If the page is new, add one index line `- [<title>](<shelf>/<file>): <one line>` under the matching heading (`## Operator`, `## Technical` or `## Maintenance`) of `<shelf root>/README.md`. If that README does not exist, create it with `shelf: index` in its header, a `sources:` list, today's `checked:` date, a title, one summary line and the three headings. Write only the page and, for a new page, its index line. Capture lines go in your reply, never into `.flightdeck/workshops.md` or any other file.
6. If `lab/checks/manuals.mjs` exists in the project, run `node lab/checks/manuals.mjs`. Fix any failure in the new or edited page only.
7. Do not commit. End with the page path, its shelf, one line on what it covers, and "Nothing is committed: keep it with git, or delete the file."
