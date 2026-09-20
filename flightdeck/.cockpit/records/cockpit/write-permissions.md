# Write permissions in the cockpit

Stub: existing knowledge only, not validated, not to be cited as authority.

## The principle

Write is a restriction of role, not of place. What an agent may write follows from what it is, not from where a file sits.

## The commander

The commander writes anywhere. The keep files, the desk's outgoing folders and the text of every recorded order are the commander's own words; no agent edits them.

## The pilot

The pilot writes only in the cockpit. It has two exceptions: `dev/workspace/` when a dev-workspace procedure requires it, and the `.claude` folder, a side room the commander permits for scratch. The pilot does not write to the project or to a launch. A change to the flightdeck system outside the cockpit is proposed to the commander and carried out by crew once approved.

Inside the cockpit the pilot writes its own context: logs, missions, manifests, dossiers, requests, procedures, crew dossiers. Bulk work there, such as a refactor or a build of cockpit tooling, goes to a team.

## Crew

Crew write where their dispatch scopes them: the project, a launch, or the cockpit. A team may be dispatched for work outside the cockpit or for work inside it. The brief states the write boundary as paths, and the team writes nothing outside it. Crew have no standing permission anywhere; a seat's permission begins and ends with its brief.

## A team working in the cockpit

The pilot gives the scope: which rooms and files the team may write, and what it must not touch. The pilot links the team to the commander, passing the commander's words to the team and the team's questions to the commander. The pilot records its own actions and the team's: the dispatch entry, the log, and what changed.

## Enforcement

A PreToolUse guard, `base/bin/cockpit-guard.py`, registered in `base/settings/pilot.settings.json`, blocks the pilot's writes outside its allowed roots. It covers the file tools and a parsed subset of shell commands. It does not see what a script run by an interpreter writes, a variable it cannot resolve, or a command substitution. It covers only a session launched with the pilot's settings; a session launched without them has no guard. Crew are not guarded: their restriction is the brief, and the pilot's check of what they changed.

The restrictions stand wherever the guard cannot see.
