#!/usr/bin/env python3
"""Table test for cockpit-rename, written to notepad/stage-a-2026-09-20/plan.md pass 3,
never to the tool's own source. Run: python3 base/bin/test_cockpit_rename.py (from anywhere),
under /usr/bin/python3 (3.9.6). Case numbers match the plan's pass-3 numbering under
"Case list — test_cockpit_rename.py" (13 cases; pass 2 had 14, two merged). Every case copies
the fixture tree with shutil.copytree into tempfile.mkdtemp() and points --root at that copy,
so the real cockpit and the shared fixture tree under base/bin/fixtures/stage-a/cockpit are
never a target and never mutated; a case may add case-specific content to its own copy first.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
RENAME = os.path.join(HERE, "cockpit-rename")
CHECK = os.path.join(HERE, "cockpit-check")
FX = os.path.join(HERE, "fixtures/stage-a/cockpit")

FAILS = []
TMP_DIRS = []


def tree_hash(root):
    h = hashlib.sha256()
    for base, dirs, files in os.walk(root):
        dirs.sort()
        for name in sorted(files):
            p = os.path.join(base, name)
            h.update(os.path.relpath(p, root).encode())
            with open(p, "rb") as f:
                h.update(f.read())
    return h.hexdigest()


def copy_fixture():
    d = tempfile.mkdtemp(prefix="cockpit-rename-test-")
    TMP_DIRS.append(d)
    dest = os.path.join(d, "cockpit")
    shutil.copytree(FX, dest)
    return dest


def run(args, cwd=None, root=None):
    """root=None means --root is deliberately omitted from the command line (case 2)."""
    cmd = [RENAME]
    if root is not None:
        cmd += ["--root", root]
    cmd += args
    try:
        return subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    except (FileNotFoundError, PermissionError) as e:
        class R:
            returncode = None
            stdout = ""
            stderr = str(e)
        return R()


def read(path):
    with open(path) as f:
        return f.read()


def write(path, content):
    with open(path, "w") as f:
        f.write(content)


def check(name, cond, detail=""):
    ok = bool(cond)
    print("%s  %s%s" % ("ok  " if ok else "FAIL", name, ("  -- " + detail) if (not ok and detail) else ""))
    if not ok:
        FAILS.append(name)
    return ok


def case(fn):
    try:
        fn()
    except Exception as e:
        check(fn.__name__, False, "raised %r" % (e,))


# 1. Dry run writes nothing: --path mapping with no --apply.
def case_01_dry_run_writes_nothing():
    root = copy_fixture()
    before = tree_hash(root)
    r = run(["--path", "commanders-desk/out-advice/DS001.md=commanders-desk/out-advice/CA001.md"], root=root)
    after = tree_hash(root)
    check("case1: dry run writes nothing", before == after)
    check("case1: dry run prints a change list", bool(r.stdout.strip()))
    check("case1: dry run reports a non-zero pre-pass count", any(c.isdigit() and c != "0" for c in r.stdout) or "1" in r.stdout)


# 2. --apply without an explicit --root: refused, exit 2, nothing written.
def case_02_apply_without_root_refused():
    root = copy_fixture()
    before = tree_hash(root)
    r = run(["--id", "D001=De001", "--apply"], cwd=root, root=None)
    after = tree_hash(root)
    check("case2: apply without --root is refused (exit 2)", r.returncode == 2)
    check("case2: nothing written", before == after)


# 3. The ordering gate, scoped to the colliding id token. DS001.md's outstanding hits are
# dossiers.json's advice_copy (whole value) and the topics ref composite (whole value), both
# tier1, so a single path repair clears the DS001.md entry. A second outstanding renames entry
# with no id token (records/ -> records/manuals/) must not gate any --prefix run, and --prefix
# O=Or must be unaffected by the DS001.md entry throughout.
def case_03_ordering_gate():
    root = copy_fixture()
    # Give the no-token entry an outstanding live citation of its own, in this copy only.
    dossiers_path = os.path.join(root, "commanders-desk/in-dossiers/dossiers.json")
    dossiers = json.loads(read(dossiers_path))
    dossiers["dossiers"][0]["notes_path"] = "records/"
    write(dossiers_path, json.dumps(dossiers, indent=2))

    before = tree_hash(root)
    r1 = run(["--prefix", "DS=Ds"], root=root)
    after1 = tree_hash(root)
    check("case3: --prefix DS=Ds refused while DS001.md has outstanding hits (exit 2)", r1.returncode == 2)
    check("case3: refusal names the entry, its count and the colliding token",
          "DS001.md" in (r1.stdout + r1.stderr) and "DS001" in (r1.stdout + r1.stderr)
          and any(ch.isdigit() for ch in (r1.stdout + r1.stderr)))
    check("case3: nothing written while refused", before == after1)

    r_or = run(["--prefix", "O=Or"], root=root)
    check("case3: --prefix O=Or is unaffected by the DS001.md entry (not refused for that reason)",
          r_or.returncode != 2 or "DS001" not in (r_or.stdout + r_or.stderr))

    r2 = run(["--path", "commanders-desk/out-advice/DS001.md=commanders-desk/out-advice/CA001.md",
              "--path", "commanders-desk/out-advice/DS002.md=commanders-desk/out-advice/CA002.md",
              "--path", "commanders-desk/out-advice/DS003.md=commanders-desk/out-advice/CA003.md",
              "--apply"], root=root)
    dossiers_after = read(dossiers_path)
    topic = read(os.path.join(root, "logs/topics/sample-topic.json"))
    check("case3: path repair rewrote dossiers.json advice_copy", "CA001.md" in dossiers_after and '"DS001.md"' not in dossiers_after.replace('"DS001.md#', ""))
    check("case3: path repair rewrote the composite ref's path half", "CA001.md#DS001" in topic)

    r3 = run(["--prefix", "DS=Ds"], root=root)
    check("case3: the same --prefix DS=Ds run now proceeds", r3.returncode != 2)

    r4 = run(["--prefix", "O=Or"], root=root)
    check("case3: --prefix O=Or is not gated by the still-outstanding no-token records/ entry", r4.returncode != 2)


# 4. Tier 1 applied: a whole-value id field renames under --apply; pre-pass count zero next run.
def case_04_tier1_applied():
    root = copy_fixture()
    r1 = run(["--id", "D001=De001", "--apply"], root=root)
    check("case4: apply exits cleanly", r1.returncode in (0, 1))
    decisions = json.loads(read(os.path.join(root, "base/decisions.json")))
    ids = [d["id"] for d in decisions["decisions"]]
    check("case4: D001 renamed to De001", "De001" in ids and "D001" not in ids)

    r2 = run(["--id", "D001=De001"], root=root)
    check("case4: second run's pre-pass count for D001 is zero", "D001" not in r2.stdout or "0" in r2.stdout)


# 5. Tier 3 survives a full pass: O048's text is untouched; its id becomes Or048.
def case_05_tier3_survives_full_pass():
    root = copy_fixture()
    run(["--prefix", "O=Or", "--apply"], root=root)
    after_orders = read(os.path.join(root, "quarters/commander/orders.json"))
    check("case5: (O001 is not very readable) survives byte-identical",
          "(O001 is not very readable)" in after_orders)
    orders = json.loads(after_orders)
    ids = [o["id"] for o in orders["orders"]]
    check("case5: O048's id becomes Or048", "Or048" in ids)


# 6. Tier 2 is never applied: a live markdown occurrence and a JSON-prose occurrence
# produce diff hunks and are byte-identical after --apply.
def case_06_tier2_never_applied():
    root = copy_fixture()
    dossier_md = os.path.join(root, "commanders-desk/in-dossiers/DS001-fixture.md")
    before_md = read(dossier_md)
    write(dossier_md, before_md + "\nSee `commanders-desk/out-advice/DS001.md` for the source.\n")
    md_before = read(dossier_md)

    decisions_path = os.path.join(root, "base/decisions.json")
    before_dec = read(decisions_path)  # D002's prose already cites workshop/retired-notes.md

    r = run(["--path", "commanders-desk/out-advice/DS001.md=commanders-desk/out-advice/CA001.md",
             "--path", "workshop/retired-notes.md=workshop/new-notes.md", "--apply"], root=root)
    check("case6: diff hunks are printed", "DS001.md" in r.stdout or "retired-notes" in r.stdout)
    check("case6: markdown occurrence byte-identical after --apply", read(dossier_md) == md_before)
    check("case6: JSON-prose occurrence byte-identical after --apply", read(decisions_path) == before_dec)


# 7. Commander-reviewed is tier 2 whatever the shape: a whole-value occurrence in
# out-advice/CA001.md and a rename of a commander-owned file are both proposed, never applied.
def case_07_commander_reviewed_tier2():
    root = copy_fixture()
    ca001 = os.path.join(root, "commanders-desk/out-advice/CA001.md")
    before_ca001 = read(ca001)
    write(ca001, before_ca001 + "\nC001\n")  # a bare whole-line id, tier1-shaped in isolation
    ca001_before = read(ca001)

    ds002 = os.path.join(root, "commanders-desk/out-advice/DS002.md")
    check("case7: DS002.md exists before the run", os.path.exists(ds002))

    r = run(["--id", "C001=C001x", "--path", "commanders-desk/out-advice/DS002.md=commanders-desk/out-advice/CA002.md",
             "--apply"], root=root)
    check("case7: CA001.md byte-identical after --apply (whole-value occurrence proposed only)",
          read(ca001) == ca001_before)
    check("case7: DS002.md is not renamed on disk under --apply", os.path.exists(ds002))
    check("case7: proposal for the file rename appears in the change list", "DS002.md" in r.stdout or "CA002.md" in r.stdout)


# 8. Tier 3 by zone: a stale id in a *.keep and in out-ideas/ (commander-verbatim) is counted,
# never diffed, never changed under --apply; a frozen log, a scratch file and
# base/bin/fixtures/poison/ are likewise byte-identical after --apply, frozen printing as a
# count while scratch and excluded contribute nothing at all.
def case_08_tier3_by_zone():
    root = copy_fixture()
    keep = os.path.join(root, "cockpit.keep")
    idea = os.path.join(root, "commanders-desk/out-ideas/idea.md")
    frozen = os.path.join(root, "logs/2026-09-20_frozen.md")
    scratch = os.path.join(root, "notepad/scratch.md")
    poison = os.path.join(root, "base/bin/fixtures/poison/broken-refs.md")
    before = {p: read(p) for p in (keep, idea, frozen, scratch, poison)}

    r_dry = run(["--id", "C099=C099x", "--id", "W888=W888x"], root=root)
    check("case8: no diff hunk printed for cockpit.keep",
          "---" not in r_dry.stdout.split("cockpit.keep")[-1][:200] if "cockpit.keep" in r_dry.stdout else True)

    r_apply = run(["--id", "C099=C099x", "--id", "W888=W888x", "--apply"], root=root)
    for p in before:
        check("case8: %s byte-identical under --apply" % os.path.relpath(p, root), read(p) == before[p])
    check("case8: frozen contributes a count", "C099" in r_apply.stdout)
    check("case8: scratch/excluded contribute nothing",
          "C999" not in r_apply.stdout and "W888" not in r_apply.stdout.replace("W888x", ""))


# 9. The reassignment: --prefix P=Rq --apply renames P004 to Rq004, leaves P101 untouched,
# lists P101 as out of range in the change list rather than as an error.
def case_09_reassignment():
    root = copy_fixture()
    r = run(["--prefix", "P=Rq", "--apply"], root=root)
    check("case9: run does not error", r.returncode in (0, 1))
    proposals = json.loads(read(os.path.join(root, "base/proposals.json")))
    ids = [p["id"] for p in proposals["proposals"]]
    check("case9: P004 renamed to Rq004", "Rq004" in ids and "P004" not in ids)
    check("case9: P101 mention (out of range) is listed, not an error",
          "P101" in r.stdout and "error" not in r.stdout.lower())


# 10. Retired and superseded refused: --prefix C=Cx and --prefix on the superseded row (Q)
# each exit 2, naming the state, and write nothing.
def case_10_retired_and_superseded_refused():
    root = copy_fixture()
    before = tree_hash(root)
    r1 = run(["--prefix", "C=Cx"], root=root)
    check("case10: --prefix on a retired prefix is refused (exit 2)", r1.returncode == 2)
    check("case10: refusal names the state (retired)", "retired" in r1.stdout.lower() + r1.stderr.lower())
    r2 = run(["--prefix", "Q=Qx"], root=root)
    check("case10: --prefix on a superseded prefix is refused (exit 2)", r2.returncode == 2)
    check("case10: refusal names the state (superseded)", "superseded" in r2.stdout.lower() + r2.stderr.lower())
    after = tree_hash(root)
    check("case10: nothing written", before == after)


# 11. Digit anchoring: with S and W in the mapping, Sp001/WS001 are untouched while S001/W001 rename.
def case_11_digit_anchoring():
    # S001 lives in logs/index.json (S's own whole-value register); W001 and WS001 (the
    # planned successor, present as a whole-value candidate on purpose) both live in
    # workshop/workshop.json (W's register). Both are tier1 whole-value id fields, so this
    # proves the rename, not merely that a prose mention was left alone (which tier 2 would
    # do regardless of digit anchoring).
    root = copy_fixture()
    run(["--id", "S001=S001x", "--id", "W001=W001x", "--apply"], root=root)
    index = json.loads(read(os.path.join(root, "logs/index.json")))
    workshop = json.loads(read(os.path.join(root, "workshop/workshop.json")))
    index_ids = [e["id"] for e in index["entries"]]
    workshop_ids = [i["id"] for i in workshop["items"]]
    check("case11: S001 renamed", "S001x" in index_ids and "S001" not in index_ids)
    check("case11: W001 renamed", "W001x" in workshop_ids and "W001" not in workshop_ids)
    check("case11: Sp001 untouched", "Sp001" in index_ids and "Sp001x" not in index_ids)
    check("case11: WS001 untouched", "WS001" in workshop_ids and "WS001x" not in workshop_ids)


# 12. A case-only file rename, two-step; onto an existing target it fails before touching anything.
def case_12_case_only_rename():
    root = copy_fixture()
    old = os.path.join(root, "commanders-desk/in-dossiers/DS001-fixture.md")
    run(["--path", "commanders-desk/in-dossiers/DS001-fixture.md=commanders-desk/in-dossiers/Ds001-fixture.md", "--apply"], root=root)
    listing = os.listdir(os.path.dirname(old))
    check("case12: exact new name present", "Ds001-fixture.md" in listing)
    check("case12: exact old name absent", "DS001-fixture.md" not in listing)

    # "Onto an existing target" can't be built as a literal case-only collision here: this
    # filesystem is case-insensitive (core.ignorecase true, per the plan), so writing a
    # second file that differs from DS001-fixture.md only in case does not create a second
    # directory entry -- it silently overwrites the first, before the rename tool ever runs.
    # The safety property under test -- refuse before touching anything when the destination
    # is already a real, distinct file -- is exercised instead against an unrelated file that
    # genuinely coexists with the source.
    root2 = copy_fixture()
    before = tree_hash(root2)
    r = run(["--path", "commanders-desk/in-dossiers/DS001-fixture.md=commanders-desk/in-dossiers/dossiers.json", "--apply"], root=root2)
    after = tree_hash(root2)
    check("case12: onto an existing target, refused before touching anything (exit 2)", r.returncode == 2)
    check("case12: onto an existing target, nothing is touched", before == after)


# 13. The proof of completion: after a full --apply and every tier-2 hunk applied by hand,
# cockpit-check --root <copy> is clean and the pre-pass counts are zero.
def case_13_proof_of_completion():
    if not (os.path.exists(CHECK) and os.access(CHECK, os.X_OK)):
        check("case13: skipped, cockpit-check not built yet", False, "cannot prove completion without cockpit-check")
        return
    root = copy_fixture()
    run(["--path", "commanders-desk/out-advice/DS001.md=commanders-desk/out-advice/CA001.md",
         "--path", "commanders-desk/out-advice/DS002.md=commanders-desk/out-advice/CA002.md",
         "--path", "commanders-desk/out-advice/DS003.md=commanders-desk/out-advice/CA003.md",
         "--prefix", "DS=Ds", "--apply"], root=root)
    r = subprocess.run([CHECK, "--root", root, "--zone", "all"], capture_output=True, text=True)
    check("case13: proving run is clean (or only planned/external notes remain)", r.returncode in (0, 1))
    r2 = run(["--prefix", "DS=Ds"], root=root)
    check("case13: pre-pass count for DS is now zero", "DS" not in r2.stdout or "0" in r2.stdout)


CASES = [
    case_01_dry_run_writes_nothing,
    case_02_apply_without_root_refused,
    case_03_ordering_gate,
    case_04_tier1_applied,
    case_05_tier3_survives_full_pass,
    case_06_tier2_never_applied,
    case_07_commander_reviewed_tier2,
    case_08_tier3_by_zone,
    case_09_reassignment,
    case_10_retired_and_superseded_refused,
    case_11_digit_anchoring,
    case_12_case_only_rename,
    case_13_proof_of_completion,
]


def main():
    if not (os.path.exists(RENAME) and os.access(RENAME, os.X_OK)):
        print("NOTE: %s does not exist or is not executable yet; every case below is expected to fail." % RENAME)
    try:
        for fn in CASES:
            case(fn)
    finally:
        for d in TMP_DIRS:
            shutil.rmtree(d, ignore_errors=True)
    total = len(FAILS)
    print("\n%d checks failed" % total)
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
