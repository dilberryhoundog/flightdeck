---
shelf: index
sources:
  - flightdeck/policies.md
  - flightdeck/agents/librarian.md
checked: 2026-10-11
---

# FlightDeck library

The library holds concepts, knowledge and good practice. The manuals say how to do something; the library says why, and what good looks like.

## How the corpus works

- The library and the manuals together are the corpus. The index of the manuals is [manuals README](../manuals/README.md).
- One topic per page, describing FlightDeck as it is now.
- Every page starts with a few lines of header: `shelf:` (which shelf it is on), `sources:` (the files it relies on) and `checked:` (the day a person or the librarian last confirmed it). A carried-over page also has `from:`, which says where it came from.
- A page is stale when it was checked more than 30 days ago, or when a source file has changed since. `/flight:library-check` finds stale pages and has the librarian re-check them.
- One paragraph per line, plain words, about 100 lines a page at most.
- Ask the librarian a question by saying "Librarian, ..." in a pilot session, or start it with `claude --agent flight:librarian`. It answers from the corpus and cites the file and line for every claim.

## Pages

- [Adversarial mandate](adversarial-mandate.md): how to attack work against its criteria, what a finding is, and the form of the answer.
- [Rubric guide](rubric-guide.md): how to write yes-or-no questions a judge can answer from the material, and how to check them.
- [Team design](team-design.md): why a team has the roles it has, how a role becomes an agent file, and where rank fits.
- [Retrying and stopping](retry.md): setup carries over, run output does not, and one change per retry.
- [Terms](terms.md): FlightDeck's words in plain words.
