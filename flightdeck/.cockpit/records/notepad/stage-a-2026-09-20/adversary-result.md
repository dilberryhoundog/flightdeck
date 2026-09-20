# T011 — adversary on the code, result pass 2

By `adversary` (Opus), 2026-09-20. Attacks the code as it stands after pass 2, re-read file by file rather than quoted from my earlier pass. Everything below was run. Read-only against the real cockpit; every write test ran against `cp -R` copies in my scratch space. `--apply` was never run against the real cockpit.

**Superseding my pass-1 result findings.** Closed by pass 2: my R7 (a verbatim field was not read) — verbatim fields are now read and noted. My query on note counts — they now print occurrences and rows. Carried and re-verified below: the undeclared-JSON hole, the bare-name case rule. Withdrawn for good: my bytecode suspicion, tested twice and false both times.

## The headline: `--apply` could not be made to write outside tier 1

I planted a `DS001` target in all eight protected locations at once and ran `--id DS001=Ds001 --apply` over the lot.

    cp -R .cockpit $W/c && cd $W/c
    printf 'frozen log cites DS001\n' >> logs/2026-09-18_dcb75456.md
    printf 'scratch cites DS001\n'    >> notepad/ideas-2026-09-20/question.md
    printf 'excluded cites DS001\n'   >  base/bin/fixtures/stage-a/poison.md
    printf 'keep cites DS001\n'       >> cockpit.keep
    printf 'idea cites DS001\n'       >> commanders-desk/out-ideas/frontmatter.txt
    printf '{"kind":"t","rows":[{"quoted":"the commander said \"DS001 stands\" here","esc":"See DS001 now","ref":"DS001"}]}' > dispatch/poison.json
    cp -R . $W/before && python3 base/bin/cockpit-rename --root . --id DS001=Ds001 --apply && diff -rq $W/before $W/c

Three files changed, all correctly: `base/proposals.json` (`dossier` whole value), `dossiers.json` (`id`), and `dispatch/poison.json`'s `ref`. **Unchanged: the frozen log, the scratch file, the excluded fixture, the keep file, the out-ideas file, `out-advice/CA001.md`, the quoted span, and the escape-shifted prose field.** The `"esc"` case was built specifically to break the offset arithmetic — a `S` escape ahead of the token, so the decoded offset and the raw offset disagree — and it still did not produce a stray write. Digit anchoring holds in the same way: `--prefix S=Sp` claims `S001` and not `Sp001`, `W=WS` claims `W001` and not `WS001`, `D=De` claims `D001` and neither `De001` nor `Ds001`, and `P=Rq` takes `P100` while listing `P101` as out of range and leaving it. The ordering gate refuses `--prefix DS=Ds` naming the colliding token and its count. The write path is sound.

## R1 — Undeclared JSON is tier 1, and the pilot's safer rule is measurably free. Medium-high.

Reproduced: `dispatch/poison.json` is in no `fields.json` entry and its `ref` field was written under `--apply`. The prose and quoted fields beside it were not, so the whole-value test governed correctly; the gap is that a file nobody has declared is nonetheless writable.
The measurement that settles it:

    python3 -c "…Store('.'); [rel for rel in every readable .json if not st.doc_for(rel)]"
    → declared patterns: 16   UNDECLARED readable json: 1   (base/settings/pilot.settings.json)

One undeclared readable JSON file exists in the whole cockpit, it is a config object, and it carries no references. So the pilot's leaning — undeclared JSON is tier 2 until declared — moves **zero** tier-1 changes to tier 2 today. It costs nothing, it closes the hole, and it turns declared coverage into an invariant the store can be checked against rather than a property that happens to hold. I withdraw my pass-1 recommendation of a note instead of a gate: I priced the gate without measuring it, and measured it is free. Cure: tier 2 for any JSON with no `fields.json` entry, plus a `store` note naming the file so the fix is obvious.

## R2 — Twenty-nine live citations resolve only outside the cockpit, silently. Medium.

The three-root resolution tries the citing file's folder, the cockpit root, then the repo root, and prints nothing when a citation resolves. I counted where each resolving citation actually landed:

    resolving citations by root: cockpit-root 257, own-dir-only 87, REPO-ROOT-ONLY 39
    repo-root-only AND undeclared (pass silently): 29

