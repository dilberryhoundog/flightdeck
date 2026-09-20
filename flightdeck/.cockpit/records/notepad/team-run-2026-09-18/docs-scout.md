# Docs-scout findings (Sonnet), 2026-09-18

- **S1** `@path` imports in CLAUDE.md load at launch (https://code.claude.com/docs/en/memory#import-additional-files). Suggests importing `pilot.md` and `commander.md`. Pilot's question: does `@` expand in a file passed by `--append-system-prompt-file`?
- **S2** Keep files under 200 lines (memory#write-effective-instructions). All session-loaded cockpit files are within it.
- **S3** The auto-memory index-plus-topic-files design (memory#how-it-works) supports the notepad-to-records pattern and `logs/index.json`. Keep indexes to one line per entry.
- **S4** Sandbox `filesystem.denyWrite` / `allowWrite` enforce write limits at the OS level for Bash and its children (sandboxing#configure-sandboxing). Suggests `denyWrite: ["."]`, `allowWrite` cockpit and dev/workspace. Pilot's question: this would deny `.git` writes and break commits and dev-workspace commands.
- **S5** Hooks enforce rules and CLAUDE.md only advises (memory). Supports S4 over adding more prose.
- **S6** The crew protocol matches documented practice (best-practices#add-an-adversarial-review-step, sub-agents). If dossiers become `.claude/agents/*.md` files, add a `tools:` allowlist per role.
