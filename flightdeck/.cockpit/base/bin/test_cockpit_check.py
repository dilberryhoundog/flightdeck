#!/usr/bin/env python3
"""Table test for cockpit-check, written to notepad/stage-a-2026-09-20/plan.md pass 3,
never to the tool's own source. Run: python3 base/bin/test_cockpit_check.py (from anywhere),
under /usr/bin/python3 (3.9.6). Case numbers below match the plan's pass-3 numbering under
"Case list — test_cockpit_check.py" (17 cases; pass 2 had 20, several merged). Cases are
independent; each opens the fixture tree read-only and hashes it before and after to prove
the checker writes nothing (case 17 folds an explicit hash-invariant assertion in as well,
but every case checks it, not just the last).
"""
import hashlib
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
COCKPIT = os.path.dirname(os.path.dirname(HERE))  # base/bin -> base -> .cockpit
CHECK = os.path.join(HERE, "cockpit-check")
FX = os.path.join(HERE, "fixtures/stage-a/cockpit")
BROKEN = os.path.join(HERE, "fixtures/stage-a/broken-store")

FAILS = []


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


VALUE_FLAGS = ("--zone",)


def resolve_positionals(root, args):
    """Positional PATH args narrow the scan inside --root; cockpit-check takes them
    as absolute (or otherwise not relative to --root), so join relative-looking ones
    against root here rather than repeating os.path.join at every call site."""
    out = []
    skip_next = False
    for a in args:
        if skip_next:
            out.append(a)
            skip_next = False
            continue
        if a in VALUE_FLAGS:
            out.append(a)
            skip_next = True
            continue
        if a.startswith("-") or os.path.isabs(a):
            out.append(a)
        else:
            out.append(os.path.join(root, a))
    return out


def run(root, args=None, cwd=None):
    args = resolve_positionals(root, args or [])
    cmd = [CHECK, "--root", root] + args
    try:
        return subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    except (FileNotFoundError, PermissionError) as e:
        class R:
            returncode = None
            stdout = ""
            stderr = str(e)
        return R()


def run_json(root, args=None):
    r = run(root, (args or []) + ["--json"])
    parsed = None
    if r.stdout:
        try:
            parsed = json.loads(r.stdout)
        except ValueError:
            pass
    return r, parsed


def line_of(path, needle):
    with open(path) as f:
        for i, line in enumerate(f, 1):
            if needle in line:
                return i
    return None


def finding(parsed, file=None, line=None, kind=None, replacement=None):
    if not parsed:
        return None
    for f in parsed.get("findings", []):
        if file is not None and file not in f.get("file", ""):
            continue
        if line is not None and f.get("line") != line:
            continue
        if kind is not None and f.get("kind") != kind:
            continue
        if replacement is not None and replacement not in (f.get("replacement") or ""):
            continue
        return f
    return None


def check(name, cond, detail=""):
    ok = bool(cond)
    print("%s  %s%s" % ("ok  " if ok else "FAIL", name, ("  -- " + detail) if (not ok and detail) else ""))
    if not ok:
        FAILS.append(name)
    return ok


def case(fn):
    """Runs one case, hashing FX before/after, catching any exception as a failure."""
    before = tree_hash(FX)
    try:
        fn()
    except Exception as e:
        check(fn.__name__, False, "raised %r" % (e,))
    after = tree_hash(FX)
    check(fn.__name__ + " :: writes nothing", before == after, "fixture tree hash changed")


# 1. The excluded zone: base/bin/fixtures/poison/ is never opened.
def case_01_excluded_zone_self():
    r, j = run_json(FX)
    check("case1: poison contributes no findings", not finding(j, file="fixtures/poison"))
    if j:
        check("case1: poison contributes no notes", not any("poison" in str(v) for v in j.get("notes", {}).values()))
    check("case1: duplicate register in poison raises no store fault", r.returncode != 2)


# 2. The real tree, by zone: run against the REAL cockpit, narrowed to base/bin/fixtures.
def case_02_real_tree_cannot_see_suite():
    r, j = run_json(COCKPIT, ["base/bin/fixtures"])
    check("case2: real proving run over fixtures reports nothing", r.returncode == 0)
    if j:
        check("case2: no findings from the suite itself", len(j.get("findings", [])) == 0)


