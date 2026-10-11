# Results

This folder holds the results of drills, climbs and owner-run checks.
Each run gets one folder named `<YYYY-MM-DD>-<what>`, for example `2026-10-11-interview`.
A result folder is committed only when the owner wants to keep it. Git ignores result folders, except climb reports, and `git add -f lab/results/<folder>` keeps one.
A climb writes its report to `lab/results/<date>-climb-<document-name>/report.md` on its own branch (`<document-name>` is the target document's short name).
Eval reports do not land here: they go to `lab/evals/results/`, which is ignored.
