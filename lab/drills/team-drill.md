# Team drill (you run this one, by hand)

A drill is a practice run that tests FlightDeck itself. This one asks which finds more for its cost on the same planted bug: a live adversary teammate inside an agent team, or the `second-opinion` workflow. It is interactive, because agent teams are experimental and cannot run in the background. Results are not tried yet; they appear when you run it.

You need:

- Agent teams switched on: in a settings file, an `env` block holding `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` set to `1`.
- PR 4 (launches) merged, for the second arm.

Step 1, prepare a copy with a planted bug. From the FlightDeck folder:

`mkdir -p "$HOME/flightdeck-drills" && cp -r lab/fixtures/export-html "$HOME/flightdeck-drills/team-drill-$(date +%F)"`

Then `cd` into that new folder to plant the bug and run the tests there (the plant removes the step that escapes `<`, and stops with an error if nothing changed):

`node -e "const fs=require('fs');const f='src/export/index.mjs';const s=fs.readFileSync(f,'utf8');const t=s.replace(\".replace(/</g, '&lt;')\",'');if(t===s)process.exit(1);fs.writeFileSync(f,t)"`

Check the bug is real: `node --test 'tests/export/*.test.mjs'` should now fail, and test B5 should be among the failures.

Then `cd` back to the FlightDeck folder. Steps 2 and 3 run from there, because PR 1's local-scope install switches the plugin on in the FlightDeck folder and not in the copy. Name the copy by its full path, `$HOME/flightdeck-drills/team-drill-<date>`, with the date the copy was made.

Step 2, arm A (the agent team). Start a pilot session in the FlightDeck folder and say: "Captain, start an agent team: one builder teammate asked to review only the files under $HOME/flightdeck-drills/team-drill-<date>/src/export against its tests/export, and a live adversary teammate using the flight:adversary agent type; report every finding."

Step 3, arm B (the workflow). The bug stays planted. In a fresh session in the FlightDeck folder, run `/flight:second-opinion $HOME/flightdeck-drills/team-drill-<date>/src/export/index.mjs`. If that command is not there, run `flightdeck/workflows/second-opinion.js` by path from the FlightDeck folder, as the launch skill says.

Step 4, record. In the FlightDeck folder, make `lab/results/<date>-team-drill/notes.md` and write down, for each arm:

- whether the `<` escaping bug was found;
- every other finding;
- the minutes it took;
- the cost, from `/cost` or the workflow summary;
- anything surprising.

Then compare the two arms: which found the bug, and which cost less. Git ignores result folders; run `git add -f lab/results/<date>-team-drill` only if you want to keep the notes.
