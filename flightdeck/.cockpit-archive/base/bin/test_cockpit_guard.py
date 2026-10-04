#!/usr/bin/env python3
"""Table test for cockpit-guard.py. Run: python3 base/bin/test_cockpit_guard.py (from anywhere).

Each case is (tool, input, cwd relative to the repo root, expected exit code).
Cases marked A2 come from the auditor's findings in the 2026-09-18 team run.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.realpath(os.path.join(HERE, "..", "..", "..", ".."))
GUARD = os.path.join(HERE, "cockpit-guard.py")
CP = ROOT + "/flightdeck/.cockpit"

CASES = [
    # Write tools
    ("Write", {"file_path": CP + "/notepad/x.md"}, "", 0),
    ("Write", {"file_path": ROOT + "/flightdeck/STRUCTURE.md"}, "", 2),
    ("Write", {"file_path": "notepad/x.md"}, "flightdeck/.cockpit", 0),
    ("Write", {"file_path": os.path.expanduser("~/.claude/scratch-pilot/x")}, "", 0),
    # redirections
    ("Bash", {"command": "echo hi > logs/x.md"}, "flightdeck/.cockpit", 0),  # A2 relative to payload cwd
    ("Bash", {"command": "echo hi > flightdeck/x.md"}, "", 2),
    ("Bash", {"command": "cd flightdeck/.cockpit && echo hi > logs/x.md"}, "", 0),  # A2 cd followed
    ("Bash", {"command": "echo 'a -> b' && echo \"x > y\""}, "", 0),  # A2 quoted arrows
    ("Bash", {"command": "ls 2>&1 | head; ls 2>/dev/null"}, "", 0),
    ("Bash", {"command": "echo hi >> README.md"}, "", 2),
    # variables
    ("Bash", {"command": "N=" + CP + "/notepad; echo hi > $N/x.md"}, "", 0),  # A2 variables
    ("Bash", {"command": "N=" + ROOT + "/flightdeck; rm $N/x.md"}, "", 2),
    # sed and cp
    ("Bash", {"command": "sed -i '' 's/a/b/' " + CP + "/notepad/x.md"}, "", 0),  # A2 sed expression
    ("Bash", {"command": "sed -i '' 's/a/b/' flightdeck/STRUCTURE.md"}, "", 2),
    ("Bash", {"command": "cp flightdeck/STRUCTURE.md " + CP + "/notepad/"}, "", 0),  # A2 cp source
    ("Bash", {"command": "cp " + CP + "/notepad/x flightdeck/x"}, "", 2),
    ("Bash", {"command": "mv notepad/a notepad/b"}, "flightdeck/.cockpit", 0),
    # bypasses the old guard missed
    ("Bash", {"command": "git rm flightdeck/STRUCTURE.md"}, "", 2),  # A2
    ("Bash", {"command": "git rm -q quarters/pilot/pilot.md"}, "flightdeck/.cockpit", 0),
    ("Bash", {"command": "git checkout -- flightdeck/STRUCTURE.md"}, "", 2),  # A2
    ("Bash", {"command": "git restore README.md"}, "", 2),
    ("Bash", {"command": "git reset --hard"}, "", 2),
    ("Bash", {"command": "git status && git add flightdeck/.cockpit && git commit -m x && git push"}, "", 0),
    ("Bash", {"command": "FOO=1 rm flightdeck/x"}, "", 2),  # A2 env prefix
    ("Bash", {"command": "find flightdeck -name '*.tmp' -delete"}, "", 2),  # A2
    ("Bash", {"command": "find flightdeck -name '*.md'"}, "", 0),
    ("Bash", {"command": "find " + CP + "/notepad -name '*.tmp' -delete"}, "", 0),
    ("Bash", {"command": "ls | xargs rm"}, "", 2),  # A2
    ("Bash", {"command": "sudo rm -rf flightdeck/x"}, "", 2),
    # heredocs
    ("Bash", {"command": "cat > " + CP + "/notepad/x.md <<'EOF'\nsee `a` -> `b` and > `c`\nrm flightdeck/x\nEOF"}, "", 0),
    ("Bash", {"command": "cat > flightdeck/x.md <<'EOF'\nhello\nEOF"}, "", 2),
    # malformed input fails closed
    ("Bash", "oops", "", 2),  # A2 non-dict tool_input
    ("Bash", {"command": "echo 'unclosed"}, "", 2),
    ("Read", {"file_path": ROOT + "/flightdeck/STRUCTURE.md"}, "", 0),
]


def run(tool, inp, cwd):
    payload = json.dumps({"tool_name": tool, "tool_input": inp, "cwd": os.path.join(ROOT, cwd) if cwd else ROOT})
    env = dict(os.environ, CLAUDE_PROJECT_DIR=ROOT)
    return subprocess.run([sys.executable, GUARD], input=payload, text=True, capture_output=True, env=env)


def main():
    failed = 0
    for tool, inp, cwd, want in CASES:
        r = run(tool, inp, cwd)
        ok = r.returncode == want
        failed += not ok
        label = inp.get("command", inp.get("file_path")) if isinstance(inp, dict) else repr(inp)
        print("%s  want %d got %d  %s %s" % ("ok  " if ok else "FAIL", want, r.returncode, tool, label.replace("\n", "\\n")[:90]))
        if not ok and r.stderr:
            print("      " + r.stderr.strip()[:200])
    print("\n%d/%d passed" % (len(CASES) - failed, len(CASES)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
