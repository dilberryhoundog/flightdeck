# T010 exploration paper — rooms, identifiers, JSON shape, frontmatter

Held by `option-maker`. Mission M001, team T010, dispatched by `pilot` (Ace), 2026-09-20. Pass 1: drafted from the four idea files and the option-maker's own reading. Not a design, not a refactor plan. The commander's four files are ideas, not orders.

## Evidence this pass rests on

Measured by the option-maker, not taken from another seat.

- Guard scope. `base/bin/cockpit-guard.py` line 19: `ALLOWED = ("flightdeck/.cockpit", "dev/workspace")`. The allowlist is the cockpit root only, so no room move inside the cockpit affects the guard.
- Hard-coded paths, SessionStart. `base/bin/session-start.sh` reads `logs/index.json`, `missions/missions.json`, `base/proposals.json`, and prints two literal paths (`flightdeck/.cockpit/CLAUDE.md`, `flightdeck/.cockpit/logs/<file>`). Five path dependencies.
- Hard-coded paths, launcher. `base/bin/pilot.sh` reads `quarters/pilot/identity.md`, `quarters/pilot/job.md`, `quarters/commander/commander.md`. Three.
- CLAUDE.md. One `@procedures/triggers.md` import, plus the "How to find things" map and roughly a dozen inline paths in rules 1, 2 and the crew protocol.
- Map already drifted. CLAUDE.md says `base/` holds `dossiers/`. No such directory exists; dossiers live in `commanders-desk/in-dossiers/`. The map is wrong today, before any regroup.
- Index and unit split across rooms. `base/proposals.json` indexes nine markdown proposals that live in `commanders-desk/in-proposals/`, and its `file` fields reach across with `../commanders-desk/...`. `commanders-desk/in-dossiers/dossiers.json` sits with its units. Two rooms, two opposite conventions.
- Identifier prefixes in live use, by occurrence count across `.cockpit`: DS 369, M 322, T 269, P 213, O 150, S 135, D 83, C 83, W 69, CA 7. `Rq` 2 and `Or` 1, both only inside the commander's own idea file.
- Not everything is numbered. `procedures/procedures.json` keys on slugs (`record-keeping`, `forming-a-team`); `dispatch/rosters.json` keys on names (`recon`, `mini-adversary`); records key on path. Three live registries with no numeric ID at all.
- JSON sizes, lines. `dispatch/cockpit.json` 391, `quarters/commander/orders.json` 307, `base/decisions.json` 209, `quarters/crew/crew.json` 187, `logs/crew-manifest.json` 183, `workshop/workshop.json` 182, `logs/topics/topics.json` 165. Everything else is under 140. At roughly 8 to 12 tokens per line these are 1.5k to 5k tokens each; nothing here is blowing a budget today.
- The split already exists and works. `logs/topics/` is a manifest (`topics.json`, 165 lines) plus 22 unit files. This is the commander's proposed pattern, already flying in the cockpit.
- YAML validity, measured with Ruby's Psych. `DS001-flightcrew-recon.md` frontmatter FAILS to parse: `stamp: "2026-09-18", "Pilot: Ace", "session dcb75456"` and `generates: "P004", "P005", ...` are not valid YAML (a plain scalar cannot follow a quoted one in a block mapping). `P004` parses (`status` and `recorded` come back null, both empty on the desk). `CA001` parses.
- Duplication, measured. DS001 carries id, title, date, author, source, mission and generated proposals three times over: frontmatter, the bolded block beneath it, and the `dossiers.json` row. CA001 carries `type` and `unit` only and duplicates nothing.
- The commander has already started. Working tree shows `out-advice/DS001.md` renamed to `CA001.md`, etc. One prefix from the sketch is live.

## Area 1 — Rooms

The idea: regroup the ten top-level rooms into six (`base/`, `commander/`, `records/`, `work/`, `team/`, plus `bin`/`settings` under base), because fitout is causing the cockpit to settle differently than intended. It solves a real problem: rooms were added one at a time as needs arose, so siblings at the top level are at different altitudes (`workshop/` and `dispatch/` are peers of `records/` and `quarters/`), and the CLAUDE.md map has already fallen out of step with the disk.

