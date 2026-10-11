# Results

This folder holds the results of drills, climbs and owner-run checks.
Each run gets one folder named `<YYYY-MM-DD>-<what>`, for example `2026-10-11-interview`.
A result folder is committed only when the owner wants to keep it; otherwise it stays untracked and can be deleted.
A climb writes its report to `lab/results/<date>-climb-<slug>/report.md` on its own branch.
Eval reports do not land here: they go to `lab/evals/results/`, which is ignored.
