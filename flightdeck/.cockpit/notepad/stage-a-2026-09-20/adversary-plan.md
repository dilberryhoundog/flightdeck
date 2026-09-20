# T011 — adversary on the build plan, pass 1

By `adversary` (Opus), team T011, mission M001, 2026-09-20. Attacked against `spec.md` as it now stands and against DS006's closing section and O044 to O055. Every count below re-measured against the real cockpit read-only; commands in my transcript. Seven findings, ranked.

## P1 — The fixture tree is excluded as a *citation*, not as a *zone*, so the checker still scans it. High.

Quoted, `paths.json`: "`planned`: ruled-but-absent paths that are not findings (… `base/bin/fixtures/` …)". Quoted, `zones.json`: the rule list runs `records/notepad`, `notepad`, `logs/crew-manifest.json`, `logs/*.md`, `**/*.keep`, out-ideas, out-advice — "default `live`".
`paths.planned` stops `base/bin/fixtures/` being reported when some file *mentions* it. It does nothing about the files *inside* it, which fall to the default zone, `live`. The fixture tree is required by the spec to contain a stale path, a stale id, a `C` id, `P004` and `P101`, a scratch file full of stale ids and a second minting register. At spec step 4 the tools are run against the real cockpit, where that tree now exists, so every planted fault is reported as a live finding and buries the real ones — and the planted second register makes the checker report the cockpit itself as having two registers for that prefix, the one rule with no other detector. On the write side `--apply` tier 1 rewrites whole-value references in live JSON, so the first apply run repairs the suite's planted faults and the tests go green against fixtures that no longer test anything. Line 91's "a fixture tree with its own `base/store/`" covers the test runs and not the proving run.
Cure: first rule in `zones.json`, `{"match":"base/bin/fixtures/**","zone":"excluded"}` — never opened, never written — with case 1 asserting it against a tree that contains the real cockpit's own `base/bin/fixtures/`.

## P2 — The `commander` zone is tier 3, and the ruling makes it tier 2. High.

Quoted: "**Tier 3** if F's zone is `frozen`, `commander` or `scratch` … Never touched, **never proposed**."
The spec as the pilot has now stated it puts the commander's own files at tier 2: proposed, never applied. DS006 decision 2 is where that comes from — the advice files are citations, repaired in the reviewed tier, "with you seeing the diff of your files before it lands" — and D027 has the pilot repairing them by hand. Under tier 3 no diff is ever generated for CA001 to CA003, so the commander never sees the diff the ruling promises and the pilot repairs nine identifiers with no machine-produced starting point. `*.keep` and `out-ideas/` behave correctly as never-proposed; it is `out-advice/` that the ruling moved.
Cure: split the zone — `commander-verbatim` (keeps, out-ideas) stays tier 3; `commander-reviewed` (out-advice) is tier 2, diff emitted, never applied.

## P3 — Two rename sources claim the same string and no order is stated. High.

Quoted, `paths.json`: "`renames`: … seeded with `commanders-desk/out-advice/DS001.md` → `CA001.md` and DS002, DS003". Quoted, `prefixes.json`: `{"prefix":"DS", … "succession":{"type":"renamed","to":"Ds","keep_number":true}}`.
Both match `DS001` inside `commanders-desk/out-advice/DS001.md`. Run `--prefix DS=Ds` before the path repair and 57 references — 24 live plus the 33 in `logs/topics/` — become `out-advice/Ds001.md`, a dossier path that has never existed. Nothing catches it at the time, and the damage is not just wrong: `paths.renames` is keyed on `DS001.md`, so after the pass the exact replacement no longer matches and the finding degrades to a basename guess or `no known replacement`. The ordering exists in DS006 — stage A's first job is the 24 references, the identifier pass second — but the tool does not enforce what the order of change assumes.
Cure: `cockpit-rename` refuses any `--prefix` run while a `paths.renames` entry still has live hits, and says which.

## P4 — Eight of the eleven "real id findings" are not faults, and they are the first output anyone sees. Medium-high.

