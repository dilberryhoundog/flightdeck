# adversary: harness-register — T006

Boundary note: my brief bars me from reading under the cockpit beyond the named criteria, so I did not open `notepad/research-2026-09-18/source/harness-facts.md`. Axis 1 is therefore checked against the official documentation each line cites, not against your source file. For a register whose verdicts are "against official documentation" (line 3) that is the stronger check, but fidelity-to-notepad is unaudited. Ask the pilot to lift the boundary if you want that pass.

**F1** — **A "Contradicted" verdict inverts a fact that is true**
**S-H** · **C-H**
**FINDING**: Line 25 states the claim "Uncommitted files are invisible to a worker because of the base ref" and returns **Contradicted**. Only the causal clause is wrong. The substance, that uncommitted files are invisible, is true and your own correction says so. The register's two-value scheme (line 7, "Verdicts are Confirmed or Contradicted only") has no slot for "right conclusion, wrong reason", and line 3 tells the reader to consult one line and not hold the file in mind. A pilot who reads the claim and the verdict in a dispute concludes uncommitted files are visible, which is the opposite of the truth.
**EVIDENCE**: Worktrees page: "A worktree is a fresh checkout, so untracked files like `.env` or `.env.local` from your main repository are not present." Split it into a Confirmed line for the invisibility and, if the causal error is worth keeping, a separate Contradicted line naming the base ref as the false explanation.

**F2** — **The cited source does not support the claim; the source that does has no URL**
**S-H** · **C-H**
**FINDING**: Line 33 sources the eight-block ceiling to "https://code.claude.com/docs/en/hooks (Stop input section), also the best-practices page". The hooks page carries no such limit. The claim is true, but only the best-practices page supports it, and that page is named without a URL, failing rule 2's "every claim names its source (a URL and date)".
**EVIDENCE**: I fetched the hooks page twice, the second time as a targeted negative across spellings ("8", "eight", "consecutive", "in a row", "stop_hook_active", "overrides the hook"), and it returned no numeric limit. Best practices, under "Give Claude a way to verify its work": "A Stop hook runs your check as a script and blocks the turn from ending until it passes. Claude Code overrides the hook and ends the turn after 8 consecutive blocks." Fix: cite https://code.claude.com/docs/en/best-practices (2026-09-18) and drop the hooks citation.

**F3** — **A Confirmed verdict rests on a false particular, and the line carries two subjects**
**S-M** · **C-H**
**FINDING**: Line 13 says "a Bash or PowerShell command whose git cannot be proven to stay inside the worktree is blocked". PowerShell is not covered by that check. The line also asserts `isolation: worktree` *and* `permissionMode` are enforced, then offers evidence for worktree containment only, so a second subject rides in on the first's verdict against rule 2's "it claims one thing".
**EVIDENCE**: Worktrees page, "How Claude Code enforces isolation": the command-shape check blocks "a Bash or Monitor command when it can't verify from the command text that any git the command runs stays inside the worktree", and the section closes "For PowerShell commands, Claude Code applies only the working-directory check." Monitor, not PowerShell, is the second tool. Split `permissionMode` onto its own line with its own source.

**F4** — **A documented exception is dropped by the word "regardless"**
**S-M** · **C-H**
**FINDING**: Line 16 ends "managed policy files load regardless". There is a documented case where they do not.
**EVIDENCE**: Sub-agents page: a subagent whose definition sets `omitClaudeMd` "loads only the managed policy files, or none at all when the definition comes from managed settings." Replace "regardless" with "except when the definition itself comes from managed settings, where none load".

**F5** — **Conditional fields are stated as unconditional**
**S-M** · **C-M**
**FINDING**: Line 31 lists the stdin envelope and returns **Confirmed** on the ground that the fields are "documented as used". Four of the eight are conditional, and your axis 1 names version gates and fallback conditions as the qualifiers that matter. A pilot writing a hook against this line assumes `scratchpad_dir` and `prompt_id` are always there.
**EVIDENCE**: Hooks page, common input fields: `prompt_id` "Absent until the first user input. Requires Claude Code v2.1.196 or later"; `scratchpad_dir` "Absent when the session has no scratchpad or the temp directory is unavailable. Requires Claude Code v2.1.257 or later"; `permission_mode` "Not all events receive this field"; `effort` present only "for events that fire within a tool-use context... when the current model supports the effort parameter".

**F6** — **A claim about what documentation omits cannot survive two years**
**S-M** · **C-M**
**FINDING**: Line 36 ends "the permissions page does not mention the workflow form". That is a fact about the current contents of a web page, not about the harness, and rule 2 requires a record's claims to "still be true in two years". A doc edit falsifies it silently, and nothing in the register tells a future reader to distrust it. It is also not an adjudicating finding: no dispute is settled by knowing which page failed to mention something.
**EVIDENCE**: Rule 2, third test: "it would still be true in two years". Keep the first half of the line, that both permission forms are real and documented on different pages, and cut the clause about the omission.

**F7** — **Process instruction in a record that forbids process**
**S-L** · **C-H**
**FINDING**: Line 7 closes "Re-read a page before leaning on its line; the harness moves fast." That is standing procedure, not an adjudicating finding.
**EVIDENCE**: Rule 2, second test: "it states the current form only, no history, no divergence, no process." The staleness warning belongs in `records/README.md`, which already carries one ("Re-research when the CLI version moves; the harness changes quickly").

**F8** — **An absence claim that ages badly**
**S-L** · **C-M**
**FINDING**: Line 14 asserts "`maxTurns` is the only documented turn limit". An exhaustive negative over the whole documentation set cannot be established from the single page cited, and a new limit falsifies it.
**EVIDENCE**: Rule 2, third and fifth tests. The verdict does not need the exclusivity claim: the correction stands on partial marking and resumption alone.

**F9** — **Unverified clause, routed rather than ruled**
**S-L** · **C-L**
**FINDING**: Line 18 ends "nested subagents count toward the concurrent total while running". I could not confirm it on either cited page, which document the depth limit as withholding the `Agent` tool from every subagent except a fork at the limit. I am not calling it wrong.
**EVIDENCE**: Sub-agents page on `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`: "At the depth limit, Claude Code withholds the `Agent` tool from every subagent except a fork." Per my brief I am sending this clause to the validator rather than ruling on it myself.

## Checked and passing

Line 12 keeps both qualifiers that matter, "nothing" and "usually", and matches the page exactly. Line 24 states the base-ref fallback correctly, including "no remote is configured" and "neither cached nor fetchable". Line 26 matches the hooks note that `${CLAUDE_PROJECT_DIR}` "stays put" while `cwd` "moves again when Claude runs `cd`". Line 32 matches the page nearly word for word, including exit 2 beating a JSON `permissionDecision` of allow. Line 34 is correct on both halves; the hooks page alone does not show the path printing, but the worktrees page does, and you cited both.

## Scope (your axis 4)

Both exclusions are right and I am not arguing either. Unsettled observations have no verdict, and a two-value register that admitted them would have to invent one. Claims about flightcrew's own code fail the register's own title: they are terrain, they change when the code changes, and they would break the two-year test that harness facts survive. Your line 7 states both exclusions in the file, which is what lets a reader trust an absence.

## Docspec status

Register style is met: one line per entry, each carrying claim, verdict, source and date. Rule 2 sets no 40-line cap for a register, only "one line per entry", so the 37 lines are not a problem. The header satisfies rule 2 by naming the notepad file it was distilled from, which is the permitted alternative to a topic id. The source test is met on every line except 33 (F2).
