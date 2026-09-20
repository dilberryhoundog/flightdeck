# base/verify

The cockpit's paperwork check. Every document type has a defined shape written down as a JSON Schema, so a new session writes a dossier the same way the last session wrote one, and `cockpit-lint` says whether a file has that shape. Run it as:

    base/verify/cockpit-lint [<file>...]    # no file named = everything lint.yaml names

One short line when every file is clean. On a fault, one line per fault naming the file, the line where there is one, the field, what is wrong and the form expected, so the fix is a small edit and needs no second tool call. The exit codes are flightcrew's: 0 clean, 2 a failed check, 1 a usage or environment error. It reads; it never writes. It finds a file's schema by the document's own `type` (a markdown file's frontmatter) or `kind` (a JSON file), never by where the file sits, so moving a room costs the schemas nothing. It also checks the file's name: a `MANIFEST-<collection>.json` holds `kind` equal to `<collection>`, and a file named for an identifier (`Ds006.md`, `T010.json`) carries that identifier as its `unit` or `id`.

## Where frontmatter goes

Frontmatter is the block between two `---` lines at the very top of a markdown file, before the title. Everything after the closing `---` is the body, which the linter does not read. A whole small dossier:

    ---
    type: "Dossier"
    unit: "Ds007"
    stamp: ["2026-09-20", "Pilot: Ace", "b27e6c01"]
    work: "M001"
    context: ["T014"]
    generates: ["Rq015"]
    ---

    # Ds007 — What the refit found

It is read strictly and flatly. A value is a bare value (`work: M001`), a quoted string (`type: "Dossier"`) or a bracketed list (`generates: ["Rq004", "Rq005"]`). A bare `true`, `false` or number is that value, as it would be in JSON; quote it to mean the word or the digits. A comma list without brackets is a fault, and is reported as one.

## What is here

- `schema/<type>.json` — one schema per document type, draft 2020-12. Each carries a `title` and a `description` saying what the document is for, and a `description` on every field: read one to learn how to write that document. A manifest and a register are not the same thing: a manifest's rows point at units you can open, a register lists things that live outside the cockpit's files, such as git branches, so its rows carry no path.
- `cockpit-lint` — the linter, one Node file. No `package.json`, no install; it needs `node` on the PATH.
- `lint.yaml` — the globs a whole-cockpit run covers, and the only file here that names cockpit paths, so a room move means editing this one file. A file no glob names is skipped, which is why `CLAUDE.md`, the READMEs, `triggers.md`, the session logs and the notepad are not linted; a glob starting with `!` takes files back out.
- `lib/schema-lib.mjs`, `lib/output.mjs` — flightcrew's own dependency-free schema engine and output writers, copied with their origin stated in their headers. The schemas use only the keywords that engine supports: `type`, `required`, `properties`, `additionalProperties`, `enum`, `const`, `pattern`, `minimum`, `maximum`, `minLength`, `minItems`, `items`, `oneOf`, `anyOf`, `$defs` with same-document `$ref`.

## Add a document type, or a collection

A new document type is one schema file in `schema/`, and nothing else — except a glob in `lint.yaml` if a whole run should cover it. Its `x-select` list holds the `type` or `kind` values it answers to, which is how the linter finds it; two schemas may not claim the same value. A new manifest collection is no schema at all: `manifest.json` carries `x-select-filename` and so answers to any `MANIFEST-<collection>.json` whose `kind` matches its name. A schema that rules the document as a whole, with a top-level `anyOf`, also carries a one-clause `x-expect`, which the fault line quotes in place of the schema's whole description.
