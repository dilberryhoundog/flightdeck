# T010 — Idea exploration: cockpit rooms, identifiers, JSON shape, frontmatter

Mission M001. Dispatched by session `pilot` (Ace), 2026-09-20, on the commander's order. The commander is in the room through the pilot's seat: the pilot relays the commander's answers and rulings to every seat at once.

## Standing of the source material

The commander left four idea files in `commanders-desk/out-ideas/`. The commander's words on them: "these are ideas not orders." Treat each as a starting point to test, extend, narrow or argue against. This team explores; it does not design the final scheme and it does not plan a refactor. A refactor team follows later and starts from what settles here.

- `cockpit-setup.txt` — regroup the rooms; the commander's reason: fitout is causing the cockpit to settle differently than intended.
- `frontmatter.txt` — consistent frontmatter for generated markdown, replacing bolded metadata, for searchability.
- `json-data-consistency.txt` — lightweight named manifests pointing at unit files; a fixed identifier shape; proposals renamed requests.
- `orphan-branch.txt` — marked future work by the commander. Out of scope, except to note anything in the other three that would block it.

The commander's worked examples of frontmatter, uncommitted on the desk: `commanders-desk/in-dossiers/DS001-flightcrew-recon.md`, `commanders-desk/in-proposals/P004-open-missions-from-the-cut.md`, `commanders-desk/out-advice/CA001.md` to `CA003.md`.

## The pilot's working view, to be tested not assumed

The first three ideas are one scheme: frontmatter `unit:` values are the identifiers, manifests live in the rooms, and unit files are what frontmatter or JSON describes. Deciding them apart means refactoring twice.

## What the exploration should surface

1. Rooms. How each room is actually used today against what its keep file and README intended; where things settled differently; what the proposed grouping fixes, what it costs, and what it leaves unsolved. What depends on current paths: the write guard, the SessionStart hook, `base/bin/pilot.sh`, the `@procedures/triggers.md` import, the map in `CLAUDE.md`, cross-references between files.
2. Identifiers. Every ID kind in use now, where each is minted and where referenced, collisions and near-collisions (P is both proposal and the suggested procedure prefix; DS against the suggested Ds), and whether one shape can hold them all.
3. Manifest and unit. Which JSON files are single large files today, their size in lines and rough tokens, how they are read in practice, and what a manifest-to-unit split would buy or cost for each. Where a split is not worth it.
4. Frontmatter. Which document types would carry it, which fields are common and which are type-specific, how the fields relate to the JSON unit fields so one fact is not kept in two places, whether the worked examples are valid YAML, and how an agent would actually search it.
5. Order of change. What must be decided together and what can be decided later without rework.
6. Questions only the commander can answer. Keep them few and sharp; the pilot rules on anything the pilot can rule on.

## Output

An exploration paper held by the option-maker: the option space for each of the four areas with evidence, where the areas constrain each other, a leaning with what would make it wrong, and the commander questions. It is revised as the commander answers. An adversary attacks it only once it settles. The pilot then distils it into a dossier.
