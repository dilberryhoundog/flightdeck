#!/usr/bin/env python3
"""PreToolUse hook. Enforces the pilot's first mandate: write only inside the cockpit.

Stdin: hook JSON with tool_name, tool_input and cwd. Exit 0 allows. Exit 2 blocks and
feeds stderr back to the agent as the reason. The hook runs for the pilot's session and
its teammates.

Allowed write roots (relative to the repo root): flightdeck/.cockpit and dev/workspace.
Paths outside the repo (the .claude side room, tmp) are not this guard's concern and pass.

Bash coverage is a parser, not a shell: it tokenises with shlex, follows `cd`, expands
variables assigned earlier in the same command, and checks the targets of known write
commands, redirections, `sed -i`, `find -delete`, `xargs` and git's file-changing
subcommands. Not covered: scripts run by an interpreter (python3, node, perl without -i),
variables it cannot resolve, and command substitution. The mandate stands regardless.
"""
import json, os, re, shlex, sys

ALLOWED = ("flightdeck/.cockpit", "dev/workspace")
WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}
SEPARATORS = {";", "&&", "||", "|", "&", "(", ")", "|&"}
REDIRECTS = {">", ">>", ">|", "&>", "&>>"}
WRAPPERS = {"sudo", "command", "nohup", "time", "nice", "builtin", "exec"}
TARGET_ALL = {"rm", "rmdir", "touch", "mkdir", "truncate", "tee", "shred", "unlink", "chmod", "chown"}
TARGET_LAST = {"cp", "mv", "install", "rsync", "ln", "scp"}
VAR = re.compile(r"\$(\w+)|\$\{(\w+)\}")


class Blocked(Exception):
    pass


def repo_root():
    return os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())


def resolve(path, cwd):
    return os.path.realpath(os.path.join(cwd, os.path.expanduser(path)))


def allowed(path, cwd, base):
    p = resolve(path, cwd)
    if p != base and not p.startswith(base + os.sep):
        return True  # outside the repo: not this guard's job
    rel = os.path.relpath(p, base)
    return any(rel == a or rel.startswith(a + os.sep) for a in ALLOWED)


def strip_heredocs(cmd):
    """Remove heredoc bodies so their text is never read as commands."""
    out, pending = [], []
    for line in cmd.split("\n"):
        if pending:
            if line.strip() == pending[0]:
                pending.pop(0)
            continue
        out.append(line)
        pending += [m.group(2) for m in re.finditer(r"<<-?\s*(['\"]?)(\w+)\1", line)]
    return "\n".join(out)


def tokenise(cmd):
    lex = shlex.shlex(strip_heredocs(cmd).replace("\n", " ; "), posix=True, punctuation_chars=";&|<>()")
    lex.whitespace_split = True
    lex.commenters = ""
    return list(lex)


def split_commands(tokens):
    cmd = []
    for t in tokens:
        if t in SEPARATORS:
            if cmd:
                yield cmd
            cmd = []
        else:
            cmd.append(t)
    if cmd:
        yield cmd


def expand(token, env):
    return VAR.sub(lambda m: env.get(m.group(1) or m.group(2), m.group(0)), token)


def operands(args):
    return [a for a in args if not a.startswith("-")]


def git_targets(args, cwd):
    """Returns (targets, cwd) for git's file-changing subcommands."""
    i = 0
    while i < len(args) and args[i].startswith("-"):
        if args[i] == "-C" and i + 1 < len(args):
            cwd = os.path.join(cwd, args[i + 1])
            i += 1
        i += 1
    if i >= len(args):
        return [], cwd
    sub, rest = args[i], args[i + 1:]
    if sub in ("rm", "mv", "restore"):
        return operands(rest) or ["."], cwd
    if sub == "checkout" and "--" in rest:
        return rest[rest.index("--") + 1:] or ["."], cwd
    if sub == "clean":
        return operands(rest) or ["."], cwd
    if sub == "reset" and "--hard" in rest:
        return ["."], cwd
    return [], cwd


