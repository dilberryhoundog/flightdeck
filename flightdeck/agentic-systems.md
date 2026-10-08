# Agentic systems

A working map of the systems flightdeck needs in order to run agentic workflows inside a project folder, on top of Claude Code. It names each system, says what it is for, and says what Claude Code already supplies for it, so that each one can be researched, built and improved on its own.

## Agent Invariants

- This is a working decomposition, not a settled design. Everything in flightdeck is an experiment.
- Build one system at a time. Never attempt the whole thing at once.
- Never replace what Claude Code ships. Accelerate it.
- The human can always fall back to direct conversation with a standard model.
- Nothing starts on its own. The human keeps control of what their agents do.
- Decisions, escalations, rubrics and policies are not systems. They are things systems make and pass around.
- The layer is mostly JSON and Markdown files, run on a Claude Code subscription with existing tooling.

## What this is

Agentic workflows are a layer over a model that takes the burden of deciding off a human. Claude Code is not that layer. It is a developer tool for developer workflows, and it keeps the human in the loop: a session, a set of tools, and a project folder that agents use as a dump for their input and output. It offers tasters of agentic workflow, such as memory, dynamic workflows, agent teams, goals and basic evaluation, but they are not integrated, and regular use of them pulls the human back in.

Flightdeck is agentic workflows inside project folders, layered over Claude Code. It is a light version of what others build as custom systems over a model API: it plugs into a project, runs on the Claude Code subscription and the tooling already there, and is made mostly of JSON and Markdown files instead of code.

The question every part answers is: how can we help an agent achieve a goal autonomously, beyond a single response loop? The aim is one integrated system that builds trust over time and removes the need for human steering, with the human sitting a level higher than the work.

## Terms

- **System:** a maintained body of content with a way to improve it, living in a container Claude Code provides.
- **Artefact:** something systems make and pass around, such as a rubric, a policy, a decision or an escalation.
- **Harness:** Claude Code plus everything layered on it.
- **Residue:** the permanent record a piece of work leaves behind.
- **Work loop, persistence loop, improvement loop:** the three groups the systems fall into. The work loop does the work, the persistence loop keeps what must outlast it, and the improvement loop makes the harness better.

## Why it is decomposed

Each system is a discrete part that can be researched, built, retried and improved in isolation. The test of a well-cut system is practical: when something goes wrong, the owner can go into that one system, improve it, and the next run goes better. Earlier attempts in this repository tried to build the whole thing at once, without this decomposition, and failed.

Discrete does not mean walled off. The systems lift each other: a better rubric built in verification should also make evaluation better, because evaluation uses that rubric as its grader.

A system here is custom content that has to be built, maintained and improved. Claude Code provides the containers but none of the content: it gives no roles, no project or domain context, no verification, no patterns for dispatching a team, and its own memory records impressions, not curated knowledge. Using a native container is how a system fits the harness, and the system is still work to be done.

The principle behind all of it is "fix the machinery, not the output". When the human has to respond to something, that response is converted into an improvement to the harness, so the same response is not needed again.

## What independent agentic work needs

Six properties separate an agent that works on its own from one that needs steering:

1. It knows what done looks like through something it can call itself.
2. Trust builds over time and widens what it may decide.
3. It retries after the machinery is fixed, not after the output is patched.
4. It escalates well.
5. It decomposes work and routes each piece to the right place.
6. The system reviews, repairs and improves itself.

The systems below are what supply these properties.

## The systems

The last column names the Claude Code container each system lives in or leans on. Where it says nothing dedicated exists, the system has to bring its own files.

### Work loop

| System                     | What it is                                                                                                                                                                                              | Claude Code supplies                                                                                                                     |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Interpretation and routing | Turns a request into understood, planned and decomposed work and sends each piece where it belongs. Planning, decomposition and routing are one dynamic system, not four.                               | Plan mode; skills; a classifying step in a dynamic workflow                                                                              |
| Verification               | The rubrics and schemas that say whether a piece of work is right. Policy does not live here.                                                                                                           | Hooks, `/goal`, the `schema` option on workflow agents, review subagents, scripts                                                        |
| Tools                      | Skills, scripts and bespoke mini tools that speed up an agent's work. A system in its own right.                                                                                                        | Skills, scripts, MCP servers                                                                                                             |
| Roles and responsibilities | Agent definitions and the entry point each agent is given when dispatched.                                                                                                                              | Agent definitions in `.claude/agents/`, `--agent`, `initialPrompt`                                                                       |
| Co-ordination              | Team makeup, patterns, and when to do what.                                                                                                                                                             | Agent teams with a shared task list and messaging; saved workflows in `.claude/workflows/`                                               |
| Orchestration              | Models, budgets, stops, handover and dependencies. Containment, latency and model tiering sit here.                                                                                                     | Model and effort settings, agent frontmatter, background sessions, worktrees, permission modes and rules, the sandbox, task dependencies |
| State and retry            | Tracking: where a piece of work is and what is next. One isolated location per piece of work, holding its progress, decisions and verification. It belongs to the work and goes when the work finishes. | The shared task list and agent view's session state; neither keeps a record per piece of work, so this system brings its own files       |
| Human structured response  | The human's decisions, reviews and gates, given in a form the harness can use.                                                                                                                          | `AskUserQuestion`, permission prompts, plan approval, agent view's needs-input state, artifact pages                                     |

### Persistence loop

| System                    | What it is                                                                                       | Claude Code supplies                                                                       |
|---------------------------|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Observability and residue | Logging: what happened, as a permanent record.                                                   | Session and subagent transcripts on disk, hooks for capturing events, OpenTelemetry export |
| Memory                    | Shared knowledge over the project and the harness: principles, rules and best practices.         | `CLAUDE.md` and `.claude/rules/`; the content is still a system to build                   |
| Conduct                   | Escalation boundaries: what an agent may decide alone and what it must raise. Policy lives here. | Permission rules and hooks can enforce a boundary; the boundaries themselves are custom    |
| Context                   | Manuals and a library that improve what an agent can draw on.                                    | Skills with reference files, `@` imports                                                   |

### Improvement loop

| System      | What it is                                                                                                        | Claude Code supplies                                                                 |
|-------------|-------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| Promotion   | Moves agent and human decisions into memory or context.                                                           | Nothing dedicated; a skill or workflow can run it                                    |
| Evaluation  | Certified performance improvements over one surface of the harness, by hillclimbing against fixed cases.          | `claude plugin eval`; the claude-api skill's `build-eval` and `hillclimb`            |
| Testbenches | Trials, or drills, that gather information for best practices. An example: can a background session spawn a team? | Headless runs with `claude -p` and transcripts to read the result; nothing dedicated |
| Audits      | Finds machinery upgrades in the record of decisions, retries and signals.                                         | Workflows that mine sessions; nothing dedicated                                      |

## How the systems connect

Observability and state together are what let a session resume: state says where the work is and what is next, and the residue says how it got there.

Because nothing starts on its own, the state system is also how the human sees what is done and what is not.

A decision is an event that passes through several systems. It is made inside a piece of work and tracked in state. Conduct says whether the agent may make it alone. If not, it is answered through the human's structured response. It is logged in the residue, promotion carries it into memory or context, and an audit may turn it into a machinery upgrade.

Authority is not a system. What an agent is trusted to decide comes from a mixture of policy, memory, past decisions and context.

## Nice to have

- A roleplay system.
- A command-line tool.
- A local web page for visualisation and for the human's responses.
- Packaging as a Claude Code plugin.
