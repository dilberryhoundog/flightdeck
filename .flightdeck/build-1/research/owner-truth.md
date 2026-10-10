# Owner truth: what the owner wants from FlightDeck

Summary: the owner wants a light layer over Claude Code that moves load from the human to agents, built from Claude Code's own parts (agent definitions, hooks, rules, CLAUDE.md, plugin, workflows, teams) and not from replacement infrastructure, with themed (flight and military rank) roleplay, a plain-language HTML page suite for seeing and answering, per-task "workshops" with retryable state and "truth", multi-agent "launches" picked by Claude, a small agent-facing CLI, a cheap-token tier plan (Haiku sweeps, Sonnet 5.5 workers, Opus high ceiling), isolated testable parts, a lab, manuals and a library, and plain chat that still works. The binding documents are `.flightdeck/VISION.md` (13 sections) and `.flightdeck/build.txt` (9 requirements), plus `.flightdeck/build-1-brief.md` and `.flightdeck/build-1/constraints.md` (currently empty: "(none yet)"). The owner is fatigued by upfront specifying ("im fatigued working it all out upfront. show me something that works great. and fits the goal."), has repeatedly punished agents for scope creep, invented mechanisms, jargon, many questions, token waste, writing unasked and building everything at once, and wants to be able to cut a too-big result down. Three things VISION does not state (how work starts, where owner questions wait, dev-workspace relationship) are explicitly left to the lead, and section 5 sets out the evidence for each. Everything else in the repo (INTENT.md, README.md, reports, other branches) is agent-written: the owner on INTENT.md: "Who wrote INTENT.md? agents, they always get stuff wrong." Quotes below are the owner's, dated, with session-id prefix where `user-intent.md` gives one. Quotes in `user-intent.md` were extracted by agents and only 12 key ones were re-checked verbatim, so treat the rest as faithful but not re-verified. Never describe earlier work as "finished" (owner's standing instruction in `interview-record.md`).

Source paths used (all relative to the repo root; `origin/cockpit:` means the `cockpit` branch):
- `.flightdeck/VISION.md`, `.flightdeck/build.txt`, `.flightdeck/build-1-brief.md`, `.flightdeck/build-1/constraints.md`
- `dev/workspace/research/repo-reset/interview-record.md` (owner interview 2026-10-09, corrected and approved by the owner)
- `dev/workspace/research/repo-reset/user-intent.md` (owner's dated words from 51 sessions)
- `dev/workspace/research/repo-reset/concept-trace.md` (agent comparison of eight concept documents)
- `origin/cockpit:CONCEPT.md` (owner's concept note of 2026-10-09; the interview record says it is "kept as a dated note, not the current statement")
- `origin/cockpit:flightdeck/agentic-systems.md`, `origin/cockpit:flightdeck/.cockpit/constitution.md`, `origin/cockpit:dev/workspace/context/agentic-systems-session-summary.md` (2026-10-08, partly agent-written; use only as evidence, not canon)

## 1. The 13 VISION.md sections: what the owner means, their words, and what "works great and fits the goal" would show

Reading rule: VISION.md is the only binding statement of the shape. The quotes show what each phrase means in the owner's usage. Where an interview or older quote conflicts with VISION.md, VISION.md and build.txt win.

### 1.1 Accelerate Claude Code
- Means: FlightDeck is a thin layer inside Claude Code's own places (agents, hooks, rules, CLAUDE.md, skills, plugin) holding curated content, so a fresh agent in the project starts with the right context. "Saturate Claude's harness tools with curated content" means fill the existing harness slots, not invent a parallel system. "keep context fresh" means old material must not pile in front of agents.
- "I want to do a light version, pluggable into a codebase/project and deploy agents for advanced agentic worflows, but using CC subscriptiong and existing tooling." (2026-10-07 cedaf5ae)
- "To replace this stuff with custom infra is fighting the machine." (2026-10-04 409dd51e)
- "layer over the top a small set of customisations that are easy to maintain, recognisable by the model, fit in with (don't fight or replace) the harness, and most importantly becomes a machine that over time, improves useability, quality and pleasurability." (2026-10-04 409dd51e)
- "CC gives no roles (adversary, source checker etc), no project or domain context, no verification [...] CC memory is vibes. all these need custom building" (2026-10-07 cedaf5ae). Net position: custom content is wanted where Claude Code supplies nothing, layered and not replacing.
- "It means im not coding, most of this will be JSON and Markdown files." (2026-10-07 cedaf5ae)
- "the former spec builder agent has been deleted so not to spoil your context. do not dig into git histories or logs" (2026-09-04 bab64608)
- Works great and fits the goal if: the owner installs the plugin in a project, opens Claude Code, and agents, hooks, rules and CLAUDE.md are already in their native locations and load without ceremony. Nothing re-implements dispatch, messaging, memory or teams. A fresh agent can say where it is and what the rules are without reading archive piles. Claude Code content is easy to see and edit as plain Markdown and JSON.

### 1.2 Roleplay
- Means: a flight and military-rank theme gives roles their tone and shows each role's influence ("Military ranks set the tone for roles given their influence in the project"). It is meant to be fun and to make the system pleasant. The owner gave the chain "commander -> pilot -> officers -> crew" (interview decision 10): human, single lead, background-session members, workers.
- "Let's make this fun." (VISION.md)
- "I really caught the bug when I was roleplaying the commander (I still want to do this) but I was too eager to build quickly and got trapped by poor implementation." (interview-record.md, Record 2/2, owner 2026-10-09)
- "I realised my mistake using the pilot to fitout the cockpit. I am back HITL to get it scaffolded with you." (2026-10-02 409dd51e)
- Earlier roleplay machinery the owner or later documents did not keep: vocatives ("yes commander"), callsigns, approval flags. The 2026-10-08 agent documents say "the ranks and the vocatives ... should not be rebuilt as it was" (`origin/cockpit:dev/workspace/filebox/session-close/Ds-010-session-concepts.md`). The 2026-10-07 owner list calls the roleplay system a nice-to-have.
- Works great and fits the goal if: role names and rank voice appear cheaply (agent descriptions, greetings, page headings, team names) and make the system recognisable and fun, without any new records, approval flags or vocative rules to maintain, and without blocking plain chat. The owner is the commander and gets addressed as such; the lead is the pilot; background sessions are officers; workers are crew.
- Tension to flag: the 2026-10-09 interview reading was "no lead agent and no roleplay on day one", but VISION.md (later) lists Roleplay as a section. Treat roleplay as present but light.

### 1.3 Themed HTML page suite
- Means: a set of local, flight-themed HTML pages where agents show the human pictures, and where the human sends content back to the agent. Named pieces: a prompt builder "and other ai tools". It replaces a command line as the human's control surface.
- "my highest focus is on getting the JSON underpinings correct as an 'interface' that i can connect to (built later, out of scope here) with a local web server that will become my control surface rather than a CLI." (2026-09-09 0fb7c77a)
- "I went searching because I couldn't SEE my project in the spec. just a wall of text." (2026-09-10 9b679556)
- "each unanswered question needs a plain register explanation." (2026-09-14 9b679556)
- 2026-08-31 5ad10754: decisions were made by editing an HTML page and pasting the result back (user-intent.md, Phase 4).
- "human structured response" is on the owner's 2026-10-07 systems list, and "local webpage (visualisation and response)" is on their nice-to-have list (user-intent.md, Phase 9).
- `origin/cockpit:CONCEPT.md` (2026-10-09): "HUD html page system ... visibility platform and agent human interaction platform. build for agent efficiency, mutating and viewing JSON files from flightdeck. interviews, explainer presentations etc. local web server". It was "stubbed implementation for later fitout" there. The HUD has been deferred in every earlier version; VISION.md now lists it as a section, and build.txt itself requires an HTML review page in plain language.
- Works great and fits the goal if: the owner opens an HTML page and sees the state of the work as a picture or plain list, not a wall of text; the page has a way to answer or edit and produces something the owner pastes (or a file) back to the agent; a prompt builder produces a usable prompt; pages work offline from files with no server needed to start, and the language is plain with no undefined terms.

### 1.4 Workshops
- Means: one directory per piece of work, branch-isolated, holding everything that work produces (agent output, reports, plans, state, decisions, truth, logs, verification). Important things get promoted out to global tools (decisions to CLAUDE.md). The work can be retried at any time. "Truth" in a workshop is agent-readable guidance where the work happens, and requirements are built up over time so the retry is better.
- "I see workshops in flightdeck/workshops and they take slightly different form, all work happens in there, agents store in each workshop not notepad." (interview-record.md, starting list of parts)
- "runs should accumulate many retries until they succeed, rather than one shotting." (2026-09-08 8fdc3b29)
- "each run needs to happen on a throw away branch that ends with a PR back to the feature branch. if accepted the feature branch is mutated and the next launch creates new run PR's against it." (2026-09-10 9b679556)
- "convert human response into harness improvement (fix the machinery, not the output)" (2026-10-07 cedaf5ae)
- A past version of the idea: an order and everything it spawns in one directory (concept-trace.md, ledger item 9). The owner returned to it because "decisions should sit with the order that created them" (user-intent.md, dropped-then-returned item 10; reader's reason).
- Caution: the owner found "writing 'truth' statements for everything" tedious (2026-10-02 409dd51e, user-intent.md Phase 9). So truth should be drawn out of the owner by short interviews and turned into durable documents by agents; it should not be a form the owner fills in for every item.
- Works great and fits the goal if: one command or request creates a workshop directory; everything the work produces lands in it and nowhere else (no notepad); a failed attempt can be thrown away and rerun after the owner adds a line of truth, with the first attempt kept; a decision made in a workshop can be promoted into CLAUDE.md in one step; two workshops never touch each other.

### 1.5 Launches
- Means: multi-agent workflows "of all shapes" that Claude chooses from the workshop (teams, background sessions, dynamic workflows, worktrees), on work that is scoped and specified, checkable, reviewed and delivered as a PR. The owner counts "about 6 shapes" (the flightcrew orchestration is "now 1 of about 6 shapes ive found", interview decision 6).
- "background sessions, agent teams and workflows all in. lead can retire agents at will [...] workflows have a place, but are not the only way. teams with 'live' adversaries often push the others in a way they can't in a workflow." (2026-10-02 409dd51e, 13:49)
- "a well prompted custom workflow will build what we want in half and hour." (2026-09-16 9b679556)
- "They need to know what done looks like through something they can call themselves" (2026-10-07 cedaf5ae)
- Open: "I don't know what that means for launch vs workshop. I feel they are different but don't know how yet." (interview-record.md, Record 2/2). A reasonable reading from VISION.md's own wording: the workshop is the place and the launch is the act of dispatching a multi-agent run from that place. This is the lead's call and should be shown for the owner to correct.
- Works great and fits the goal if: from a workshop the owner says "go", Claude picks a suitable shape without asking the owner to choose; the run is limited to what the workshop's scope names; a check the agents can run says done or not done; the result arrives as a reviewed pull request and not as loose files; a failed launch can be retried after the machinery is fixed.

### 1.6 Local CLI
- Means: a small command line for agents (and the owner) to read and change the FlightDeck directory: start web servers, bulk-commit the FlightDeck files, and "any other suitable actions (to be discovered)". The owner wants to call it `flight`.
- "I hated it [the fc CLI], but accepted the need for a few required scripts" (2026-09-19 4450a586)
- "mainly though for enabling 'determinstic tools' principle" (2026-09-08 8fdc3b29, wants it called 'flight')
- "The first build agent, built a highly complex and hard to learn/use fc command as the core of the system because it was (deterministic) testable." (2026-09-11 9b679556)
- "I like the idea of a runner just not as the major user control surface" (2026-09-08)
- "I eventually want a command surface built on later runs." (2026-09-09 0fb7c77a)
- Works great and fits the goal if: it has a handful of commands, each doing one chore an agent would otherwise do with many git or shell steps; the whole system still works without it; it does not become the centre of the design or the thing the tests mostly test; it is not a replacement for any Claude Code feature.

### 1.7 dev-workspace
- Means: dev-workspace served the first era, "a place for a Human in the loop and a single agent to collaborate". FlightDeck is for the next era, agentic engineering. HITL is kept; agentic workflows become first-class. "Humans altitude is raised." The text does not say replace, remove or keep. See section 5, question 3 for the evidence.
- "I thought I would create dev-workspace 2.0 for the agentic era." (interview-record.md, owner context)
- "dev can stay" (interview decision 12); "dev/ retained to prevent errors and agents from flagging missing stuff." (interview decision 3)
- Works great and fits the goal if: FlightDeck works whether or not `dw` is installed, does not touch `dev/`, does not break the owner's existing `dw` habits, and the new thing is visibly the next-era layer (workshops where the old workspace folders were, agents as first-class), not a clone of the old command set.

### 1.8 Cheap tokens, smart agents
- Means: the owner is on a Claude 20X max subscription and wants every tier used for what it suits: frontier-level agents guide, dispatch, check and improve; small tiers do the building and exploring. Opus, Sonnet, Haiku are all usable as invoked agents. build.txt sets the ceiling: nothing above Opus on high effort; Sonnet 5.5 encouraged.
- "Fable is only useful if the workflow is trying to one shot the solution. [...] if it's retry until green fable will blow the budget as an implementer." (2026-09-03 724ffc18)
- "send explorers when ever you want, they are cheap and don't spoil context." (2026-09-09 56570eaf)
- "you are conductor, cheap agents gather everything." (2026-09-10 5cfb546b)
- "model and effort in the settings is the wrong place. correct location is agent body" (2026-09-20 241bff25)
- "I want a hard cap on fable for live scenario testing, no exceptions. Opus and below." (2026-09-14 9b679556)
- "Im not scared. its retryable, they are only tokens, i might end up with something awesome i don't not forsee." (build-1-brief.md). So cost is acceptable but must be spent on purpose.
- Note: "sonnet doesn't have the CPU power to process this type of work and takes extensively longer and sometimes 'busts'" (2026-09-18 dcb75456) was said of an earlier Sonnet and a heavy task; build.txt now calls Sonnet 5.5 "a very versatile cheap agent, that i encourage you to use".
- Works great and fits the goal if: each agent definition names its own model and effort in its body; reading sweeps use Haiku, building uses Sonnet 5.5, deciding and checking use Opus high; nothing runs above Opus high; the owner can see which tier did what.

### 1.9 Built with quality
- Means: every sub-system can be tested and improved on its own without touching the others; purpose-built testbenches, laboratories and teams exist to improve FlightDeck itself.
- "What I have done is decomposed 'agentic workflows' here, into discrete parts that I can research, build, (and retry) etc in isolation. (this is probably why my build attempts failed before)" (2026-10-07 cedaf5ae)
- "one component at a time, the plan mapping all majors... each component lite and discrete with minimal overlap." (interview decision 2)
- "I dont want a test suite I have to 'fight' each time i make some changes." (2026-09-17 9b679556)
- Works great and fits the goal if: each part sits in its own folder with its own check that an agent can run; any one part can be removed or rejected (its PR rejected) without breaking the others; the checks protect behaviour without needing rewriting at every change.

### 1.10 Human energy
- Means: the owner's attention is limited and tires. The system should let agents recognise the owner's "truth" so the owner is not asked for bulk decisions or constant course correction. The owner's input should be high-impact and long-lasting, stored as improvable documents: rubrics, policies, schemas, templates, examples, manuals, library.
- "im fatigued working it all out upfront. show me something that works great. and fits the goal." (build-1-brief.md)
- "It seems like im trudging through mud and all your questions seem so tedious. 'do you want to keep x y z' I don't know. I only have a vision for my app, agents are the experts at filtering through walls of text." (2026-09-09; user-intent.md Phase 6 attributes it to session 56570eaf and heading 6 to 9b679556)
- "The human can front load their attention and time into a carefully crafted definition of the work, then with an intelligently built automated system beyond that the work materialises through agents repeatedly attempting to discover the deterministic outcome." (2026-09-10 9b679556)
- "record and mine all my decisions so that the cockpit and flightdeck align over time with my vision. rather than me define it blind session by session." (2026-09-18 dcb75456)
- Note: "decisions and escalation is not a system, nor is a rubric, nor is a policy." (2026-10-07 cedaf5ae). These are kinds of durable content that carry the owner's truth, not machinery.
- Works great and fits the goal if: the owner is asked few questions, in plain language, about their own ideas (not about agent-made options); a statement the owner makes once shows up later as a rubric, rule or template that agents use without asking again; the owner can stop attending and the work still proceeds to a checkable result.

### 1.11 Keep it simple
- Means: the owner can open a chat window and work one-to-one with a single agent, "like the good ol days". FlightDeck must not force advanced usage.
- "preserves the ability for effective direct response window interaction (abilolishing that is fighting the machine)" (2026-10-04 409dd51e)
- "I will sit here HITL and dispatch teams myself, learn as I build." (interview decision 1)
- Works great and fits the goal if: after installing, the owner can ignore workshops, launches and pages and just chat; no extra step, record, ID or approval is required for a plain session; advanced features switch on only when asked for.

### 1.12 Manuals and libraries
- Means: operator, technical and maintenance manuals are written next to the work and stored globally; a library holds concepts, knowledge and best practices, kept fresh; mid-tier agents "preside over the corpus", reviewing work against it and delivering the right manual or library item to where it is needed.
- "I see manuals shift out of cockpit (with workshops)." (interview, starting list)
- "bulk sources condensed into key findings and distributed into self sustaining content is the intention." (2026-09-20 b27e6c01)
- "Oh youve written another bunch of lines all on the same subject, this should definately be a manual" (2026-09-20 b27e6c01)
- "flight deck manuals for everyone, cockpit manuals for the pilot." (2026-09-20)
- "I agree with library." and "any library content maintained." (interview decisions 12 and 3). Downloaded sources are in `library/source/` (Claude Code documentation, Claude developer blog, Anthropic papers, JetBrains guides).
- Works great and fits the goal if: finishing a piece of work leaves a manual in the global manuals location; a mid-tier curator agent can be asked "does this work follow our manuals and library?" and answers with specifics; library items cite their source and date so freshness can be judged; the owner is never handed a long block of explanation that should have been filed as a manual.

### 1.13 Laboratory
- Means: a place to evaluate and drill FlightDeck itself. Drills are test runs that discover and tune hidden behaviour, especially of teams, revealing best practices. Evaluations are standard evals with fixtures used to hillclimb documents. The infrastructure is built so it can be evaluated, drilled and improved.
- "I see I need a lab to improve and test" (interview, starting list)
- "drills/testbenches so improvement does not burden real work" (user-intent.md summary, 4 and 7 Oct)
- "A HUUUUGE principle of orchestrated runs is iterated improvment." (no date or session given in user-intent.md, stable intent 4)
- `origin/cockpit:CONCEPT.md`: "lab (non distributed) for improving the accelerator. drills - dummy teams and setups to test and discover certain best practices. evals - workshop runs as fodder or source dummy data". Main's purpose is "testing and improving flightdeck in a lab/ folder" (interview decision 3).
- Works great and fits the goal if: a drill can run a dummy team cheaply and write down what was learned about a best practice; an eval with fixtures can score a manual or agent definition, and a revised version can be shown to score higher; the lab does not ship in the plugin; a result from the lab can be fed back to improve a document.

## 2. Hard requirements: numbered checklist

Sources: B = `.flightdeck/build.txt`, R = `.flightdeck/build-1-brief.md`, C = `.flightdeck/build-1/constraints.md`, T = the computed task text for this planning run, I = interview record standing instructions. Precedence: VISION.md and build.txt, then constraints.md, then the brief where it agrees with build.txt (build.txt wins on any difference).

From build.txt:
1. (B) Build out the human's vision for a Claude Code agentic accelerator, based on agentic engineering best practices, employing agentic workflows and "a bit of good ol HITL also".
2. (B) Do not use any agent above Opus on "high" effort. Sonnet 5.5 is encouraged.
3. (B) About 3 weeks of earlier work exists on other branches and favourite sources are downloaded. The lead decides what to use, change or ignore.
4. (B) The result needs verification by review, by adversary and by human imposter.
5. (B) The plan and the workflow must be retryable: the owner may add constraints, scoping or truth, and the build tries again.
6. (B) Do not hesitate to research and explore to gather context.
7. (B) Stop after planning, before building. Offer one review HTML page of everything awaiting building. The owner may make last-minute changes. Write the review in plain, simple language with no jargon.
8. (B) Deliver several PRs back to a build branch. The first is basic and holds only Claude Code content: agent definitions, hooks, rules, CLAUDE.md and similar. It may also fill core files and locations such as team dispatches, agent entry points and workflow patterns.
9. (B) Advanced features go in separate PRs so each can be rejected and retried.

From the brief:
10. (R) Where the brief and build.txt differ, build.txt wins.
11. (R) Only VISION.md and build.txt bind. Everything else, including INTENT.md, README.md, HISTORY.md, the folder layout and documents on other branches, was written by agents and may be used, changed or ignored. INTENT.md's section "How it is built" (one component at a time, by hand) does not apply to this build.
12. (R) The lead decides, and shows on the review page: what "working" means for each part; where everything goes (layout of `.flightdeck/`, what lives in `.claude/`, what lives at the plugin root); how a retry works (where added constraints go and how a second attempt is kept apart from the first); how big the build is ("if i like it but its too big, I cut it down"); and the three unstated things (how the owner starts work, where questions waiting on the owner are held, whether FlightDeck replaces dev-workspace or sits beside it).
13. (R) The owner must be able to try the result straight away: "Agent should build it so I can instantly try it out, particularly dogfooding itself."
14. (R) A human imposter is an agent that acts like a human ("great for testing stuff like interview questions"), and it is one of the three required verifiers.
15. (R) Use dynamic workflows (the Workflow tool) for the multi-agent work. There is no limit on the number of agents: "do what it takes to get the agents we need." The default workflow size guideline does not apply.
16. (R) Models: nothing above Opus at high effort; Sonnet 5.5 as the preferred worker; Haiku for file sweeps and other cheap reading.
17. (R) Cost and risk are accepted: "Im not scared. its retryable, they are only tokens".
18. (R) Order of work: research; plan; stop and produce the review page, commit it to `build-1`, push it, tell the owner where it is, then wait. Do not start building until the owner replies. After the owner replies, build as several PRs into `build-1`, the basic one first, each advanced feature in its own PR.
19. (R) A workflow cannot pause for a human, so planning is its own workflow run that ends at the review page, and building is a later run.
20. (R) Never push to `main`. Never force-push. Never delete a branch. All work lands on `build-1` or on branches that open PRs into `build-1`. The owner merges the PRs.
21. (R) `dev-workspace` may not be installed where the build runs. If it is missing, use plain `git` and `gh`.
22. (R) Writing rules: no markdown tables in chat replies (use lists); write each paragraph as a single line in markdown files with no hard wrapping; say things literally and directly.
23. (C) Read `constraints.md` first. Anything in it is binding and outranks everything except VISION.md and build.txt. Today it contains no items ("(none yet)"). Items will be one per line and dated. It is the owner's retry input.
24. (C and `.flightdeck/build-1/README.md`) A retry is: owner adds constraints, scoping or truth to `constraints.md`, then asks Claude to rerun `.flightdeck/build-1/workflows/plan.js`.

Planning-run rules from the task text, which also bind the planning agents:
25. (T) Planning agents do not run git commands that change anything. They read other branches with `git show origin/<branch>:<path>` and write only the file(s) they are told to write.
26. (T) Do not call earlier work "finished" (also the owner's standing instruction in the interview record: "don't record flightcrew (or anything else) as finished, this throws other agents off"). Also from the interview: do not write any instruction that limits when agents may read earlier work; "keep this open ended".

## 3. Pain points and corrections the owner has made to agents

Each item has one quote. The owner's standing rules implied by these clusters (from user-intent.md heading 6): stay within the named files, do not invent, ask about the owner's ideas in plain language, do not write until told to, use cheap agents first.

- Scope creep and reading what was forbidden: "PLEASE dont go freestyling throughout my code base. NO other reads except those two locations. if you do I stop the thread." (2026-09-09 bfb87cff)
- Running ahead or acting on a question: "what the fuck dude? don't stop the run, millions of tokens wasted. Im just wondering why the all important command got named something i didn't want?" (2026-09-03 724ffc18)
- Invented mechanisms and rules presented as settled: "umm where the F did run.json come from?" and "ASK ME ABOUT MY IDEAS ON HOW TO SOLVE THE PROBLEMS, dont invent shit and say 'done'" (2026-09-09 56570eaf)
- Invented limits: "how did the cap arrive at 40 lines?" (2026-09-18 dcb75456). Also "There are 18 decisions, none of them are mine. treat them as removable or editable rather than MY previous decisions." (2026-09-09 56570eaf)
- Too many questions, or the wrong subject: "That interview process failed hard. It was riddled with 'master, what do I do with this node?' questions that fatigued me." (2026-09-09 56570eaf)
- Questions about the agent's own writing: "the most recent round of questions is grilling me on the shit YOU wrote" (2026-09-09 0fb7c77a)
- Questions the owner cannot answer: "I cannot inventory each tiny subpart. arrrgggggh. I expected you to put some actuall effort in." (2026-09-14 9b679556)
- Jargon and undefined terms: "I have no idea what this whole passage even means with all these undefined terms" (2026-09-08 8fdc3b29)
- Output too long or fast to follow: "i haven't read 90 percent of the fluff you wrote above [...] humans can't hold 8 different directives at once." (2026-09-10 4f6285bb)
- Questions buried by agent chatter: "you ask for my input and then 4 agent returns come in and the question is now hundreds of lines up." (2026-09-20 b27e6c01)
- Token waste: "holy shit youve gone off on your own again swallowing all my tokens" (2026-09-09 56570eaf); "are you using tiered agent fit for the job, or just all the highest level?" (2026-09-03 724ffc18)
- Wrong tier use: "these bulk adversaries are costing huge tokens and later runs are less valuable than earlier runs." (2026-09-10 9b679556)
- Replacement infrastructure: "I think my two largest mistakes so far have been. Trying to build the perfect implementation first time and all at once, and trying to build too much replacement infra that already had a billion dollar company looking after it." (2026-10-04 409dd51e)
- Building all at once: "I have realised Im trying to build a subset of them, this is why i keep failing." (2026-10-07 409dd51e); see also "Trying to build the perfect implementation first time and all at once" above.
- A command surface that swallowed the system: "The first build agent, built a highly complex and hard to learn/use fc command as the core of the system because it was (deterministic) testable." (2026-09-11 9b679556)
- Using an immature system to build itself: "using half built systems, to build out the half built system is a fail HARD, I have learnt this now." (interview decision 1, 2026-10-09). The brief's "particularly dogfooding itself" sits against this; section 6 treats it.
- Writing before the owner has finished: "um so you got straight to writing? did my answers settle every question?" (2026-09-08 8fdc3b29); "iim not prepared for you to write." (2026-10-04 409dd51e)
- Ceremony and approval overhead: "I found most of the stuff in this repo that I was required to do tedious, like the prefixes, the enacted approval dance, writing 'truth' statements for everything." (2026-10-02 409dd51e)
- Owner stuck in details: "I have been getting my hands too dirty and becoming bogged down in the details and answering approvals" (2026-09-22 f6216b95)
- Sycophancy and passive posture: "Im not getting grilled anywhere near enough, roast my shit intent." (2026-09-09 0fb7c77a). The owner wants hard questioning of their intent, but not node-by-node triage.
- Treating old material as canon: "leaving it in place agents treat it like canon and dare not change anything. removing the lot loses previous precious time spent." (interview decision 7). And STRUCTURE.md "if it is reading it as truth it will be lead astray" (2026-10-07 cedaf5ae).
- Archiving too much: "I was also too keen to archive the lot, and feel like I have to build from scratch again." (2026-10-09 2cc7baef)
- Overreaching a specialist role: "The test agent is a specialist. you are a generalist." (2026-09-14 9b679556)
- Tooling failures that stalled work: "I came across problem after problem that i was having to fix on the fly [...] with this run it is clearly tooling." (2026-09-16 9b679556)
- The owner's own trouble telling agents: "I just don't know how to tell agents efficiently, and I got sucked into fancy things from day one, that blocked my flow." (interview-record.md, owner context)

## 4. The owner's vocabulary

Status key: CURRENT = used in VISION.md, build.txt, the brief, or the owner-approved interview record of 2026-10-09. DATED = coined or defined in an earlier phase; the owner may still say the word, but its precise form is not the current design. MIXED = used now but with a meaning that changed.

Names for the project and its parts
- flightdeck / FlightDeck (CURRENT): the whole system, "a pluggable agent loop accelarator" (2026-10-07 409dd51e). Originally (2026-08-31) the successor to dev-workspace.
- flight (CURRENT): the plugin name; the marketplace is "DBHD-FlightDeck" (interview decision 13). Also the wished-for CLI name `flight`.
- cockpit (MIXED): in 2026-09 to 2026-10-04, the pilot's post (`.cockpit/`, later `.cockpit-archive/`). `origin/cockpit` is the branch name and is retained. In the interview the owner still says "manuals shift out of cockpit", and CONCEPT.md has a "cockpit" section for the pilot and officers. VISION.md does not use the word.
- flightcrew / fc (DATED): the orchestration system built 2026-09-03 and onward (spec chain, runner `fc`, launch/run folders). Owner: now "1 of about 6 shapes ive found". It stays on its branches as minable and is not labelled finished.
- hangar / controltower / radar / blackbox / testbench (DATED): early folder names from 2026-08-31 to 09-01 (`origin/cockpit:flightdeck/STRUCTURE.md`). Testbench became "lab".
- HUD (MIXED): the web page control surface; deferred in every version; VISION.md now covers it as the "Themed HTML page suite".

People and roles
- commander (CURRENT): the human owner. VISION.md is titled "Commander's vision." (First defined 2026-09-17/18: "I sit one rung higher, dispensing orders and advice".)
- pilot (CURRENT, shape open): the single lead agent that knows the system and dispatches. Owner: "I definately want a single agentic entrypoint to the whole flightdeck system" but it is "a later piece" and "I need to build and test/drill first." Earlier it was the locked-down cockpit agent (callsign Ace) and was also called orchestrator, captain, lead.
- officers (CURRENT, owner-coined 2026-10-09): background-session members, "I can have other member also sitting in bg sessions, I call them officers." CONCEPT.md: "officers are direct session agents".
- crew (CURRENT): the worker agents. Past meanings vary: a set of roles (`flightcrew/crew/`), "any other agent: subagents, teammates, other sessions" (cockpit v1).
- adversary (CURRENT): the checking agent; "adversary is a the only non general purpose agent" and stays on main as an agent definition (interview decision 12).
- human imposter (CURRENT, in build.txt/brief): an agent that acts like a human, used for testing e.g. interview questions.
- seat / roster / vocative / callsign (DATED): cockpit v1 terms for a role in a team, a prebuilt team, "yes commander" replies, and Ace. Later agent documents say not to rebuild them as they were.

Units of work
- workshop (CURRENT): per-work directory with state, decisions, truth, logs, verification, retryable, promotion upward. Earlier (2026-09-17 to 29) a place for fixes and maintenance, then per-order directory.
- launch (MIXED): VISION.md: a multi-agent workflow run built from a workshop. Earlier: "one run of one spec" (2026-09-03/04), then launch as the unit of work and run as the unit of attempt (2026-09-10). Owner: unsure how it differs from a workshop.
- run (DATED): one unattended execution or one attempt. "abandon failed runs [...] retry".
- mission (DATED): 2026-09-17/18 "Missions are epic" (epics the pilot leads); earlier (2026-09-02) idea notes. Mission sparks went to an "incubator". Dropped from the 2026-10-08 documents.
- orders / advice / dossier / proposals / requests / records (DATED): the cockpit v1 chain of typed records. Dossier had three meanings (a crew role file, a commander-facing presentation file, a file controlling an agent definition). "proposals change to requests" (2026-09-20). The owner called the approval machinery tedious (2026-10-02). The word "dossier" is still used loosely: "write a dossier on all the important concepts and decisions" (2026-10-07).
- notepad (DATED, partly kept): a messy but important "dump location" and minable history record (2026-09-20). The interview: "agents store in each workshop not notepad."
- kickoff / liftoff / spec / freeze / gate (DATED): the flightcrew spec chain. Owner on gates: "there is no gates, only workflows." (2026-09-09), then unsure.

Ideas and principles
- truth (CURRENT, hard to pin): VISION.md: "guide agents with 'truth' where the work happens" and "agent recognisable 'truth' devices". Means the owner's statements, recorded in a form agents treat as ground. Earlier: a truth record versus an advice record (2026-09-28/29); "writing 'truth' statements for everything" was tedious. In the 2026-10-08 agent documents, a "truth suite" was "half-settled".
- drills (CURRENT): lab test runs that discover hidden behaviour, especially of teams.
- evals / evaluations / hillclimb (CURRENT): standard evals with fixtures to improve documents. "harbor evals" in CONCEPT.md.
- lab / laboratory (CURRENT): the improvement place; testbench is its older name.
- manuals (CURRENT): operator, technical, maintenance, stored globally. Earlier: documents "the crew reads"; also "records" were renamed "manuals" on 2026-09-20.
- library (CURRENT): knowledge, concepts, best practices; `library/source/` holds captured outside sources.
- HITL (CURRENT): human in the loop. "I was HITL master" before agentic work; used as the old way.
- agentic workflows / agentic engineering (CURRENT): the field the owner found on 2026-10-07; the earlier build was "a subset" of it.
- harness (CURRENT): Claude Code's own parts. "fighting the machine" (CURRENT idiom) means replacing them with custom infra. "fix the machinery, not the output" (CURRENT) means improve the setup, retry.
- promotion (CURRENT): moving important things from a workshop to global tools such as CLAUDE.md.
- dw (CURRENT shorthand): the dev-workspace command.
- stub (CURRENT in CONCEPT.md): reserve a component for later; "investigate but don't fully transfer yet".
- omakase (DATED): 2026-09-08, "a base yaml file but omakase options might be the go" (curated defaults).
- Fable (DATED): the owner's name for the top model tier in 2026-09 sessions ("fable 5.1"). The current ceiling is Opus high.

## 5. Evidence on the three questions VISION.md does not answer

None of these has a direct owner statement. The quotes below are all that exists. Each ends with what the evidence supports; the lead decides, and the review page should show the decision for the owner to correct.

### 5.1 How the owner starts a piece of work

Evidence:
- Plain chat stays first-class: "Sometimes the human just wants to jump into a chat window and do regular HITL with a single agent" (VISION.md, Keep it simple). "I will sit here HITL and dispatch teams myself, learn as I build." (interview decision 1)
- A single entrypoint: "I definately want a single agentic entrypoint to the whole flightdeck system." (interview decision 10); but "no lead agent and no roleplay on day one; a pilot is a later piece" was the interviewer's reading of that, and VISION.md has since added Roleplay. build.txt asks the first PR to fill in "agent entry points".
- Asking Claude directly: "I can simply ask you to do an agent team with the right setting and an agent team is up and running. I can load a background session and ask you to message it and the other agent will talk back. I can load a definition straight in to a session." (2026-10-04 409dd51e)
- A prompt builder page: VISION.md "Prompt builder and other ai tools" under the HTML suite.
- Front-loading intent through an interview: "an interview bg session to grill me on any new directions" (2026-10-09 2cc7baef); "The convention here is for the users idea's and vision to be probed, thats what I hold and no agent can access unless you 'draw' it out of me." (2026-09-09 0fb7c77a)
- Nothing starts without the owner: "the one thing the human wants control of is what his agents do" (2026-10-07 cedaf5ae). The 2026-10-08 agent document says "Nothing starts on its own."
- The owner is poor at specifying cold: "I just don't know how to tell agents efficiently" and "IM not even sure how to ask for help." (2026-10-09 2cc7baef).
- Past forms the owner called tedious: filing typed orders with IDs and approval flags (2026-10-02).

What the evidence supports: the owner starts work by saying a rough ask in normal Claude Code chat (or through a prompt-builder page that produces that ask), optionally to the single entrypoint agent; a short plain-language interview then draws out the owner's own ideas and writes them into a new workshop as truth; the owner then says go. There is no typed order, ID or approval form. Nothing starts without the owner.

### 5.2 Where questions waiting on the owner are held

Evidence:
- The HTML page is the response surface: "Interactive interface [...] Agents show visualisations to the human. The human returns content back to the agent." (VISION.md). Earlier practice: decisions "by editing an HTML page and pasting the result back" (2026-08-31 5ad10754).
- Questions must not get buried in chat: "you ask for my input and then 4 agent returns come in and the question is now hundreds of lines up." (2026-09-20 b27e6c01)
- Questions must be bundled and plain: "instead of stages. I want you to ask question bundles based upon the problems" (2026-09-09 56570eaf); "each unanswered question needs a plain register explanation." (2026-09-14 9b679556); "This thread moves very fast. I don't know what exactly i am ruling on? three rules?" (2026-09-18 dcb75456)
- Items should be approve, deny or change, not tedious flags: "the dossiers boil down into some proposals, which is approve, deny or change." (2026-09-18 dcb75456) against "the enacted approval dance" being tedious (2026-10-02).
- Escalation is a system need: "they need to escalate well" (2026-10-07 cedaf5ae). "human structured response" is on the 2026-10-07 systems list.
- Background sessions can hold the question live: "Think of background session teams as unlimited, I can hop on their sessions and answer questions also." (2026-10-09 2cc7baef)
- Decisions belong with their work: VISION.md lists "decisions" among a workshop's contents; the owner returned to per-order workshops because "decisions should sit with the order that created them" (reader's reason, user-intent.md dropped-then-returned 10).
- The owner needs planning residue so they do not have to re-describe things: "I feel that we need planning residue of some sort, otherwise I might have to redescribe the situation." (interview decision 11)

What the evidence supports: open questions live as files in the workshop they belong to (so they survive sessions and retries), are gathered into short plain-language bundles on an HTML page with an answer box that produces text to paste back, and a live background session may ask the same question directly. The owner is never required to hunt through agent output, and no typed approval flags are needed.

### 5.3 Whether FlightDeck replaces dev-workspace or sits beside it

Evidence:
- Replace, early: "This directory is the begining of a orchestration workflow tool. it is named FlightDeck and will eventuall replace the dev-workspace system" (2026-08-31 5ad10754). "eventually integrate dev-workspaces command surface so as to retire that system" (2026-09-08 8fdc3b29). These are old and have no later statement either way except the next two.
- Next evolution: flightdeck is "an agent management system, the next evolution of dev-workspace, built for multi agent workflows." (2026-10-02 409dd51e). "I thought I would create dev-workspace 2.0 for the agentic era." (interview owner context). VISION.md: "dev-workspace was built for the first era [...] Flightdeck is for the next era, agentic engineering. HITL is not forgotten."
- Beside, now: "dev can stay" and "dev/ retained to prevent errors and agents from flagging missing stuff." (interview decisions 12 and 3). The owner uses `dw commit` and says a plain git merge, "not dw merge", because dev-workspace protects workspace files (interview decision 14). The repo rules in `.claude/rules/` direct agents to `dw` commands.
- CONCEPT.md, 2026-10-09 (a dated note, not current): "dev-workspace is previous incantation of humans claude code accelerator, built for HITL era [...] workspace folders redundant with workshops taking over. git management and branch isolation, retained. commands repurposed. stub this component for later development, investigate but don't fully transfer yet.."
- The build environment may not have `dw` installed (brief).
- The interview records that the dev-workspace relationship "beyond 'dev can stay'" was not discussed (Record 2/2).

What the evidence supports: for this build, FlightDeck sits beside dev-workspace. It does not touch `dev/`, does not depend on `dw` being installed, does not remove or rewrite it, and uses workshops where dev-workspace used workspace folders. Whether it later replaces dev-workspace is left open, with the "next era" wording from VISION.md as the stated direction and the CONCEPT.md stub as the nearest plan for commands. Do not write a retirement plan.

## 6. Acceptance tests in the owner's own terms

Short statements the owner would use to judge the build. Where I am inferring wording, I say so.

From the owner's direct words:
1. "Show me something that works great and fits the goal." (brief) The owner can see the result working on a real example, not a description.
2. "I can instantly try it out." (brief) From the review page or the first PR the owner can run something within a minute or two with no setup puzzle.
3. "It dogfoods itself." (brief) After the basic PR, FlightDeck is used to do part of its own further work, with the 2026-10-09 caution in mind: no half-built system is used to build itself ("a fail HARD"). Inferred resolution: the basic Claude Code content (PR 1) is complete and usable before anything dogfoods; advanced features that are rejected do not block the rest.
4. "If I like it but its too big, I cut it down." Each advanced feature is its own PR that can be rejected or retried without breaking the first one.
5. "I can add constraints and you try again." Adding a dated line to `constraints.md` and rerunning the plan produces a new attempt and keeps the old one.
6. "It is reviewed by a review, an adversary and a human imposter." The review page shows what each found and what was changed because of it.
7. "The review page is in plain, simple language, no jargon." Every term on it is explained or avoided; the owner can answer without hunting for meaning.
8. "I may make some last minute changes." The review page lets the owner change things and hands the agent those changes in a form that is easy to paste back.
9. "Nothing above Opus on high, Sonnet 5.5 doing the work." The owner can see which tier did what, and cost looks like it was spent on purpose.
10. "Claude Code content in Claude Code's places." Agent definitions, hooks, rules, CLAUDE.md, skills are in native locations and loaded by the harness; nothing replaces the harness (not "fighting the machine").
11. "I can still just open a chat and work." Plain HITL sessions work with FlightDeck installed and no ceremony.
12. "It did not ask me a wall of questions." Questions were few, plain, about the owner's own ideas, and not buried.
13. "I can SEE my project." The owner can see the shape of the plan as a picture or short list, not a wall of text.
14. "Nothing was invented and called settled." Anything the lead decided on the owner's behalf is marked as a decision with the reason, ready to be overruled; no new mechanism is presented as the owner's.
15. "Nothing happened on main." No push to `main`, no force-push, no deleted branch; the owner merges the PRs.
16. "It was not built all at once." The build is staged: basic first, advanced items separate.
17. "A fresh agent does not treat old stuff as canon." A new session can tell what is current without being forbidden from reading earlier work, and no earlier work is described as "finished".
18. "Each part stands alone." Any one part can be tested and improved without the others.
19. "My once-said truth gets reused." A statement the owner gives once ends up in a rubric, rule, template or manual that agents use later.
20. "I can see the lab work." At least one drill or eval exists that shows how a best practice or document was tested and improved.

Things that would make the owner stop and push back (from corrections): files read that were out of scope; invented files or flags; unexplained jargon; an interview of node-by-node "what do I do with this?" questions; a custom command line or record scheme at the centre of the design; much text before anything works; agents on the top tier doing cheap work; the plan relying on the owner remembering something nobody wrote down.

## 7. Conflicts and gaps the lead should show the owner

- Dogfooding versus no half-built system building itself (brief versus interview decision 1). Suggested handling in 6.3.
- VISION.md lists Roleplay, a CLI, an HTML suite and a lead concept that the interview treated as later pieces; build.txt requires them to be separate advanced PRs that can be rejected, so they are consistent if kept out of the basic PR.
- "Launch versus workshop": the owner does not know the difference; present the lead's reading and ask for correction.
- Truth: wanted in workshops, but writing truth for everything was tedious. Present truth as drawn out by interview and kept short.
- The 2026-10-08 agent documents say plain chat must always work and "nothing starts on its own"; CONCEPT.md does not repeat them. Both are consistent with VISION.md's "Keep it simple" and are safe to keep.
- Single-user Claude Max 20X was a stated constraint in earlier documents and VISION.md says "Effective use of Claude 20X max subscription". Keep it as the cost assumption.
- Sources are agent summaries of owner sessions; a few quotes come from reader reports not checked against transcripts. Where a quote matters for a decision, check it in `dev/workspace/research/repo-reset/user-intent.md` before relying on the exact wording.
