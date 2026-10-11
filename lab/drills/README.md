# Drills

A drill is a test run that breaks or removes a part on purpose and checks that something notices.
Run every command from the project folder.
Each section says what the drill shows, the command, the time, the cost, what it needs, and what passing looks like.
Free drills print one line per case: `pass <case>` or `FAIL <case>: <reason>`, then `<n>/<m> passed`, and exit 0 only when all pass.

## Sweep

Shows that FlightDeck's checks notice breakage: it breaks one part at a time in a temporary copy and proves a check complains each time.
Command: `node lab/drills/sweep.mjs`.
Options: `--case <name>` runs one case; `--no-claude` leaves out the broken-plugin-file case (plugin-manifest-broken).
Time: about half a minute. Cost: no tokens.
Needs: Node and the version-control tool; the broken-plugin-file case (plugin-manifest-broken) also needs `claude` on your path.
Passing: `pass baseline` (the unbroken copy passed every check first), then a `pass` line for every case with a plain sentence saying what was broken, then `n/n passed`.

## Remove-part

Shows that every later pull request can be cut without breaking the rest: it deletes each part's files in a temporary copy and proves the checks stay green.
Command: `node lab/drills/remove-part.mjs`.
Time: seconds to a minute. Cost: no tokens.
Needs: Node and the version-control tool; `--no-claude` skips plugin validation.
Passing: `pass baseline`, then one `pass remove pr<n>` line for each merged later part, then `n/n passed`.

## Lint

Shows where documents have grown too long or hold things that do not belong.
Command: `node lab/checks/lint.mjs`.
Time: seconds. Cost: no tokens.
Needs: Node.
Passing: it only warns, so it always exits 0; read the `warn` lines and the last line, `<c>/<r> rules clean, <w> warnings`.

## Interview drill

Shows whether the workshop interviewer draws out a fact the owner would not volunteer: it interviews a stand-in owner who holds one fact back, then scores the result on 8 mechanical checks.
Command: say "Captain, run the interview drill".
That runs `lab/drills/interview.js` with the Workflow tool and the arguments `repo` (this folder's full path), `scratch` (a scratch folder's full path) and `today` (the date).
Time: several minutes. Cost: a few dollars of Sonnet.
Needs: pull request 3 (workshops) merged. The drill uses your last commit, and says so plainly when pull request 3 is missing.
The scratch folder must be one the session may work in. In a pilot session, add it first with `/add-dir <scratch folder>`, or start Claude with `--add-dir <scratch folder>`.
The drill lets its nested sessions run node commands and nothing else.
Passing: it writes `lab/results/<date>-interview/index.html` with the score, the 8 checks and whether the held-back fact was found.

## Team drill and teammate types

These two are run by the owner by hand, because agent teams are experimental and interactive only.
The team drill compares a live adversary teammate with the `second-opinion` workflow on the same planted defect; see `lab/drills/team-drill.md`.
The teammate-type check asks whether agent teams accept the plugin's own agents as teammates; see `lab/drills/team-types.md`.

## Evals

Eval cases score FlightDeck's parts with a model, cost a few dollars, and never block a pull request.
See `lab/evals/README.md`.

## Climbs

A climb improves one document by measured rounds.
See `lab/climbs/README.md`.