**R0 — leave it as it is.** Buys: zero migration, zero reference churn, no risk to the eight hard-coded paths. Costs: the drift stands, and every new room makes the top level flatter and harder to hold in mind. Breaks: nothing.

**R1 — the commander's regroup as drawn.** Buys: rooms grouped by what they are for rather than when they were added; `work/` (missions, workshop, procedures) is the strongest part of the sketch and is clearly right — those three are the pilot's own working rooms and have no business being peers of `records/`. Costs: renames nearly every path in CLAUDE.md, the eight script paths, the cross-room `file` fields in `proposals.json`, every README cross-reference, and every log, dossier and archive that cites a path. Breaks: three specific things. (a) `records/` is redrawn to mean "anything recorded" and today's `records/` becomes `manuals/`; rule 2, `records/README.md` and the commander's own CA001 distinction ("library is for all, records are yours") all hang on the current meaning, and the word would then mean two different things across sessions and the `dev/branches/` archives. (b) `dispatch/` moves under `records/`, but rule 10 says dispatch entries are kept current as work happens — they are live state, not a record. (c) the commander appears twice in the sketch, once at top level (`commander/` with desk and orders) and once under `team/officers/commander/`; that is a contradiction in the drawing, not a scheme.

**R2 — drift repair only, no regroup.** Fix the four places where the cockpit settled differently: the phantom `base/dossiers/` in the map, the proposals index living apart from its units, the advice rename already in flight, and whichever cross-room `file` fields remain. Buys: removes the actual observed damage for a few file moves. Costs: leaves the altitude problem. Breaks: nothing.

**R3 — regroup by lifecycle, keep the loaded names.** Do R2, plus introduce `work/` over missions, workshop and procedures, and leave `records/`, `quarters/`, `logs/`, `dispatch/`, `base/` and `commanders-desk/` named as they are. Buys: most of what R1 buys at a fraction of the churn, and keeps a word the commander has spent three sessions loading with meaning. Costs: the top level goes from ten to eight, not six. Breaks: three script paths at most, none of them `records/`.

