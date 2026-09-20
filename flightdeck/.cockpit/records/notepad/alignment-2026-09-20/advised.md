# What the commander advised

Clerical extraction. Each item is a direct quotation, source in brackets. No interpretation added.

## Purpose

A1. "wondering if we should set up a schema store, so we can specify document shapes: stored in base, callable by a linter, so pilots have their paperwork in order." [O045]
A2. "This is just schemas and linters, right? That is what I advised?" [O056]
A3. "The whole purpose of having some schemas around is so that our documents have a defined shape, not just conjured up each time an agent writes one; it is so a new session can write a document the same way you write a document." [O056]

## Schema store

A4. "wondering if we should set up a schema store" [O045]
A5. "stored in base, callable by a linter" [O045]
A6. "Flightcrew has these schema checking assets already built, on other branches; the spec builder was using a linter recently, along with rubric checkers." [O046]

## Linter

A7. "callable by a linter, so pilots have their paperwork in order." [O045]
A8. "On the lint: whatever saves the most tokens and reduces churn. Non-blocking is the right shape: small output on success, enough guidance on error to fix directly without a tool call, a small edit to fix (preventing a large write)." [O054]
A9. "The lint is non-blocking: small output on success; on error, enough guidance to fix directly without a tool call, by a small edit rather than a large write; whatever saves the most tokens and reduces churn." [D027]

## Document shapes and frontmatter

A10. "Consistent frontmatter for most generated markdown files. Fields are consistent across document types." [frontmatter.txt]
A11. "This should provide better searchability across markdown corpus." [frontmatter.txt]
A12. "Add line to claude.md indicating searchability and metadata conventions" [frontmatter.txt]
A13. "'recorded' was the initial form of 'stamp', renamed to avoid confusion with the records room." [O051]
A14. "'context' is the contextual position this document maintains: work is the umbrella, generates is follow-up documents; it is a chain, for example the context for a Ds should be a team dispatch." [O051]

## Identifiers

A15. "shape = <abbreviation> + <number>" [json-data-consistency.txt]
A16. "abbreviation = 1-3 letters. single capital - commonly recognised units. eg teams = T, Proposal = P. double/triple capital - Reconisable words combined. eg Commanders Advice = CA. number - 3 digits. eg 001, 002" [json-data-consistency.txt]
A17. "Identifiers used accros the application. each ID mentioned in claude.md" [json-data-consistency.txt]
A18. "change desk/proposals to desk/requests. prevents conflict with procedure ID. eg Rq001, Rq002" [json-data-consistency.txt]
A19. "On the P prefix: nope, proposals change to requests. That is the easier name to change and remember." [O046]
A20. "On DS versus Ds for dossiers: nope, DS means dossier should be two words; Ds allows the lowercase to guide what the D means." [O047]
A21. "Decision De, Spark Sp, Order Or (O001 is not very readable)." [O048]
A22. "C looks like Crew, I'm not sure if this still fits. Actually WS is work shop combined; keeps the capitals designated correctly." [O049]
A23. "everything that accumulates and is commonly referenced in a chat gets an ID; how else do you refer to request 15 in a document? ... all accumulating items (dossiers, requests, decisions, orders, dispatches and so on) get an ID only." [O053]

## Manifests

A24. "MANIFESTS: lightweight named manifest (recognisable in streaming output) eg orders/orders-manifest.json. points towards json file units. eg orders/Or001.json" [json-data-consistency.txt]
A25. "The manifest reads the whole scope of units. token efficient, enough data for unit disclosure." [json-data-consistency.txt]
A26. "Units allow rich recording of data. prevents large singular files of data that blows budgets." [json-data-consistency.txt]
A27. "Flow = agent needs context --> manifest --> unit" [json-data-consistency.txt]
A28. "in stream outputs `manifest.json, manifest.json and manifest.json` might be the same file or different files and you have to consult the path to find the manifest's context; `orders.json` could be a manifest file but it could also be something else; MANIFEST-commander-advice.json tells you exactly what the file is and is also identifiable in a folder with CA001.json, CA002.json." [O051]
A29. "Match the manifest collection to the ID; agent-oriented naming doesn't mind longer, more descriptive names. This means commander/../advice = CA = MANIFEST-commander-advice." [O052]
A30. "a global manifest (MANIFEST-dispatches), with team rooms dispatch/flightcrew/T003, T026, T045 and dispatch/cockpit/T004, T005; but it could easily be a flat dispatch folder. Early on flat seems better, but after three months and up to T364, dispatch rooms may be more readable." [O052]
A31. "teams = roles information, dispatch = team instances." [O052]

