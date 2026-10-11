# Team drill (you run this one, by hand)

A drill is a practice run that tests FlightDeck itself. This one asks which finds more for its cost on the same planted bug: a live adversary teammate inside an agent team, or the `second-opinion` workflow. It is interactive, because agent teams are experimental and cannot run in the background. Results are [stated] until you run it.

You need:

- Agent teams switched on: in a settings file, an `env` block holding `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` set to `1`.
- PR 4 (launches) merged, for the second arm.

Step 1, prepare a copy with a planted bug. From the FlightDeck folder:

`mkdir -p "$HOME/flightdeck-drills" && cp -r lab/fixtures/export-html "$HOME/flightdeck-drills/team-drill-$(date +%F)"`

Go into that new folder and plant the bug (it removes the step that escapes `<`, and stops with an error if nothing changed):

`node -e "const fs=require('fs');const f='src/export/index.mjs';const s=fs.readFileSync(f,'utf8');const t=s.replace(\".replace(/</g, '&lt;')\",'');if(t===s)process.exit(1);fs.writeFileSync(f,t)"`

Check the bug is real: `node --test 'tests/export/*.test.mjs'` should now fail, and test B5 should be among the failures.

Step 2, arm A (the agent team). Start a pilot session in that folder and say: "Captain, start an agent team: one builder teammate asked to review src/export for the spec in tests/export, and a live adversary teammate using the flight:adversary agent type; report every finding."

Step 3, arm B (the workflow). The bug stays planted. In a fresh session in the same folder, run `/flight:second-opinion src/export/index.mjs`. If that command is not there, run `flightdeck/workflows/second-opinion.js` by path, as the launch skill says.

Step 4, record. Make `lab/results/<date>-team-drill/notes.md` and write down, for each arm:

- whether the `<` escaping bug was found;
- every other finding;
- the minutes it took;
- the cost, from `/cost` or the workflow summary;
- anything surprising.

Then compare the two arms: which found the bug, and which cost less. Commit the notes only if you want to keep them.
