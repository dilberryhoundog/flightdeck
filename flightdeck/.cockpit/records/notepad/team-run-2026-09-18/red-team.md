# Red-team verdicts (Sonnet adversary), 2026-09-18

Received in two parts (idle result truncated at A12, remainder resent). S = auditor severity, C = red-team confidence.

## Auditor

- **A1** stands (C-H). Duplicate-pilot grep never matches. Pilot confirmed.
- **A2** stands, weakened on novelty (C-H). False positives already known and worked around. Undocumented bypasses matter most: `git rm/mv/checkout`, env-prefixed commands, `find -delete`, `xargs rm`, fail-open on non-dict `tool_input`. Pilot confirmed `git rm` and `find -delete` pass (exit 0) and non-dict exits 1.
- **A3** stands (C-H). `notepad/claude-code/pilot-choice.md:23` is wrong; guard defects can break crew writes too.
- **A4** stands (C-H). `pilot.md:33` repeats the overreach the commander corrected.
- **A5** weakened (C-M). M001 crew list was updated after the auditor read it. `crew.json` harness-guide count and the missing general-purpose role confirmed.
- **A6** weakened (C-M). Wording in `crew.json` is loose, but P002 and P003 fit the worker contract.
- **A7** stands (C-H). Four manifests still say updated 2026-09-17.
- **A8** weakened (C-M). The commander dossier restating decisions is intentional.
- **A9** stands (C-H). P001 duplicated in S002 and proposals.json.
- **A10** stands (C-H). session-start.sh log naming, sorting and grep counting are fragile.
- **A11** stands (C-H). Two session-start orders in CLAUDE.md.
- **A12** stands, raised to high (C-H). Official memory docs: CLAUDE.md in subdirectories is included when Claude reads files there. Crew authorised to read the cockpit receive the pilot persona.
- **A13** stands (C-H). `notepad/team/README.md` contradicts records/README and crew protocol rule 3.
- **A14** stands (C-H). All stale index and reference items confirmed.
- **A15** mostly falls (C-M). pilot.sh finds the root with `git rev-parse`, which is sound. pyc and double-pinned model left unverified by red-team; pilot confirmed the pyc is tracked, and the double pin is deliberate (settings for fresh start, flag for resume).
- **A16** partly stands (C-M). (b) confirmed: today's log is not in index.json. (a) narrows to `--resume pilot` lookup by name. (c) and (d) are churn.

## Docs-scout

- **S1** stands (C-H), low urgency. In-tree `@` imports trigger no approval. Not answered: whether `@` expands in a file passed by `--append-system-prompt-file`.
- **S2** stands; nothing to do now.
- **S3** stands; informational.
- **S4** weakened (C-M). Docs show deny-then-reopen only for reads; `allowWrite` re-opening a `denyWrite` region is extrapolated. Sandbox is a posture change and belongs in a proposal. Not raised: denying the repo root would block `.git` writes.
- **S5** stands (C-H). Quote verified: settings are enforced, CLAUDE.md is not.
- **S6** stands; no change now.

## Ranked actions (red-team)

1. A1. 2. A2 bypasses. 3. A3. 4. A12, to the commander first. 5. A4. Then batch A7, A9, A11, A13, A14, A10. S4 as a proposal.
