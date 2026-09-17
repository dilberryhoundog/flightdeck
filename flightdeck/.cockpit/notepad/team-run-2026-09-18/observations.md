# Team mechanics observed, 2026-09-18 (CLI 2.1.274)

- Agent call with `name` returned `agent_id: name@session-<id>` and "will receive instructions via mailbox". Three spawned in one message, mixed models and agent types (general-purpose Opus, claude-code-guide Sonnet, adversary Sonnet).
- Idle notifications arrive as JSON `{"type":"idle_notification","from","timestamp","idleReason":"available","result"|"summary"}`. `result` carries the teammate's final text, but long text is truncated with "[result truncated — ask the agent for the rest via SendMessage]".
- A teammate told to wait for two messages went idle after reading the orders, woke on the first message, went idle again, and woke on the second. Teammate-to-teammate SendMessage worked (auditor to red-team, docs-scout to red-team).
- The pilot's SendMessage to a teammate routes as sender `team-lead`. A resend request was answered with a direct message, which arrived intact.
- Notification timestamps read 2026-09-17T14:5x UTC, which is 00:5x AEST on 2026-09-18.
- The auditor reported that the pilot's PreToolUse guard hook also fires on teammates' Bash calls (unverified by the pilot).
- The guard blocked the pilot's own heredoc filing these notes on backticks inside quoted text, which confirms part of A2.