**R4 — let the harness hold the map, whatever the layout.** Orthogonal, combines with R0 to R3. A nested `CLAUDE.md` in each room (Claude Code loads a directory's CLAUDE.md when a file there is read, so each room describes itself where it lives), the top-level map reduced to `@` imports or deleted, and a lint script that fails when a room has no README or a cited path does not resolve. Buys: the map cannot drift from the disk again, which is the root cause here, not the grouping. Costs: one script to write and a hook or manual run to invoke it; nested CLAUDE.md files consume context when those rooms are read. Breaks: nothing.

**Leaning: R3 plus R4.** The measured damage is drift between map and disk, not the grouping; R4 fixes the cause and R3 takes the part of the commander's sketch that is unarguable. Wrong if the commander's aim is a cockpit that reads identically wherever it is deployed and the sketch is the target shape rather than a starting point, or if the orphan-branch move is near, in which case regrouping before the quickfire commit paths are scripted is cheaper than after.

## Area 2 — Identifiers

The idea: one shape for every ID, `<1-3 capitals><3 digits>`, single capital for common units, double or triple for combined words; and rename `desk/proposals` to `desk/requests` so `Rq` frees `P` for procedures. It solves a real problem: ten prefixes exist with no stated rule, and the pilot has no way to know what a new kind of thing should be called.

**I0 — leave it as it is.** Buys: nothing changes. Costs: the next ID kind is invented ad hoc again. Breaks: nothing.

**I1 — the commander's shape with the collisions resolved as sketched** (P to procedures, proposals to `Rq`, dossiers to `Ds`). Buys: one rule, stated once in CLAUDE.md. Costs: 213 `P` references and nine file names rewritten, plus `proposals.json` re-keyed; 369 `DS` references recased. Breaks: two things hard. (a) `Ds` violates the commander's own stated rule in the same file, which says the abbreviation is capitals. (b) `Ds001.md` and `DS001.md` are the same path on this machine's default case-insensitive filesystem, so a half-finished rename silently overwrites and git reports phantom changes. `Ds` should be rejected on that ground alone.

**I2 — the commander's shape, collisions resolved the other way.** Keep `P` = proposal and `DS` = dossier (the incumbents, by 213 and 369 references and by nine live filenames), and give procedures something else or nothing. Buys: the rule without the rename. Costs: `P` for procedure was the commander's stated preference and is lost. Breaks: nothing.

**I3 — two tiers, stated.** Numbered IDs for things that are counted, appended to and cited across rooms (M, T, P, DS, O, D, S, W, CA, C); named slugs for things cited by name and never counted (procedures, rosters, records, crew seats). Buys: it describes what the cockpit already does and works, and it stops the pressure to number things that read better named — `forming-a-team` is a better citation in a brief than `P002`. Costs: two rules instead of one. Breaks: nothing; it is the status quo made explicit.

**I4 — enforce whatever is chosen.** A lint script that mints the next ID for a kind, checks uniqueness across the cockpit, and checks that every `unit:`/`id:` reference resolves to a file or a manifest row; optionally run from a hook on write. Buys: the scheme cannot rot, and minting stops being a thing the pilot has to remember. Costs: one script, and a hook adds latency to every write. Breaks: nothing.

**Leaning: I3 + I2 + I4.** Keep `P` and `DS`, name the things that are named, write the two-tier rule into CLAUDE.md once, and let a lint hold it. Wrong if the commander wants procedures cited by number in briefs and rosters (in which case `Pr` is the cheap answer, not taking `P`), or if a future consumer outside this repo needs a single regex over every identifier.

## Area 3 — Manifest and unit JSON

The idea: a lightweight named manifest per room, recognisable in streaming output (`MANIFEST-dispatch-cockpit.json`), pointing at per-unit JSON files, so an agent reads manifest then unit and never loads a large file. It solves a real problem in principle: append-forever files eventually cost a full read to answer one question.

**J0 — leave it as it is.** Buys: nothing to do. Costs: `dispatch/cockpit.json` (391 lines) and `orders.json` (307) grow by one entry per team and per session forever; both are read whole today to answer one-row questions. Breaks: nothing yet.

**J1 — split everywhere, with the `MANIFEST-` filename.** Buys: uniformity, and the streaming-output recognisability the commander wants. Costs: roughly forty JSON files become a hundred and forty, most of them five to fifteen lines, for files that were never large; and twelve existing manifests get renamed away from names that already say what they are (`dossiers.json`, `missions.json`, `crew.json`, `topics.json`, `procedures.json`). Breaks: `session-start.sh` reads two of those names directly.

**J2 — split the three that grow without bound.** `dispatch/cockpit.json`, `quarters/commander/orders.json`, `base/decisions.json`. Buys: the actual benefit, at three rooms' cost, following a pattern already proven in `logs/topics/`. Costs: a second convention alongside the unsplit files unless a rule says which is which. Breaks: nothing.

**J3 — split on a stated threshold, enforced.** State the rule ("a manifest splits when it passes roughly 200 lines, or when a unit needs more than a few lines of its own") and let the currency-review procedure or a lint flag files that have crossed it. Buys: the decision is made once and never revisited per-file. Costs: a threshold is arbitrary and will be argued with. Breaks: nothing.

**J4 — do not split; shrink instead.** Where a JSON row has grown prose, move the prose to the markdown unit that in most cases already exists and leave a one-line row. Buys: most of the token saving with no new files. Costs: does not help `orders.json`, which is prose by nature. Breaks: nothing.

**On the `MANIFEST-` prefix specifically.** The stated reason is recognisability in streaming output. `dossiers.json`, `missions.json` and `topics.json` are already recognisable and already name their contents; `MANIFEST-dispatch-cockpit.json` additionally encodes its room in its filename, which means any room move renames every manifest and re-couples area 1 to area 3 for no benefit. If recognisability is the whole aim, a `"manifest": true` key or leaving the names alone gets it cheaper.

**Leaning: J3 with J2 as the first application, and reject the `MANIFEST-<room>` filename.** Wrong if the commander wants units to be individually addressable for a reason other than token cost — for example a per-unit file being the thing an external tool or an orphan-branch worktree checks out.

## Area 4 — Frontmatter

The idea: consistent YAML frontmatter on generated markdown, fields common across document types, replacing bolded metadata blocks, for searchability; a line in CLAUDE.md stating the convention. It solves a real problem: DS001 carries the same facts three times and P004 shipped to the desk with two frontmatter fields empty, so the bolded block and the frontmatter are already disagreeing.

**F0 — leave it as it is** (bolded blocks, frontmatter on five files). Buys: nothing to do. Costs: the three-way duplication stands and worsens. Breaks: nothing.

**F1 — the commander's uniform frontmatter, replacing the bolded blocks.** Buys: `grep '^unit: "DS001"'` and `grep '^type: "Dossier"'` both work across the corpus; the bolded duplicate goes. Costs: the facts now live in two places (frontmatter and the manifest row) with no stated owner, which is the same defect one layer up. Breaks: the sketch's own example, which is invalid YAML and must be `stamp: ["2026-09-18", "Pilot: Ace", "session dcb75456"]` or three separate keys.

**F2 — the markdown owns the facts; the manifest is generated from it.** A script walks the room and rebuilds the manifest from the frontmatter blocks. Buys: one owner, and a unit file that is complete on its own — which matters if files are ever read outside the cockpit. Costs: a generator to write and to keep correct; a manifest that must never be hand-edited, which the pilot will do anyway under rule 10.

**F3 — the manifest owns the facts; frontmatter is a pointer only.** Frontmatter carries `type` and `unit` and nothing else, as CA001 already does. Buys: duplication is impossible by construction, searchability is fully preserved (both the questions frontmatter answers — "what is this file I just opened" and "which files are of this type" — are answered by two keys), and it is the cheapest of the four. Costs: a markdown file read alone does not carry its own date, mission or lineage.

**F4 — frontmatter with fields, plus a lint that checks it against the manifest row.** Buys: duplication is allowed but cannot drift. Costs: a script, and two sources of truth that a human must still reconcile when they disagree.

**Field survey for whichever wins.** Common across all types: `type`, `unit`. Common across ID-based work documents: `work` (mission), `context` (the thing it came from), a date. Type-specific: `status` and `recorded` (proposals only), `generates` (dossiers only), `session` and author (dossiers only). Crew and officer documents share none of the work fields and would want `seat`, `crew`, `model`, `first_flown` — arguably a different scheme wearing the same clothes.

**Leaning: F3, upgraded to F4 only if a lint gets written anyway for area 2.** The three-way duplication in DS001 is the measured defect; F3 removes it without a script. Wrong if the commander intends unit markdown files to be portable outside the cockpit — the orphan-branch idea points that way — in which case F2 is the right answer and the generator is the price.

## How the areas constrain each other

The pilot's working view is that the first three ideas are one scheme. Tested: two of the three, yes; rooms, no.

- **Identifiers and JSON units are genuinely one decision.** A unit file is named for its ID (`T001.json`, `Or001.json`), so deciding the split before the prefix set means renaming every unit file afterwards. Decide together.
- **Frontmatter is downstream of identifiers, not level with them.** It needs the final prefix set for its `unit:` values, and it needs the owner ruling (F2 versus F3) which is its own question. Its field list can be settled at any time after.
- **Rooms are separable, with two threads to cut.** The only things binding rooms to the rest are (a) manifest filenames that encode the room (`MANIFEST-dispatch-cockpit.json`) and (b) `file` fields that cross rooms with `../` (`base/proposals.json` today). Drop the room name from manifest filenames and make every stored path cockpit-relative, and rooms decouple completely. Those two changes are cheap and worth doing regardless of which room option wins.
- **A lint or hook, if built, spans all four.** One script can check IDs, frontmatter, manifest-to-unit resolution and room READMEs. If it is going to exist, that changes the leaning in areas 2 and 4 towards the enforced options.

## Order of change

1. **Decide together, first:** the prefix set (area 2) and whether the manifest or the markdown owns a fact (area 4's F2/F3 fork). Everything downstream cites the prefixes, and the owner question decides whether frontmatter grows fields or stays two keys.
2. **Then, in any order, without rework:** the unit split and its threshold (area 3), the frontmatter field list, the lint script.
3. **Rooms, whenever,** provided the two threads above are cut first.
4. **Rework risk if reversed.** Renaming `P` to `Rq` after frontmatter lands means re-editing every `unit:` line and every `context:` cross-reference. Regrouping rooms after `MANIFEST-<room>.json` lands means renaming every manifest. Splitting units before the prefix set is fixed means renaming every unit file.

## What would block the orphan-branch idea

Out of scope, noted only where the other three could close a door.

- **The guard's allowlist is repo-root-relative and hardcoded** (`ALLOWED = ("flightdeck/.cockpit", ...)`), while `pilot.settings.json` already exports `FLIGHTDECK_COCKPIT`. In a separate worktree or orphan checkout the prefix stops matching and the guard either blocks everything or waves everything through. Making the guard read the env var is a one-line change that costs nothing now and unblocks the idea later. This is the single real blocker found.
- **Stored paths that leave the cockpit** break under an orphan checkout. `base/proposals.json` crosses rooms but stays inside; DS001's prose cites `../../../launch`, which would not resolve. Keeping every stored path cockpit-relative (see "How the areas constrain each other") is the same cheap change, for the same reason.
- **Quickfire commits keyed to locations** (`commit cockpit`, `commit launch`) assume stable top-level room names. If rooms are going to be regrouped at all, doing it before those are scripted is materially cheaper than after.
- **Not a blocker:** the `@procedures/triggers.md` import is relative to CLAUDE.md and survives a move of the whole cockpit.

## Questions for the commander

1. `P` is proposals today with 213 references and nine filenames, and you have suggested it for procedures — keep `P` for proposals and give procedures something else, or pay for the rename to `Rq`? Decides whether nine files, an index and 213 references get rewritten.
2. `Ds` collides with `DS` on this machine's case-insensitive filesystem and breaks your own capitals rule — is plain `DS` acceptable for dossiers? Decides whether 369 references are recased and whether a half-done rename can silently destroy files.
3. Should things currently cited by name — procedures, rosters, records, crew seats — get numbers, or is a named slug an acceptable second tier? Decides whether the identifier rule is one shape or two.
4. When a fact appears in both a JSON unit and a markdown frontmatter block, which one owns it? Decides the entire frontmatter field list and whether a generator or a lint has to be written.
5. Does `records/ (anything recorded)` with today's records becoming `manuals/` mean the word "records" should stop meaning the pilot's source of truth? Rule 2, `records/README.md` and your own library-versus-records distinction in CA001 all rest on the current meaning.
6. Is `MANIFEST-<room>.json` wanted for its own sake, or is being recognisable in streaming output the whole aim? If the latter, the existing names already do it and twelve renames are avoided.
7. In your room sketch the commander sits both at the top level and under `team/officers/` — which was intended? Decides where `orders.json` and the desk live.
8. Do you want a lint script, or a hook, enforcing IDs, frontmatter and the room map, or convention in CLAUDE.md alone? Decides four leanings at once, and it is the only thing that stops the map drifting again the way it already has.

## Change list

- Pass 1, 2026-09-20: first draft. All four areas opened with options, evidence measured directly (guard scope, hard-coded paths, ID counts, JSON line counts, YAML validity of the three worked examples, three-way duplication in DS001). Pilot's one-scheme view tested and found two-thirds right: rooms separate cleanly once manifest filenames and cross-room paths are fixed. Eight commander questions. Not yet incorporating the auditor or scout reports.
