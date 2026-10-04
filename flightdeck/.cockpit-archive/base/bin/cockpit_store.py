#!/usr/bin/env python3
"""The cockpit's reference store, and the scanner both paperwork tools share.

Loads base/store/, walks a cockpit tree by zone, and yields every id and path
reference it finds with the tier that governs it. Writes nothing, ever.

Zones decide what is read; tiers decide what may be written. Keep them apart:
an id the checker does not read is an id cockpit-rename does not rewrite, so a
false finding is cured at its source or by a declared store row, never by not
reading. Nothing here suppresses a read.

Python 3.9, standard library only.
"""
import fnmatch
import json
import os
import re

STORE_DIRNAME = "base/store"

# Zone behaviour is design, not data: read says whether the zone is opened at
# all, tier_floor the most writable tier it allows (1 is most writable). A store
# may override a zone, but never has to declare them to be correct.
ZONE_BEHAVIOUR = {
    "live": {"read": True, "tier_floor": 1},
    "scratch": {"read": False, "tier_floor": 3},
    "excluded": {"read": False, "tier_floor": 3},
    "frozen": {"read": True, "tier_floor": 3},
    "commander-verbatim": {"read": True, "tier_floor": 3},
    "commander-reviewed": {"read": True, "tier_floor": 2},
}
TEXT_EXT = (".md", ".json", ".txt", ".keep")
PATH_EXT = ("md", "json", "py", "sh", "txt", "keep", "mjs", "js", "yml", "yaml", "toml", "jsonl")
FENCE_LOOKAHEAD = 40


class StoreError(Exception):
    """The store itself is wrong. Exit 2; no scan is attempted."""


