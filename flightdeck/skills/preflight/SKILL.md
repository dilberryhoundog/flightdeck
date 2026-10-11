---
name: preflight
description: "Runs FlightDeck's own checks and reports where this machine stands: plugin validation, hard rules, tests, always-on token cost, then GitHub sign-in, worktree base, model ceiling and branch protection as information."
disable-model-invocation: true
allowed-tools: Bash(claude plugin validate *), Bash(claude plugin details *), Bash(node *), Bash(gh auth status*), Bash(gh api *), Bash(git *), Read
---

# Pre-flight

Run the four checks in order. For each one, report pass or fail and the last lines of its output. Then report the information items. Plain words, one line per item, no tables.

## Checks (these decide "systems green")

1. Plugin validation: `claude plugin validate "${CLAUDE_PLUGIN_ROOT}"`
2. Hard rules: only if `lab/checks/hard-rules.mjs` exists in the project, run `node lab/checks/hard-rules.mjs`. If it does not exist, say "not in this project: FlightDeck's own repository only" and count the check as skipped, not failed.
3. Tests: `node --test "${CLAUDE_PLUGIN_ROOT}/tests/*.test.mjs"`
4. Always-on cost: `claude plugin details flight`. Report the always-on token cost it prints.

## Information (these never fail)

- GitHub sign-in: run `gh auth status`. Say whether it succeeded. If not, say agents cannot open pull requests until `gh auth login` is done.
- Worktree base: read `~/.claude/settings.json`, `.claude/settings.json` and `.claude/settings.local.json`, and say whether `worktree.baseRef` is `"head"` in any of them. This matters for your own `--worktree` sessions; runners set it themselves.
- Model ceiling: read the managed settings file (Linux `/etc/claude-code/managed-settings.json`, macOS `/Library/Application Support/ClaudeCode/managed-settings.json`). Say whether it sets `"maxEffortLevel": "high"` and a `deniedModels` list containing `fable`. If it does not, print these two lines and the file location, for the owner to add once if they want the ceiling to hold on the whole machine (it needs administrator rights):

  `"maxEffortLevel": "high",`

  `"deniedModels": ["fable"]`

- Branch protection on `main`: get the repository name from `git remote get-url origin`, then run `gh api repos/<owner>/<repo>/branches/main/protection`. Say whether it succeeded. If not, say protection is turned on in the repository's GitHub settings under Branches, and that it is the real stop against pushes to main.

## The ending

End with one line. If checks 1 to 4 passed (a skipped check 2 is fine), write "systems green". Otherwise write "not green:" and list what failed, one per line, each with the command to rerun. Information items never change this line.
