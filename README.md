# FlightDeck

FlightDeck is a Claude Code plugin called `flight` that gives you a small crew of agents, led by a pilot you talk to. It keeps your work, your words and your checks in plain files in this repository, so you can see where things stand and stay in charge.

## Try it in five minutes

1. In this repository, on PR 1's branch, run `git fetch origin && git switch build-1-pr1-basic-a1`. Then run `claude plugin marketplace add "$PWD" --scope local` and `claude plugin install flight@DBHD-FlightDeck --scope local`.
2. Start the pilot with `claude --agent flight:pilot --model opus --effort high`. If you like, save it as a shell alias: `alias fly='claude --agent flight:pilot --model opus --effort high'`. Read the pre-flight card on screen. It says "FlightDeck 0.2.0 pre-flight: Captain on deck", then the branch, the build-1 workshop with its latest attempts and open questions (one question is held to ask later), and "Captured, waiting to start: 1".
3. Type `/flight:preflight`. FlightDeck checks itself and ends with "systems green" or a list of what is not green.
4. Say: "push this branch to main with --dry-run". The guard refuses and names the rule.
5. In a second terminal in the same folder, start plain `claude`. There is no card and there are no ranks. Type `/exit`.

Next, if you want: say "Captain, recon: what do the sources in library/source say about evals, five lines", or "Captain, have the adversary attack README.md against .flightdeck/VISION.md", or "Captain, we should make the board work offline". For the last one the pilot adds one line to `.flightdeck/workshops.md` and tells you. Calling the pilot "Captain" is optional.

## The crew

- pilot: leads your session, picks how to send agents out, checks what comes back and reports in plain words. It does not do the work itself.
- runner: runs one piece of work on its own in a background session and reports the branch it made.
- scout: reads and reports a short answer with a path and line for every claim. Cheap. Changes nothing.
- builder: builds one unit inside its own files in its own worktree.
- reviewer: judges work against the brief and the rubric from a fresh start. Never edits.
- adversary: attacks the work against its criteria and returns ranked findings. Read-only.
- imposter: plays you, following the steps literally from your own words in `.flightdeck/persona.md`, and says where it got stuck.

Ranks are about responsibility, not names. You are the Commander. The pilot sits as Captain. A team lead is an Officer. Everyone else in a team is a Worker. Rank is given when work is handed out. The rules are in `flightdeck/policies.md`.

## How work starts

Talk to the pilot. Say what you want done and it picks the smallest team that fits. Work you mention that is bigger than this sitting is captured as one line in `.flightdeck/workshops.md` and waits. Nothing starts until you say so. When you say "activate <name>", the pilot makes that work's folder in `.flightdeck/` from the templates. Only you activate, settle or promote a workshop.

## Plain claude stays plain

Starting `claude` without `--agent flight:pilot` gives you no card, no ranks and no workshop text. Your own actions are never guarded.

## The guards and their limits

Three guards watch agents only, not you: no pushing to main, no force-push and no branch deletion; no writing your own words (`constraints.md`, `VISION.md`, `build.txt`); and no model above Opus at high effort. They are safety nets, not a permission system. They miss things such as git run from a script. The real stops are GitHub branch protection on `main` and Claude Code's managed settings. `/flight:preflight` tells you whether those are on.

## Where things live

- `flightdeck/`: the plugin (agents, skills, hooks, templates, policies, rubric).
- `.flightdeck/`: your documents (`VISION.md`, `build.txt`), the list of workshops and one folder per active workshop.
- `lab/`: checks and tests for FlightDeck itself.
- `library/source/`: downloaded sources to read.
- `CLAUDE.md`: the rules every session here loads.

## What later pull requests add

The flight board (a page to read state and answer questions), full workshop commands, launches (send a runner and get back a reviewed pull request), the laboratory (drills and evals), manuals and libraries, and a status band. A local command line was skipped by the owner and is not built.
