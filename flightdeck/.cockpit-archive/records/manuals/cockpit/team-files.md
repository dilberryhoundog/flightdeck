---
type: "Manual"
stub: true
style: "record"
stamp: ["2026-09-22", "Pilot: Ace", "71b94de4"]
context: ["CA004", "Or072", "Or076", "Or079", "Or082", "Or083", "Or084"]
---
# Team files

The shapes the commander set in CA004 for the files that describe teams. The files on disk are still the earlier placeholders until the refit (WS031) lands; this manual is the target.

## Roster

Names the seats that fill it; that is its reason to exist. Carries the team type (Auto, standard, ATS, ITR), the shape the pilot reads to conduct the dispatch including what the lead must do, a dynamic list of improvement suggestions gathered from dispatches and audits and acted on by on-demand sweeps, the testing methods the roster can run, and metadata: name, purpose, status. The manifest row is audited against this shape. No axis residue: a fresh session dispatches a roster without knowing the axes.

## Dossier

Two kinds. Direct invocation: the seat exists only as a dossier, and the pilot builds its dispatch message from the template; no hooks, model or tool restrictions. Agent definition: the seat has its own system prompt and metadata as an agent file, and the dossier gives invocation guidance only. Both carry an entry point, which generates the lead's dispatch message: a generalised role that applies to every dispatch, the targeted variations the seat can take (stage, focus, criteria), and the tasks and output for the run. Both carry the duties the lead performs while the seat is active (name to be settled), the improvements found while in the seat, and the seat's own testing methods. The agent type is real and chosen with care, because it is what dispatch and task claiming rely on; a value shared by four seats in five scopes nothing.

## Dispatch

The residue of a dispatched team and the store to mine. The pilot's document alone: crew bulk goes to the notepad. Keeps date, session, mission, roster, subagents, room. A seat row holds the name, an entry point summary, the reason and what was returned. `outcome` holds what would otherwise be lost when the session ends: in-flight catches, seat failures, withdrawals, claim and completion events, emitted as they happen. `improvements` holds what the dispatch accumulated. `events` replaces `scope`: security and other events the pilot records. Not carried: a procedure pointer or per-axis results. Whether the improvement catch-all lives here rather than on each dossier and roster, and whether the records move under `team/`, are open (WS030).

## Agent definitions

Give a seat hooks, tool and model restrictions, and instructions that can be improved by evals or live trial. Generated for seats that fly often enough to pay for a second file; the dossier remains the source. A definition's body is applied differently in-process and in split panes, and a resumed teammate has none of it until the definition's folder is trusted.

## Notepad and events

A team's bulk output sits in one notepad folder per dispatch, with a README listing each file and its pass. Output from cockpit hooks goes to `records/events/`. ID-based documents are the pilot's; nothing bulk from crew enters them.

## Procedures

Stand alone; they join cockpit parts into a repeatable chain of pilot actions and leave no residue in team files. P002 remains and is rewritten from the findings: the questionnaire is a step before dispatch, with the commander.

## Axes

Internal to the team-builder: speed (time and token efficiency at held performance), coverage (breadth of sources), quality (project fit and small footprint, a seat asking mid-run whether a change can be leaner), alignment (external and internal best practice), security (boundaries kept), adversarial (output justified against criticism). They describe the rosters the builder creates and what a roster includes to perform on each; they are not a score for a dispatch and they appear on no team file. Their tuning instructions are a manual of their own when the builder exists.