## Rooms

A32. "change the cockpit structure, as fitout is cause it to settle differently than intended." [cockpit-setup.txt]
A33. Proposed tree includes "records/ (anything recorded)", "manuals/ (formerly records/, short references over a single topic)", "work/ (The pilots work)", "team/ (any actor, role or combination of)" [cockpit-setup.txt]
A34. "Manuals in two places is the commander's worry too, although it is the same concept in two places: flightdeck manuals for everyone, cockpit manuals for the pilot." [O050]
A35. "'Workbook' was considered and cancelled, as the name often drives how an agent writes the document." [O050]
A36. "Extracts is a placeholder for extractions; the commander's speaking topics is a great starter, maybe logs, decisions and so on. Having an extractions location relieves pressure to keep stuff long term: a huge log folder can be extracted into key findings later. Bulk sources condensed into key findings and distributed into self-sustaining content is the intention." [O050]
A37. "Extracts is future work; currently scaffolding procedures and folder structures as part of M001." [O051]
A38. "Now that records have become manuals, manuals become the authority and anything else records used to be." [O051]
A39. "Keep files are slowly drifting as ideas change; eventually they will be removed. They are initial placeholders to scaffold the initial shape." [O045]
A40. "the notepad is a rather messy record type, but important as minable history and a dump location; forgotten during the sketch (this is why a chat about ideas is good, it catches little gaps)." [O050]

## How work should be done (pace, who builds, size)

A41. "Do an idea exploration team with the commander in the room through the pilot's seat, then a dossier once it settles. After that a refactor team much like the one the pilot suggested, still with a designer but a much richer starting point. Once the ideas settle with a dossier, add them to the fitout mission." [O044]
A42. "Send a quick team to check that what I advised and what was built align. These two teams' findings will decide the way forward." [O056]
A43. "Run the mini adversaries against this for fit and trim. My HITL instinct says that this is low effort, but I will leave it up to them." [O056]
A44. "What is happening? I asked a question and you have disappeared into the team frantically fixing things?" [O056]
A45. "On the pace of the room: not the pilot's fault, don't change anything yet. The pilot asks for input, then four agent returns come in and the question is hundreds of lines up; the commander has to think how to solve it." [O053]
A46. "Procedures will be key references, and having M, Ws, P for work is a decent convention." [O046]
A47. "The findings presented tend to indicate a much larger test system we have to maintain each time something changes." [O056]

# Rulings that are the pilot's, not the commander's

R1. "Timing of rooms against identifiers is the pilot's call." [O050] — stated as the commander deferring, not a commander ruling on shape.
R2. "the pilot repairs the identifiers in CA001 to CA003 itself, on its own judgement" [D026] — pilot's own judgement, not the commander's specification.
R3. "After that a refactor team much like the one the pilot suggested" [O044] — the team shape referenced here is attributed to the pilot, not stated as the commander's own idea.
R4. "Pilot decides convention, research team helps, including mini adversaries." [frontmatter.txt] — the convention itself is left to the pilot; not the commander's ruling on what the convention is.
R5. "Pilot requests changes to commander. refactor team helps, including mini adversaries." [json-data-consistency.txt] — process note deferring the actual change decision to the pilot's request, not the commander's stated ruling.

Uncertain: A28 through A31 (manifest naming) read as the commander thinking through the problem in his own words rather than a closed ruling; treated here as advice since the text is presented as his statement, but note the uncertainty.
