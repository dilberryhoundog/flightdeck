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

## T4 — `--append-system-prompt-file` delivers the cockpit persona

Command: `--append-system-prompt-file flightdeck/.cockpit/CLAUDE.md --name pilot-probe-2`. The session answered as the pilot, named the commander as its superior, and quoted mandate one correctly. **Verified.**

## Decision

The launcher uses `--settings` for env (including the agent teams flag), permission mode auto, messaging policy and hooks (session start context, write guard), `--append-system-prompt-file` for the persona, `--name pilot` for addressability, and `--add-dir` for the cockpit. No `--agent`: the pilot needs the full tool set and the default prompt. Tool restriction by definition is kept in reserve for crew, not the pilot. See `base/bin/pilot.sh`.

## T5 — PreToolUse guard from the settings file

`hooks.PreToolUse` with matcher `Write|Edit|MultiEdit|NotebookEdit|Bash` running `base/bin/cockpit-guard.py`. A `-p` session asked to write into the cockpit succeeded; asked to write `flightdeck/guard-test.txt` it was refused with the guard's message, and no file appeared. **Verified.** Exit 2 blocks and the stderr text reaches the model.

Observed payload: `{"session_id","transcript_path","cwd","prompt_id","permission_mode","hook_event_name":"PreToolUse","tool_name","tool_input":{...},"tool_use_id"}`. The Write tool sends an absolute `file_path`.

Limits of the guard: Bash coverage is a heuristic over redirections, `sed -i` and a list of write commands. Scripts passed to `python3` or `node` are not inspected. Invalid hook JSON is allowed through. The mandate still stands as an order; the guard catches the obvious slips.
