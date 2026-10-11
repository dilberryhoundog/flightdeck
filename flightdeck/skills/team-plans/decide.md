# Decide

Several options written from different angles, compared in pairs and attacked, then the owner picks.

## When to use

Use it when the right answer is a choice: a design, a name, an approach, a trade-off. The work is to lay out the options well, not to pick one for the owner.

Do not use it when one option is plainly right (plain chat is enough) or when the choice has already been made (use Build and check).

## What will tell us the work is right

Only the owner's taste can say. So the plan ends in a pick by the owner, with a recommendation and the reasons for and against each option. It never claims one option is correct.

## Phases

1. Facts: two or three scouts gather what the options depend on (constraints, prior attempts, costs), each with path:line pointers.
2. Options: two or three builders each write one option into its own file in the attempt folder, from a different angle (for example cheapest, most robust, simplest for the owner). They do not see each other's file.
3. Compare: one reviewer compares the options in pairs against the question and the workshop's truth, and says which wins each pair and why.
4. Attack: the adversary attacks the leading option and returns what would make it a bad choice.
5. Pick: the lead puts the options, the comparison, the attack and a recommendation in front of the owner. Once the board (a later pull request) is merged this is a page; until then it is a short summary in chat and a question in the workshop's `questions.md` with the options and a recommended one.

Opening text for each seat is in `entry-points.md`.

## Seats

- pilot (flight:pilot): Captain, opus high; frames the question, presents the options and asks the owner to pick.
- scout 1, scout 2 (flight:scout): Worker, haiku default; gather the facts the options depend on.
- option writer 1, option writer 2, option writer 3 (flight:builder): Worker, sonnet high; each writes one option into its own file.
- comparer (flight:reviewer): Worker, sonnet high; compares the options in pairs and gives reasons.
- adversary (flight:adversary): Worker, opus high; attacks the leading option in cold mode.

## Owner's touch points

Nothing starts until the owner says go. The owner picks one option, or sends the options back with a note. That pick is the whole point of the plan.

## Size and cost

About 7 to 8 agents besides the lead. Cost class: medium.
