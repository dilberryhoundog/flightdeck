## Intention

<!-- The outcome being pursued, and why it is worth it -->
FlightCrew built to source, but builder added extra command surface to make for easier testing. Returning back to core source description. Testing improved for future usage. large parts of the system retained.

## Scope

<!-- The perimeter of the work, what is inside and what is outside -->

### In

- test suite.
- 'fc' command surface removed
- non source user commands and redundant system commands.
- launch and run directory
- manuals

### Out

- agents
- spec, launch, test maps,
- plans units
- hooks and injection mechanism
- kickoffs with 3 workflows
- runners required for original system
- expansions to the system talked over with agents. (command surface, radar, workflow)

## Constraints

<!-- The conditions the result must satisfy no matter how it is achieved. imported from the surrounding world -->

- dynamic workflow with spec and test map, not full flightcrew run.
- agents from flightcrew used.
- FlightCrew source referenced.

## Interfaces

<!-- The exact shapes through which the work will meet everything around it -->

## Behaviours

<!-- what the finished work observably does. -->
- command surface removal
- redundant commands removed not in source
- test suite over existing infrastructure
- launch and run directories implemented and documented
- FlightCrew setup skill, creates directories, sets up configs.
- manual contents validated
- operator manual, with usage of each component
- maintenance manual, agent facing maintenance of each component

## Edges

<!-- what happens at the boundaries of normal use and when the world does not cooperate -->

## Decisions

<!-- The judgements already made: choices settled before the work began, and improvements deliberately not being pursued -->

## Verification

<!-- How each claim in the document will be proven -->

## Acceptance

<!-- the short final list stating the conditions under which the result is accepted and attention moves on -->

## Open Questions
