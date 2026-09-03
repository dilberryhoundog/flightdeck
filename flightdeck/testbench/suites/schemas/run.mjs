// testbench/suites/schemas/run.mjs — T26: every schema file the spec's I2, I3, I4, I5, I6 and I8 name parses; every sample-launch document, the sample map and the sample plan validate against its schema and a mutated copy fails with the schema keyword; fc validate return accepts the sample returns by kind; settings.fragment.json matches spec I14 (spec I2, I3, I4, I5, I6, I8, I14).
// Usage: node flightdeck/testbench/suites/schemas/run.mjs   (no arguments; prints pass/FAIL per case and '<n>/<m> passed'; exits 0 or 2)
// One case proves one thing: each sample document, each mutation and each schema file is its own case, so a FAIL line names the defect rather than a bundle and no assertion hides behind an earlier one.

import fs from 'node:fs';
import path from 'node:path';
import { suite, mkActiveLaunch, fc, FIXTURES, SCHEMAS, HOOKS, CREW, readJson, writeJson, readText, exists, assert, assertExit, assertEq } from '../../lib/suite-lib.mjs';
import { validate } from './mini-schema.mjs';

const SAMPLE_LAUNCH = path.join(FIXTURES, 'sample-launch');
const SAMPLE_SPEC = path.join(FIXTURES, 'sample-spec');
// Every schema file design section 2 lists that an interface node of this suite names, with that node. spec.schema.json is
// not here: it ships unchanged from before this system and no I node of T26 names it; validate-spec's suite reads it on every case.
const SCHEMA_FILES = [
  ['launch.schema.json', 'I2'], ['tests-map.schema.json', 'I3'], ['plan.schema.json', 'I4'], ['event.schema.json', 'I5'],
  ['check-result.schema.json', 'I6'], ['explorer-return.schema.json', 'I8'], ['worker-return.schema.json', 'I8'],
  ['verifier-verdict.schema.json', 'I8'], ['critic-findings.schema.json', 'I8'],
];
const WORKER_UNITS = ['U0', 'U1', 'U2', 'U3'];
const CHECK_RESULTS = ['T1', 'T2', 'T3', 'T4', 'T5'];
const RETURN_KINDS = [
  ['returns/explore-X1.json', 'explorer'], ['returns/U0.json', 'worker'], ['returns/U1.json', 'worker'],
  ['returns/U2.json', 'worker'], ['returns/U3.json', 'worker'], ['returns/verify-1.json', 'verifier'], ['review/pass-1.json', 'critic'],
];
const RECORDED_EVENTS = ['SessionStart', 'SessionEnd', 'SubagentStart', 'SubagentStop', 'TaskCreated', 'TaskCompleted',
  'PostToolUseFailure', 'PermissionDenied', 'PreCompact', 'PostCompact', 'Stop', 'WorktreeRemove'];
const ALLOW_LITERALS = [
  'Bash(node flightdeck/flightcrew/bin/fc *)', 'Bash(flightdeck/flightcrew/bin/fc *)', 'Bash(./flightdeck/flightcrew/bin/fc *)',
  'Bash(git status *)', 'Bash(git diff *)', 'Bash(git log *)', 'Bash(git rev-parse *)', 'Bash(git add *)', 'Bash(git commit *)',
  'Bash(git switch *)', 'Bash(git worktree list *)', 'Workflow(fc-implement)', 'Workflow(fc-review)', 'Workflow(fc-explore)',
];
const DENY_LITERALS = ['Edit(flightdeck/launch/*/specs/**)', 'Edit(flightdeck/launch/specs/**)'];

function schema(name) {
  const file = path.join(SCHEMAS, name);
  assert(exists(file), `${file} does not exist`);
  return readJson(file);
}

function describe(errors, limit = 4) {
  return errors.slice(0, limit).map((e) => `${e.message} [${e.keyword}]`).join(' / ');
}

