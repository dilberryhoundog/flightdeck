# Stage A, attacked for bulk — `trim-critic`, T012, roster `mini-adversary`, mission M001, 2026-09-20

Every number below was measured on the tree as it stands at 18:20 today, not estimated. Method: `wc -l`; `/usr/bin/python3 base/bin/cockpit-check` under `--zone live`, `--zone all`, `--zone commander` and `--json`, byte-counted; both test suites run; a 103-line replacement checker written in the scratchpad and diffed finding-for-finding against the real one. Nothing in the repository was written except this file.

Ground that moved under the brief, re-measured: `cockpit-check` is 470 lines, not 457. There is a third test file, `base/bin/test_cockpit_guard.py`, 80 lines, which is not Stage A's and which I have not judged. The fixture restructure the brief called interrupted is finished: 32 files, 1,382 lines, a coherent two-tree shape (`cockpit/` and `broken-store/`), and both suites are green — 17/17 check cases and 13/13 rename cases, 0.89s and 1.10s.

Current weight: tools 1,723 lines (`cockpit_store.py` 740, `cockpit-check` 470, `cockpit-rename` 513); tests 800; store 431 (197 + 117 + 50 + 28 + 39); fixtures 1,382. Total 4,336 lines for a cockpit of 104 live files.

## The headline measurement

I wrote a replacement checker of **103 non-blank lines**, stdlib only, no classes, one file. Run against the real cockpit it prints **77 findings: the same 77 the 1,723-line toolset prints, with zero misses and zero false positives** — file, line, kind and the exact replacement, identical set. It reads `prefixes.json` and `paths.json`, hardcodes a six-entry skip list in place of `zones.json`, and never opens `fields.json` at all. It runs in 0.08s against the real tool's 0.15s.

That is the whole of this review's case. The permanent checking job — job three of the three — is a 103-line job. The other 1,620 lines of tool buy the migration, the tier machinery the migration needs, and a set of cases that occur zero times.

## The three cuts that matter most

### Cut 1 — `cockpit-rename` and its test are migration scaffolding, not cockpit furniture: 873 lines to 0 permanent

`cockpit-rename` is 513 lines and `test_cockpit_rename.py` is 360. Together they are 20% of the build and they are written to self-terminate. `add_prefix` refuses any prefix whose state is `retired` or `superseded` (cockpit-rename:60) and refuses any row with no `renamed` succession (cockpit-rename:70). The plan has the pilot flip every renamed row `live`→`superseded` the moment the identifier pass lands (plan.md:21). So after the six-prefix pass, every row in the table is `superseded`, `retired` or successionless, and the tool refuses all sixteen. It runs twice — the path repair and the prefix pass — and then declines every input it was built to take, for the life of the cockpit.

What is lost by cutting it: nothing permanent. What is lost by cutting it *now*: the tier-2 unified diff for the commander's three advice files and the two-step case-only rename, both of which are real and both of which are wanted for the 518-reference pass. So the cut is not "delete it", it is "**do not file it in `base/bin/` as furniture**". Run the migration from `notepad/stage-a-2026-09-20/`, then delete both files and their nine rename-only fixture cases. `base/bin/` keeps one tool, not two.

### Cut 2 — `fields.json` and the tier machinery serve the rename tool, not the checker: 117 lines to about 4

`fields.json` is 117 lines: 16 document entries, 39 `whole_value` declarations, 2 `verbatim`. My 103-line checker never opens it and loses nothing — same 77 findings. Its entire measured return inside `cockpit-check` today is **one** store note (`decisions[].proposal is declared whole_value but holds 'P001, P002, P003'`) and **one** load-bearing declaration (`orders[].text`, which is one line). The other 38 `whole_value` rows exist to sort references into tier 1 and tier 2, and tiers only decide what `cockpit-rename` may write. No tier, no need for the declarations.

What is lost: the `tier1 37, tier2 42` split in the summary tail, which nothing consumes; and the whole_value-rot note, one occurrence, which a pilot would find by reading the line anyway. Once cut 1 lands, `fields.json` becomes a four-line verbatim list. The store then goes from four files and 431 lines to **one file of about 260** — `prefixes.json`'s 16 rows are the real data and stay, `paths.json`'s 22 entries stay, `zones.json`'s 9 rules become a 6-entry skip list. Four files because the design liked four categories, not because the data needed four: `zones.json` is 28 lines and `paths.json` is 50.

