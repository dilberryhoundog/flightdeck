---
type: "dispute"
status: "open"
stamp: ["2026-09-29", "Pilot: Ace", "f6216b95"]
statement: "records/truth/concepts/truth-record.truth"
disputed: ["records/truth/concepts/truth-advice.truth"]
---
# build-lock

## The statement

truth-record, statement 7: "Truth records are locked during any build phase to prevent any agent from mutating them"

## The contradiction

truth-advice, statement 9: "An advice file can be locked, to be built against. A check is written, whereby the advice replaces the original truth record during a build run. If the build fails the advice is opened again for mutation."

## The reasoning

Replacing a truth record during a build run is a mutation during a build phase, which the first statement forbids. The second statement does not say who performs the replacement; if an agent does, the lock is broken by the mechanism meant to work under it. The commander may mean that the advice stands in for the truth record for the build's checks without the record itself changing, or that the swap happens before the build starts; the records do not say either. The pilot's advice on the lock, written today, reads the lock as starting when the build team is dispatched and covering the truth records and the one advice file the build is locked to.