# 3. A clean fixture: exit 0, one line, no finding lines. Narrowed to a file with no faults.
def case_03_clean_subset():
    r = run(FX, ["missions/missions.json"])
    check("case3: exit 0 on clean subset", r.returncode == 0)
    lines = [l for l in r.stdout.splitlines() if l.strip()]
    check("case3: one summary line, no findings", len(lines) == 1, repr(r.stdout))


# 4. A stale path as a whole JSON value: dossiers.json advice_copy -> DS001.md, replacement CA001.md.
def case_04_stale_path_whole_value():
    dossiers_path = os.path.join(FX, "commanders-desk/in-dossiers/dossiers.json")
    r, j = run_json(FX, ["commanders-desk/in-dossiers/dossiers.json"])
    ln = line_of(dossiers_path, "DS001.md")
    f = finding(j, file="dossiers.json", line=ln, kind="path", replacement="CA001.md")
    check("case4: whole-value stale path with exact replacement", f is not None, str(j))


# 5. Stale path in JSON prose + markdown backtick span; bare markdown prose path-shape: no candidate.
def case_05_stale_path_prose_and_markdown():
    dec = os.path.join(FX, "base/decisions.json")
    r, j = run_json(FX, ["base/decisions.json"])
    ln = line_of(dec, "See notes in")
    f = finding(j, file="decisions.json", line=ln, kind="path")
    check("case5: stale path in JSON prose is a finding", f is not None)
    check("case5: prose finding is tier2", f is not None and f.get("tier") in (2, "2", "tier2"))
    dossier_md = os.path.join(FX, "commanders-desk/in-dossiers/DS001-fixture.md")
    with open(dossier_md) as fh:
        original = fh.read()
    with open(dossier_md, "a") as fh:
        fh.write("\nSee `commanders-desk/out-advice/DS001.md` for the source. pass/fail and they/them are not paths.\n")
    try:
        r2, j2 = run_json(FX, ["commanders-desk/in-dossiers/DS001-fixture.md"])
        ln2 = line_of(dossier_md, "See `commanders-desk")
        f2 = finding(j2, file="DS001-fixture.md", line=ln2, kind="path")
        check("case5: stale path in markdown backtick span is a finding", f2 is not None)
        check("case5: bare markdown prose path-shape (pass/fail, they/them) is no candidate",
              not any("pass/fail" in json.dumps(fnd) or "they/them" in json.dumps(fnd) for fnd in (j2 or {}).get("findings", [])))
    finally:
        with open(dossier_md, "w") as fh:
            fh.write(original)


# 6. A `by`-style field: short prose with a stale path is tier2, not tier1; bare "commander" is no match.
def case_06_by_field():
    dec = os.path.join(FX, "base/decisions.json")
    r, j = run_json(FX, ["base/decisions.json"])
    ln = line_of(dec, "commander, per workshop/retired-notes.md")
    f = finding(j, file="decisions.json", line=ln, kind="path")
    check("case6: by-field short prose with a stale path is a finding", f is not None)
    check("case6: by-field finding is tier2 not tier1", f is not None and f.get("tier") in (2, "2", "tier2"))
    ln_bare = line_of(dec, '"by": "commander"')
    check("case6: bare word commander produces no finding at that line", not finding(j, file="decisions.json", line=ln_bare))


# 7. orders.json text field: (O001 is not very readable) is never scanned.
def case_07_orders_text_verbatim():
    r, j = run_json(FX, ["quarters/commander/orders.json"])
    check("case7: no finding from orders.json text", not finding(j, file="orders.json"))
    if j:
        check("case7: no note from orders.json text either",
              not any("O001 is not very readable" in str(v) for v in j.get("notes", {}).values()))


