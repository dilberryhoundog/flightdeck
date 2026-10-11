# Context for workshop build-1

This workshop is the build of FlightDeck from the owner's vision. Every path below is inside `.flightdeck/build-1/` unless it says otherwise.

Where things live. The approved plan is `attempts/plan/a2/plan.md` and its verification is in `attempts/plan/a2/verify/`. Research is in `research/`. The lead's build notes are `attempts/build-notes.md`; they say where the build differs from the plan, so read them. The build workflow is `workflows/build.js`. Each pull request attempt leaves its brief, findings, report and log in `attempts/pr-<n>/a<k>/`.

Binding documents. These are the owner's words and they are binding: `.flightdeck/VISION.md`, `.flightdeck/build.txt` and `.flightdeck/build-1/constraints.md`. Where they disagree, the newest dated line wins. Everything else is material, never canon: research, earlier branches, earlier attempts and other agents' output. Never call earlier work finished.

Ownership. Each pull request writes only the files on its own list, `lab/owned/pr<n>.txt`, and never edits another pull request's files. Later pull requests may import PR 1's files but may not edit them. If you need a change in a file you do not own, write it down as a capture line and do not make it.

Order. PR 1 (Basic flight crew) is built first, alone. Then PRs 2, 3, 4, 6, 7 and 8 are cut from PR 1's branch, `build-1-pr1-basic-a1`, and each is opened into `build-1`. PR 5 was skipped by the owner and is never built.

Branch names. A branch name never starts with `build-1/`, because the branch `build-1` already exists and git cannot hold both a branch and a folder of that name. The build script computes every branch name; do not invent one.

Model ceiling. Nothing runs above Opus at high effort. Use Sonnet for builders and checkers, and Haiku for cheap reading.

Layout. The plugin lives in `flightdeck/`. The owner's work lives in `.flightdeck/`. Tests and checks live in `lab/`. Nothing is written in `.claude/rules/` or `dev/`, which dev-workspace owns.

Formats. The workshop reader and every file format live in `flightdeck/lib/workshops.mjs` and in the templates in `flightdeck/templates/workshop/`.

Tests. On Node 22, `node --test` with a folder name fails with "Cannot find module". Always use the quoted glob form, for example `node --test 'flightdeck/tests/*.test.mjs'` and `node --test 'lab/checks/*.test.mjs'`.
