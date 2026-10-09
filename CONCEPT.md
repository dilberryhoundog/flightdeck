FlightDeck - Claude Code agentic accelerator

Repo 
  repo for building, distributing, testing and improving flightdeck.
  current repo state messy from about 2 weeks previous experimentation. 
  all previous work can be archived, treat work as no longer relevant. 
  minable for fast tracking and possible restoration given good reason.

Goal
  Claude code is a HITL developer tool, with a moderate amount of agentic functionality. Build an acceleration layer on top of claude code based upon modern agentic engineering and agentic workflow practices. Using a purpose built "lead" talking to agent teams and other background sessions. Dispatching teams using common shapes and practices.

workshops
  discrete work contained, state recorded, retryable, team output store, plans etc
  workshop for chiselling machinery docs, 
  promotion when build completes
  
cockpit
  head and hands philosophy, A pilot dispatching teams of agents.
  officers are direct session agents
  agent definitions across common patterns
  team patterns and shapes
  dispatch strategies (how agents and teams interact)

manuals
  every workshop produces an (or integrates into another):
    operator manual - How to operate the new feature
    technical manual - How the underlying machinery works
    maintenance manual - How to maintain the feature

lab (non distributed) for improving the accelerator
  drills - dummy teams and setups to test and discover certain best practices.
  evals - workshop runs as fodder or or source dummy data, harbor evals for inspiration.

dilberryhoundog/dev-workspace
  dev-workspace is previous incantation of humans claude code accelerator, 
  built for HITL era, streamlines git commands, deployment, context building and branch isolation.
  workspace folders redundant with workshops taking over. git management and branch isolation, retained. commands repurposed.
  stub this component for later development, investigate but don't fully transfer yet..

"flight" CLI command
  stubbed for further investigation and improvement.
  placeholder for future command improvements, dev workspace commands. 

HUD html page system
  stubbed implementation for later fitout.
  visibility platform and agent human interaction platform.
  build for agent efficiency, mutating and viewing JSON files from flightdeck.
  interviews, explainer presentations etc.
  local web server,


components
  each major section is a discrete component, able to be evaluated and hillclimbed.
  prefer claude code harness content over bespoke solutions

Plugin 
  distributed as a claude code plugin. 
  imports a single "flightdeck" directory, with accelerator functions inside
  agents, skills, scripts, outputstyles, hooks etc can live in the plugin.