Quoted: "**11 are real id findings**: `C014` ×1 and `C015` ×2 in `workshop.json.source`, `C023` ×1 in DS006 prose, `M003`–`M006` ×7 in P004/P005 prose."
Checked each. `C014` and `C015` are genuine — `workshop.json` rows cite "doctrine-recon C014" and "docs-verifier C015" against a frozen manifest that stops at C011, so three occurrences are true dangling references and a good catch. The other eight are not. `M003` to `M006` are missions that **P004 is asking the commander to open**; P004 is a live, undecided request and `missions.json` holds M001 and M002, so those seven are forward references in a proposal doing its job. `C023` is inside an illustrative quotation in DS006 — `"document-critic" says who is flying; "C023" does not` — an example, not a citation.
So on day one the tool reports eleven id faults of which three are real. The plan already has the concept in two other places: `planned` prefixes and `planned` paths are notes, never findings. It is not applied to ids.
Cure: `prefixes.json` carries `planned_ids` (M003–M006 today, sourced to the request that proposes them) counted as notes, and an id inside a quoted span in prose is a candidate only when the quote is a path.

## P5 — There is no state for a prefix that has been superseded, so a second pass is still accepted. Medium.

Quoted: "`state` … `live` … `planned` … `retired` (`C`, resolves against the frozen manifest only). **After the identifier pass the pilot flips `state` on both halves and the same table is still correct.**"
It is not. After the pass, `DS` has no live ids but keeps `succession.type: "renamed"`, so `--prefix DS=Ds` is still a legal run — and the second run reaches whatever `DS###` remains in frozen logs and scratch if either is ever brought into scope. Flipping `DS` to `retired` is worse, because `retired` means C's case, no successor, resolves against a frozen manifest. The two are different things: C never had a successor; DS has one and has already used it.
Cure: a fourth state, `superseded` — never minted, resolves only in frozen and scratch, and `cockpit-rename` refuses it exactly as it refuses `retired`.

## P6 — The case list misses the three failures above, and the composite is where they meet. Medium.

The twenty-seven cases cover this session's failure list well: O048 untouched (1), `by` as prose (4, 5), quoted commander words in pilot prose (3), scratch ignored (13), a frozen `C` (12), `P` reassigned (10, 11), a second register (16). Case 21 covers the `path#ID` composite where the path is stale. Nothing covers: a `--prefix DS=Ds` run attempted while `paths.renames` still has live hits (P3), and the composite is exactly where it bites, since 33 of the 57 sit in `statements[].ref`; an `out-advice/` file producing a tier-2 diff that `--apply` then declines to write (P2); the real cockpit's own `base/bin/fixtures/` being skipped by zone, not merely unreported as a path (P1); and a live request proposing ids that do not yet exist (P4).
Cure: four cases, one per finding, and make the P3 case use a topics `ref` value so the ordering and the composite are proved together.

## P7 — `Exit 1.` is a blocking contract in the one place the lint is meant to gate. Low.

Quoted: "Exit 0 clean, exit 1 with findings, exit 2 on a broken store" and the tail line "`Exit 1.`". D027 rules the lint non-blocking. Exit 1 is harmless from a procedure and is a failed commit under the W3 commit gate the paper leans to, which is where a non-blocking ruling matters most.
Cure: state that exit 1 is informational, and that any commit gate treats only exit 2 as failure.

## What holds, and it is most of it

The tier test on the value rather than the field name is right and is what makes `decisions.json.by` land correctly without a special case — the plan reaches that conclusion from its own measurement (12 of 25 values are the bare word `commander`) rather than from my finding, which is the better way to have got there. Restricting path candidates to backtick spans, link targets and JSON string values is the strongest single decision in the plan: measured at one resolving hit lost and zero unresolved, it removes `pass/fail` and `they/them` without a hand-written exception list, which is exactly the shape the spec asked for. The composite `path#ID` as one whole value is a shape the spec never named and the plan found; without it the 33 topic references would have fallen to tier 2 and the largest single block of the repair would have needed a human. One row per prefix with `segments` for `P`, and a derived succession subset the rename tool consumes so it can never acquire a `C` rule, is the cure I proposed in its stronger form. Case-sensitive resolution by cached `listdir` rather than `os.path.exists`, and the four-step case-only rename with a post-assert, are correct on a filesystem measured `core.ignorecase true`. `--apply` refused without an explicit `--root`, no `--fix` on the checker, and case 27 hashing the tree before and after are the right safeguards given that the guard cannot see an interpreter-run script. The 24 live advice references reproduce the dossier's figure exactly, by zone, and the plan says so.

