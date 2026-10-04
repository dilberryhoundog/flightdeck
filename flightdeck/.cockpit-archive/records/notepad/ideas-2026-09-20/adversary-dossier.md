# T010 adversary — attack on DS006, the dossier

Seat `adversary`. Measured 2026-09-20 against the working tree and against the paper, the three evidence reports and my own file. Read-only; nothing written in the repository. Held to the shape of DS004 and `in-dossiers/README.md`.

## D1 — An inference is filed under "By you". High. High confidence.

Quoted, under **By you**: "Procedures join missions and workshop as a work room, which the pilot reads from 'M, WS, P for work' and treats as stated."
O046 rules a prefix convention: "Procedures will be key references, and having M, Ws, P for work is a decent convention." That is about three prefixes reading as a set, not about a `work/` room. The room grouping comes from `cockpit-setup.txt`, which O044 rules an idea and not an order. So the commander has ruled neither, the paper carried it as "to confirm rather than ask", and the dossier promotes it to a commander ruling and then acts on it at order of change 4, "`work/` first as the cheapest corner". The commander reading "By you" will not know they are being shown their own sketch back.
Cure: move the sentence to "By the pilot, yours to overturn", or make it a one-line confirmation beside decision 4.

## D2 — The breakdown of the live count does not sum to the live count. Medium-high. High confidence.

Quoted: "518 live (509 repairable, 9 inside your verbatim `text` in `orders.json`) ... Of the live ones 169 are in markdown, 280 in live JSON, 56 in the topic index."
169 plus 280 plus 56 is 505, not 518. The 518 is the option-maker's pattern; the three-way split is mine, taken with a different one. Both are defensible and the dossier presents them as one arithmetic. The commander will add them.
Cure: take all four figures from one pattern, or say the split is by a second count and approximate.

## D3 — A withdrawn claim is restated without its caveat. Medium. High confidence.

Quoted: "Rooms are cheaper to move than they look, and coupled to less ... Rooms decouple from the other areas once nothing is keyed on a path."
The paper withdrew that sentence. Rooms decouple from identifiers, manifests and frontmatter, but not from the store: R4, the per-room `CLAUDE.md` that makes the map self-maintaining, is built out of the stage B linter, and the dossier's own order of change 4 carries it — "a small CLAUDE.md per room so the map lives where the room does". A reader who never sees the paper takes "decouple" as licence to schedule rooms in parallel with everything else.
Cure: "decouple from identifiers, manifests and frontmatter; the map fix still waits on the linter."

## D4 — Decision 1 and proposal P013 ask the same thing twice, one open and one already answered. Medium. High confidence.

Quoted, header: "**Proposals arising:** P013 (build stage A by the outside-build route)." Quoted, decision 1: "The pilot proposes: crew build and test outside the cockpit ... The alternatives are the pilot writing it or crew writing inside."
The `in-dossiers/README.md` shape says the dossier boils down into proposals the commander approves, denies or changes, so P013 is the right vehicle and the recommendation is right. But the same question also heads a list of ten decisions, with the route presented as open. The commander can answer decision 1 one way and rule on P013 another, and nothing in the file says which governs.
Cure: decision 1 reads "answered by P013, approve, deny or change", with the two alternatives named there.

## D5 — "Eight script paths" understates the paper's eleven, and drops the file the last bullet depends on. Medium. High confidence.

Quoted: "The guard knows only the cockpit root; eight script paths are hardcoded."
Measured: `base/bin/pilot.sh` four, `base/bin/session-start.sh` four, `base/settings/pilot.settings.json` two hook commands plus the cockpit path — the paper and the auditor both say eleven. Eight counts the two shell scripts and silently drops the settings file, which is the same file the dossier's own closing bullet relies on: "the guard hardcodes its allowlist while the settings file already exports the cockpit path."
Cure: eleven, or "eight in the two shell scripts and three more in the settings file".

## D6 — Decision 10 is implementation with no policy in it, and the dossier says so itself. Medium. Medium-high confidence.

Quoted: "**The stage B engine, open.** Copy flightcrew's Node engine into `base/` ... or write a validator in Ruby ... **Nothing in stage A waits on this.**"
Both options sit inside the cockpit, so rule 6 does not reach them, and the pilot rules comparable mechanics throughout this dossier — P101, the rename mechanics, the parsing subset, the three tiers. A language choice for a tool the pilot will run, explicitly deferred and explicitly blocking nothing, is the pilot's. It is the one item on a ten-item list the commander gains nothing by working through.
Cure: rule it when stage B starts and say so, or keep it and state what the commander's answer would turn on that the pilot cannot judge.

## D7 — The team account misstates the roster and the round counts. Low. High confidence.

Quoted: "Five seats from the `decision` roster" — `dispatch/rosters.json` gives that roster four seats: cockpit-auditor, practice-scout, option-maker, adversary. The fifth, assets-scout, is not in it, and the same sentence says it was "added on your lead", which contradicts the clause it sits in.
Quoted: "the adversary's four rounds" and "then four rounds and a verdict" — there were five, against passes 5, 6, 7, 8 and 9. Quoted: "Messages between the two Opus seats crossed four times" — by the option-maker's own account they crossed twice.
Cure: "the four-seat `decision` roster plus assets-scout, added on your lead"; five rounds; twice.

## What holds

Every other figure I can check is supported. The 24 broken references verify exactly (25 hits in live rooms less `orders.json`'s verbatim one). 1,230 raw with 545 scratch and 167 frozen reconciles with the paper's table. The 509-and-9 split, the 13-of-17 `../` strings, the nine-of-seventeen manifests with eight pointing at markdown, `cockpit.json` and `orders.json` at about 5.5k tokens, the 200-line memory cap, DS001 failing to parse while P004 and CA001 to CA003 pass, the 327 lines at 93e18c5 with no YAML parser, node absent from a bare path, Ruby's standard library carrying no JSON Schema validator, `logs/README.md`'s false script-generated line, the broken `superseded_by` in the topic store, and the 113-against-9 notepad figure all check out.
My four closing findings are carried without softening: the three tiers with the whole-value test, the advice files as decision 2 with the citation reading and the commander seeing the diff, stage A parsing no frontmatter with the single reader in stage B, and the tiers preferred over the total. The zone-error paragraph names both seats' mistakes, including mine, and draws the right rule from them. "What the pilot does not claim" is the strongest section in the file and gives away more than it had to.

## Verdict

Fit for the desk once D1 and D2 are fixed. D1 is the only one that misleads about authority — it shows the commander their own sketch under the heading of their own rulings — and D2 is the only arithmetic a reader can falsify in their head. D3 to D7 are accuracy repairs that change no recommendation.
Nothing the commander needs is missing, and one thing is present that need not be: D6. Nothing is softened; the withdrawals and residuals from four rounds are all carried, and the density matches DS004.
