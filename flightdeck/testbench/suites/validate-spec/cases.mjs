/**
 * cases.mjs — the case table for run.mjs.
 *
 * A case is a one-field mutation of a golden fixture plus the rules that
 * mutation must raise. Cases are diffs rather than stored files so that a
 * change to the spec shape is made once, in the golden, and every case
 * inherits it.
 *
 * Fields:
 *   name    identifies the case in the report and names its temp directory
 *   base    "v1" (draft baseline) or "v2" (frozen revision)
 *   as      filename to write, when the case is about the filename itself
 *   dir     folder name to write into, default the spec's own name
 *   args    extra arguments passed to validate-spec.mjs
 *   mutate  receives the parsed golden and edits it in place
 *   rules   the exact set of distinct rule ids the run must report
 *   warns   substrings that must each appear in a warning line
 *   clean   true when the run must report no errors and no warnings
 *   code    expected exit status, default 2 when rules is non-empty else 0
 */

export const cases = [
  // ── the goldens themselves ────────────────────────────────────────────
  { name: "golden-v1-clean", base: "v1", clean: true },
  { name: "golden-v2-clean", base: "v2", clean: true },

  // ── schema-level checks, via schema-lib ───────────────────────────────
  { name: "schema-missing-required", base: "v1", rules: ["required"],
    mutate: (s) => { delete s.behaviours; } },
  { name: "schema-unknown-key", base: "v1", rules: ["additionalProperties"],
    mutate: (s) => { s.owner = "nobody"; } },
  { name: "schema-bad-enum", base: "v1", rules: ["enum"],
    mutate: (s) => { s.status = "wip"; } },
  { name: "schema-bad-type", base: "v1", rules: ["type"],
    mutate: (s) => { s.version = "1"; } },
  { name: "schema-empty-behaviours", base: "v1", rules: ["minItems"],
    mutate: (s) => { s.behaviours = []; } },
  { name: "schema-bad-commit-pattern", base: "v2", rules: ["pattern"],
    mutate: (s) => { s.commit = "NOTAHASH"; } },

  // ── invariant 1: ids unique across every section ──────────────────────
  { name: "inv1-duplicate-id", base: "v1", rules: ["invariant-1"],
    mutate: (s) => { s.scope[1].id = "SC1"; } },

  // ── invariant 2: an id belongs to its section ─────────────────────────
  { name: "inv2-misplaced-id", base: "v1", rules: ["pattern", "invariant-2"],
    mutate: (s) => { s.edges[0].id = "B9"; } },

  // ── invariants 3 and 4: the freeze gates ──────────────────────────────
  { name: "inv3-frozen-without-commit", base: "v2", rules: ["invariant-3"],
    mutate: (s) => { delete s.commit; } },
  { name: "inv3-frozen-with-open-question", base: "v2", rules: ["invariant-3"],
    mutate: (s) => { s.open_questions.push({ id: "Q1", text: "unresolved at freeze" }); } },
  { name: "inv3-for-freeze-rehearsal", base: "v1", args: ["--for-freeze"], rules: ["invariant-3"],
    mutate: (s) => { s.open_questions.push({ id: "Q1", text: "would block a freeze" }); } },
  { name: "inv4-draft-carrying-commit", base: "v1", rules: ["invariant-4"],
    mutate: (s) => { s.commit = "a1b2c3d"; } },

  // ── invariant 5: a retired id never comes back ────────────────────────
  { name: "inv5-retired-id-reused", base: "v2", rules: ["invariant-5"],
    mutate: (s) => { s.behaviours.push({ id: "B2", status: "ok", text: "reintroduced without a human reopening it" }); } },

  // ── invariant 6: the lineage is ordered and distinct ──────────────────
  { name: "inv6-not-ascending", base: "v2", as: "spec.v3.json", rules: ["invariant-6"],
    mutate: (s) => {
      s.version = 3;
      s.previous_versions = [
        { v: 2, file: "spec.v2.json", date: "2026-08-25", commit: "7c1d0aa", reason: "listed newest first by mistake" },
        { v: 1, file: "spec.v1.json", date: "2026-08-24", commit: "a1b2c3d", reason: "initial fixture" },
      ];
    } },
  { name: "inv6-entry-not-lower-than-version", base: "v2", rules: ["invariant-6"],
    mutate: (s) => {
      s.previous_versions.push({ v: 2, file: "spec.v2.json", date: "2026-08-25", commit: "7c1d0aa", reason: "a file listing itself" });
    } },
  { name: "inv6-duplicate-file", base: "v2", as: "spec.v3.json", rules: ["invariant-6"],
    mutate: (s) => {
      s.version = 3;
      s.previous_versions.push({ v: 2, file: "spec.v1.json", date: "2026-08-25", commit: "7c1d0aa", reason: "two versions pointing at one file" });
    } },

  // ── invariant 8: v1 is a baseline ─────────────────────────────────────
  { name: "inv8-v1-node-not-ok", base: "v1", rules: ["invariant-8"],
    mutate: (s) => { s.constraints[0].status = "new"; s.constraints[0].note = "there is nothing for it to be new against"; } },
  { name: "inv8-v1-carries-retired", base: "v1", rules: ["invariant-8", "invariant-11"],
    mutate: (s) => { s.retired = [{ id: "B9", at: 2, text: "never existed", note: "removed before it was written" }]; } },

  // ── invariant 9: a non-ok status owes a note ──────────────────────────
  { name: "inv9-changed-without-note", base: "v2", rules: ["invariant-9"],
    mutate: (s) => { delete s.constraints[0].note; } },

  // ── invariant 10: filename agrees with the version field ──────────────
  { name: "inv10-filename-version-mismatch", base: "v1", as: "spec.v2.json", rules: ["invariant-10"] },
  { name: "inv10-unrecognised-filename", base: "v1", as: "draft.json", rules: [],
    warns: ["is not spec.v<n>.json"] },

  // ── invariant 11: a retired entry names a real removal version ────────
  { name: "inv11-retired-at-after-version", base: "v2", rules: ["invariant-11"],
    mutate: (s) => { s.retired[0].at = 5; } },
  { name: "inv11-retired-at-below-two", base: "v2", rules: ["invariant-11"],
    mutate: (s) => { s.retired[0].at = 1; } },

  // ── invariant 12: the lineage has no holes ────────────────────────────
  { name: "inv12-lineage-hole", base: "v2", as: "spec.v3.json", rules: ["invariant-12"],
    mutate: (s) => { s.version = 3; } },

  // ── warnings: judgement flags, never fatal ────────────────────────────
  { name: "warn-edge-states-a-concern", base: "v1", rules: [],
    warns: ["concern rather than an outcome"],
    mutate: (s) => { s.edges[0].text = "The schema file might be unreadable in some environments."; } },
  { name: "warn-folder-name-mismatch", base: "v1", dir: "not-the-spec-name", rules: [],
    warns: ["does not match folder"] },
];

// Appended after the invariant-7 heuristic was widened: the flag must still
// fire on the shape it exists for, an edge that names a worry and no outcome.
cases.push(
  { name: "warn-edge-bare-noun-phrase", base: "v1", rules: [],
    warns: ["concern rather than an outcome"],
    mutate: (s) => { s.edges[0].text = "Concurrent access to the run directory."; } },
  { name: "warn-edge-condition-colon-outcome-is-clean", base: "v1", clean: true,
    mutate: (s) => { s.edges[0].text = "The schema is unreadable: the run halts and the path is named in the summary."; } },
);

// Invariant 13: the live ids and the retired ids together form an unbroken
// 1..N in each prefix. Renaming the live B3 of the frozen golden to B4 leaves
// B3 in neither the live arrays nor the registry, so the sequence has a hole.
cases.push(
  { name: "inv13-id-hole", base: "v2", rules: ["invariant-13"],
    mutate: (s) => { s.behaviours[1].id = "B4"; } },
);
