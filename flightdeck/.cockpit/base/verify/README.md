# base/verify

The cockpit's paperwork check. Every document type has a defined shape written down as a JSON Schema, so a new session writes a dossier the same way the last session wrote one, and `cockpit-lint` says whether a file has that shape.

## Run it

    base/verify/cockpit-lint <file>...

One short line when every file is clean. On a fault, one line per fault naming the file, the field, what is wrong and the form expected, so the fix is a small edit and needs no second tool call. The exit codes are flightcrew's: 0 clean, 2 a failed check, 1 a usage or environment error. It reads; it never writes.

The linter finds a file's schema by the document's own `type` (a markdown file's frontmatter) or `kind` (a JSON file), never by where the file sits, so moving a room costs the schemas nothing. It also checks the file's name: a `MANIFEST-<collection>.json` holds `kind` equal to `<collection>`, and a file named for an identifier (`Ds006.md`, `T010.json`) carries that identifier as its `unit` or `id`.

Frontmatter is read strictly and flatly. A value is a bare value (`work: M001`), a quoted string (`type: "Dossier"`) or a bracketed list (`generates: ["Rq004", "Rq005"]`). A comma list without brackets is a fault, and is reported as one.

## What is here

- `schema/<type>.json` — one schema per document type, draft 2020-12. Each carries a `title` and a `description` saying what the document is for, and a `description` on every field: read one to learn how to write that document.
- `cockpit-lint` — the linter, one Node file. No `package.json`, no install; it needs `node` on the PATH.
- `lib/schema-lib.mjs`, `lib/output.mjs` — flightcrew's own dependency-free schema engine and output writers, copied with their origin stated in their headers. The schemas use only the keywords that engine supports: `type`, `required`, `properties`, `additionalProperties`, `enum`, `const`, `pattern`, `minimum`, `maximum`, `minLength`, `minItems`, `items`, `oneOf`, `anyOf`, `$defs` with same-document `$ref`.

## Add a document type

Write one schema file in `schema/`. Nothing else changes. Its `x-select` list holds the `type` or `kind` values it answers to, which is how the linter finds it; two schemas may not claim the same value.
