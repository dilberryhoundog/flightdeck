#!/usr/bin/env node
// suites/workflows-contract — the contract every workflow of I14 keeps: the entry args it takes, the result object it returns, the point after which it dispatches nothing, and the refusal when its args do not hold. Covers B25, B26, E14, E19, I14.
import path from 'node:path';
import { CORE_WORKFLOWS, RUN_SCHEMAS, SAMPLE_LAUNCH, WORKFLOW_NAMES, assert, assertEq, exists, listFiles, readJson, suite, validateAgainst } from '../../lib/core-lib.mjs';
import { adversaryReturn, commandOf, crew, runWorkflow, runWorkflowStrict, unitOf, workerReturn } from '../../lib/workflow-stub.mjs';

const LIFTOFF = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'liftoff', 'sample.json'));
const PLAN = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'plan.json'));
const MAP = readJson(path.join(SAMPLE_LAUNCH, 'specs', 'tests-map.v1.json'));

/** The entry args I14 states for each workflow. */
const ENTRY = {
  'fc-plan-feature': { questions: ['how?'] },
  'fc-plan-migration': { questions: ['how?'] },
  'fc-plan-audit': { questions: ['how?'] },
  'fc-plan-agent': { questions: ['how?'] },
  'fc-contracts': {},
  'fc-build': { standalone: true, waves: null, session: null },
  'fc-verify': {},
  'fc-review': { passes: 1 },
  'fc-report': {},
};

/** The keys I14 states for each workflow's result. */
const RESULT_KEYS = {
  'fc-plan-feature': ['plan', 'explorers', 'halt'],
  'fc-plan-migration': ['plan', 'explorers', 'halt'],
  'fc-plan-audit': ['plan', 'explorers', 'halt'],
  'fc-plan-agent': ['plan', 'explorers', 'halt'],
  'fc-contracts': ['unit', 'green', 'halt'],
  'fc-build': ['units', 'verify', 'review', 'stopped'],
  'fc-verify': ['green', 'refuted', 'failing'],
  'fc-review': ['passes', 'open', 'resolved'],
  'fc-report': ['report', 'log_entry', 'worktrees_removed', 'error'],
};

/** The agent type each workflow's last dispatch belongs to, as I14 names its end. */
const ENDS_WITH = {
  'fc-plan-feature': 'steward',
  'fc-plan-migration': 'steward',
  'fc-plan-audit': 'steward',
  'fc-plan-agent': 'steward',
  'fc-contracts': 'interface-builder',
  'fc-verify': 'verifier',
  'fc-review': 'critic',
  'fc-report': 'steward',
};

const WORLD = {
  plan: PLAN,
  map: MAP,
  adversary: (unit) => adversaryReturn(unit, false),
  returns: {
    explorer: { id: 'X1', question: 'how?', stage: 'plan', answer: 'so', confidence: 'high', pointers: [], candidates: [] },
    planner: { target: 'plan', fix: null, plan: { ...PLAN, status: 'draft' } },
    'interface-builder': { target: 'U0', fix: null, ...workerReturn('U0', 'green') },
    implementer: (unit, n, spec) => workerReturn(unitOf(spec) ?? 'U1', 'green'),
    'strong-worker': (unit, n, spec) => workerReturn(unitOf(spec) ?? 'U1', 'green'),
    judge: (unit, n, spec) => ({ target: spec.target ?? 'T5', fix: null, rubric: 'r', subject: 's', answers: [{ question: 'q', answer: 'yes', quote: 'x' }], verdict: 'pass' }),
    verifier: { refuted: false, checks_rerun: [{ id: 'T1', verdict: 'pass' }], reasons: [], unverified: [], test_file_changes: [], outside_boundary: [] },
    critic: { verdict: 'pass', pass: 1, findings: [] },
    scribe: { target: 'report', fix: null, report: 'report.json', log_entry: '## entry', assembled: true, missing: [] },
  },
};

const args = (name, entry) => ({ launch: 'sample-core', run: 1, liftoff: LIFTOFF, entry: entry ?? ENTRY[name] });
const invoke = (name, entry) => runWorkflowStrict(name, args(name, entry), { agents: crew(WORLD), workflows: { 'fc-verify': { green: true, refuted: false, failing: [] }, 'fc-review': { passes: 1, open: [], resolved: [] } } });

