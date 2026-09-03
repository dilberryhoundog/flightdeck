// testbench/suites/lint-spec/run.mjs — T18: spec-readiness-lint exits 2 naming the failed rule id for a spec violating each rule of design section 5.14, prints warn-impression and warn-length without failing, and exits 0 on the sample spec with --repo pointing at the sample project (spec B26).
// Usage: node flightdeck/testbench/suites/lint-spec/run.mjs   (no arguments; prints pass/FAIL per case and '<n>/<m> passed'; exits 0 or 2)

import path from 'node:path';
import { suite, mkLaunchRepo, fc, sh, FD, readJson, writeJson, exists, assert, assertExit } from '../../lib/suite-lib.mjs';

const LINTER = path.join(FD, 'flightcrew', 'checks', 'validators', 'spec-readiness-lint.mjs');

/** Splits linter output (design 5.12) into error lines {message, rule} and warning messages. */
function parse(result) {
  const out = `${result.stdout}${result.stderr}`;
  const errors = [...out.matchAll(/^error: (.*) — \[([^\]]+)\]\s*$/gm)].map((m) => ({ message: m[1], rule: m[2] }));
  const warns = [...out.matchAll(/^warn: {2}(.*)$/gm)].map((m) => m[1]);
  return { out, errors, warns };
}

function tail(text, lines = 6) {
  return String(text).split('\n').filter((l) => l.trim()).slice(-lines).join(' / ') || '(no output)';
}

/** A fresh sample repository whose canonical spec copy has been mutated in place. */
function repoWithSpec(mutate) {
  const R = mkLaunchRepo();
  const file = path.join(R.root, R.specPath);
  const spec = readJson(file);
  mutate?.(spec);
  writeJson(file, spec);
  return { ...R, file };
}

function lint(R, extra = []) {
  return fc(['lint', 'spec', R.file, '--repo', R.root, ...extra], { cwd: R.root, env: { FLIGHTCREW_ROOT: R.root } });
}

const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** The linter script itself, run as a program (design section 2 names spec-readiness-lint as the thing under test). */
function lintScript(R, extra = []) {
  return sh([process.execPath, LINTER, R.file, '--repo', R.root, ...extra].map(q).join(' '), { cwd: R.root, env: { FLIGHTCREW_ROOT: R.root } });
}