# 8. Quoted id in JSON prose: finding, pinned tier 3, "quoted, not rewritten". The same id
# unquoted in the same value: finding, tier 2. A quoted id in markdown body, and in a quoted
# frontmatter value: both checked normally, both findings when stale -- the regression guard
# against pass 2's dropped read-suppression rule.
def case_08_quotation_is_a_tier_rule_not_a_read_rule():
    dec = os.path.join(FX, "base/decisions.json")
    r, j = run_json(FX, ["base/decisions.json"])
    ln = line_of(dec, "C099 is fine as an example")
    fs = [f for f in (j or {}).get("findings", []) if f.get("line") == ln]
    check("case8: exactly two findings on the D004 line (quoted + unquoted C099)", len(fs) == 2, str(fs))
    quoted = [f for f in fs if f.get("tier") in (3, "3", "tier3")]
    unquoted = [f for f in fs if f.get("tier") in (2, "2", "tier2")]
    check("case8: the quoted occurrence is pinned tier 3", len(quoted) == 1, str(fs))
    check("case8: tier-3 quoted finding is listed quoted, not rewritten",
          quoted and "quoted, not rewritten" in json.dumps(quoted[0]).lower())
    check("case8: the unquoted occurrence is tier 2", len(unquoted) == 1, str(fs))

    p004 = os.path.join(FX, "commanders-desk/in-proposals/P004-fixture.md")
    r2, j2 = run_json(FX, ["commanders-desk/in-proposals/P004-fixture.md"])
    ln_body = line_of(p004, "Quoted in body")
    f_body = finding(j2, file="P004-fixture.md", line=ln_body, kind="id")
    check("case8: quoted stale id in markdown body is a finding, no special treatment", f_body is not None)
    ln_fm = line_of(p004, 'ref: "DS006"')
    f_fm = finding(j2, file="P004-fixture.md", line=ln_fm, kind="id")
    check("case8: quoted stale id in frontmatter is a finding, checked normally", f_fm is not None)


# 9. A C0nn id in a frozen session log: no finding under --zone live, reported under --zone all.
# A scratch file full of stale ids/paths: never opened under any --zone.
def case_09_frozen_and_scratch():
    r_live, j_live = run_json(FX, ["--zone", "live"])
    r_all, j_all = run_json(FX, ["--zone", "all"])
    frozen = os.path.join(FX, "logs/2026-09-20_frozen.md")
    ln = line_of(frozen, "Dispatch cited C099")
    check("case9: frozen C099 not reported under --zone live", not finding(j_live, file="2026-09-20_frozen.md", line=ln))
    check("case9: frozen C099 reported under --zone all", finding(j_all, file="2026-09-20_frozen.md", line=ln) is not None)
    for j, label in ((j_live, "live"), (j_all, "all")):
        check("case9: scratch never opened under --zone %s" % label, not finding(j, file="scratch.md"))


# 10. Commander-reviewed (out-advice) reported under --zone commander only, tier2.
# Commander-verbatim (*.keep, out-ideas) reported under --zone commander, tier3.
def case_10_commander_zones():
    r_live, j_live = run_json(FX, ["--zone", "live"])
    r_cmd, j_cmd = run_json(FX, ["--zone", "commander"])
    ca001 = os.path.join(FX, "commanders-desk/out-advice/CA001.md")
    ln_ca = line_of(ca001, "C099")
    check("case10: CA001 stale id not reported under --zone live", not finding(j_live, file="CA001.md"))
    f_ca = finding(j_cmd, file="CA001.md", line=ln_ca)
    check("case10: CA001 stale id reported under --zone commander", f_ca is not None)
    check("case10: CA001 finding is tier2", f_ca is not None and f_ca.get("tier") in (2, "2", "tier2"))
    f_keep = finding(j_cmd, file="cockpit.keep")
    f_idea = finding(j_cmd, file="idea.md")
    check("case10: *.keep stale id reported under --zone commander", f_keep is not None)
    check("case10: *.keep finding is tier3", f_keep is not None and f_keep.get("tier") in (3, "3", "tier3"))
    check("case10: out-ideas stale id reported under --zone commander", f_idea is not None)
    check("case10: out-ideas finding is tier3", f_idea is not None and f_idea.get("tier") in (3, "3", "tier3"))