def bash_targets(command, start_cwd):
    """Yields (path, cwd) pairs that the command would write to."""
    env = dict(os.environ)
    cwd = start_cwd
    for words in split_commands(tokenise(command)):
        words = [expand(w, env) for w in words]
        # redirections
        clean = []
        i = 0
        while i < len(words):
            w = words[i]
            if w in REDIRECTS and i + 1 < len(words):
                if not words[i + 1].startswith("&"):
                    yield words[i + 1], cwd
                i += 2
                continue
            if w == ">&" or w == "<":
                i += 2
                continue
            if re.fullmatch(r"\d+", w) and i + 1 < len(words) and words[i + 1] in REDIRECTS | {">&"}:
                i += 1
                continue
            clean.append(w)
            i += 1
        words = clean
        # assignments and wrappers
        while words and re.fullmatch(r"\w+=.*", words[0]):
            k, v = words[0].split("=", 1)
            env[k] = v
            words = words[1:]
        while words and (words[0] in WRAPPERS or words[0] == "env"):
            words = words[1:]
            while words and (re.fullmatch(r"\w+=.*", words[0]) or words[0].startswith("-")):
                words = words[1:]
        if not words:
            continue
        name, args = os.path.basename(words[0]), words[1:]
        if name == "xargs":
            inner = [a for a in args if not a.startswith("-")]
            if inner and os.path.basename(inner[0]) in TARGET_ALL | TARGET_LAST | {"sed"}:
                raise Blocked("xargs feeds a write command targets the guard cannot see")
            continue
        if name == "cd":
            target = operands(args)
            cwd = resolve(target[0], cwd) if target and "$" not in target[0] else cwd
            continue
        if name in TARGET_ALL:
            targets = operands(args)
        elif name in TARGET_LAST:
            if "-t" in args and args.index("-t") + 1 < len(args):
                targets = [args[args.index("-t") + 1]]
            else:
                ops = operands(args)
                targets = ops[-1:] if len(ops) >= 2 else []
        elif name in ("sed", "perl") and any(a.startswith("-i") or a.startswith("-pi") for a in args):
            # BSD sed takes a backup suffix after -i: '' or .bak. Drop it before finding operands.
            kept = [a for j, a in enumerate(args) if not (j > 0 and args[j - 1] == "-i" and (a == "" or a.startswith(".")))]
            ops = [a for a in operands(kept) if a]
            has_script = any(a in ("-e", "-f") for a in args)
            targets = ops if has_script else ops[1:]
        elif name == "dd":
            targets = [a[3:] for a in args if a.startswith("of=")]
        elif name == "find":
            if "-delete" in args or any(a in ("-exec", "-execdir", "-ok") and j + 1 < len(args) and os.path.basename(args[j + 1]) in TARGET_ALL | TARGET_LAST for j, a in enumerate(args)):
                roots = []
                for a in args:
                    if a.startswith("-") or a in ("(", "!"):
                        break
                    roots.append(a)
                targets = roots or ["."]
            else:
                targets = []
        elif name == "tar" and any(a.startswith("-x") or re.fullmatch(r"x\w*", a) for a in args):
            targets = [args[args.index("-C") + 1]] if "-C" in args and args.index("-C") + 1 < len(args) else ["."]
        elif name == "unzip":
            targets = [args[args.index("-d") + 1]] if "-d" in args and args.index("-d") + 1 < len(args) else ["."]
        elif name == "git":
            targets, gcwd = git_targets(args, cwd)
            for t in targets:
                yield t, gcwd
            continue
        else:
            targets = []
        for t in targets:
            yield t, cwd


def check(data):
    if not isinstance(data, dict):
        raise Blocked("hook payload is not an object")
    tool = data.get("tool_name", "")
    inp = data.get("tool_input", {})
    if tool not in WRITE_TOOLS and tool != "Bash":
        return []
    if not isinstance(inp, dict):
        raise Blocked("tool_input is not an object")
    base = repo_root()
    cwd = data.get("cwd") or base
    bad = []
    if tool in WRITE_TOOLS:
        for key in ("file_path", "notebook_path", "path"):
            p = inp.get(key)
            if isinstance(p, str) and p and not allowed(p, cwd, base):
                bad.append(p)
    else:
        command = inp.get("command", "")
        if not isinstance(command, str):
            raise Blocked("command is not a string")
        try:
            pairs = list(bash_targets(command, cwd))
        except ValueError as e:
            raise Blocked("could not parse the command (%s); rewrite it more simply" % e)
        for t, tcwd in pairs:
            if "$" in t or t.startswith("&"):
                continue  # unresolvable; the mandate still applies
            if not allowed(t, tcwd, base):
                bad.append(t)
    return bad


def main():
    try:
        data = json.load(sys.stdin)
        bad = check(data)
    except Blocked as e:
        sys.stderr.write("[cockpit-guard] Blocked: %s.\n" % e)
        return 2
    except Exception as e:  # fail closed
        sys.stderr.write("[cockpit-guard] Blocked: guard error (%s: %s). Fix the guard or simplify the call.\n" % (type(e).__name__, e))
        return 2
    if bad:
        sys.stderr.write(
            "[cockpit-guard] Blocked: the pilot writes only inside flightdeck/.cockpit (and dev/workspace for dev-workspace procedures). "
            "Offending path(s): " + ", ".join(bad) + ". Route this change through base/ as a proposal and dispatch crew to execute it.\n")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