/** token is a literal substring or a RegExp; a rule whose message may name any of several ids is asserted with a RegExp. */
function expectRule(result, rule, token) {
  assertExit(result, 2, `spec-readiness-lint should exit 2 for a spec violating ${rule}`);
  const { out, errors } = parse(result);
  const hits = errors.filter((e) => e.rule === rule);
  assert(hits.length > 0, `no 'error: … — [${rule}]' line; output: ${tail(out)}`);
  if (token) {
    const re = token instanceof RegExp ? token : new RegExp(String(token).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    assert(hits.some((e) => re.test(e.message)), `no [${rule}] line matches ${re}; output: ${tail(out)}`);
  }
}

function expectClean(result, what, absentRule) {
  assertExit(result, 0, `spec-readiness-lint should exit 0 on ${what}`);
  const { out, errors } = parse(result);
  assert(errors.length === 0, `unexpected error lines on ${what}: ${tail(out)}`);
  if (absentRule) assert(!out.includes(absentRule), `${absentRule} still reported on ${what}: ${tail(out)}`);
}

/** Design 5.12 gives a warning line no '— [<rule>]' suffix, so the warning is matched on its rule id or on the id's stem inside the message. */
function expectWarning(result, id, what) {
  assertExit(result, 0, `a ${id} warning must not fail the lint (${what})`);
  const { out, errors, warns } = parse(result);
  assert(errors.length === 0, `unexpected error lines for ${what}: ${tail(out)}`);
  assert(warns.length > 0, `no 'warn:  <message>' line for ${what}; output: ${tail(out)}`);
  const stem = id.replace(/^warn-/, '');
  const re = new RegExp(`${id}|${stem}`, 'i');
  assert(warns.some((w) => re.test(w)), `no warning names ${id} or ${stem} for ${what}; output: ${tail(out)}`);
}

const IMPRESSION = 'exportProject should be fast and robust, handle large projects gracefully, and produce clean, readable, user-friendly HTML that looks good, works well and feels intuitive in most browsers, with appropriate and reasonable performance.';

await suite('lint-spec', [
  {
    id: 'positive-sample-spec',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec();
      expectClean(lint(R), 'the sample spec with --repo at the sample project');
    },
  },
  {
    id: 'lint-domains-empty-domain-without-decision',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => { s.decisions = []; });
      expectRule(lint(R), 'lint-domains', 'decisions');
    },
  },
  {
    id: 'lint-open-questions',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => { s.open_questions = [{ id: 'Q1', text: 'Should the exporter also emit a table of contents?' }]; });
      expectRule(lint(R), 'lint-open-questions', 'Q1');
    },
  },
  {
    id: 'lint-sequential-id-hole',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => {
        s.behaviours[4].id = 'B7';
        s.verification.text = s.verification.text.replace('B4 and B5', 'B4 and B7');
      });
      expectRule(lint(R), 'lint-sequential', /B5|B6|B7/);
    },
  },
  {
    id: 'lint-out-list-no-out-scope',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => { s.scope[2].kind = 'in'; });
      expectRule(lint(R), 'lint-out-list');
    },
  },
  {
    id: 'lint-artefacts-unresolved-path',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => { s.interfaces[0].text += ' The helper src/export/missing-helper.mjs is also exported.'; });
      expectRule(lint(R), 'lint-artefacts', 'src/export/missing-helper.mjs');
    },
  },
  {
    id: 'lint-artefacts-satisfied-by-deliverable',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => { s.interfaces[0].text += ' The helper src/export/missing-helper.mjs is also exported.'; });
      expectClean(lint(R, ['--deliverable', 'src/export/missing-helper.mjs']), 'a spec whose unresolved artefact is listed by --deliverable', 'lint-artefacts');
    },
  },
  {
    id: 'lint-commands-run-missing-script',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => {
        s.verification.text = s.verification.text.replace('node scripts/export-smoke.mjs', 'node scripts/nonexistent-smoke.mjs');
      });
      expectRule(lint(R), 'lint-commands-run', 'scripts/nonexistent-smoke.mjs');
    },
  },
  {
    id: 'lint-claimed-behaviour-absent-from-verification',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => {
        s.verification.text = s.verification.text.replace('B1, B2, B3, B4 and B5', 'B1, B2, B3 and B4');
      });
      expectRule(lint(R), 'lint-claimed', 'B5');
    },
  },
  {
    id: 'lint-boundary-acceptance-without-path-token',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => {
        s.acceptance.text = s.acceptance.text.replace('the diff touches only src/export/ and tests/export/', 'the diff touches only the exporter and its tests');
      });
      expectRule(lint(R), 'lint-boundary');
    },
  },
  {
    id: 'lint-class-tags-agent-shaped-without-tags',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => { s.intent.text += ' The exporter is agent-shaped: an agent drives it from a brief.'; });
      expectRule(lint(R), 'lint-class-tags');
    },
  },
  {
    id: 'lint-class-tags-satisfied-when-tagged',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => {
        s.intent.text += ' The exporter is agent-shaped: an agent drives it from a brief.';
        for (const b of s.behaviours) b.text = `[deterministic] ${b.text}`;
      });
      expectClean(lint(R), 'an agent-shaped spec whose behaviours all carry a class tag', 'lint-class-tags');
    },
  },
  {
    id: 'linter-script-accepts-the-sample-spec',
    covers: ['B26'],
    fn: async () => {
      assert(exists(LINTER), `${LINTER} does not exist; B26 names spec-readiness-lint as the thing under test`);
      const R = repoWithSpec();
      expectClean(lintScript(R), 'the sample spec, running the linter script directly');
    },
  },
  {
    id: 'linter-script-names-lint-open-questions',
    covers: ['B26'],
    fn: async () => {
      assert(exists(LINTER), `${LINTER} does not exist; B26 names spec-readiness-lint as the thing under test`);
      const R = repoWithSpec((s) => { s.open_questions = [{ id: 'Q1', text: 'Should the exporter also emit a table of contents?' }]; });
      expectRule(lintScript(R), 'lint-open-questions', 'Q1');
    },
  },
  {
    id: 'warn-impression-does-not-fail',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => { s.behaviours[0].text = IMPRESSION; });
      expectWarning(lint(R), 'warn-impression', 'a behaviour written as impressions');
    },
  },
  {
    id: 'warn-length-does-not-fail',
    covers: ['B26'],
    fn: async () => {
      const R = repoWithSpec((s) => {
        const sentence = 'The document carries one section per page, in the order of project.pages, each holding the page title in an h2 element and every block in order. ';
        s.behaviours[0].text = sentence.repeat(60).trim();
        const extra = [];
        for (let n = 6; n <= 70; n += 1) {
          s.behaviours.push({ id: `B${n}`, status: 'ok', text: `Block number ${n} of a page renders in position ${n} of its section.` });
          extra.push(`B${n}`);
        }
        s.verification.text += ` T2 also proves ${extra.join(', ')} with one named test per behaviour.`;
      });
      expectWarning(lint(R), 'warn-length', 'a spec far beyond a readable length');
    },
  },
]);