await suite('workflows-contract', [
  {
    id: 'I14 the suite holds one script per workflow I14 names and nothing else',
    covers: ['I14'],
    fn: () => {
      assert(exists(CORE_WORKFLOWS), 'flightdeck/flightcrew/workflows/ exists');
      const found = listFiles(CORE_WORKFLOWS).filter((name) => name.endsWith('.js')).map((name) => name.replace(/\.js$/, '')).sort();
      assertEq(found, [...WORKFLOW_NAMES].sort(), 'the workflow suite is exactly the nine I14 names');
    },
  },
  {
    id: 'B25 every workflow, given its I14 args, returns the result object for its name',
    covers: ['B25', 'I14'],
    fn: async () => {
      for (const name of WORKFLOW_NAMES) {
        const run = await invoke(name);
        assertEq(run.error, null, `${name} ran: ${run.error?.message ?? ''}`);
        assert(run.result !== null && typeof run.result === 'object', `${name} returned an object`);
        assertEq(Object.keys(run.result).sort(), [...RESULT_KEYS[name]].sort(), `${name}: the result keys of I14`);
      }
    },
  },
  {
    id: 'B26 no workflow dispatches after the point I14 names as its end',
    covers: ['B26'],
    fn: async () => {
      for (const [name, ending] of Object.entries(ENDS_WITH)) {
        const run = await invoke(name);
        const types = run.agents.map((call) => call.spec.agentType ?? call.spec.type);
        assert(types.length > 0, `${name} dispatched something`);
        assertEq(types.at(-1), ending, `${name} ends on the ${ending}, and its last dispatch was a ${types.at(-1)}`);
      }
    },
  },
  {
    id: 'B26 fc-build dispatches nothing after its last merge when it runs standalone',
    covers: ['B26'],
    fn: async () => {
      const run = await invoke('fc-build', { standalone: true, waves: null, session: null });
      const lastMerge = run.agents.findLastIndex((call) => /merge/.test(commandOf(call.spec)));
      assert(lastMerge !== -1, 'something was merged');
      assertEq(run.agents.slice(lastMerge + 1).map((call) => call.spec.agentType ?? call.spec.type), [], 'nothing is dispatched after the last merge');
    },
  },
  {
    id: 'E14 args failing the workflow-s schema are refused, and nothing is dispatched',
    covers: ['E14'],
    fn: async () => {
      const bad = [
        { launch: 'sample-core', run: 1, liftoff: LIFTOFF },
        { launch: 'sample-core', run: 'one', liftoff: LIFTOFF, entry: {} },
        { run: 1, liftoff: LIFTOFF, entry: {} },
        { launch: 'sample-core', run: 1, liftoff: { name: 'broken', task: 'refactor' }, entry: {} },
      ];
      for (const name of WORKFLOW_NAMES) {
        for (const [index, argument] of bad.entries()) {
          const run = await runWorkflowStrict(name, argument, { agents: crew(WORLD), workflows: {} });
          assertEq(typeof run.result?.refused, 'string', `${name} refuses bad args ${index + 1}, got ${JSON.stringify(run.result)}`);
          assertEq(run.calls.length, 0, `${name} dispatches nothing on bad args ${index + 1}`);
        }
      }
    },
  },
  {
    id: 'E14 entry args of the wrong shape for the workflow are refused too',
    covers: ['E14', 'I14'],
    fn: async () => {
      const wrong = {
        'fc-plan-feature': { questions: 'not a list' },
        'fc-build': { standalone: 'yes', waves: null, session: null },
        'fc-review': { passes: 'two' },
      };
      for (const [name, entry] of Object.entries(wrong)) {
        const run = await invoke(name, entry);
        assertEq(typeof run.result?.refused, 'string', `${name} refuses entry args of the wrong shape, got ${JSON.stringify(run.result)}`);
        assertEq(run.calls.length, 0, `${name} dispatches nothing`);
      }
    },
  },
  {
    id: 'E19 fc-build with the plan absent or draft is refused',
    covers: ['E19'],
    fn: async () => {
      const drafted = { ...PLAN, status: 'draft' };
      delete drafted.commit;
      for (const plan of [null, drafted]) {
        const run = await runWorkflowStrict('fc-build', args('fc-build'), { agents: crew({ ...WORLD, plan }), workflows: {} });
        assertEq(typeof run.result?.refused, 'string', `fc-build refuses a ${plan === null ? 'missing' : 'draft'} plan, got ${JSON.stringify(run.result)}`);
        const workers = run.agents.filter((call) => ['implementer', 'strong-worker'].includes(call.spec.agentType ?? call.spec.type));
        assertEq(workers.length, 0, 'no worker is dispatched');
      }
    },
  },
  {
    id: 'I14 the library ships at least three liftoffs and each one validates',
    covers: ['I14'],
    fn: () => {
      const schema = readJson(path.join(RUN_SCHEMAS, 'liftoff.schema.json'));
      const dir = path.join(CORE_WORKFLOWS, '..', 'liftoffs');
      const names = exists(dir) ? listFiles(dir).filter((name) => name.endsWith('.json')) : [];
      assert(names.length >= 3, `the library ships at least three liftoffs, found ${names.length}`);
      for (const name of names) {
        assertEq(validateAgainst(schema, readJson(path.join(dir, name))), [], `${name} against liftoff.schema.json`);
      }
    },
  },
]);