/** The document must conform to the named schema. */
function expectValid(schemaName, doc, label) {
  const errors = validate(schema(schemaName), doc);
  assert(errors.length === 0, `${label} does not validate against ${schemaName}: ${describe(errors)}`);
}

/** The document must be rejected with the given keyword at a path mentioning field. */
function expectKeyword(schemaName, doc, keyword, field, label) {
  const errors = validate(schema(schemaName), doc);
  assert(errors.length > 0, `${label} was accepted by ${schemaName}; expected a ${keyword} error on ${field}`);
  const hit = errors.find((e) => e.keyword === keyword && (e.path.includes(field) || e.message.includes(field)));
  assert(hit, `${schemaName} rejected ${label} but not with [${keyword}] on ${field}: ${describe(errors)}`);
}

function launchDoc(rel) {
  return readJson(path.join(SAMPLE_LAUNCH, rel));
}

/** The first line of the sample events.jsonl, parsed; the starting point for every event mutation case. */
function firstEvent() {
  const lines = readText(path.join(SAMPLE_LAUNCH, 'events.jsonl')).split('\n').filter((l) => l.trim() !== '');
  assert(lines.length > 0, 'sample events.jsonl is empty');
  return JSON.parse(lines[0]);
}

function fragment() {
  const file = path.join(HOOKS, 'settings.fragment.json');
  assert(exists(file), `${file} does not exist`);
  return readJson(file);
}

function hookEntries(frag, event) {
  const list = frag.hooks?.[event];
  assert(Array.isArray(list) && list.length > 0, `settings.fragment.json has no hooks.${event} entry`);
  return list;
}

/** Every command under hooks.<event>, flattened, together with its matcher and timeout. */
function commandsFor(frag, event) {
  const out = [];
  for (const entry of hookEntries(frag, event)) {
    for (const h of entry.hooks ?? []) out.push({ matcher: entry.matcher, type: h.type, command: h.command, timeout: h.timeout });
  }
  return out;
}

const HOOK_COMMAND = /^node "\$CLAUDE_PROJECT_DIR"\/flightdeck\/flightcrew\/hooks\/([a-z-]+)\.mjs$/;

function crewNames() {
  const names = [];
  for (const entry of fs.readdirSync(CREW)) {
    if (!entry.endsWith('.md')) continue;
    const text = readText(path.join(CREW, entry));
    if (!text.startsWith('---')) continue;
    const m = /^name:\s*(\S+)\s*$/m.exec(text.split('\n---')[0]);
    if (m) names.push(m[1]);
  }
  return names;
}

function validateReturn(L, rel, kind) {
  return fc(['validate', 'return', path.join(L.launchDir, rel), '--kind', kind], { cwd: L.root, env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch } });
}

