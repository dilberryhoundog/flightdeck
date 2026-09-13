# fixtures/sample-launch-core

A complete launch folder in the layout interface I1 of flightdeck/launch/flightcrew-core/specs/spec.v1.json names, and the reference for that layout: launch.json in the I2 shape, a frozen spec and a frozen tests map holding one check of every verdict kind, and runs/run-1/ in progress with its liftoff, frozen plan, events, hook log, check scripts, rubric, dispatches, returns, report and an empty evidence folder.

FLIGHTLOG.entry.md is the entry this run would have written (I10); it is not part of the launch folder and is copied into a FLIGHTLOG.md by the suites that need one.

A suite that needs a variation copies this directory into its temporary repository and mutates the copy; the fixture itself is a locked target and is never edited by a run.
