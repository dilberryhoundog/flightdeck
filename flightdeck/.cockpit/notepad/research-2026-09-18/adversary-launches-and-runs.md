# adversary: launches-and-runs — T006

Attacked under revised rule 2: one topic whole, every sentence earning its place, 100-line tripwire. 83 lines, inside it. My earlier High on the pull-request wording is resolved and withdrawn: the record now keeps "the next launch creates new run PR's" and flags the tension instead of smoothing it, which is the right call. The tree is restored with `run outputs...` and the invented brace notation gone. The supersession check is stated in the header, which answers the half of DS002 nobody had addressed.

**F1** — **A new fidelity regression inside the blockquote added by this revision**
**S-M** · **C-H**
**FINDING**: The long quotation beginning "Hangon A HUUUUGE principle" is presented as the commander's words in a blockquote, but it has been silently corrected and recapitalised. The commander typed "improvment"; the record prints "improvement". Six sentences that begin lowercase in the source begin with capitals in the record. The same file preserves "untill", "sperated", "assests" and the whole lowercase run of the ending quote, so the standard is applied inconsistently inside one record, and this is new since the version I last read.
**EVIDENCE**: The source sentence reads "Hangon A HUUUUGE principle of orchestrated runs is iterated improvment. abandon failed runs. runs should accumulate many retries until they succeed, rather than one shotting. do we want awesome-run-1..." Every sentence after the first is lowercase, and "improvment" has no second "e". Either mark the block as lightly regularised, or print it as typed as you do elsewhere.

**F2** — **The record contradicts itself about whether it is one record or two**
**S-M** · **C-H**
**FINDING**: Under "What a run is" the record states "The two terms define each other, which is why they are one record." Under "How a launch proceeds" it states the commander's wording is kept "because these two records exist to hold the words apart." Both cannot be true. The second is a leftover from the merge.
**EVIDENCE**: Quoted above from the draft itself. Nothing external is needed. Fix the second clause to say this record, not these two records.

**F3** — **The topic is not whole: phase and gate are named three times and never defined**
**S-M** · **C-M**
**FINDING**: Revised rule 2 requires a record to cover "one topic whole" so "an agent reads one file for one question". This record tells the pilot that `launch.json` "holds the launch's phase and gate state" and quotes the commander on phase state, but never says what a phase is, what the phases are, or what a gate gates. A pilot who comes to this file to understand a launch cannot learn from it what a launch has to pass through. That is the largest hole in an otherwise complete topic.
**EVIDENCE**: The machinery is current, not historical, so DS002 does not bar it. `flightcrew-core:flightdeck/flightcrew/schemas/launch.schema.json` at commit `27f6969` lists `phase` and `gates` among its twenty required fields, alongside `status`, `acceptance`, `ceilings` and `outcome`. Describing what those currently are is the current form. What DS002 barred was measuring the built runner against the commander's definition, and what fails the two-year test is the observation that specific live launches do not satisfy that schema. Restore the machinery, sourced as branch, path and commit per rule 2. Leave the comparison and the failing launches out, which is where I think your cut went one step too far.

**F4** — **An unsourced negative that collides with the cockpit's own use of the word**
**S-M** · **C-M**
**FINDING**: The record states "The commander also uses 'mission' casually, as a synonym for a large feature (`9b679556:6718`). It carries no separate machinery." The citation supports the first sentence only. The second is an inference, and inside the cockpit it reads as false, because missions there are a first-class thing with a manifest the pilot maintains.
**EVIDENCE**: The cited turn contains only "What happens if I want to build a large feature (mission) so I make flightdeck-buildout for this". Nothing in it addresses machinery. Meanwhile cockpit rule 10 requires "The mission manifest" to be kept current and the cockpit keeps `missions/missions.json`. Scope the sentence to flightcrew launches explicitly, or drop it. As written, a pilot reading this record could conclude their own mission manifest is decorative.

**F5** — **A causal citation that still does not carry the cause, standing from the last pass**
**S-L** · **C-M**
**FINDING**: Under "What a retry may change" the record says verification being an axis is "why checks sit in the run and not in the launch (`8fdc3b29:3569`)". Line 3569 is the placement pipeline and offers no reason. You fixed this in the ownership bullet, which now correctly gives growth as the commander's stated reason, so the record now states two different reasons for the same placement and cites the weaker one for the causal claim.
**EVIDENCE**: The commander's reason, which you quote correctly elsewhere in this same file, is that checks "may have to change/grow as the iterations discover check improvements" (`8fdc3b29:3452`). The axes turn is consistent with the placement but does not explain it.

## Checked and passing

The topology quote matches `9b679556:6718` exactly, including "the next launch creates new run PR's", and the note that follows is the right way to hold an oddity without resolving it. The ending quote matches `9b679556:3683` exactly, including "a fill in runlog", with lowercase intact. "untill" is now preserved in both places it appears. The tree matches `8fdc3b29:3029` to `3037` in content and order; the indentation is a reconstruction, since the transcript shows the lines flush left, but a tree without indentation is not a tree and your placement of `FLIGHTLOG.md` is corroborated by `9b679556:1063`. The launch-record section no longer claims the file is "an index and nothing more", so the self-contradiction I raised there is gone. The four-questions handling is now exemplary: two assertions separated from four leading questions, with only the assertions carrying weight.

## Unaudited

Three claims in this record rest on `DS001`, which has never been inside my read scope: the definition of a launch as an intent carrying its infrastructure, the three movements of convergence, and the Rails-folder restatement. I have not checked any of them and am not implying a defect. Flagging so the coverage gap is visible rather than assumed closed.
