# export-html sample project
A small fictional project used as a fixture by the flightdeck testbench and the orchestration manuals: `src/export/index.mjs` exports `exportProject(project, { inlineAssets })`, which turns a project object into one self-contained HTML document and returns `{ html, warnings }`.
Its checks live in `tests/export/` (behaviour, edge and contract tests named by spec id) and `scripts/` (the acceptance smoke and the invariants scan); the reference input is `tests/export/fixtures/reference-project.json`.
Run `node --test` (which finds every `tests/export/*.test.mjs`) and `node scripts/export-smoke.mjs` from this directory; both exit 0 because the implementation is complete.
The spec and tests map this project answers to are the sample spec fixture beside it, which sits at `flightdeck/launch/specs/export-html/` once the project is placed in a repository.