## Verdict

Sound plan, three hard defects, none of them in the design. P1, P2 and P3 are all the same class — a rule written in the right file but in the wrong one of two places — and each has a one-line cure. P3 is the one that would do irreversible damage, because it destroys the replacement data that makes the other 57 repairs exact. P4 decides whether anyone trusts the first run. Fix those four and the case list, and this is ready to build.

# Pass 2 — re-attack on the changed parts only

**Withdrawn:** P1, P2, P5, P6 and P7 are taken as written and no longer stand. P3 is taken and improved: the gate's tier-1-and-2 counting is correct and my finding did not reach it — counting the `orders.json.text` reference would deadlock the pass permanently on a string nobody may repair. P4 is taken and its arithmetic confirmed; I re-measured the quoted-span corpus independently and the builder's 6-below-the-fence and one-resolving-hit both reconcile (my raw 7 includes `Or001`, filtered earlier as a planned prefix).

**Q1 — The quotation rule buys one finding and pays with a permanent blind spot in both tools. Medium-high.**
Quoted: "suppressing them removes **5 false findings** (`C023` … and the four mission titles the commander quotes in `CA001`) and loses **one** resolving hit". Measured, the seven ids in quoted spans in live markdown bodies are `Or001` and `C023` in DS006, and `M002` to `M006` in CA001 lines 30-32. `M002` is the resolving hit. But `M003` to `M006` are exactly the rows this same pass added to `planned_ids`, so they are already notes and are removed twice; `Or001` is already removed as a planned prefix. **The marginal gain of the quotation rule over the rest of pass 2 is `C023` alone.**
Against that: the plan's own top line is "zones decide what is read, tiers decide what may be written", so an id the checker does not read is also an id `cockpit-rename` does not rewrite. A quoted `"P004"` in a pilot-authored dossier would therefore survive the identifier pass as a stale `P004` that the checker can never afterwards see — silent permanent staleness, in the tool built to prevent it. Today that costs one occurrence; the cockpit's prose quotes the commander on every page, so it does not stay at one.
Cure: drop the body rule and fix `C023` at source — it is an illustration in the pilot's own `DS006`, so writing `C###` removes the finding with one character and no tool behaviour. Keep the JSON-prose half, which is prophylactic and costs nothing. If the rule is kept, it must at least emit a `quoted, not checked` note per occurrence so the blind spot is auditable, and `cockpit-rename` must list those spans in its change list.

**Q2 — The ordering gate is scoped to the whole rename table, and the refactor flight will carry two rename sets at once. Medium.**
Quoted: "`--prefix` is refused, exit 2, while **any** `paths.renames` entry still has outstanding hits". The collision P3 named is specific: `DS` sits inside `out-advice/DS001.md`, so a prefix pass can corrupt that entry. A room-move entry such as `records/` to `records/manuals/` contains no id token and no prefix pass can touch it — yet it would refuse the identifier pass all the same. DS006's closing section has the identifier pass and the room move as two commits in one refactor flight, so both sets will sit in that table together.
Cure: gate only on entries whose old path contains a token the requested prefix pass would rewrite, and say so in the refusal message.

**Q3 — The frontmatter locator fails open into the body. Low.**
Quoted: "the frontmatter block is located by position, two `---` fence lines at the head of the file, which is a line count and not a parse". If the opening fence has no closing fence, the block is never found and the whole file is treated as body — so a malformed frontmatter block's quoted values are suppressed rather than checked, which is precisely the `work`/`context`/`generates` chain DS006 requires the checker to verify. Cure: an unterminated opening fence within the first twenty lines is a `format` note, and the file is treated as having no body suppression.

**Verdict: build** — Q1 is a design choice the pilot should settle before the fixture-writer encodes it as check 10, and Q2 and Q3 are one line each that can land during the build.