### Cut 3 — features measured at exactly zero occurrences in the cockpit today: about 200 lines

Counted individually, each with today's occurrence count from `--json`:

- `check_second_registers`, cockpit-check:304-344 — **41 lines, 0 findings today**. It walks every live JSON file a second time to catch drift that has never happened.
- Dead code: `walk_json` (cockpit_store:404-418, 15 lines) and `_token_positions`/`_pop` (629-645, 17 lines) are defined and called from nowhere in any of the five files. **32 lines, 0 callers.**
- `frontmatter_unterminated` and its `format` note, cockpit_store:447-458 plus plumbing — **20 lines, 0 notes today**. The plan concedes it is for stage B and that all five frontmatter files close by line 7.
- The quoted-span tier-3 pin (`DQUOTE`, `quoted_spans`, `in_spans`, the branch at cockpit-check:233) — **about 12 lines, 0 findings today**. The plan itself calls it prophylactic and measures it at zero.
- `_case_collision` and `bare_re`, cockpit_store:689-703 — **17 lines, 0 findings today**.
- `--json` in both tools — **23 lines**. It emits 29,939 bytes against the text run's 12,915: **2.3× the cost for the same 77 findings**, and I found no consumer anywhere in `base/settings/`, `base/bin/*.sh`, `procedures/` or `.claude/`. Under O054 ("whatever saves the most tokens") an unconsumed output mode that costs 2.3× is a straight loss.
- `--from FILE`, cockpit-rename:481-486 — **6 lines**, no consumer, and three `--path` flags do the same job.
- `superseded` state handling, cockpit-check:97-107 plus the Mapping refusals — **about 11 lines**. The real store has 9 `live`, 6 `planned`, 1 `retired` and **0 `superseded`** rows; the only `superseded` prefix anywhere is `Q`, invented for the fixture.
- `Store._normalise`, cockpit_store:92-150 — 59 lines, of which about 40 accept a map *or* a list container for every store file, defending against variance in a store the same team wrote in the same session.

Sum: **about 202 lines, plus their fixture and test cases**. What is lost: `second-register` is the one with a genuine future — it catches a real class of drift — but it is 41 lines against zero occurrences and belongs in the checker only once a second register has happened once.

## Findings ranked, after the three cuts

1. **The output is right-sized on success and wrong-sized today, and today is temporary.** A clean run is 62 bytes, roughly 16 tokens: `cockpit-check: clean - 21 ids, 0 paths, 5 files, 7 notes.` That meets O054 emphatically. The current failing run is 12,915 bytes, roughly 3,229 tokens — but **53 of the 79 findings are the same three advice renames repeated**, and across all 79 there are only **23 distinct (kind, message, replacement) triples**. After the migration lands the residue is about 26 findings, roughly 700 tokens, and then zero. The per-session steady-state cost of this lint is about 16 tokens. That is the right answer and the team got it right.
2. **One grouped-output change worth making anyway.** Because the ratio of lines to distinct faults is 79:23, a repeat finding should print as `commanders-desk/out-advice/DS001.md -> CA001.md (18 hits)` followed by bare `file:line` locations. Measured on today's output that is roughly 12,915 bytes down to about 4,000, a 69% cut, with nothing lost — every location is still named, which is what O054's "small edit to fix" needs.
3. **The test weight is inverted against the risk.** `cockpit-rename` is the only thing in Stage A that can destroy anything, and it has 360 lines of test that hash the tree before and after every case — proportionate, and the cases that guard real damage are there: rename case 5 (`(O001 is not very readable)` survives a full `--prefix O=Or --apply` byte-identical), case 7 (commander-reviewed is diff-only), case 8 (frozen, scratch and the excluded zone untouched). `cockpit-check` writes nothing under any flag, has no `--fix`, and carries **440 lines of test and 17 cases** for a tool whose worst failure is one wasted pilot edit. Roughly 8 of those 17 cases guard the tool's own complexity rather than any damage: 12 (planned_ids rot), 13 (planned prefix notes), 15 (superseded), 16 (second register), 17 (`--json` parity). Cut those with their features and the check suite is about 200 lines.
4. **The `excluded` zone earns its place in one line.** `base/bin/fixtures/**` first, never opened. Without it the fixtures' planted duplicate register and broken references bury the real findings and an `--apply` repairs the suite. It is one rule and it is correct. No change.
5. **Case-sensitive resolution earns its place.** `os.path.exists` lies on this filesystem, `core.ignorecase` is true, and the whole DS→Ds hazard turns on it. `exists_exact` plus the `_dircache` is about 18 lines and is the single most load-bearing thing in the file. No change.
6. **`json_spans` (cockpit_store:313-401, 89 lines) is the right size for what it does.** A character walk that keeps exact offsets is genuinely necessary: a parse-then-search would mismatch on a repeated string and could land a rewrite inside the commander's own words. But it is needed only by the *writer*. My 103-line checker gets identical findings from plain line scanning. It goes with cut 1.
7. **The plan is 130 lines of dense single-line prose for a 103-line job.** The spec at 35 lines is the right size. The plan plus `adversary-plan.md` (70 lines) plus this report is more prose than the permanent tool has code.
8. **Against what exists already**: `notepad/ideas-2026-09-20/assets.md:14,20` records flightcrew's `schema-lib.mjs` at 215 lines and `spec-readiness-lint.mjs` at 330 on other branches. Those are Node and they validate schemas, not references — no reuse, correctly judged. But they set the scale: flightcrew's whole schema engine is 215 lines. Stage A's reference checker is eight times that.

