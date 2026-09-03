<!-- version: 1 -->
## Task: feature
Cut the work vertically: each unit delivers one testable behaviour end to end and names the checks that prove it. Wave 0 fixes the interfaces the spec names and passes their contract checks before any feature unit starts. The proof unit integrates last and lands the acceptance check.
A unit that cannot name a check is not a unit; fold it into one that can, or ask for a check before the plan is written. Prefer more small units over fewer wide ones, and keep two units off the same file where wave order allows it.
Risks worth naming: two units editing one file, an interface that wave 0 guessed, and a behaviour whose check is slower than the inner loop.
