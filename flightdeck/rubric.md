# FlightDeck rubric

Used by the reviewer, the adversary and the imposter, from PR 1 on. Every question is yes-is-pass. Answer each one from the material alone, with a quotation or a `path:line`. A question answered without one does not count. Do not judge from the builder's summary or reasoning. If the work belongs to a workshop, add the `## questions` of that workshop's `verify.md` to these.

## Brief

- Does each owned file exist and match its one-line spec in the brief?
- Is every changed file on the owned list, and nothing else changed?
- Does every check the brief names pass when you run it?

## Truth

- Is every line in every `constraints.md` the owner's own, with no line added by an agent?
- Are the owner's words quoted exactly, with their date?
- Is anything an agent decided marked as a decision with a reason, ready for the owner to strike?

## Hard rules

- Is there no push to main or master, no force-push and no branch deletion?
- Is every model Opus at most, and every effort high at most?
- Is nothing changed under `dev/` or `.claude/rules/`?
- Does no script call `dw` or `dev-workspace`?

## Evidence

- Does every claim in a report carry [checked], [reviewed] or [stated]?
- Does every finding carry a quotation or a `path:line`?
- Is anything that was only read about, not tried, marked [stated]?

## Owner fit

- Do the five-minute try steps work as written, when followed literally?
- Are the words plain, with every term explained?
- Does the pull request description lead with the try?
- Does nothing start on its own?

## Findings format

Report each finding in this form, most severe first. Report every finding you hold; "no findings", with what you checked, is a full result.

- severity: high, medium or low
- where: `path:line`
- finding: what is wrong, in one or two sentences
- evidence: the quotation or `path:line` that shows it
- suggested fix: the smallest change that would fix it
