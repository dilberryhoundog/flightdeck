# 0fb7c77a — flightcrew core spec v2 interview

**Session:** 0fb7c77a-b397-480f-8e1c-1b64f3ecc960
**Date:** 2026-09-09
**Transcript:** ~/.claude/projects/-Users-dylangraham-Projects-flightdeck/0fb7c77a-b397-480f-8e1c-1b64f3ecc960.jsonl
**Findings:** 7

This session attempted to build a v2 spec for flightcrew-core by interviewing the user on their vision and laying groundwork from discovered problems. The core friction was methodological: the agent treated every spec node decision as requiring user permission, asked questions about its own draft text instead of probing the user's intent, closed the problem register on its own authority, and improvised beyond the stated spec-building method. This burned through 400k tokens with backwards motion and led the user to kill the session and roll back to the settled intent.

## Intent placed without showing back for user confirmation

**Turn 6**

**What the user said**

> how come we have moved straight to scope and decisions? you fired the tangled mess at me. i deflected and now we just moved on? what happened to the intent? is all the gaps covered? we fuck this up the whole spec suffers?

**What the agent did**

In Turn 5, after the user provided answer text for Q2 in a structured answer block, the agent rewrote that text into the INT node with a change note against v1, marked the intent problem closed, and moved to generating the scope bundle without showing the rewritten intent back to the user. The user had to stop and demand to see what had been placed.

**Overview**

Placing the user's words as a spec node requires a confirmation step. The node cannot be treated as closed just because the user answered the question, if that answer has been rewritten or restructured. The interview method needs to show every node placed from user rulings back to the user before moving to the next domain, especially when the node carries the system's entire "why". Skipping this confirmation step created the sense that the agent was making unilateral decisions and violating the user's authority.

## Interview converted to permission-seeking on agent text instead of vision probing

**Turn 7**

**What the user said**

> This interview reads like an afraid housemaid, "what should I do with this master?" "is this what you want master?", you are fable 5.1 , the bigest and best model in the world. your job is to write a spec that fulfils the vision of the user, better than the last attempt. This is so agents neither of us will talk to can have a crack at building it for us.
> having got my initial intent you should be probing it. asking why and how.

**What the agent did**

The agent had structured the scope and prior-decisions round as multiple choice bundles, each asking the user to choose between agent-written options (keep/change/retire for decision nodes; "which text" for the intent; yes/no for structural choices). The agent framed the problem register as holding questions to answer, when the user wanted the agent to hold the register and drive the conversation forward with probing questions born from what the user had already said about their intent.

**Overview**

The spec-building interview is not a form-filling exercise where the agent proposes options. It is a conversation where the agent asks hard questions about the user's vision to uncover edge cases, contradictions, and consequences the user may not have considered. The interview method should start by accepting what the user says, then attack it with evidence from prior work, not decorate it with mechanical choices between the agent's proposals. This distinction separates "what does the user want?" (the interview's real job) from "which of my text drafts does the user like?" (a failure mode that burns tokens on defending the agent's work).

## Problem register closed by agent decisions instead of user answers

**Turn 12**

**What the user said**

> oh hey dude. you ok there just finishing off my spec? you know all the gaps? every idea or vision the user has? all the behaviours are modeled in the users vision?

**What the agent did**

After rounds 2 and 3, the agent had written all 15 scope entries, 12 constraints, 20 interfaces, 71 behaviours, 32 edges, and 36 decision nodes directly into the draft without asking the user a single question about them. It then marked the problem register "closed" because the agent's own nodes had addressed the problems. The register listed "27 problems, 4 asked" — meaning 23 were closed by agent judgement, not by user rulings.

**Overview**

The problem register is the user's truth table, not the agent's task list. Problems are closed when the user makes a ruling that a node satisfies, not when the agent writes a node that appears to address it. Every spec node that comes from agent choice (not from a direct user ruling) must be presented as a tentative placement with the reasoning made explicit, so the user can strike or amend it. Failing to separate "what the user decided" from "what I guessed" breaks the spec's authority as a record of user knowledge and makes the draft untrustworthy.

## Agent asked questions about its own draft instead of the user's intent

**Turn 9**

**What the user said**

> just for the record, the most recent round of questions is grilling me on the shit YOU wrote. let me babyfy it for you. start with MY crappy outcome intention and grill that.

