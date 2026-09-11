# 8f080d6e — spec v1 bootstrap requirements

**Session:** 8f080d6e-c858-4c54-af22-a2085eee524f
**Date:** 2026-09-10
**Transcript:** ~/.claude/projects/-Users-dylangraham-Projects-flightdeck/8f080d6e-c858-4c54-af22-a2085eee524f.jsonl
**Findings:** 2

This session attempted to bootstrap the artifacts required before a flightcrew launch (D21 of spec.v1.json). The core friction arose from the agent working against outdated spec knowledge: it asked a user question based on an old spec while another session was rewriting the command structure, then misidentified which commit the spec was frozen at. Both moments show the agent failed to distinguish between the spec-in-the-working-tree and the spec's canonical/frozen version, and did not account for parallel work in other sessions that had altered the spec's requirements.

## Agent asked user question based on spec before parallel session's changes landed

**Turn 1–4**

**What the user said**

> I just had the other session change the command. to run new that cuts a new branch

**What the agent did**

In Turn 1, the agent read spec.v1.json from the working tree and asked the user a binary-choice question: "B1 says a run folder's branch (run/flightcrew-core-1) is created from HEAD. Should the bootstrap create that git branch too, or only the files?" The agent offered two options: "Create branch from HEAD" and "Files only". The user rejected this AskUserQuestion tool use (Turn 2). In Turn 4, after the user provided context that another session had changed the command, the agent proceeded with bootstrap work, but it had spent tokens formulating and presenting a decision point that the other session had already resolved in a newer version of the spec.

**Overview**

The agent asked a user question to disambiguate a spec requirement without first checking whether other parallel sessions had already modified the spec or its dependent commands. In a multi-session environment where specs and commands coevolve, an agent cannot assume the spec in the current working tree is the authoritative version for the question it is about to ask. The agent must either check the commit history for more recent spec updates in other branches, or ask the user whether the spec it is reading is current before formulating requirements-dependent questions. Formulating a detailed multiple-choice question that a parallel session has already answered wastes context and forces the user to interrupt the agent's flow to provide external context.

## Agent used current HEAD instead of frozen spec version for base_commit

**Turn 4–5**

**What the user said**

> um what the other session says is all fixed. the v1.spec should be frozen at 852b77c

**What the agent did**

In Turn 4, the agent created `launch.json` with `base_commit` set to `1ca648b9f37ccf7f44d4dbbe279a4239ddc3644b`, which was the current HEAD at that point. The user then clarified in Turn 5 that the spec should be frozen at `852b77c`. The agent acknowledged the correction and updated the bootstrap artifacts, but the conceptual misunderstanding persisted: the agent was conflating "the commit where the spec file currently lives in the working tree" with "the canonical frozen version of the spec that this launch is built against."

**Overview**

When a spec is "frozen," it means pinned to a specific historical commit that serves as the canonical version for a build or launch. The agent must distinguish between the spec file's location in the current working tree and the frozen commit it references. Setting `base_commit` to the working-tree HEAD rather than the frozen spec's commit means the bootstrap records the wrong provenance—it documents that the launch is anchored to the ephemeral HEAD rather than the durable, referenceable frozen version. This breaks traceability: future readers of `launch.json` will not be able to reconstruct exactly which spec version was in force. The agent must either ask which commit the spec is frozen at, or read that information from the spec file itself (a `frozen_at` or `freeze_commit` field), rather than assuming the current HEAD is the right value.
