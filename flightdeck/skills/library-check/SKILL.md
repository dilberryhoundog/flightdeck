---
name: library-check
description: "Lists manual and library pages that are stale (checked more than 30 days ago, or a cited source changed in git since) and has the librarian re-check each one against its sources. Owner-started: /flight:library-check."
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(node ${CLAUDE_PLUGIN_ROOT}/skills/library-check/stale.mjs*), Bash(git status*), Bash(git log *)
---

# Library check

Find the manual and library pages that may be out of date and have the librarian re-check them. You are the Captain in this run. Plain words, one line per item, no tables. Never ask the owner to approve an edit.

## Steps

1. Run `node "${CLAUDE_PLUGIN_ROOT}/skills/library-check/stale.mjs" --json`. The script lists stale pages without using any agent. Its options are `--days <n>` (default 30), `--today <YYYY-MM-DD>` and `--project <dir>` (default the current folder).
2. If the `stale` list is empty, say "<pages> pages, none stale." with the page count from the output, and stop. This costs no agents.
3. Take at most 10 stale pages in this run, and say how many are left. For each one, send `flight:librarian`, up to five at a time, with this opening text in this order.
   - The global rules: `Binding documents, read first: .flightdeck/VISION.md, .flightdeck/build.txt and, for a workshop, its constraints.md; the newest lines win. Hard rules: never push to main or master, never force-push, never delete a branch, never merge a pull request, never write the owner's files. Ceiling: nothing above Opus at high effort. Writing: one paragraph per line, plain words.`
   - The rank line: `Rank: Worker. Reports to: the Captain (the session that ran /flight:library-check). You decide: whether each claim still holds, with evidence. You do not decide: scope, done, verification or truth; you change no files and you send out no agents.`
   - The capture line: `Work outside your brief: report it as a capture line; do not do it.`
   - The task: the plugin root is `${CLAUDE_PLUGIN_ROOT}`; the page path; the reasons the script gave for it being stale; and "re-check this page as your Re-checking a page section says".
4. For a page inside the current project, apply each proposed edit that has a source `path:line`, then set its `checked:` line to today's date. A page whose claims all still hold gets only the new `checked:` date. A claim marked "cannot tell" is left as it is and listed for the owner. For a page outside the project (an installed plugin's own folder), apply nothing and report what the librarian found.
5. Do not commit. End with one line per page: the page, then "still true", or "edited (<n> lines)", or "needs the owner (<why>)". Then write "Nothing is committed: see git status."
