# Discovery notes: constraints

- 9b679556:7008 (constraints = things that existed in the world before flightcrew) confirmed as the actual constraint-domain test in practice: interview turns 7305/7311 apply exactly this test to reject drafted nodes — it's a working rule, not just a stated one.
- 9b679556:7287 (agent file YAML frontmatter fields) confirmed near-verbatim: `flightcrew-core:flightdeck/manuals/harness/claude-code-facts.md` documents the same frontmatter surface (name, description, tools, model, etc.).
- 9b679556:5649 (network is fine for gh/websearch/fetch) — IN TENSION with built doctrine, not resolved: `flightcrew-core:flightdeck/manuals/harness/permissions.md:81` states "The harness runs with no network: allowedDomains stays empty, and any command that comes to need the network is a change on the tooling axis." Record this as an open tension between commander intent and the manual's stated default, don't resolve it either way.
- Terrain to add: `permissions.md`'s `sandbox.network.allowedDomains/deniedDomains` block as the actual constraint mechanism.
