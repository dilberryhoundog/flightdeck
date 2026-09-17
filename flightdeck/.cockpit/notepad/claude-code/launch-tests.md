# Launch Tests — Observed

Throwaway `claude -p --model haiku` sessions launched from the repo root on 2026-09-17, CLI 2.1.274. Each test states the claim, the command shape and the result. These override the docs summary where they disagree.

## T1 — `--settings <path>` delivers `env`

Command: `claude -p --settings flightdeck/.cockpit/base/settings/pilot.settings.json --allowedTools=Bash` with a prompt asking Bash to echo `$FLIGHTDECK_ROLE`. Result: `ROLE=pilot`. **Verified:** a relative settings path resolves from the working directory and its `env` block reaches tool processes.

Gotcha: `--allowedTools` is variadic and swallowed the prompt argument. Use `--allowedTools=Bash` or pass the prompt on stdin.

## T2 — hooks in a `--settings` file fire only in the nested shape

Flat shape `"SessionStart": [{"type":"command",...}]` did not fire. Nested shape `"SessionStart": [{"matcher":"...","hooks":[{"type":"command",...}]}]` fired and its stdout appeared in context as `[cockpit] ...` lines. **Verified.** The research summary's flat example was wrong.

Hook stdin payload observed: `{"session_id","transcript_path","cwd","hook_event_name":"SessionStart","source":"startup"}`. The field is `source`, not `startup_mode`. `CLAUDE_PROJECT_DIR` is set for the hook process.

## T3 — `--agent` keeps the default prompt and restricts tools

Command: `--agents '{"pilot-probe":{"description":"probe","prompt":"You are PROBE-PILOT...","tools":["Read","Bash"]}}' --agent pilot-probe`. The session reported: tools available Read and Bash only; system prompt still begins with the default Claude Code text and still contains git guidance; the user CLAUDE.md still loads. **Verified:** the agent body is appended, not substituted, at least as the model reports it. The docs summary said "replaces".

**Superseded by T7:** the self-report was wrong; `--agent` does replace the default prompt.

## T4 — `--append-system-prompt-file` delivers the cockpit persona

Command: `--append-system-prompt-file flightdeck/.cockpit/CLAUDE.md --name pilot-probe-2`. The session answered as the pilot, named the commander as its superior, and quoted mandate one correctly. **Verified.**

## Decision

The launcher uses `--settings` for env (including the agent teams flag), permission mode auto, messaging policy and hooks (session start context, write guard), `--append-system-prompt-file` for the persona, `--name pilot` for addressability, and `--add-dir` for the cockpit. No `--agent`: the pilot needs the full tool set and the default prompt. Tool restriction by definition is kept in reserve for crew, not the pilot. See `base/bin/pilot.sh`.

## T5 — PreToolUse guard from the settings file

`hooks.PreToolUse` with matcher `Write|Edit|MultiEdit|NotebookEdit|Bash` running `base/bin/cockpit-guard.py`. A `-p` session asked to write into the cockpit succeeded; asked to write `flightdeck/guard-test.txt` it was refused with the guard's message, and no file appeared. **Verified.** Exit 2 blocks and the stderr text reaches the model.

Observed payload: `{"session_id","transcript_path","cwd","prompt_id","permission_mode","hook_event_name":"PreToolUse","tool_name","tool_input":{...},"tool_use_id"}`. The Write tool sends an absolute `file_path`.

Limits of the guard: Bash coverage is a heuristic over redirections, `sed -i` and a list of write commands. Scripts passed to `python3` or `node` are not inspected. Invalid hook JSON is allowed through. The mandate still stands as an order; the guard catches the obvious slips.

## T6 — Model and effort through the settings file (2026-09-18, CLI 2.1.274)

Tests used `claude -p` from the repo root with a notepad settings file `{"model":"fable","effortLevel":"medium"}`. The model was read from the `"model"` fields in the JSON output, not from what the model said about itself.

- Fresh session, settings file only: `claude-fable-5-1`. **Verified.** A settings `model` injected by `--settings` picks the model. User settings define no `model`, so this does not prove that a `--settings` model beats a user-settings model.
- Fresh session, settings file plus `--model sonnet --effort low`: `claude-sonnet-5`. **Verified.** The `--model` flag beats the settings `model`.
- No settings file: `claude-opus-5[1m]`. This is the account default when nothing pins a model.
- Resume an Opus session with the Fable settings file: still `claude-opus-5[1m]`. **Verified.** On resume the model saved in the transcript beats the settings `model`.
- Resume the same session with `--model fable`: `claude-fable-5-1`. **Verified.** The flag overrides the transcript model on resume.
- Effort: **not verified.** Print mode has no readout. The init event has no effort field, `--debug-file` logs no effort line, and `/effort` in `-p` only prints its usage text. To check it, run `/effort` or `/status` inside an interactive session.

Environment observed: user `~/.claude/settings.json` sets `effortLevel: "high"` and no `model`. User settings env sets `CLAUDE_CODE_SUBAGENT_MODEL=opus`, which puts crew subagents and teammates on Opus unless a spawn or agent definition names a model.

Shell lessons: zsh does not word-split an unquoted `$args`, so a loop over flag strings passes them as one argument. `--output-format json` returns an event list in this environment, not one object. The cockpit guard reads unexpanded shell variables (`$N/file`) as paths inside the repo and blocks them. Use literal absolute paths in commands that write.

## T7 — `--agent` replaces the default prompt, measured (2026-09-18)

Measured by input size instead of self-report. `claude -p --model haiku --tools Read "go"` with the same probe text each time, reading `cache_creation_input_tokens`: `--agents ... --agent probe` 6,445; `--append-system-prompt` 44,955; `--system-prompt` 38,153. **Verified:** `--agent` replaces the default prompt and drops more context than `--system-prompt` does. T3 was wrong; the record in `records/claude-code/settings-and-launch.md` stands.

## T8 — Effort and model on start and resume, interactive (2026-09-18)

Interactive sessions in tmux; the welcome header prints model and effort (e.g. "Fable 5.1 with medium effort"). User settings carry `effortLevel: high`.

- Start with the pilot settings file (`model: fable`, `effortLevel: medium`): Fable 5.1, medium. **Verified:** a `--settings` effort beats the user settings effort.
- Session created on Sonnet at `--effort low`, resumed with the settings file only: Sonnet 5, medium. **Verified:** on resume the transcript restores the model, but effort comes from settings.
- Same session resumed with `--model fable --effort medium`: Fable 5.1, medium.
- `base/bin/pilot.sh` launched for real (no message sent): Fable 5.1, medium, auto mode, named `pilot`.

Launcher consequence: resume adds `--model fable` only. Probe transcripts left behind are named `pilot-probe`.
