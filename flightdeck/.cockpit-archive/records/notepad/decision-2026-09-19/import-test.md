# @ import live test — 2026-09-19, session 4450a586, CLI 2.1.275

Scratch. Fixture: `sub/CLAUDE.md` imports `@proc/triggers.md`, which imports `@deeper.md`; each imported file holds a codeword. Two `claude -p` runs on Sonnet.

- Nested case (cwd is the parent, the model reads `sub/note.txt`): `sub/CLAUDE.md` loaded on the read, and both imported files arrived with it as instruction blocks. Both codewords reported without a tool opening either file.
- Working-directory case (cwd is `sub`, no tools): both codewords present at session start.
- Relative paths resolved from the importing file in both hops, as the memory docs state (code.claude.com/docs/en/memory: relative to the importing file, four hops maximum).

So a trigger manifest imported into the cockpit `CLAUDE.md` loads whether the pilot starts in the cockpit or arrives by reading a file there. Not tested: the external-import approval dialog, imports inside code spans, a fifth hop.
