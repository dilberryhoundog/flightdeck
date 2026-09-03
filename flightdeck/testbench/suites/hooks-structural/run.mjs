// testbench/suites/hooks-structural/run.mjs — T6: structural-check runs the configured command for the edited file's extension with {file} shell-quoted, cwd at the git toplevel, exits 2 with the last 20 combined lines on non-zero, exits 0 silently on zero, and ignores unconfigured extensions. Covers B8, E9.
// Usage: node flightdeck/testbench/suites/hooks-structural/run.mjs; exit 0 when every case passes, 2 otherwise.

import path from 'node:path';
import {
  suite, hook, mkActiveLaunch,
  readJson, writeJson, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

function envelope(root, file, extra = {}) {
  const filePath = path.isAbsolute(file) ? file : path.join(root, file);
  return {
    session_id: 'sess-testbench',
    transcript_path: path.join(root, 'transcript.jsonl'),
    cwd: root,
    permission_mode: 'acceptEdits',
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_use_id: 'toolu_structural',
    tool_input: { file_path: filePath, old_string: 'a', new_string: 'b' },
    tool_result: { filePath, success: true },
    ...extra,
  };
}

function configure(active, structural) {
  const p = path.join(active.launchDir, 'launch.json');
  const launch = readJson(p);
  launch.structural = { ...launch.structural, ...structural };
  writeJson(p, launch);
}

function assertClean(result, label) {
  assertExit(result, 0, `${label}: exit code`);
  assertEq(result.stdout, '', `${label}: stdout must be empty`);
  assertEq(result.stderr, '', `${label}: stderr must be empty`);
}

const GOOD_MJS = 'export const fine = 1;\nexport function f() { return fine; }\n';
const BROKEN_MJS = 'export const broken = ;\n';
const GOOD_JS_ESM = 'export const meta = { name: "fc-sample", description: "sample", phases: [] };\n';
const BROKEN_JS = 'export const meta = { name: ;\n';

// 25 stdout lines then 5 stderr lines, then exit 3: the last 20 combined lines are out11..out25 and err1..err5.
const THIRTY_LINES = 'i=1; while [ $i -le 25 ]; do echo out$i; i=$((i+1)); done; j=1; while [ $j -le 5 ]; do echo err$j >&2; j=$((j+1)); done; cat {file} >/dev/null; exit 3';

const cases = [];

cases.push({
  id: 'broken-mjs-blocks',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    const file = 'src/export/broken.mjs';
    writeText(path.join(active.root, file), BROKEN_MJS);
    const result = hook('structural-check', envelope(active.root, file), { cwd: active.root, env: active.env });
    assertExit(result, 2, 'broken .mjs');
    assertEq(result.stdout, '', 'nothing on stdout');
    assertMatch(result.stderr, /SyntaxError/, 'stderr carries the command output');
  },
});

cases.push({
  id: 'good-mjs-silent',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    const file = 'src/export/fine.mjs';
    writeText(path.join(active.root, file), GOOD_MJS);
    assertClean(hook('structural-check', envelope(active.root, file), { cwd: active.root, env: active.env }), 'good .mjs');
    assertClean(hook('structural-check', envelope(active.root, 'src/export/index.mjs'), { cwd: active.root, env: active.env }), 'shipped index.mjs');
  },
});

cases.push({
  id: 'write-tool-also-checked',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    const file = 'src/export/written.mjs';
    writeText(path.join(active.root, file), BROKEN_MJS);
    const env = envelope(active.root, file, { tool_name: 'Write', tool_input: { file_path: path.join(active.root, file), content: BROKEN_MJS } });
    const result = hook('structural-check', env, { cwd: active.root, env: active.env });
    assertExit(result, 2, 'broken .mjs via Write');
    assertMatch(result.stderr, /SyntaxError/, 'stderr carries the command output');
  },
});

cases.push({
  id: 'js-uses-configured-module-command',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    const good = 'src/export/workflow.js';
    writeText(path.join(active.root, good), GOOD_JS_ESM);
    assertClean(hook('structural-check', envelope(active.root, good), { cwd: active.root, env: active.env }), 'ESM .js with export const meta');
    const broken = 'src/export/broken.js';
    writeText(path.join(active.root, broken), BROKEN_JS);
    const result = hook('structural-check', envelope(active.root, broken), { cwd: active.root, env: active.env });
    assertExit(result, 2, 'broken .js');
    assertMatch(result.stderr, /SyntaxError/, 'stderr carries the command output');
  },
});

cases.push({
  id: 'json-command-runs',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    const broken = 'src/export/data.json';
    writeText(path.join(active.root, broken), '{ "unterminated": ');
    const result = hook('structural-check', envelope(active.root, broken), { cwd: active.root, env: active.env });
    assertExit(result, 2, 'broken .json');
    assert(result.stderr.trim() !== '', 'stderr carries the command output');
    const good = 'src/export/good.json';
    writeText(path.join(active.root, good), '{ "ok": true }\n');
    assertClean(hook('structural-check', envelope(active.root, good), { cwd: active.root, env: active.env }), 'good .json');
  },
});

