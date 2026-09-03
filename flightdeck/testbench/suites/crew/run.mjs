// testbench/suites/crew/run.mjs — T22 (spec B31, I10): every flightcrew/crew/<role>.md carries the required frontmatter, the maxTurns, isolation, permissionMode and initialPrompt rules hold, read-only roles hold no Write or Edit, the critic mandate is present, and every new role names its inputs.
// Usage: node flightdeck/testbench/suites/crew/run.mjs; exit 0 when every case passes, 2 otherwise. Reads the crew directory only.

import fs from 'node:fs';
import path from 'node:path';
import { suite, CREW, readText, exists, assert, assertEq, assertIncludes } from '../../lib/suite-lib.mjs';
import { parseFrontmatter, toolList } from './frontmatter.mjs';

const EXISTING = ['spec-builder', 'spec-judge', 'spec-attacker'];
const NEW = ['explorer', 'test-builder', 'planner', 'orchestrator', 'implementer', 'verifier', 'critic'];
const ALL = [...EXISTING, ...NEW];
const NO_MAX_TURNS = ['orchestrator', 'spec-builder', 'spec-judge', 'spec-attacker'];
const READ_ONLY = ['explorer', 'verifier', 'critic'];
const INPUTS_SENTENCE = 'Your inputs are only those named in the dispatch';
const FINDING_KINDS = ['correctness-gap', 'scope-violation', 'spec-conflict', 'observation'];

/** The roster the crew section of the design fixes: tools, model and maxTurns per new role. */
const ROSTER = {
  explorer: { tools: ['Read', 'Grep', 'Glob', 'Bash'], model: 'haiku', maxTurns: 12 },
  'test-builder': { tools: ['Read', 'Grep', 'Glob', 'Bash', 'Write', 'Edit'], model: 'opus', maxTurns: 40 },
  planner: { tools: ['Read', 'Grep', 'Glob', 'Bash', 'Agent'], model: 'fable', maxTurns: 30 },
  orchestrator: { tools: ['Read', 'Grep', 'Glob', 'Bash', 'Agent'], model: 'inherit', maxTurns: null },
  implementer: { tools: ['Read', 'Grep', 'Glob', 'Bash', 'Write', 'Edit'], model: 'opus', maxTurns: 25 },
  verifier: { tools: ['Read', 'Grep', 'Glob', 'Bash'], model: 'sonnet', maxTurns: 15 },
  critic: { tools: ['Read', 'Grep', 'Glob', 'Bash'], model: 'fable', maxTurns: 20 },
};

function role(name) {
  const file = path.join(CREW, `${name}.md`);
  assert(exists(file), `crew file exists: flightcrew/crew/${name}.md`);
  const parsed = parseFrontmatter(readText(file));
  assert(parsed, `${name}.md starts with YAML frontmatter`);
  return { name, ...parsed };
}

function crewFiles() {
  return fs.readdirSync(CREW).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
}

function orderedItems(body) {
  return body.split('\n').map((line) => /^\s*\d+[.)]\s+(.*)$/.exec(line)).filter(Boolean).map((m) => m[1].toLowerCase());
}