Ten of the thirty-nine are declared `external` and become notes. The other twenty-nine are not, and almost all are `logs/topics/*.json` `ref` values of the form `flightdeck/.cockpit/quarters/commander/orders.json#O024` — the live topic index, written repo-relative. They resolve today only because a `.git` sits above the cockpit. These are the same composites the rename tool rewrites as tier 1, so the set is both load-bearing and invisible.
Two consequences. In an orphan-branch checkout — the future DS006 plans for and where the guard's hardcoded allowlist is already flagged — all twenty-nine break at once, and the checker that exists to prevent surprises delivers twenty-nine of them on the first run after the move. And `repo_root_of` falls back to the cockpit's *parent* when no `.git` is above, so a run inside a copy silently uses a different repo root: that is why my copy runs show a `quarters/pilot/identity.md:9` finding for `flightdeck/.cockpit/` that the real cockpit does not have. Nobody should trust a copy's path counts without checking which root it used.
Cure: count a repo-root-only resolution as a note whether or not it is declared external, and print the root used on resolving hits in `--json`. The number then moves before the move does.

## R3 — A stale path in bare markdown prose with no identifier in it is missed entirely. Medium.

    printf 'A stale path in plain prose: missions/GONE-FOREVER.md and that is all.\n' > workshop/fn2.md
    python3 base/bin/cockpit-check | grep fn2   → nothing

Candidates come only from backtick spans, link targets and JSON string values, which is the right call and was measured honestly at one resolving hit lost and zero unresolved. My five planted shapes confirm the rest of it works: a backticked stale path, a link target, an id in prose and a stale path in a JSON prose value are all caught. But the measurement is a snapshot of the corpus as written today, not a property of the rule, and the one shape it misses is the one a person writes fastest. Cure: count unresolved bare-prose path-shaped strings as a note, not a finding — the blind spot is then re-measured on every run instead of once, and the day it stops being empty is visible.

## R4 — The bare-filename case rule still fires only same-directory. Medium, carried and re-verified on pass-2 code.

    printf 'cross-room: `Ds001-flightcrew-recon.md`\n' > workshop/case-bait.md
    python3 base/bin/cockpit-check | grep case-bait   → nothing

`_case_collision` lists only the citing file's own folder, the cockpit root and the repo root, so a bare name whose differently-cased twin lives in another room produces nothing. The same hazard written as a path is caught, through `exists_exact` walking components. So the rule is a same-directory extra and the path form is the real DS/Ds guard; the plan's case 15 should use a path, or it proves a rule that cannot fire on the shape the cockpit actually has.

## R5 — `rewrite()` is handed the spans that would bound its fallback, and ignores them. Low-medium, latent.

`cockpit-rename` computes `spans = self.value_spans(rel, raw)`, passes them into `rewrite(self, raw, spans, items)`, and the body never reads `spans`. When the computed offset does not hold the token, it falls back to `raw.find(token, off-200, off+200)` — a search that is unbounded by the JSON value the reference belongs to, so in principle a tier-1 edit could land on an occurrence 200 characters away in a verbatim or quoted field.
I tried to make it happen and could not: the escape-shifted `"esc"` case is exactly the input that breaks the offset arithmetic, and the stray edit did not occur because that reference was tier 2 and tier 2 is never written. The hole is latent rather than live. Cure is one line and the data is already in hand: clamp the fallback to the ref's own span.

## R6 — The one legacy coupling that cannot be removed, and should be named. Low.

    base/bin/cockpit-check:36   if os.path.isdir(os.path.join(d, "base", "store")):
    base/bin/cockpit-rename:473 same
    base/bin/cockpit_store.py:19 STORE_DIRNAME = "base/store"

Pass 2 derived the other two literals, and this one cannot be: the store's own path is what finds the store. It is safe under O050, where `base/` survives as one of the five rooms. Worth a line in `base/store/README.md` saying it must move in lockstep if `base/` ever does, because it is the single place a room rename would silently break both tools.

## R7 — Output meets the contract. Low, no change wanted.

A clean run is one line (`cockpit-check --zone commander` → `cockpit-check: clean - 21 ids, 0 paths, 5 files, 7 notes.`). The real cockpit produces 84 lines, of which 79 are findings and 57 of those are the advice rename, so the steady state after the repair is about 22. Each finding carries file, line, fault and the exact replacement where one is known. That is the commander's requirement met, and the only thing worth saying is that the first run after the advice repair will look four times quieter.

## Verdict

**Fit to rely on for the advice repair.** The write path held against every attempt to make it write outside tier 1, including the one input built to break its offset arithmetic; the frozen, scratch, excluded, commander-verbatim and commander-reviewed zones all survived a full apply; digit anchoring and the range split are exact; and the advice repair itself is 33 tier-1 composites plus 24 tier-2 hunks, which is the shape DS006 asked for. R1 is worth taking before the identifier pass and costs nothing; R2 is worth knowing before the orphan-branch move rather than after; R3 to R7 are improvements, not blockers.