def _read_json(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (IOError, OSError) as exc:
        raise StoreError("cannot read %s (%s)" % (path, exc))
    except ValueError as exc:
        raise StoreError("%s is not valid JSON (%s)" % (path, exc))


class Ref(object):
    """One reference found in one file."""

    __slots__ = ("file", "line", "col", "kind", "token", "zone", "tier", "field",
                 "whole", "quoted", "context", "verbatim")

    def __init__(self, file, line, col, kind, token, zone, tier, field=None, whole=False, quoted=False, context=""):
        self.file = file
        self.line = line
        self.col = col
        self.kind = kind          # "id" or "path"
        self.token = token
        self.zone = zone
        self.tier = tier
        self.field = field
        self.whole = whole
        self.quoted = quoted
        self.context = context
        self.verbatim = False

    def __repr__(self):
        return "<Ref %s:%d %s %s tier%d>" % (self.file, self.line, self.kind, self.token, self.tier)


class Store(object):
    """base/store/, loaded and validated."""

    def __init__(self, root):
        self.root = os.path.realpath(root)
        self.store_rel = STORE_DIRNAME
        sd = os.path.join(self.root, STORE_DIRNAME)
        if not os.path.isdir(sd):
            raise StoreError("no store at %s" % sd)
        self.prefixes = _read_json(os.path.join(sd, "prefixes.json"))
        self.zones = _read_json(os.path.join(sd, "zones.json"))
        self.fields = _read_json(os.path.join(sd, "fields.json"))
        self.paths = _read_json(os.path.join(sd, "paths.json"))
        self.store_findings = []
        self._normalise()
        self._build()

    def _normalise(self):
        """Accept either container shape for each list the store carries.

        The plan named these as pairs and entries without fixing the JSON
        container, so a store may write renames as a map or as rows, and the
        field map under `documents` or `fields`. Both are read; neither is
        preferred. Anything else is a store error, never a traceback.
        """
        for name, obj in (("prefixes.json", self.prefixes), ("zones.json", self.zones),
                          ("fields.json", self.fields), ("paths.json", self.paths)):
            if not isinstance(obj, dict):
                raise StoreError("%s must be a JSON object" % name)
        ren = self.paths.get("renames", [])
        if isinstance(ren, dict):
            ren = [{"old": k, "new": v} for k, v in ren.items()]
        elif isinstance(ren, list):
            rows = []
            for r in ren:
                if isinstance(r, dict) and "old" in r and "new" in r:
                    rows.append(r)
                elif isinstance(r, (list, tuple)) and len(r) == 2:
                    rows.append({"old": r[0], "new": r[1]})
                else:
                    raise StoreError("paths.json renames row is not {old, new}: %r" % (r,))
            ren = rows
        else:
            raise StoreError("paths.json renames must be a map or a list")
        self.paths["renames"] = ren
        docs = self.fields.get("documents")
        if docs is None:
            docs = self.fields.get("fields", [])
        if isinstance(docs, dict):
            docs = [dict(v, name=k) for k, v in docs.items()]
        if not isinstance(docs, list):
            raise StoreError("fields.json needs a list of document entries")
        for d in docs:
            if not isinstance(d, dict) or "match" not in d:
                raise StoreError("fields.json entry has no match pattern: %r" % (d,))
        self.fields["documents"] = docs
        zmap = self.zones.get("zones") or {}
        if not isinstance(zmap, dict):
            raise StoreError("zones.json zones must be an object")
        merged = {}
        for zone, default in ZONE_BEHAVIOUR.items():
            merged[zone] = dict(default)
            if isinstance(zmap.get(zone), dict):
                merged[zone].update({k: v for k, v in zmap[zone].items()
                                     if k in ("read", "tier_floor")})
        for zone, spec in zmap.items():
            if zone not in merged and isinstance(spec, dict):
                merged[zone] = {"read": spec.get("read", True),
                                "tier_floor": spec.get("tier_floor", 2)}
        self.zones["zones"] = merged
        for rule in self.zones.get("rules", []):
            if not isinstance(rule, dict) or "match" not in rule or "zone" not in rule:
                raise StoreError("zones.json rule is not {match, zone}: %r" % (rule,))
            if rule["zone"] not in merged:
                raise StoreError("zones.json rule names unknown zone %r" % rule["zone"])

    # ---- prefix table -------------------------------------------------

    def _build(self):
        self.rows = {}
        for row in self.prefixes.get("prefixes", []):
            p = row.get("prefix")
            if not p:
                raise StoreError("a prefix row has no prefix key")
            if p in self.rows:
                raise StoreError("prefix %s has two rows; a prefix has exactly one minting register" % p)
            self.rows[p] = row
        if not self.rows:
            raise StoreError("the prefix table is empty")
        # Longest first so S never matches Sp and W never matches WS.
        alt = sorted(self.rows.keys(), key=lambda s: (-len(s), s))
        self.id_re = re.compile(r"(?<![A-Za-z0-9])(" + "|".join(re.escape(a) for a in alt) + r")([0-9]{3})(?![0-9])")
        gaps = self.prefixes.get("known_gaps", [])
        if isinstance(gaps, dict):
            gaps = [{"id": k, "reason": v} for k, v in gaps.items()]
        self.prefixes["known_gaps"] = gaps
        self.known_gaps = set(g["id"] if isinstance(g, dict) else g for g in gaps)
        planned = self.prefixes.get("planned_ids", [])
        if isinstance(planned, dict):
            planned = [{"id": k, "source": v} for k, v in planned.items()]
        rows = []
        for row in planned:
            rows.append(row if isinstance(row, dict) else {"id": row, "source": ""})
        self.prefixes["planned_ids"] = rows
        self.planned_ids = dict((r["id"], r.get("source", "")) for r in rows)
        self.path_re = re.compile(
            r"(?<![\w./@$-])(@?(?:\.{1,2}/|/)?(?:[\w.@-]+/)+[\w.@#-]*)")
        self.ext_re = re.compile(r"\.(?:" + "|".join(PATH_EXT) + r")$")
        self.bare_re = re.compile(
            r"(?<![\w./@$-])([\w.@-]+\.(?:" + "|".join(PATH_EXT) + r"))(?![\w/])")
        self._registers = {}
        self._dircache = {}
        self.anchor_roots = set()
        for group in ("planned", "external"):
            for entry in self.paths.get(group, []):
                if isinstance(entry, str) and entry:
                    head = entry.lstrip("/").split("/")[0]
                    if head and "*" not in head:
                        self.anchor_roots.add(head)

    def segments_for(self, prefix):
        """Every (range, segment-row) for a prefix. P is the one with two."""
        row = self.rows[prefix]
        if "segments" in row:
            return [(tuple(s.get("range", [1, 999])), s) for s in row["segments"]]
        return [(tuple(row.get("range", [1, 999])), row)]

    def segment_for(self, prefix, number):
        for rng, seg in self.segments_for(prefix):
            if rng[0] <= number <= rng[1]:
                return seg
        return None

    def register_ids(self, seg):
        """The ids a segment's register currently mints."""
        reg = seg.get("register")
        if not reg:
            return None
        key = (reg.get("file"), reg.get("array"), reg.get("id_field"))
        if key in self._registers:
            return self._registers[key]
        full = os.path.join(self.root, reg["file"])
        ids = set()
        if os.path.exists(full):
            try:
                data = _read_json(full)
                rows = data.get(reg["array"], []) if isinstance(data, dict) else []
                field = reg.get("id_field") or reg.get("name_field") or "id"
                for r in rows:
                    if isinstance(r, dict) and isinstance(r.get(field), str):
                        ids.add(r[field])
            except StoreError:
                self.store_findings.append(
                    ("register", reg["file"], "register named by a prefix row does not parse"))
        else:
            self.store_findings.append(
                ("register", reg["file"], "register named by a prefix row does not exist"))
        self._registers[key] = ids
        return ids

    # ---- zones --------------------------------------------------------

    def zone_of(self, rel):
        rel = rel.replace(os.sep, "/")
        for rule in self.zones.get("rules", []):
            pat = rule["match"]
            if _globmatch(rel, pat):
                return rule["zone"]
        return self.zones.get("default", "live")

    def zone_info(self, zone):
        return self.zones.get("zones", {}).get(zone, {"read": True, "tier_floor": 2})

    def tier_floor(self, zone):
        """The most writable tier this zone allows. Tier 1 is most writable."""
        return self.zone_info(zone).get("tier_floor", 2)

    def rooms(self):
        try:
            return set(d for d in os.listdir(self.root)
                       if os.path.isdir(os.path.join(self.root, d)) and not d.startswith("."))
        except OSError:
            return set()

    # ---- field map ----------------------------------------------------

    def doc_for(self, rel):
        rel = rel.replace(os.sep, "/")
        best = None
        for doc in self.fields.get("documents", []):
            if _globmatch(rel, doc["match"]):
                # most specific wins: a literal match beats a glob
                score = (0 if "*" in doc["match"] else 1, len(doc["match"]))
                if best is None or score > best[0]:
                    best = (score, doc)
        return best[1] if best else None

    # ---- case-sensitive path resolution -------------------------------

    def _listdir(self, d):
        if d not in self._dircache:
            try:
                self._dircache[d] = set(os.listdir(d))
            except OSError:
                self._dircache[d] = set()
        return self._dircache[d]

    def exists_exact(self, abspath):
        """os.path.exists lies on a case-insensitive filesystem. Walk it."""
        abspath = os.path.normpath(abspath)
        parent, name = os.path.split(abspath)
        if not name:
            return os.path.isdir(abspath)
        if not os.path.isdir(parent):
            return False
        return name in self._listdir(parent)


def _globmatch(rel, pat):
    """fnmatch, with ** spanning directory levels.

    `a/**` is a and everything under it; a leading `**/` matches at any depth
    INCLUDING none, so `**/*.keep` catches cockpit.keep at the root as well as
    a keep file in a room.
    """
    if pat.endswith("/**"):
        head = pat[:-3]
        return rel == head or rel.startswith(head + "/")
    if pat.startswith("**/"):
        tail = pat[3:]
        if fnmatch.fnmatchcase(rel, tail):
            return True
        return fnmatch.fnmatchcase(rel, "*/" + tail)
    if "**" in pat:
        return fnmatch.fnmatchcase(rel, pat.replace("**", "*"))
    return fnmatch.fnmatchcase(rel, pat)


# ---- raw JSON spans -----------------------------------------------------

class Span(object):
    """One JSON string VALUE, with its exact span in the raw text."""

    __slots__ = ("field", "start", "end", "raw", "value")

    def __init__(self, field, start, end, raw, value):
        self.field = field      # e.g. orders[].text
        self.start = start      # offset of the opening quote
        self.end = end          # offset just past the closing quote
        self.raw = raw          # the literal as written, quotes included
        self.value = value      # the decoded string


def json_spans(text):
    """Every string value in a JSON document, with its field path and exact span.

    A character walk rather than a parse-then-search, because a parse loses
    offsets and searching for a value again mismatches whenever the same string
    occurs twice -- which around a verbatim field would let a rewrite land
    inside the commander's own words.
    """
    spans = []
    stack = []          # entries: ["obj", key_or_None, expecting_key] or ["arr", index]
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == '"':
            j = i + 1
            while j < n:
                if text[j] == "\\":
                    j += 2
                    continue
                if text[j] == '"':
                    break
                j += 1
            raw = text[i:j + 1]
            try:
                value = json.loads(raw)
            except ValueError:
                value = raw[1:-1]
            is_key = bool(stack) and stack[-1][0] == "obj" and stack[-1][2]
            if is_key:
                stack[-1][1] = value
                stack[-1][2] = False
            else:
                spans.append(Span(_field_path(stack), i, j + 1, raw, value))
            i = j + 1
            continue
        if ch == "{":
            stack.append(["obj", None, True])
        elif ch == "[":
            stack.append(["arr", 0])
        elif ch in "}]":
            if stack:
                stack.pop()
        elif ch == ",":
            if stack and stack[-1][0] == "obj":
                stack[-1][2] = True
        elif ch == ":":
            if stack and stack[-1][0] == "obj":
                stack[-1][2] = False
        i += 1
    return spans


def _field_path(stack):
    parts = []
    for entry in stack:
        if entry[0] == "obj":
            if entry[1] is not None:
                parts.append(entry[1])
        else:
            parts.append("[]")
    out = ""
    for p in parts:
        if p == "[]":
            out += "[]"
        else:
            out = (out + "." + p) if out else p
    return out


def offset_to_line(text, offset):
    """1-based line and 0-based column for a raw offset."""
    line = text.count("\n", 0, offset) + 1
    start = text.rfind("\n", 0, offset) + 1
    return line, offset - start


# ---- JSON field walking -------------------------------------------------

def walk_json(value, path=""):
    """Yield (field_path, string_value) for every string in a JSON document."""
    if isinstance(value, dict):
        for k, v in value.items():
            for item in walk_json(v, (path + "." + k) if path else k):
                yield item
    elif isinstance(value, list):
        for v in value:
            for item in walk_json(v, path + "[]"):
                yield item
    elif isinstance(value, str):
        yield path, value


def field_listed(field, listed):
    return any(field == entry for entry in listed)


# ---- text spans ---------------------------------------------------------

TICK = re.compile(r"`([^`]+)`")
LINK = re.compile(r"\]\(([^)\s]+)")
DQUOTE = re.compile(r'"[^"\n]{1,300}"')


def tick_spans(line):
    return [(m.start(1), m.end(1)) for m in TICK.finditer(line)]


def link_spans(line):
    return [(m.start(1), m.end(1)) for m in LINK.finditer(line)]


def quoted_spans(text):
    return [(m.start(), m.end()) for m in DQUOTE.finditer(text)]


def in_spans(pos, spans):
    return any(a <= pos < b for a, b in spans)


def frontmatter_unterminated(lines):
    """True when a file opens with --- and never closes it in FENCE_LOOKAHEAD.

    Reported as a `format` note. Stage A parses no frontmatter; this is a line
    count, not a parse, and it suppresses nothing.
    """
    if not lines or lines[0].rstrip() != "---":
        return False
    for j in range(1, min(len(lines), FENCE_LOOKAHEAD)):
        if lines[j].rstrip() == "---":
            return False
    return True


# ---- the scanner --------------------------------------------------------

def repo_root_of(cockpit_root):
    """Walk up for the repository root; fall back to the cockpit's parent."""
    d = os.path.realpath(cockpit_root)
    while True:
        if os.path.isdir(os.path.join(d, ".git")) or os.path.isfile(os.path.join(d, ".git")):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            return os.path.dirname(os.path.realpath(cockpit_root))
        d = parent


class Scanner(object):
    """Walks a cockpit tree and yields a Ref per reference found."""

    def __init__(self, store, zones=None, targets=None):
        self.store = store
        self.repo_root = repo_root_of(store.root)
        # The first segment of the cockpit's own path inside the repository, so
        # a repo-rooted citation anchors without naming any folder literally.
        rel = os.path.relpath(store.root, self.repo_root).replace(os.sep, "/")
        self.repo_anchor = rel.split("/")[0] if rel not in (".", "") else None
        self.rooms = store.rooms()
        self.zones = zones
        self.targets = targets
        self.format_notes = []
        self._own_dir = None

    def files(self):
        root = self.store.root
        out = []
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in (".git", "__pycache__")]
            for name in sorted(filenames):
                full = os.path.join(dirpath, name)
                rel = os.path.relpath(full, root).replace(os.sep, "/")
                if not rel.endswith(TEXT_EXT):
                    continue
                zone = self.store.zone_of(rel)
                info = self.store.zone_info(zone)
                if not info.get("read", True):
                    continue
                if self.zones is not None and zone not in self.zones:
                    continue
                if self.targets and not any(rel == t or rel.startswith(t.rstrip("/") + "/")
                                            for t in self.targets):
                    continue
                out.append((rel, zone))
            dirnames.sort()
        return sorted(out)

    # -- per-file ----------------------------------------------------

    def scan(self):
        for rel, zone in self.files():
            for ref in self.scan_file(rel, zone):
                yield ref

    def scan_file(self, rel, zone):
        full = os.path.join(self.store.root, rel)
        self._own_dir = os.path.dirname(full)
        try:
            with open(full, "r", encoding="utf-8") as fh:
                raw = fh.read()
        except (IOError, OSError, UnicodeDecodeError):
            return []
        lines = raw.split("\n")
        if rel.endswith(".md") and frontmatter_unterminated(lines):
            self.format_notes.append((rel, "opens with --- and no closing fence in the first %d lines"
                                      % FENCE_LOOKAHEAD))
        if rel.endswith(".json"):
            return self._scan_json(rel, zone, raw, lines)
        return self._scan_text(rel, zone, lines)

    # -- markdown and plain text -------------------------------------

    def _scan_text(self, rel, zone, lines):
        # Markdown has no fields, so every occurrence is tier 2 by construction,
        # floored by the zone. No quotation rule here: reading is never suppressed.
        tier = max(2, self.store.tier_floor(zone))
        refs = []
        for i, line in enumerate(lines, 1):
            for m in self.store.id_re.finditer(line):
                refs.append(Ref(rel, i, m.start(), "id", m.group(0), zone,
                                tier, context=line.strip()))
            spans = tick_spans(line) + link_spans(line)
            for cand, col in self._path_candidates(line, spans):
                refs.append(Ref(rel, i, col, "path", cand, zone,
                                tier, context=line.strip()))
        return refs

    # -- JSON ---------------------------------------------------------

    def _scan_json(self, rel, zone, raw, lines):
        try:
            json.loads(raw)
        except ValueError:
            self.format_notes.append((rel, "does not parse as JSON"))
            return []
        doc = self.store.doc_for(rel)
        verbatim = doc.get("verbatim", []) if doc else []
        whole_fields = doc.get("whole_value", []) if doc else []
        floor = self.store.tier_floor(zone)
        refs = []
        for span in json_spans(raw):
            field, value = span.field, span.value
            is_verbatim = field_listed(field, verbatim)
            stripped = value.strip()
            qspans = quoted_spans(value)
            for kind, token, off in self._refs_in_value(value):
                quoted = in_spans(off, qspans)
                whole = self._is_whole(stripped, token)
                if is_verbatim or quoted:
                    tier = 3          # read and reported, never rewritten
                elif whole:
                    tier = max(1, floor)
                else:
                    tier = max(2, floor)
                # Offset inside the decoded value maps to the raw literal by
                # re-encoding the prefix, so escapes never shift the span.
                raw_off = span.start + 1 + len(json.dumps(value[:off])[1:-1])
                line, col = offset_to_line(raw, raw_off)
                r = Ref(rel, line, col, kind, token, zone, tier,
                        field=field, whole=whole, quoted=quoted,
                        context=lines[line - 1].strip() if 0 < line <= len(lines) else "")
                r.verbatim = is_verbatim
                refs.append(r)
            # A whole_value declaration is about references. A value holding no
            # reference at all (a roster name, a seat name) says nothing about it;
            # only a value that carries references without being one is stale.
            if is_verbatim:
                continue
            if field_listed(field, whole_fields) and not self._value_is_whole_ref(stripped):
                if any(True for _ in self._refs_in_value(value)):
                    self.store.store_findings.append(
                        ("field", rel,
                         "%s is declared whole_value but holds %r" % (field, stripped[:60])))
        return refs

    def _refs_in_value(self, value):
        out = []
        for m in self.store.id_re.finditer(value):
            out.append(("id", m.group(0), m.start()))
        for cand, col in self._path_candidates(value, None):
            out.append(("path", cand, col))
        return out

    def _is_whole(self, stripped, token):
        if stripped == token:
            return True
        if "#" in stripped:
            head, _, tail = stripped.rpartition("#")
            if (head == token or tail == token) and head and tail:
                return True
        return False

    def _value_is_whole_ref(self, stripped):
        if self.store.id_re.fullmatch(stripped):
            return True
        if "#" in stripped:
            head, _, tail = stripped.rpartition("#")
            return bool(head) and bool(self.store.id_re.fullmatch(tail))
        return "/" in stripped or self.store.ext_re.search(stripped) is not None

    # -- token line positions ----------------------------------------

    def _token_positions(self, lines):
        """Queues of (line, col) per token, in file order, to give JSON refs lines."""
        pos = {}
        for i, line in enumerate(lines, 1):
            for m in self.store.id_re.finditer(line):
                pos.setdefault(m.group(0), []).append((i, m.start()))
            for m in self.store.path_re.finditer(line):
                cand = self._clean(m.group(1))
                if cand:
                    pos.setdefault(cand, []).append((i, m.start(1)))
        return pos

    def _pop(self, positions, token):
        q = positions.get(token)
        if q:
            return q.pop(0)
        return 1, 0

    # -- path candidates ---------------------------------------------

    def _clean(self, cand):
        cand = cand.rstrip(".,;:)]>'\"-")
        return cand

    def _path_candidates(self, text, spans):
        """Candidates from backtick spans, link targets, or a whole JSON value.

        Measured: bare markdown prose contributes one resolving hit and zero
        unresolved hits across the live cockpit, so it is not a source.
        """
        out = []
        for m in self.store.bare_re.finditer(text):
            # A bare filename is NOT a path candidate: measured over live markdown,
            # backticked basenames give 125 unresolved against 78 resolving, nearly
            # all of them real files cited from another room. The one exception is a
            # case collision, which fires only when a differently-cased file really
            # is there -- zero noise by construction, and it is the DS/Ds hazard.
            cand = self._clean(m.group(1))
            if not cand or "/" in cand:
                continue
            if spans is not None and not in_spans(m.start(1), spans):
                continue
            if self._case_collision(cand, text):
                out.append((cand, m.start(1)))
        for m in self.store.path_re.finditer(text):
            cand = self._clean(m.group(1))
            if not cand or "/" not in cand:
                continue
            if spans is not None and not in_spans(m.start(1), spans):
                continue
            if "$" in cand or (m.start(1) > 0 and text[m.start(1) - 1] == "$"):
                continue
            before = text[max(0, m.start(1) - 12):m.start(1)]
            if "://" in before:
                continue
            if not self._anchored(cand):
                continue
            out.append((cand, m.start(1)))
        return out

    def _case_collision(self, cand, _text):
        """True when this exact name is absent but a differently-cased one is there."""
        for base in (self._own_dir, self.store.root, self.repo_root):
            if base is None:
                continue
            try:
                names = os.listdir(base)
            except OSError:
                continue
            if cand in names:
                return False
            lower = dict((n.lower(), n) for n in names)
            if cand.lower() in lower:
                return True
        return False

    def _anchored(self, cand):
        bare = cand.lstrip("@").split("#")[0]
        if self.store.ext_re.search(bare):
            return True
        head = bare.split("/")[0]
        if head in ("", ".", ".."):
            return True
        if head == self.repo_anchor:
            return True
        # A declared planned room or external root is a recognised shape even
        # though it is not on disk; it becomes a note, never a finding, and that
        # keeps the store's own rows visible rather than silently dropped.
        if head in self.store.anchor_roots:
            return True
        return head in self.rooms

    # -- resolution ---------------------------------------------------

    def resolve_path(self, cand, from_file):
        """Case-sensitive, against the file's folder, the cockpit root, the repo root."""
        bare = cand.lstrip("@").split("#")[0]
        if bare.startswith("/"):
            return self.store.exists_exact(bare)
        own = os.path.dirname(os.path.join(self.store.root, from_file))
        for base in (own, self.store.root, self.repo_root):
            if self.store.exists_exact(os.path.join(base, bare)):
                return True
        return False

    def anchor_of(self, cand):
        bare = cand.lstrip("@")
        if "#" in bare:
            head, _, tail = bare.rpartition("#")
            if self.store.id_re.fullmatch(tail):
                return tail
        return None
