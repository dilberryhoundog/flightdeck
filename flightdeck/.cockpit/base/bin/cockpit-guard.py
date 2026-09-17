#!/usr/bin/env python3
"""PreToolUse hook. Enforces the pilot's first mandate: write only inside the cockpit.

Stdin: hook JSON with tool_name and tool_input. Exit 0 allows. Exit 2 blocks and
feeds stderr back to the pilot as the reason.

Allowed write roots (relative to the repo root): flightdeck/.cockpit and dev/workspace.
Paths outside the repo (scratch, tmp) are not the cockpit's concern and pass.
"""
import json, os, re, sys

ALLOWED = ("flightdeck/.cockpit", "dev/workspace")
WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}
BASH_WRITE_CMDS = {"tee", "mv", "cp", "rm", "mkdir", "touch", "rmdir", "install", "ln", "truncate", "dd", "rsync", "unzip", "tar"}

def root():
    return os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())

def allowed(path, base):
    p = os.path.realpath(os.path.join(base, os.path.expanduser(path)))
    if not p.startswith(base + os.sep) and p != base:
        return True  # outside the repo: not this guard's job
    rel = os.path.relpath(p, base)
    return any(rel == a or rel.startswith(a + os.sep) for a in ALLOWED)

def bash_targets(cmd):
    """Best-effort: paths that a shell command would write to."""
    targets = []
    # redirections: > path, >> path, 2> path
    for m in re.finditer(r"(?<![<>])\d?>{1,2}\s*([^\s;&|)]+)", cmd):
        targets.append(m.group(1))
    # sed -i FILE..., and write-ish commands followed by paths
    for seg in re.split(r"[;&|]+|\|\|", cmd):
        toks = seg.strip().split()
        if not toks:
            continue
        name = os.path.basename(toks[0])
        if name == "sed" and any(t.startswith("-i") for t in toks):
            targets += [t for t in toks[1:] if not t.startswith("-") and not t.startswith("'") and not t.startswith('"') and "/" in t]
        elif name in BASH_WRITE_CMDS:
            targets += [t for t in toks[1:] if not t.startswith("-")]
        elif name == "python3" or name == "python":
            # cannot inspect; rely on the pilot. Heredoc scripts that open() files are not caught.
            pass
    return [t.strip("'\"") for t in targets if t and not t.startswith("$(") and t not in ("/dev/null", "&1", "&2")]

def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    tool = data.get("tool_name", "")
    inp = data.get("tool_input", {}) or {}
    base = root()
    bad = []
    if tool in WRITE_TOOLS:
        for key in ("file_path", "notebook_path", "path"):
            p = inp.get(key)
            if p and not allowed(p, base):
                bad.append(p)
    elif tool == "Bash":
        for t in bash_targets(inp.get("command", "")):
            if not allowed(t, base):
                bad.append(t)
    if bad:
        sys.stderr.write(
            "[cockpit-guard] Blocked: the pilot writes only inside flightdeck/.cockpit (and dev/workspace for dev-workspace procedures). "
            "Offending path(s): " + ", ".join(bad) + ". Route this change through base/ as a proposal and dispatch crew to execute it.\n")
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
