# Draft: rule 2 and the records README under D021 and P010

Scratch. The pilot's draft of the two docspec texts, for one adversary check before they land. Changed or new wording is what matters; everything else is the standing text.

## `CLAUDE.md` rule 2, proposed

2. **Records are protected.** `records/` is the pilot's source of truth across sessions. A record is the pilot's settled understanding of one topic, so an agent reads one file for one question. Choose the vehicle first (`procedures/record-keeping.md`): a record is for a durable fact the pilot will need to look up, not for a rule, a routine or mission knowledge. A file lands there only if it passes six tests: it covers one topic whole and speaks with authority; it states the current form only, no history, no divergence, no process; it would still be true in two years; every sentence earns its place, as long as the topic needs and no longer; past 100 lines it draws a finding asking whether it is one juicy topic or two, and 150 lines is the cap; every claim has a source and no source is named in the prose, so the body carries no citations or quotations and the record carries one header line (forms in `records/README.md`); it extracts, never copying `flightdeck/library/` (the documentation for all stakeholders) or `notepad/`. A `Validated:` line is applied only by a crew seat that did not write the record, never by the pilot to its own work, after that seat has checked every statement against the sources read in full; an edit voids it, so the record is re-validated or the line is removed. A record may land as a stub, headed by the `Stub:` line, which is replaced by the line the record earns when it is promoted; a stub is never cited as authority in a crew brief. Two styles. A record: a title naming the topic, the header line, then headed sections of plain statements, one idea per section, as in `records/claude-code/agent-teams.md`. A register: one domain of adjudicating findings, one line each with claim, verdict, source and date, consulted in disputes and not held in mind. A record is updated in place when its topic changes; the commander reads a record before it lands.

## `records/README.md` paragraphs 1 and 2, proposed

The pilot's source of truth across sessions. The docspec is cockpit rule 2: six tests, two styles, and the exemplar. A record is one topic, whole. Where the docspec and an existing record disagree, the docspec wins; where this README and the docspec disagree, the docspec wins. Every claim in a record has a source, recorded per claim in the writer's working notes (kept in the team's notepad folder while the record stands) and named by kind in the one header line; nothing is cited or quoted in the body. When in doubt it goes in `../notepad/`. A record is re-checked when a source it names moves; how that is noticed is in `../procedures/cockpit/currency-review.md`.

Header line forms, one per record, both where a record draws on both kinds. Web-sourced: `Source: <URL> (researched YYYY-MM-DD by <seat>, CLI <version>).` Locally sourced: `Validated: checked against <kinds of source, for example the commander's directives, the flightdeck library and the source guides>; <team id> <seat>, YYYY-MM-DD.` Stub: `Stub: existing knowledge only, not validated, not to be cited as authority.` A register's entries keep their own per-line source and date, which is the register style.

Index lines: a stub is listed with its record room and marked `(stub)`.

## Questions the check should answer

1. Does rule 2 now contradict itself or the README anywhere?
2. The register style carries a source per line; does "no source is named in the prose" wrongly forbid it, and does the README's last sentence repair that cleanly?
3. Is anything from D021, DS004 items 4 to 6 or the commander's clarification ("every claim has a source doesn't mean it has to be explicitly named inline") missing or overstated?
4. Rule 2 is one long paragraph in an always-loaded file. What can move to the README or the procedure without loss?
