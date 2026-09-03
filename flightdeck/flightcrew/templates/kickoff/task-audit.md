<!-- version: 1 -->
## Task: audit
The deliverable is findings and their evidence, not a change to the product. Cut the units by question, one question per unit, and give each unit the check that reproduces what it claims: an audit finding without a reproduction is an opinion.
Wave 0 builds the harness the audit reads through — the script, the fixture or the query every later unit reuses — so that every finding is produced the same way. Later units answer one question each and land their evidence under the launch folder.
Read widely and write narrowly: the allowed paths for an audit are usually the harness and the launch folder alone, and a unit that wants to fix what it found stops and says so instead. Remedies belong to a later run against a spec written from these findings.
Risks worth naming: a question that cannot be answered from the repository, a finding that only reproduces on one machine, and a sweep that quietly becomes a fix.