await suite('schemas', [
  ...SCHEMA_FILES.map(([name, node]) => ({
    id: `${name.replace('.schema.json', '')}-schema-parses`,
    covers: [node],
    fn: async () => {
      const s = schema(name);
      assert(s && typeof s === 'object' && !Array.isArray(s), `${name} is not a JSON object`);
      assert(typeof s.type === 'string' || s.properties || s.oneOf || s.anyOf || s.$ref, `${name} declares no schema shape`);
    },
  })),
  {
    id: 'tests-map-schema-description-lists-invariants',
    covers: ['I3'],
    fn: async () => {
      const s = schema('tests-map.schema.json');
      const text = String(s.description ?? '');
      for (let n = 1; n <= 13; n += 1) assert(text.includes(`tm-invariant-${n}`), `tests-map.schema.json description does not list tm-invariant-${n}`);
      assert(/coverage/i.test(text), 'tests-map.schema.json description does not name the coverage rule');
    },
  },
  {
    id: 'launch-sample-validates',
    covers: ['I2'],
    fn: async () => {
      expectValid('launch.schema.json', launchDoc('launch.json'), 'sample-launch/launch.json');
    },
  },
  {
    id: 'launch-schema-rejects-status-outside-enum',
    covers: ['I2'],
    fn: async () => {
      const doc = launchDoc('launch.json');
      doc.status = 'bogus';
      expectKeyword('launch.schema.json', doc, 'enum', 'status', 'launch.json with status bogus');
    },
  },
  {
    id: 'launch-schema-rejects-stop-blocks-above-eight',
    covers: ['I2'],
    fn: async () => {
      const doc = launchDoc('launch.json');
      doc.ceilings.stop_blocks = 9;
      expectKeyword('launch.schema.json', doc, 'maximum', 'stop_blocks', 'launch.json with stop_blocks 9');
    },
  },
  {
    id: 'launch-schema-requires-base-commit',
    covers: ['I2'],
    fn: async () => {
      const doc = launchDoc('launch.json');
      delete doc.base_commit;
      expectKeyword('launch.schema.json', doc, 'required', 'base_commit', 'launch.json without base_commit');
    },
  },
  {
    id: 'pinned-frozen-map-validates',
    covers: ['I3'],
    fn: async () => {
      expectValid('tests-map.schema.json', launchDoc('specs/export-html/tests-map.v1.json'), 'the pinned frozen sample map');
    },
  },
  {
    id: 'draft-map-validates',
    covers: ['I3'],
    fn: async () => {
      expectValid('tests-map.schema.json', readJson(path.join(SAMPLE_SPEC, 'tests-map.v1.json')), 'the draft sample map');
    },
  },
  {
    id: 'tests-map-schema-rejects-status-outside-enum',
    covers: ['I3'],
    fn: async () => {
      const doc = launchDoc('specs/export-html/tests-map.v1.json');
      doc.status = 'pending';
      expectKeyword('tests-map.schema.json', doc, 'enum', 'status', 'a map with status pending');
    },
  },
  {
    id: 'tests-map-schema-requires-checks',
    covers: ['I3'],
    fn: async () => {
      const doc = launchDoc('specs/export-html/tests-map.v1.json');
      delete doc.checks;
      expectKeyword('tests-map.schema.json', doc, 'required', 'checks', 'a map without checks');
    },
  },
  {
    id: 'tests-map-schema-rejects-check-kind-outside-enum',
    covers: ['I3'],
    fn: async () => {
      const doc = launchDoc('specs/export-html/tests-map.v1.json');
      doc.checks[0].kind = 'manual';
      expectKeyword('tests-map.schema.json', doc, 'enum', 'kind', 'a check of kind manual');
    },
  },
  {
    id: 'launch-plan-validates',
    covers: ['I4'],
    fn: async () => {
      expectValid('plan.schema.json', launchDoc('plan.json'), 'sample-launch/plan.json');
    },
  },
  {
    id: 'spec-folder-plan-sample-validates',
    covers: ['I4'],
    fn: async () => {
      expectValid('plan.schema.json', readJson(path.join(SAMPLE_SPEC, 'plan.sample.json')), 'sample-spec/plan.sample.json');
    },
  },
  {
    id: 'plan-schema-rejects-shape-outside-enum',
    covers: ['I4'],
    fn: async () => {
      const doc = launchDoc('plan.json');
      doc.shape = 'bogus';
      expectKeyword('plan.schema.json', doc, 'enum', 'shape', 'a plan with shape bogus');
    },
  },
  {
    id: 'plan-schema-rejects-wave-mode-outside-enum',
    covers: ['I4'],
    fn: async () => {
      const doc = launchDoc('plan.json');
      doc.waves[0].mode = 'staggered';
      expectKeyword('plan.schema.json', doc, 'enum', 'mode', 'a wave with mode staggered');
    },
  },
  {
    id: 'plan-schema-requires-abandon-triggers',
    covers: ['I4'],
    fn: async () => {
      const doc = launchDoc('plan.json');
      delete doc.abandon_triggers;
      expectKeyword('plan.schema.json', doc, 'required', 'abandon_triggers', 'a plan without abandon_triggers');
    },
  },
  {
    id: 'plan-schema-rejects-unit-kind-outside-enum',
    covers: ['I4'],
    fn: async () => {
      const doc = launchDoc('plan.json');
      doc.units[0].kind = 'chore';
      expectKeyword('plan.schema.json', doc, 'enum', 'kind', 'a unit of kind chore');
    },
  },
  {
    id: 'event-sample-lines-validate',
    covers: ['I5'],
    fn: async () => {
      const lines = readText(path.join(SAMPLE_LAUNCH, 'events.jsonl')).split('\n').filter((l) => l.trim() !== '');
      assert(lines.length > 0, 'sample events.jsonl is empty');
      lines.forEach((line, i) => expectValid('event.schema.json', JSON.parse(line), `events.jsonl line ${i + 1}`));
    },
  },
  {
    id: 'event-schema-rejects-source-outside-enum',
    covers: ['I5'],
    fn: async () => {
      const doc = firstEvent();
      doc.source = 'other';
      expectKeyword('event.schema.json', doc, 'enum', 'source', 'an event with source other');
    },
  },
  {
    id: 'event-schema-requires-ts',
    covers: ['I5'],
    fn: async () => {
      const doc = firstEvent();
      delete doc.ts;
      expectKeyword('event.schema.json', doc, 'required', 'ts', 'an event without ts');
    },
  },
  {
    id: 'event-schema-rejects-string-detail',
    covers: ['I5'],
    fn: async () => {
      const doc = firstEvent();
      doc.detail = 'text';
      expectKeyword('event.schema.json', doc, 'type', 'detail', 'an event whose detail is a string');
    },
  },
  ...CHECK_RESULTS.map((id) => ({
    id: `check-result-sample-${id}-validates`,
    covers: ['I6'],
    fn: async () => {
      expectValid('check-result.schema.json', launchDoc(`evidence/${id}.json`), `evidence/${id}.json`);
    },
  })),
  {
    id: 'check-result-schema-rejects-verdict-outside-enum',
    covers: ['I6'],
    fn: async () => {
      const doc = launchDoc('evidence/T1.json');
      doc.verdict = 'maybe';
      expectKeyword('check-result.schema.json', doc, 'enum', 'verdict', 'a result with verdict maybe');
    },
  },
  {
    id: 'check-result-schema-rejects-string-exit',
    covers: ['I6'],
    fn: async () => {
      const doc = launchDoc('evidence/T1.json');
      doc.exit = 'zero';
      expectKeyword('check-result.schema.json', doc, 'type', 'exit', 'a result whose exit is a string');
    },
  },
  {
    id: 'check-result-schema-requires-commit',
    covers: ['I6'],
    fn: async () => {
      const doc = launchDoc('evidence/T1.json');
      delete doc.commit;
      expectKeyword('check-result.schema.json', doc, 'required', 'commit', 'a result without commit');
    },
  },
  {
    id: 'explorer-return-sample-validates',
    covers: ['I8'],
    fn: async () => {
      expectValid('explorer-return.schema.json', launchDoc('returns/explore-X1.json'), 'returns/explore-X1.json');
    },
  },
  ...WORKER_UNITS.map((u) => ({
    id: `worker-return-sample-${u}-validates`,
    covers: ['I8'],
    fn: async () => {
      expectValid('worker-return.schema.json', launchDoc(`returns/${u}.json`), `returns/${u}.json`);
    },
  })),
  {
    id: 'verifier-verdict-sample-validates',
    covers: ['I8'],
    fn: async () => {
      expectValid('verifier-verdict.schema.json', launchDoc('returns/verify-1.json'), 'returns/verify-1.json');
    },
  },
  {
    id: 'critic-findings-sample-validates',
    covers: ['I8'],
    fn: async () => {
      expectValid('critic-findings.schema.json', launchDoc('review/pass-1.json'), 'review/pass-1.json');
    },
  },
  {
    id: 'explorer-return-rejects-confidence-outside-enum',
    covers: ['I8'],
    fn: async () => {
      const doc = launchDoc('returns/explore-X1.json');
      doc.confidence = 'sure';
      expectKeyword('explorer-return.schema.json', doc, 'enum', 'confidence', 'an explorer return with confidence sure');
    },
  },
  {
    id: 'worker-return-rejects-status-outside-enum',
    covers: ['I8'],
    fn: async () => {
      const doc = launchDoc('returns/U0.json');
      doc.status = 'amber';
      expectKeyword('worker-return.schema.json', doc, 'enum', 'status', 'a worker return with status amber');
    },
  },
  {
    id: 'worker-return-rejects-halt-kind-outside-enum',
    covers: ['I8'],
    fn: async () => {
      const doc = launchDoc('returns/U0.json');
      doc.status = 'halt';
      doc.halt = { kind: 'tired', detail: 'not a halt kind' };
      expectKeyword('worker-return.schema.json', doc, 'enum', 'kind', 'a worker return whose halt kind is tired');
    },
  },
  {
    id: 'verifier-verdict-rejects-string-refuted',
    covers: ['I8'],
    fn: async () => {
      const doc = launchDoc('returns/verify-1.json');
      doc.refuted = 'no';
      expectKeyword('verifier-verdict.schema.json', doc, 'type', 'refuted', 'a verifier verdict whose refuted is a string');
    },
  },
  {
    id: 'critic-findings-rejects-finding-kind-outside-enum',
    covers: ['I8'],
    fn: async () => {
      const doc = launchDoc('review/pass-1.json');
      doc.findings[0].kind = 'nitpick';
      expectKeyword('critic-findings.schema.json', doc, 'enum', 'kind', 'a finding of kind nitpick');
    },
  },
  {
    id: 'critic-findings-rejects-severity-outside-enum',
    covers: ['I8'],
    fn: async () => {
      const doc = launchDoc('review/pass-1.json');
      doc.findings[0].severity = 'cosmetic';
      expectKeyword('critic-findings.schema.json', doc, 'enum', 'severity', 'a finding of severity cosmetic');
    },
  },
  ...RETURN_KINDS.map(([rel, kind]) => ({
    id: `fc-validate-return-accepts-${rel.replace(/[/.]/g, '-').replace(/-json$/, '')}-as-${kind}`,
    covers: ['I8'],
    fn: async () => {
      const L = mkActiveLaunch();
      const result = validateReturn(L, rel, kind);
      assertExit(result, 0, `fc validate return ${rel} --kind ${kind}`);
      assert(!/^error: /m.test(`${result.stdout}${result.stderr}`), `error lines printed for ${rel}`);
    },
  })),
  {
    id: 'fc-validate-return-rejects-by-schema-keyword',
    covers: ['I8'],
    fn: async () => {
      const L = mkActiveLaunch();
      const file = path.join(L.launchDir, 'returns', 'U0.json');
      const doc = readJson(file);
      doc.status = 'amber';
      writeJson(file, doc);
      const result = validateReturn(L, 'returns/U0.json', 'worker');
      assertExit(result, 2, 'fc validate return on a worker return with status amber');
      const out = `${result.stdout}${result.stderr}`;
      assert(/^error: .* — \[enum\]\s*$/m.test(out), `no 'error: … — [enum]' line: ${out.split('\n').filter((l) => l.trim()).slice(-4).join(' / ')}`);
    },
  },
  {
    id: 'fragment-hook-commands-run-in-place',
    covers: ['I14'],
    fn: async () => {
      const frag = fragment();
      assert(frag.hooks && typeof frag.hooks === 'object', 'settings.fragment.json has no hooks object');
      const events = Object.keys(frag.hooks);
      assert(events.length > 0, 'hooks object is empty');
      for (const event of events) {
        const commands = commandsFor(frag, event);
        assert(commands.length > 0, `hooks.${event} carries no command`);
        for (const c of commands) {
          assertEq(c.type, 'command', `hooks.${event} entry type`);
          const m = HOOK_COMMAND.exec(String(c.command));
          assert(m, `hooks.${event} command is not 'node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/<name>.mjs': ${c.command}`);
          assert(exists(path.join(HOOKS, `${m[1]}.mjs`)), `hooks.${event} names ${m[1]}.mjs, which does not exist under flightcrew/hooks`);
        }
      }
    },
  },
  {
    id: 'fragment-wires-each-hook-to-its-events',
    covers: ['I14'],
    fn: async () => {
      const frag = fragment();
      const names = (event) => commandsFor(frag, event).map((c) => HOOK_COMMAND.exec(String(c.command))?.[1]);
      for (const event of RECORDED_EVENTS) {
        assert(names(event).includes('event-log'), `hooks.${event} does not run event-log.mjs`);
      }
      const pre = commandsFor(frag, 'PreToolUse');
      for (const guard of ['lock-guard', 'boundary-guard']) {
        const entry = pre.find((c) => HOOK_COMMAND.exec(String(c.command))?.[1] === guard);
        assert(entry, `hooks.PreToolUse does not run ${guard}.mjs`);
        for (const tool of ['Edit', 'Write', 'NotebookEdit']) assert(String(entry.matcher ?? '').includes(tool), `${guard} matcher does not match ${tool}: ${entry.matcher}`);
      }
      const post = commandsFor(frag, 'PostToolUse').find((c) => HOOK_COMMAND.exec(String(c.command))?.[1] === 'structural-check');
      assert(post, 'hooks.PostToolUse does not run structural-check.mjs');
      for (const tool of ['Edit', 'Write']) assert(String(post.matcher ?? '').includes(tool), `structural-check matcher does not match ${tool}: ${post.matcher}`);
      assert(names('Stop').includes('stop-gate'), 'hooks.Stop does not run stop-gate.mjs');
      assert(names('SessionEnd').includes('session-end'), 'hooks.SessionEnd does not run session-end.mjs');
      assert(!('WorktreeCreate' in frag.hooks), 'WorktreeCreate must never be hooked');
    },
  },
  {
    id: 'fragment-stop-hook-timeout-600',
    covers: ['I14'],
    fn: async () => {
      const frag = fragment();
      const gate = commandsFor(frag, 'Stop').find((c) => HOOK_COMMAND.exec(String(c.command))?.[1] === 'stop-gate');
      assert(gate, 'hooks.Stop does not run stop-gate.mjs');
      assertEq(gate.timeout, 600, 'stop-gate timeout');
    },
  },
  {
    id: 'fragment-worktree-baseref-head',
    covers: ['I14'],
    fn: async () => {
      const frag = fragment();
      assertEq(frag.worktree?.baseRef, 'head', 'worktree.baseRef');
    },
  },
  {
    id: 'fragment-permissions-allow',
    covers: ['I14'],
    fn: async () => {
      const frag = fragment();
      const allow = frag.permissions?.allow;
      assert(Array.isArray(allow), 'permissions.allow is not an array');
      for (const literal of ALLOW_LITERALS) assert(allow.includes(literal), `permissions.allow lacks ${literal}`);
      const names = crewNames();
      assert(names.length >= 7, `fewer than seven crew files with frontmatter found under flightcrew/crew: ${names.join(', ')}`);
      for (const name of names) assert(allow.includes(`Agent(${name})`), `permissions.allow lacks Agent(${name})`);
    },
  },
  {
    id: 'fragment-permissions-deny-and-sandbox-example',
    covers: ['I14'],
    fn: async () => {
      const frag = fragment();
      const deny = frag.permissions?.deny;
      assert(Array.isArray(deny), 'permissions.deny is not an array');
      for (const literal of DENY_LITERALS) assert(deny.includes(literal), `permissions.deny lacks ${literal}`);
      const sandboxDeny = frag._sandbox_example?.filesystem?.deny;
      assert(Array.isArray(sandboxDeny) && sandboxDeny.length > 0, '_sandbox_example.filesystem.deny is absent or empty');
    },
  },
]);