cases.push({
  id: 'path-with-space-is-shell-quoted',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    const broken = 'src/export/my broken file.mjs';
    writeText(path.join(active.root, broken), BROKEN_MJS);
    const result = hook('structural-check', envelope(active.root, broken), { cwd: active.root, env: active.env });
    assertExit(result, 2, 'broken .mjs whose path holds a space');
    assertMatch(result.stderr, /SyntaxError/, 'the command ran against the file with the space');
    const good = 'src/export/my fine file.mjs';
    writeText(path.join(active.root, good), GOOD_MJS);
    assertClean(hook('structural-check', envelope(active.root, good), { cwd: active.root, env: active.env }), 'good .mjs whose path holds a space');
  },
});

cases.push({
  id: 'path-with-quote-and-dollar-is-shell-quoted',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    const good = "src/export/it's $HOME.mjs";
    writeText(path.join(active.root, good), GOOD_MJS);
    assertClean(hook('structural-check', envelope(active.root, good), { cwd: active.root, env: active.env }), 'good .mjs whose path holds a quote and a dollar sign');
    const broken = "src/export/it's $HOME broken.mjs";
    writeText(path.join(active.root, broken), BROKEN_MJS);
    const result = hook('structural-check', envelope(active.root, broken), { cwd: active.root, env: active.env });
    assertExit(result, 2, 'broken .mjs whose path holds a quote and a dollar sign');
    assertMatch(result.stderr, /SyntaxError/, 'the command ran against the awkward path');
  },
});

cases.push({
  id: 'file-placeholder-is-absolute-path',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    configure(active, { '.abs': 'case {file} in /*) test -f {file} || exit 8;; *) exit 9;; esac' });
    const file = 'src/export/thing.abs';
    writeText(path.join(active.root, file), 'x\n');
    assertClean(hook('structural-check', envelope(active.root, file), { cwd: active.root, env: active.env }), '{file} is the absolute path of an existing file');
    const relative = envelope(active.root, file);
    relative.tool_input.file_path = file;
    assertClean(hook('structural-check', relative, { cwd: active.root, env: active.env }), 'a relative file_path is absolutised against cwd');
  },
});

cases.push({
  id: 'cwd-is-git-toplevel',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    configure(active, { '.top': 'test -f scripts/export-smoke.mjs || exit 7; cat {file} >/dev/null' });
    const file = 'src/export/deep.top';
    writeText(path.join(active.root, file), 'x\n');
    const fromSubdir = envelope(active.root, file);
    fromSubdir.cwd = path.join(active.root, 'src', 'export');
    assertClean(hook('structural-check', fromSubdir, { cwd: fromSubdir.cwd, env: active.env }), 'the command sees the toplevel as cwd when the envelope cwd is a subdirectory');
  },
});

cases.push({
  id: 'last-twenty-combined-lines-on-stderr',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    configure(active, { '.noisy': THIRTY_LINES });
    const file = 'src/export/loud.noisy';
    writeText(path.join(active.root, file), 'x\n');
    const result = hook('structural-check', envelope(active.root, file), { cwd: active.root, env: active.env });
    assertExit(result, 2, 'non-zero structural command');
    assertEq(result.stdout, '', 'nothing on stdout');
    const lines = result.stderr.split('\n').filter((line) => line.trim() !== '');
    for (const expected of ['out11', 'out25', 'err1', 'err5']) assertIncludes(lines, expected, `stderr keeps ${expected}`);
    for (const dropped of ['out1', 'out10']) assert(!lines.includes(dropped), `stderr drops ${dropped} (only the last 20 combined lines)`);
    const kept = lines.filter((line) => /^(out|err)\d+$/.test(line));
    assertEq(kept.length, 20, 'exactly 20 output lines are kept');
  },
});

cases.push({
  id: 'unconfigured-extension-silent',
  covers: ['E9'],
  fn: async () => {
    const active = mkActiveLaunch();
    for (const file of ['README.md', 'src/export/notes.txt', 'src/export/data.yaml', 'src/export/Makefile']) {
      writeText(path.join(active.root, file), 'not checked: syntax { [ (\n');
      assertClean(hook('structural-check', envelope(active.root, file), { cwd: active.root, env: active.env }), `unconfigured ${file}`);
    }
  },
});

cases.push({
  id: 'unconfigured-extension-when-structural-empty',
  covers: ['E9'],
  fn: async () => {
    const active = mkActiveLaunch();
    const p = path.join(active.launchDir, 'launch.json');
    const launch = readJson(p);
    launch.structural = {};
    writeJson(p, launch);
    const file = 'src/export/broken.mjs';
    writeText(path.join(active.root, file), BROKEN_MJS);
    assertClean(hook('structural-check', envelope(active.root, file), { cwd: active.root, env: active.env }), 'no command configured for .mjs');
    assert(exists(path.join(active.root, file)), 'the file is left in place');
  },
});

cases.push({
  id: 'runs-in-every-phase',
  covers: ['B8'],
  fn: async () => {
    const active = mkActiveLaunch();
    const file = 'src/export/broken.mjs';
    writeText(path.join(active.root, file), BROKEN_MJS);
    for (const phase of ['targets', 'plan', 'contracts', 'implement', 'verify', 'review', 'report']) {
      const p = path.join(active.launchDir, 'launch.json');
      const launch = readJson(p);
      launch.phase = phase;
      writeJson(p, launch);
      const result = hook('structural-check', envelope(active.root, file), { cwd: active.root, env: active.env });
      assertExit(result, 2, `phase ${phase}`);
    }
  },
});

await suite('hooks-structural', cases);