## The smallest tool that would do the three jobs

Built and measured, at `/private/tmp/claude-501/-Users-dylangraham-Projects-flightdeck/b27e6c01-a246-44bd-950b-90d8452b439a/scratchpad/mini-check.py`, 103 non-blank lines:

- Reads one store file: the 16 prefix rows with their registers and ranges, the rename pairs, the planned and external lists, the gaps and planned ids. A six-entry skip tuple replaces `zones.json`.
- Walks the tree, skips `base/bin/fixtures/`, `base/store/`, `notepad/`, `logs/*.md`, `logs/crew-manifest.json`; skips lines in `orders.json` carrying a `"text"` key.
- Per line: the id regex with prefixes sorted longest-first and the digit anchor; path candidates from backtick spans, link targets and whole JSON lines, anchored on a known extension or an enumerated room.
- Resolves case-sensitively against the citing folder, the cockpit root and the repo root, with a `listdir` cache. Looks up the rename table for an exact replacement.
- Prints `file:line  kind  what -> replacement`, one line each, then a count. Exit 0 or 1. Writes nothing.

What it would not do, honestly: no tiers, so it cannot drive a rename tool; no `--zone`, `--json` or positional narrowing; no second-register detection; no store-rot checking; no `superseded` state; no composite `path#ID` id-half checking (it checks the path half only); no `--root` retargeting, so it is not testable against a fixture tree without one more argument. The first of those is the real one — **the 103 lines are the permanent checker, not the migration tool**. The migration needs the tiers and the diffs, which is cut 1's whole point: build them, use them twice, then do not keep them.

## Verdict for the commander

Keep trimmed, and set the trim date now rather than later.

Stage A works: both suites are green, the checker finds 77 real broken references including all 57 of the advice rename, it writes nothing under any flag, and a clean run costs about 16 tokens a session, which is exactly what O054 asked for. Do not set it aside — re-doing it costs a session and the migration is imminent.

But 1,723 lines of tool and 800 of test are roughly four times the permanent job. A 103-line replacement produces the identical 77 findings with zero misses and zero false positives. Run the migration with the tools as built, then cut: delete `cockpit-rename` and its test from `base/bin/` once the prefix pass has landed (873 lines), collapse the store's four files into one and drop `fields.json` (about 290 lines), and remove the nine features measured at zero occurrences (about 202 lines). That leaves roughly 350 lines of permanent tool and 200 of test in `base/bin/`, which is the size of the job.

One change worth making before the migration, not after: group repeat findings by (old → new) with bare `file:line` locations beneath. Measured on today's output that is 12,915 bytes down to about 4,000, with nothing lost.
