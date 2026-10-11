# Eval cases

An eval case is a prompt plus graders. The prompt is sent to Claude with FlightDeck loaded, and the graders score the answer. Some graders are exact checks (a word must appear, a tool must be used) and some are a model reading the answer against written criteria. The model-graded ones are noisy, so eval results are reported and never block a pull request.

The cases live in `flightdeck/evals/`, not here, because Claude Code only reads eval cases from inside the plugin folder. Their results come back here, in `lab/evals/results/`, which git ignores.

Name each case `pr<n>-<what>` so one part's cases can be picked with `--case 'pr3-*'`. The three cases so far are `pr1-plain-chat-quiet` (plain chat stays plain), `pr1-adversary-planted-defect` (the adversary finds a planted bug) and `pr1-workshop-scope` (a workshop's notes reach only the agents sent into that workshop).

Run the plain-chat case and the adversary case, one command each (about $1 each):

`claude plugin eval flightdeck --eval-dir evals --case 'pr1-p*' --runs 1 --no-publish --trust-plugin --ablation none --max-cost-usd 1 --output-dir lab/evals/results/chat`

`claude plugin eval flightdeck --eval-dir evals --case 'pr1-a*' --runs 1 --no-publish --trust-plugin --ablation none --max-cost-usd 1 --output-dir lab/evals/results/adversary`

`--case` understands only `*` in a name pattern; square brackets and braces match nothing.

Run the workshop case (about $1):

`claude plugin eval flightdeck --eval-dir evals --case 'pr1-workshop-scope' --runs 1 --no-publish --trust-plugin --ablation none --max-cost-usd 1 --scaffold --allow-tools 'Bash(node *)' --output-dir lab/evals/results/scope`

Granting Bash makes Claude Code run every command in its own sandbox, and on Linux the sandbox needs bubblewrap and socat installed first (for example `sudo apt install bubblewrap socat`). Without them the run is refused and still prints a score (0.25, 'Sandbox required but unavailable'); that is the machine, not FlightDeck.

`--ablation none` runs only the with-FlightDeck side, which halves the cost. With `--ablation none` the plain-chat case runs only with FlightDeck, so a 1.00 shows that no loud greeting or card appeared; it does not compare against Claude without FlightDeck. `--max-cost-usd` stops the run at the cap. `--scaffold` and `--allow-tools 'Bash(node *)'` are added only for cases tagged `scaffold`, because a scaffold runs a script on your machine before the case starts.

When a run finishes, open the report page: `lab/evals/results/chat/report.html`, `lab/evals/results/adversary/report.html` and `lab/evals/results/scope/report.html`. The raw numbers are in `aggregate-result.json` beside each one. An exit code of 1 means a case scored below full marks, or no case matched the name, or a case did not load, or the run was refused; read the printed message to tell which. A scored-below-full-marks case is a finding and not a failure. An exit code of 2 means the cost cap was reached.

If `claude plugin eval` is unknown on your Claude Code, evals are "not available here". Nothing else in the lab needs them.

To add a case: make a folder `flightdeck/evals/pr<n>-<what>/` holding a `prompt.md` and a `graders/` folder with one `<name>.md` per grader. The `prompt.md` front matter may use only `description`, `model`, `max_turns`, `allowed_tools`, `runs`, `tags`, `plugins`, `expected_outcome`, `timeout_seconds`, `append_system_prompt` and `env` (plus `schema_version` and `name`), and the text below it is the prompt. Each grader file starts with a `type:` line (`llm`, `regex`, `tool_used`, `file_exists`) and, for `llm`, the text below it is the criteria. Use `model: haiku` or `model: sonnet` only. Use a `case.yaml` instead of `prompt.md` only when the case needs a scaffold script that sets up its files first.
