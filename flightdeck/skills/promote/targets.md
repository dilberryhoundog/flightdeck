# Where promoted lines go

This file is read by `/flight:promote` and by the drafter it sends. Promotion lifts a settled workshop's lasting lines into the global files every agent reads. A promotion writes lines, never code.

## What deserves promotion

A line deserves promotion when it is still true after the workshop is settled, would change how agents work elsewhere in the project, and is not already said in the target file. Facts that only matter inside the workshop stay in the workshop.

## Where each kind goes in FlightDeck's own repository

FlightDeck's own repository is the one that holds `flightdeck/.claude-plugin/plugin.json`.

- Decisions go under `## Decisions` in the root `CLAUDE.md`, which every agent always loads. The first promotion of a decision adds that heading at the end of the file, which is expected and not a last resort.
- Context lines go to the root `CLAUDE.md` under the existing heading that fits. When they are about workshop files and folders, they go to `.flightdeck/CLAUDE.md` instead.
- Verification questions go to `flightdeck/rubric.md`, under the heading that fits. The default is `## Owner fit`.
- Verification checks that a script can already run go to the `## Checks` list in the root `CLAUDE.md`. The scripts themselves live in `lab/checks/`.
- A check that needs a new script under `lab/checks/` is a capture line (one new line in `.flightdeck/workshops.md` for later work), not an edit, because a promotion writes lines, not code.
- Once the manuals pull request (PR 7) is merged, operator, technical or maintenance knowledge goes to the page that fits under `flightdeck/manuals/`.

## Where each kind goes in any other project

Decisions go under `## Decisions` in that project's root `CLAUDE.md`, and the first one adds that heading at the end, which is expected. Every other promoted line goes to that project's root `CLAUDE.md` under the existing heading that fits, or to its `.flightdeck/CLAUDE.md`. The plugin's own rubric is not the project's to edit.

## The smallest edit

One line under a heading that already exists, copied word for word, with ` (from workshop <name>)` added at the end. A new heading is a last resort, except `## Decisions`, which the first promoted decision adds.

## Forbidden targets

Only `.md` files can be targets. Never anything under `.claude/`, `dev/`, `.git/`, `library/source/` or any `.claude-plugin/` folder. Never `INTENT.md` or `HISTORY.md`, never a `constraints.md`, and never `.flightdeck/VISION.md` or `.flightdeck/build.txt`. Never a file whose frontmatter (the settings block between `---` lines at the top of a file) says `write: "human"`. These are the owner's, or another tool's. The promotion script refuses all of them and ignores capital letters when it compares names.

## The correction ladder

When the owner corrects an agent, the lesson climbs one step each time it repeats. A correction that recurs becomes a rule line, which is a promotion. A rule that keeps being broken becomes a hook, a small script that checks the rule automatically. A hook is new code, so it is captured as a line for the owner to start, never written in a promotion.
