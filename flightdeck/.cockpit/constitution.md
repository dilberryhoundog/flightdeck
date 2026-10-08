# Cockpit constitution
1 At its very core, the cockpit's purpose can be fulfilled with a decent prompt in a session with a standard claude code model with teams settings on. Teams, background agent messaging, workflows can all be spawned from here by just mentioning in the chat. Create some templated prompts with learnings so far and the "system" is born.

2 Beyond the basic system anthropic maintains a whole raft of harness tools built directly into claude code. These come ready to run straight out of the box. Anthropic maintains and integrates these tools together, these native tools are the foundation of a good agent system. Looking to replace these tools with custom implementations is "fighting the machine"

3 So the building blocks are provided by anthropic, but context has to be entered by the human. Best practices are how ai output slop is avoided. This aligns the agent with the tools they use and the context they read. Best practices inserts good or correct "content" in all the tools and documents that make up a harness. Best practices must always be followed to ensure good results, they can be the result of experiments and knowledge from trusted sources like anthropic or curated through experience and experimentation from the human. 

4 Best practices produce quality results. But they are tedious to follow directly in the response window. This is where the human will always look to follow the maxim "fix the machinery, not the code". This encourages us to create effective machinery that serves our best practices able to be called upon consistently, instead of manually steering the agent using best practices, time and again. These are usually recognisable tools and devices not necessarily in the native harness; agent familiarity and suitability for the task prevent the custom machinery fighting the harness. With the primary goal being human usability, outcome quality, and pleasureability.

5 Core mistakes when fitting out this new cockpit agent system is; Trying to build the perfect implementation first time and all at once. This leaves the system devoid of real metrics to base best practices from as it is built theoretically; another is trying to build too much replacement infrastructure that the professionals (anthropic) have already provided; Lastly creating advanced systems that only work just as good as basic implementation. 

6 This agent system therefore maintains the ability for the human to always fall back to direct response window interaction, with a standard model. Every part of the machinery must be callable in direct natural language or execute automatically without surprising the human.

7 This agent system has improvement machinery built to discover and declare best practices, evaluate effectiveness and generators for ease of creation. centered around a laboratory where testing and improvement can happen isolated from work. It is important to not mix machinery improvements with work. signals can be gathered from live work runs, but is preffered to replicate in a controlled environment.

8 This agent system employs a starting scaffold that provides the core usage pattern and best practices with a place to store its output and required contextual inputs. This structure is a foundation the system can expand into and doesn't attempt to guess what will be needed in the future, nor is the structure open for large-scale rearranging.

9 This agent system always looks to transfer the contextual effort and decisions from the human to the agent, with the utopian goal of having an agent system agents can largely run themselves. With the human present mainly to activate the agent.

10 This agent system prefers accelerating existing harness toolsets rather than creating toolsets that compete with the harness.

11 

---


## Claude's notes

- **The lab sits beside the work.** Drills check a harness mechanic once, small, before anything relies on it. Evals (`/claude-api build-eval` and `hillclimb`) test agent definitions and skills on fixed cases. Session and teammate transcripts stay on disk, so real work leaves a trace the lab can read later without the work doing anything extra.
- **Nothing makes you file records.** The conversation, memory, and transcripts already hold what you say. Prompt templates are welcome where they save you effort; prefixes, approval states, and flags to flip are what v1 showed to cost more than they returned.
- **v1 is a source to mine, not to load.** It lives in `flightdeck/.cockpit-archive/`. The parts most worth reusing: `records/manuals/claude-code/agent-team-function.md` (team mechanics measured on this machine), `records/manuals/cockpit/adversary-mechanics.md` and `found-strategies.md` (live, tandem, and cold adversaries), `base/bin/pilot.sh` (starting a session from an agent definition), and `records/dispatch/cockpit/T013.json` (two blind readers and a judge, the cheapest alignment check v1 found).
- **Sources.** `library/source/claude-dev-blog/` is current Anthropic practice and `library/source/claude-code/` holds captured docs. The six documents in `library/source/agent-teams/` are proposals from a web session; read them critically.
