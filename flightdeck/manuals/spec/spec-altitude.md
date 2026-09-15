# Altitude

Altitude is everything.

With a spec the human should be able to visibly see the shape of their project changing. A spec is written in human language, not machine language. It is the last place a human does so in FlightCrew orchestration before machines take over.
A spec is not a wall of indecipherable coding text, is not some abstract representation that could be many different things, is not a soup of expert terminology.

Altitude guides how far above the system's own workings each statement sits. It is the property that decides whether a spec is usable or not, because the work is never the spec writer's to complete. A competent builder with a spec at the right altitude can build exactly what is specified.

The spec describes precisely in a plain register what the change to a project looks like. With enough fidelity for each statement to be testable, but also enough scale that a small human statement propagates into large rich systems with the builder's touch.

## Correct Altitude

A behaviour statement at the right altitude reads like this:

> The user must be authenticated before entering the main page.

Plain words, no internal vocabulary, and one thing that is either true or false of the finished result.
The right altitude is found when statements cover the **largest surface that can still be falsified or described as one thing**. Any higher and it stops being checkable or must be interpreted. Smaller and now you are building the system instead of describing it.

**The Builder** expands this natural bounded description into exponential system language.

## Altitude Antipatterns

### Too high

> Harden this feature. Ensure it works correctly.

> The session layer returns a predicate, which through memoization, wires it through the standard middleware chain. Mutating session state.

High altitude fails because the builder doesn't have enough knowledge. Often because the writer eased their drafting efforts by using either broad abstractions or expert domain knowledge, the builder doesn't know or understand to "compress" the statement.

Nothing is testable, so the definition of done cannot be determined, and the builder guesses at the outcome. The builder is capable but not telepathic. It cannot fill gaps, cannot infer what was settled in another document, and cannot read intent from an adjective. A spec at too high an altitude asks the builder to supply the decisions the writer avoided making.

**The Builder** makes decisions on the outcome, or it doesn't know the outcome because of the terms. The result will often be largely different from the original intent.

### Too low

> Exit 0 must convert to a code-safe message format.

Written in the language the system already speaks: internal names, protocols, return values, file paths, function shapes.

Writing this way drives the spec toward a one-for-one representation of the work. The tests confirm behaviour the spec already described, so the later roles have nothing left to do. The interview degrades into asking the human to confirm statements they have no expertise to judge, because the statements are derivations rather than behaviours the human want to "see". The result costs more to write than the work costs to build, and it is always struggles to finish, before frustration sets in.

Using the system's own language is an attempt to steer how the work gets built; the writer thinks they are the builder.

**The Builder** implements the spec directly. But cannot use their expertise to implement structural choices. The result is often "correct" but has lots of bugs and nits the writer couldn't predict.

## Between an Engineer and the Builder

The spec is like construction drafts, it is written by a "draftsman", who is neither the Engineer nor the Builder. It is not written in the language of either, but a simple, universal language of profile views, lines, and distances. The draftsman ensures the specifications are precise enough that a building can be structurally sound to suit the engineer, but also with enough scale to fit on only several pages, relying on a builders deeper construction knowledge.

The draftsman understands his role in the build chain. He collects the engineer's vision and how this work fits into the bigger picture, but does not know this himself. He then "drafts" in a simple language any competent builder can then transpose at scale into the actual structure of the building.

## Observable Behaviour

A spec states the difference in observable behaviour the work produces. For new work the difference is between nothing and done. For a change to existing work it is a reduction, an addition, or an alteration.

The spec does not restate existing behaviour. It is placed out of scope and the pre-existing verifications ensure it is held.

Observable behaviour is described as a human would see it and say it. Not in the language the project speaks.


## Spec summary

A Spec is a document that scales. The statements expand exponentially into system language but are precise. Like a 1:100 building draft.

First describes success. Then includes all information the builder needs for that success. Finally, directs the work's own verification.

A spec dynamically grows and changes. Describe what you know, have a try to build, come back if the spec needs to "know" more.

Spec is the last document that speaks "human" in Flightcrew. After which the language is of FlightCrew itself or the system it is building.

The spec is the construction drafts. The builder decides the structural material. The engineer makes the decisions.

Language is plain register and universally understood by all parties, Engineers, builders, even interested stakeholders.

A spec holds no expert, evaluative, or abstract terminology. It is precise and universal.

A spec is atomic. The work decomposed into individual parts belonging to separate domains. Then joined back together by the builders into the whole outcome.

A spec written in the expert’s register assumes shared knowledge, in the systems register assumes shared method. Both come from the writer imagining the builder is a version of themselves.

The work is a **change** in the system and the spec describes it, added, removed, or changed. It protects the existing or previous work through verification-based preventions.
