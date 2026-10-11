# The lab: rules for any agent working in lab/

The lab tests and improves FlightDeck itself, and nothing in it ships as plugin content.
The one exception is eval cases (an eval is a prompt plus graders that score the answer), which live in `flightdeck/evals/` because Claude Code reads them only there.
A drill is a test run that breaks or removes a part on purpose and checks that something notices.
Drills and checks print one line per case, `pass <case>` or `FAIL <case>: <reason>`, then `<n>/<m> passed`.
Drills and checks exit 0 only when every case passes.
The lint only warns: it prints `warn` lines and always exits 0.
Drills break and remove things only in a temporary copy, never in the working tree.
The sweep breaks one part at a time in a copy and checks something notices.
Remove-part deletes each later pull request's files in a copy and checks the rest still passes.
The sweep and remove-part cost no tokens.
Every eval command carries `--max-cost-usd` and `--no-publish`.
Eval results never block a pull request, because model-graded scores are noisy.
Noise is how much a score moves between two identical measurements.
A climb is a loop that improves one document by measured rounds.
A climb makes one change per round.
A climb uses training cases (the cases the improver may read) and held-back test cases (cases kept from it, used only to check the gain is real).
A climb keeps a change only when the training score and the held-back test score both rise beyond the noise.
Otherwise a climb reverts the change and says "within noise, do not merge".
A climb tells the proposer not to read the held-back test cases.
A fixture is a small sample project used as test material.
Fixtures are copied in and never edited in place; a drill plants defects in a copy.
A scaffold is a script that sets up a case's starting folder.
Results go in `lab/results/<YYYY-MM-DD>-<what>/` and are committed only when the owner wants to keep them.
Nothing runs above the ceiling (Opus at high effort).
Haiku measures and Sonnet proposes, by default.
Lab scripts never name the old workspace tool.
Lab scripts never hold a written-out name of a model or effort above the ceiling, not even in comments, because the hard-rule check (lab/checks/hard-rules.mjs, the script that checks the owner's no-go rules) scans them.
Every later pull request lists its files in `lab/owned/pr<n>.txt`, so remove-part can cut it out.
Write only the files on your own list.