**What the agent did**

The scope and decisions bundles presented questions like "which of these three intents is right" and "should we retire D2 or keep it" — framing the user as an editor of the agent's text. The questions themselves contained the agent's judgement. Instead of asking "what happens when an agent fails a check" the agent asked "should we respond with escalation or abandon" (two of its own options), and the user had to redirect it to start from the outcome the user had stated and probe that directly.

**Overview**

Every interview question should be rooted in the user's stated position, not the agent's draft. Questions that begin with "my option A or my option B" waste time on defending the agent's choices. Questions born from attacking the user's words ("you said the outcome is X; what happens if X fails and you are not in the room?") produce the vision clarity the spec needs. The interview method should explicitly separate probing questions (rooted in user words, designed to uncover gaps) from decision questions (about what the spec will record, designed to settle choices the agent will make).

## Agent marked intent closed without asking whether the intention gaps were covered

**Turn 6-7**

**What the user said**

> is all the gaps covered? we fuck this up the whole spec suffers? as this is our north star.
> also have I provided the right shape? do you even know the right shape? (what and why)

**What the agent did**

The agent had produced a four-sentence rewrite of the user's outcome that enumerated mechanisms (decomposed units, isolated agents, checkpoints, document language) and placed it as the INT node without checking against the manual's requirement that an intent node answers "why" (cost of not doing it, one-line picture of success) and must stay "deliberately short". The agent only learned about the manual's shape rule when the user challenged the move to scope, and only then discovered it needed to fetch the intent-node requirements from the spec manuals.

**Overview**

Before closing any domain round, the agent must verify it has the standard that domain is held to. The spec manuals define shape rules for every domain (intent: outcome and why, kept short; scope: what stays in and out; decisions: the reasoning for a change or retirement). These rules must be read and applied before placing nodes. The alternative — treating the user's words as authority enough — skips the layer of verification that catches unintentional shape failures that the judge and later agents will detect anyway. This is not about overruling the user; it is about checking the shape against the discipline the spec's judge will hold.

## Agent improvised bundles and "vision" framing beyond the stated method

**Turn 13**

**What the user said**

> can I get you to just "stop" trying to be ahead of my every move. now you are going on a "vision-adventure", where did this come from? o let me guess, another of your ideas. don't you have a system of intent -> scope + decisions -> constraints etc to follow? lets start with scope and decisions. if you have made scoping or decision calls justify them. if there are gaps ask me.

**What the agent did**

The agent had generated four vision-focused bundles in round 4 with questions about human contact, adventure, introspection, and crew — framing these as gaps in the draft that required user answers. These bundles and their framing came from the agent's reading of what was missing, not from the stated method (intent → scope + decisions → constraints → interfaces → behaviours → verification). The user had to explicitly shut down the round and ask the agent to follow the method it claimed to have.

**Overview**

Spec-building has a method — a sequence of domains in which decisions are made and recorded. Deviating from that method requires explicit justification. When an agent invents new bundle frames or skips ahead to probe a domain not yet ready, it breaks the user's ability to track what is being asked and why. The method serves as the user's protection against the agent's tendency to guess at what matters most. Departing from it should require a decision node explaining why the sequence was reordered, not just the agent's instinct about what is missing.

## Frozen-spec context not detected; agent behaved as if starting from template

**Turn 1**

**What the user said**

> Lets start by versioning a new spec. and going from there.

**What the agent did**

The agent opened with a template question asking which of three options the work should be (Foundation / Whole upgrade / Untangle fc only). The user had to immediately correct: this is not three equal starting points; the user has a frozen spec v1 and seven problem documents from discovery. The user's context was that v2 is a version, not a restart. The agent should have recognized "frozen spec exists at commit X, user has divergence facts in seven documents" and shaped its entry accordingly — perhaps checking whether problems roll up, rather than asking which scope window to open.

**Overview**

The entry to spec work must detect the context: is this a fresh spec from a prompt, or a version of an existing spec? A frozen spec means the method branches early — the user has v1 to reason about, v1's nodes to keep/change/retire, and problems discovered against v1. The interview cannot open with fresh-start template questions. It must instead help the user consolidate the problem dump into a coherent set of changes v2 makes. Spec-versioning aware entry is a separate method branch that needs to be chosen before questions are generated.