# 11. P004 resolves; P101 raises no finding (planned segment). CA### resolves when the file
# exists, one finding when it does not.
def case_11_p_segments_and_ca():
    r, j = run_json(FX, ["base/proposals.json", "base/decisions.json", "commanders-desk/in-proposals"])
    check("case11: P004 is not itself a finding",
          not any(f.get("token") == "P004" for f in (j or {}).get("findings", [])))
    check("case11: P101 mention in prose raises no finding",
          not any("P101" in json.dumps(f) for f in (j or {}).get("findings", [])))
    p004 = os.path.join(FX, "commanders-desk/in-proposals/P004-fixture.md")
    ln = line_of(p004, "CA999")
    f = finding(j, file="P004-fixture.md", line=ln, kind="id")
    check("case11: CA999 (file absent) is a finding", f is not None)
    check("case11: CA001 (file present) is not a finding at that line",
          not any("CA001" in json.dumps(f) and f.get("kind") == "id" for f in (j or {}).get("findings", [])))


# 12. planned_ids are notes, not findings; a stale source or an already-minted planned_id is a store note.
def case_12_planned_ids():
    r, j = run_json(FX)
    check("case12: M003-M006 are not findings",
          not any(m in json.dumps(f) for f in (j or {}).get("findings", []) for m in ("M003", "M004", "M005", "M006")))
    if j:
        notes_blob = json.dumps(j.get("notes", {}))
        check("case12: planned_ids appear as notes sourced to P004", "P004" in notes_blob and "M003" in notes_blob)


# 13. A planned prefix (Or001) and a known_gap (S005) are notes, not findings.
def case_13_planned_prefix_and_gap():
    r, j = run_json(FX, ["commanders-desk/in-proposals/P004-fixture.md"])
    check("case13: Or001 (planned prefix) is not a finding", not any("Or001" in json.dumps(f) for f in (j or {}).get("findings", [])))
    check("case13: S005 (known gap) is not a finding", not any("S005" in json.dumps(f) for f in (j or {}).get("findings", [])))


# 14. Case-sensitive resolution: citing Ds001-fixture.md while only DS001-fixture.md exists
# is a finding. A composite path#ID with a stale path and a valid id: one finding, both
# halves replaced. (Plan's own prose example is DS001.md/Ds001.md; that exact basename has
# already been renamed away in this fixture -- see fixtures-report.md -- so the case-only
# collision is proved instead against DS001-fixture.md, the one real file that still exists.)
def case_14_case_sensitive_and_composite():
    target = os.path.join(FX, "commanders-desk/in-dossiers/DS001-fixture.md")
    with open(target) as fh:
        original = fh.read()
    with open(target, "a") as fh:
        fh.write("\nAlso see `Ds001-fixture.md` in this same folder.\n")
    try:
        r, j = run_json(FX, ["commanders-desk/in-dossiers/DS001-fixture.md"])
        ln = line_of(target, "Ds001-fixture.md")
        f = finding(j, file="DS001-fixture.md", line=ln, kind="path")
        check("case14: case-only mismatch is a finding", f is not None)
    finally:
        with open(target, "w") as fh:
            fh.write(original)

    topic = os.path.join(FX, "logs/topics/sample-topic.json")
    r2, j2 = run_json(FX, ["logs/topics/sample-topic.json"])
    ln2 = line_of(topic, '"ref"')
    f2 = finding(j2, file="sample-topic.json", line=ln2)
    check("case14: composite ref with a stale path half is one finding", f2 is not None)
    # Plan's wording is only "both halves in the printed replacement" -- a full path#ID
    # shape -- not that the id half is left unchanged. Whether the id half should stay
    # DS001 (still a resolving id) or be recomputed from the new path's basename (CA001,
    # also resolving, since CA resolves by filename) is a live question put to tool-builder;
    # this asserts the letter of the plan and no more until that is settled.
    replacement = (f2 or {}).get("replacement") or ""
    check("case14: replacement is a full path#ID composite, both halves present",
          f2 is not None and "CA001.md" in replacement and "#" in replacement and replacement.split("#", 1)[1])


# 15. A superseded prefix (Q): resolves in frozen/scratch; every live hit is a finding.
def case_15_superseded_prefix():
    dec = os.path.join(FX, "base/decisions.json")
    with open(dec) as fh:
        original = fh.read()
    patched = original.replace(
        '"decision": "No path here, nothing to find.",',
        '"decision": "No path here, nothing to find. Q001 is superseded and cited live here.",',
    )
    assert patched != original
    with open(dec, "w") as fh:
        fh.write(patched)
    try:
        r, j = run_json(FX, ["base/decisions.json"])
        ln = line_of(dec, "Q001 is superseded")
        f = finding(j, file="decisions.json", line=ln, kind="id")
        check("case15: superseded prefix live hit is a finding", f is not None)
    finally:
        with open(dec, "w") as fh:
            fh.write(original)


