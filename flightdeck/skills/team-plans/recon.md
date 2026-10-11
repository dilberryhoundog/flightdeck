# Recon

Three cheap readers look at the same question from different angles, then one checker tests the summary.

## When to use

Use it when you need facts before deciding anything: where something lives, what a set of documents says, what an unfamiliar part of the repository does.

Do not use it when you already know where to look (plain chat is enough) or when the answer needs a change to files (use Build and check).

## What will tell us the work is right

Every claim in the summary points to a path:line, and a checker has opened each pointer and found the claim true. "Not found" is a complete answer when every named path was searched. Nothing here is proven by tests, so confidence is stated and never assumed.

## Phases

1. Split: the lead writes the question and picks three separate angles, for example "what the docs say", "what the code does", "what earlier branches did". Each scout gets one angle and is not told what the others look at.
2. Read: the three scouts start together. Each returns a short answer, every claim with a path:line pointer and a confidence of certain, probable or guess.
3. Summarise: the lead writes one short summary from the three returns and keeps every pointer. It does not read the sources itself.
4. Check claims: one reviewer in a fresh context opens each cited path:line and marks the claim confirmed, wrong or unsupported.
5. Report: the lead gives the summary with the reviewer's marks in plain words, and says what was not found.

Opening text for each seat is in `entry-points.md`.

## Seats

- pilot (flight:pilot): Captain, opus high; picks the angles, writes the summary from the returns and reports to the owner.
- scout 1, scout 2, scout 3 (flight:scout): Worker, haiku default; each reads one angle and returns a short answer with path:line pointers.
- claim checker (flight:reviewer): Worker, sonnet high; opens every cited pointer and says whether the claim is true.

## Owner's touch points

Nothing starts until the owner says go. Recon asks nothing else of the owner: the summary is read and used as they like.

## Size and cost

About 4 agents besides the lead: 3 scouts and 1 checker. Cost class: low, mostly haiku.
