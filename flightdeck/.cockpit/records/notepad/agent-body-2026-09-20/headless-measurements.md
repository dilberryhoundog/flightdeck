# Headless launch measurements, 2026-09-21 (pilot, session 241bff25)

Method: `claude -p` v2.1.278 from the session scratchpad, a test copy of the launcher's agents JSON (harmless `initialPrompt`, a codeword added to the body), `--agent pilot`, `--append-system-prompt` carrying a second codeword, `--tools ""`, `--output-format json`, a copy of `pilot.settings.json` without hooks. Read from output fields and the transcript on disk, not from the model's account of itself.

- Agent `model: fable`, no `model` key in the `--settings` file: `modelUsage` lists `claude-fable-5-1` only. The agent's model applies.
- The reply returned both codewords: the agent body reaches the model and `--append-system-prompt` lands on top of it.
- Under `-p`, the first user turn in the transcript is the `initialPrompt` text, a blank line, then the `-p` prompt: prepended, one turn.
- Agent `effort: medium`, no `effortLevel` in the `--settings` file, `effortLevel: high` in the user settings: transcript records `effort: high`. With `effortLevel: medium` in the `--settings` file: transcript records `effort: medium`. An agent definition's `effort` does not beat a settings `effortLevel`.
- Not measured: an interactive launch; resume (whether `initialPrompt` fires again, whether effort holds); `@` expansion inside an agent body.

## Second round, after the commander removed `effortLevel` from his user settings

- No `effortLevel` in any settings file; agent `effort: medium`: transcript records `effort: high`. Agent `effort: low`: `effort: high`. The agent definition's `effort` does not apply to a main session agent launched from `--agents` JSON; `high` is the default.
- Same launch with the CLI flag `--effort medium`: transcript records `effort: medium`. The flag pins it.
- Ruling: the launcher reads `effort` from `pilot.md` and passes `--effort`; `effortLevel` leaves the pilot's settings file. `pilot.md` is the single source for model and effort.