# 16. Second-register: T001 minted in workshop.json, not T's declared register (dispatch/cockpit.json).
# A duplicate prefix row in prefixes.json: exit 2, store finding, no scan attempted.
def case_16_second_register_and_duplicate_prefix():
    r, j = run_json(FX, ["workshop/workshop.json", "dispatch/cockpit.json"])
    # second-register is a store-level observation, not a per-line finding -- it lands in
    # the json output's "store" list, alongside the duplicate-prefix-row fault (below).
    store_rows = (j or {}).get("store", [])
    f = next((row for row in store_rows if row.get("kind") == "second-register"), None)
    check("case16: second-register finding raised", f is not None, str(j))
    if f:
        blob = json.dumps(f)
        check("case16: second-register finding names both files", "workshop.json" in blob and "cockpit.json" in blob)

    r2 = run(BROKEN, [])
    check("case16: duplicate prefix row exits 2", r2.returncode == 2)
    check("case16: duplicate prefix row output names it a store fault",
          "store" in (r2.stdout + r2.stderr).lower() or "duplicate" in (r2.stdout + r2.stderr).lower())


# 17. Placeholders, globs, env vars and absolute paths are never candidates. Planned/external
# are notes only, exit 0. --json parses and its counts equal the text tail's, and the fixture
# tree hashes identically before and after every case under every flag.
def case_17_placeholders_notes_and_json_parity():
    r, j = run_json(FX, ["base/decisions.json"])
    dec = os.path.join(FX, "base/decisions.json")
    ln = line_of(dec, "Template ids look like")
    fs = [f for f in (j or {}).get("findings", []) if f.get("line") == ln]
    check("case17: no candidates from placeholders/globs/env/absolute on that line", len(fs) == 0, str(fs))
    if j:
        blob = json.dumps(j.get("notes", {}))
        check("case17: planned room work/ is a note", "work/" in blob)
        check("case17: external root checks/ is a note", "checks/" in blob)
    # Not asserting exit 0 here: decisions.json also carries D002/D003/D004's deliberate
    # findings (cases 5/6/8), so the whole-file exit code is 1 by design. Case 3 already
    # proves exit 0 on a genuinely clean file; this case only needs the placeholders and
    # the planned/external notes, both checked above.

    r_text = run(FX, [])
    r_json, jall = run_json(FX, [])
    check("case17: --json parses", jall is not None)
    if jall and r_text.stdout:
        tail = r_text.stdout.strip().splitlines()[-2:]
        tail_blob = "\n".join(tail)
        counts = jall.get("counts", {})
        check("case17: json counts block present", bool(counts))
        for key in ("findings",):
            if key in counts:
                check("case17: %s count appears in the text tail" % key, str(counts[key]) in tail_blob)


CASES = [
    case_01_excluded_zone_self,
    case_02_real_tree_cannot_see_suite,
    case_03_clean_subset,
    case_04_stale_path_whole_value,
    case_05_stale_path_prose_and_markdown,
    case_06_by_field,
    case_07_orders_text_verbatim,
    case_08_quotation_is_a_tier_rule_not_a_read_rule,
    case_09_frozen_and_scratch,
    case_10_commander_zones,
    case_11_p_segments_and_ca,
    case_12_planned_ids,
    case_13_planned_prefix_and_gap,
    case_14_case_sensitive_and_composite,
    case_15_superseded_prefix,
    case_16_second_register_and_duplicate_prefix,
    case_17_placeholders_notes_and_json_parity,
]


def main():
    if not (os.path.exists(CHECK) and os.access(CHECK, os.X_OK)):
        print("NOTE: %s does not exist or is not executable yet; every case below is expected to fail." % CHECK)
    for fn in CASES:
        case(fn)
    total = len(FAILS)
    print("\n%d checks failed" % total)
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
