# Plan: flightcrew-v1 · flightcrew-buildout-2

## Approach

Retry of flightcrew-buildout after its wrong-check escalation. The implementation from run 1 stands at the build commit and is not rebuilt. This run carries the surviving work: verification against tests-map v2, a fresh critic pass with one fix pass, the run report, and the ending.

## Waves and units

| unit | name  | kind  | wave | mode   | pilot | checks                                                                                                                                                               | spec refs   | paths           | depends on | owner    | turns |
| ---- | ----- | ----- | ---- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------- | ---------- | -------- | ----- |
| U8   | proof | proof | W1   | serial | no    | `T1` `T2` `T3` `T4` `T5` `T6` `T7` `T8` `T9` `T10` `T11` `T12` `T13` `T14` `T15` `T16` `T17` `T18` `T19` `T20` `T21` `T22` `T23` `T24` `T25` `T26` `T27` `T28` `T29` | `B33` `B34` | `flightdeck/**` | —          | verifier | 15    |

## Risks

- run 1 was abandoned at verify because two locked cases asserted wrong values; tests-map v2 corrects them — reaction: watch (source: runlog)
- a saved workflow file under .claude/workflows/ sits outside the allowed paths and is not part of this build — reaction: watch (source: explore)

## Gates

- G1: this document
- G2: no contracts wave: T1 green since the lock commit
- G3: evidence display, critic findings, the three unverified lines, cost

## Abandon triggers

- any suite red at verify after tests-map v2 — observable by: evidence/summary.json counts
- critic pass 2 still holds a blocking finding — observable by: review/pass-2.json