await suite('crew', [
  {
    id: 'every-crew-file-carries-name-description-tools-model',
    covers: ['I10'],
    fn: () => {
      const files = crewFiles();
      for (const name of ALL) assertIncludes(files, `${name}.md`, 'role file present');
      for (const file of files) {
        const parsed = parseFrontmatter(readText(path.join(CREW, file)));
        assert(parsed, `${file} starts with YAML frontmatter`);
        for (const key of ['name', 'description', 'tools', 'model']) {
          assert(typeof parsed.fields[key] === 'string' && parsed.fields[key].length > 0, `${file} frontmatter has ${key}`);
        }
        assertEq(parsed.fields.name, path.basename(file, '.md'), `${file} frontmatter name equals the file name`);
        assert(toolList(parsed.fields.tools).length > 0, `${file} tools is a non-empty comma list`);
      }
    },
  },
  {
    id: 'max-turns-on-every-role-except-the-four-named',
    covers: ['I10'],
    fn: () => {
      for (const name of ALL) {
        const { fields } = role(name);
        if (NO_MAX_TURNS.includes(name)) {
          assert(!('maxTurns' in fields), `${name} carries no maxTurns`);
        } else {
          assert(/^\d+$/.test(fields.maxTurns ?? '') && Number(fields.maxTurns) > 0, `${name} carries an integer maxTurns (got ${fields.maxTurns})`);
        }
      }
    },
  },
  {
    id: 'implementer-isolation-and-accept-edits',
    covers: ['I10'],
    fn: () => {
      const implementer = role('implementer').fields;
      assertEq(implementer.isolation, 'worktree', 'implementer isolation');
      assertEq(implementer.permissionMode, 'acceptEdits', 'implementer permissionMode');
      const testBuilder = role('test-builder').fields;
      assertEq(testBuilder.permissionMode, 'acceptEdits', 'test-builder permissionMode');
    },
  },
  {
    id: 'orchestrator-initial-prompt-names-launch-status-and-kickoff',
    covers: ['I10', 'B31'],
    fn: () => {
      const { fields } = role('orchestrator');
      assert(typeof fields.initialPrompt === 'string' && fields.initialPrompt.length > 0, 'orchestrator carries initialPrompt');
      assertIncludes(fields.initialPrompt, 'fc launch status', 'initialPrompt names fc launch status');
      assertIncludes(fields.initialPrompt, 'kickoff.md', 'initialPrompt names kickoff.md');
    },
  },
  {
    id: 'new-roles-end-with-a-fenced-json-return-block',
    covers: ['I10'],
    fn: () => {
      for (const name of NEW) {
        const body = role(name).body.trimEnd();
        assert(body.endsWith('```'), `${name} body ends with a closing fence`);
        const opening = body.lastIndexOf('```json');
        assert(opening >= 0, `${name} body has a \`\`\`json fence`);
        const inner = body.slice(opening + '```json'.length, body.length - 3).trim();
        assert(inner.startsWith('{'), `${name} return block is a JSON object`);
        assert(!inner.includes('```'), `${name} json block is the last fenced block`);
      }
    },
  },
  {
    id: 'explorer-verifier-critic-hold-no-write-or-edit',
    covers: ['B31'],
    fn: () => {
      for (const name of READ_ONLY) {
        const tools = toolList(role(name).fields.tools);
        assert(!tools.includes('Write'), `${name} tools exclude Write (got ${tools.join(', ')})`);
        assert(!tools.includes('Edit'), `${name} tools exclude Edit (got ${tools.join(', ')})`);
      }
    },
  },
  {
    id: 'critic-mandate',
    covers: ['B31'],
    fn: () => {
      const body = role('critic').body;
      const lower = body.toLowerCase();
      assertIncludes(lower, 'assume the diff contains at least one gap', 'critic carries the presumption sentence');
      assertIncludes(lower, 'look for it', 'critic presumption tells it to look');
      const items = orderedItems(body);
      const tests = [
        (t) => /behaviou?r/.test(t) && /implement/.test(t),
        (t) => /scope/.test(t),
        (t) => /test/.test(t) && /untouch/.test(t),
        (t) => /error/.test(t) && /suppress/.test(t),
      ];
      let found = false;
      for (let i = 0; i + 3 < items.length && !found; i += 1) {
        found = tests.every((test, k) => test(items[i + k]));
      }
      assert(found, 'critic carries the four-item ordered checklist (behaviours implemented; scope held; tests untouched; errors handled, not suppressed)');
      assertIncludes(lower, 'not style', 'critic bound excludes style');
      assertIncludes(lower, 'not hypothetical robustness', 'critic bound excludes hypothetical robustness');
      assert(/correctness or stated requirements/.test(lower), 'critic bound names correctness or stated requirements');
      for (const kind of FINDING_KINDS) assertIncludes(body, kind, 'critic names every finding kind');
      assertIncludes(body, 'no gaps', 'critic carries the literal exit');
    },
  },
  {
    id: 'new-roles-state-their-inputs-sentence',
    covers: ['B31'],
    fn: () => {
      for (const name of NEW) assertIncludes(role(name).body, INPUTS_SENTENCE, `${name} body carries the inputs sentence`);
    },
  },
  {
    id: 'new-roles-match-the-roster',
    covers: ['B31', 'I10'],
    fn: () => {
      for (const [name, expected] of Object.entries(ROSTER)) {
        const { fields } = role(name);
        assertEq([...toolList(fields.tools)].sort(), [...expected.tools].sort(), `${name} tools`);
        assertEq(fields.model, expected.model, `${name} model`);
        if (expected.maxTurns !== null) assertEq(Number(fields.maxTurns), expected.maxTurns, `${name} maxTurns`);
      }
    },
  },
]);
