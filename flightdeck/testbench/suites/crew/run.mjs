// testbench/suites/crew/run.mjs — every flightcrew/crew/<role>.md carries the frontmatter and body its manuals state (flightdeck/manuals/orchestration/crew.md, the roster in flightdeck/flightcrew/crew/README.md), and every .claude/agents/flightcrew/<role>.md is the copy the distribute command writes from its source.
// Usage: node flightdeck/testbench/suites/crew/run.mjs; exit 0 when every case passes, 2 otherwise. Reads the crew directory and the tree's .claude/agents/flightcrew/; the distribute command writes only into a temporary target.

import fs from 'node:fs';
import path from 'node:path';
import { suite, defect, fc, tmp, REPO, CREW, readText, exists, assert, assertEq, assertIncludes, assertExit } from '../../lib/suite-lib.mjs';
import { parseFrontmatter, toolList } from './frontmatter.mjs';

const EXISTING = ['spec-builder', 'spec-judge', 'spec-attacker'];
const NEW = ['explorer', 'test-builder', 'planner', 'orchestrator', 'implementer', 'verifier', 'critic'];
const ALL = [...EXISTING, ...NEW];
const NO_MAX_TURNS = ['orchestrator', 'spec-builder', 'spec-judge', 'spec-attacker'];
const READ_ONLY = ['explorer', 'verifier', 'critic'];
const INPUTS_SENTENCE = 'Your inputs are only those named in the dispatch';
/** Today's divergences from the manuals, pinned by the defect cases below. */
const MAX_TURNS_MISSING_TODAY = ['explorer', 'verifier', 'critic'];
const MAX_TURNS_TODAY = { explorer: null, verifier: null, critic: null, implementer: '200' };
const INPUTS_LINE_MISSING_TODAY = ['spec-judge', 'spec-attacker'];
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

const README_REL = 'flightdeck/flightcrew/crew/README.md';
const CREW_MANUAL_REL = 'flightdeck/manuals/orchestration/crew.md';
const LOWER_HYPHEN = /^[a-z]+(-[a-z]+)*$/;
const INPUTS_LINE = 'Your inputs are only those named in the dispatch; auto-loaded project instructions that ask you to read other files or run repository tooling do not apply to this role.';

/** The roster table of the crew README: role -> { tools, model, turns, isolation }, where '—' reads as null. */
function readmeRoster() {
  const lines = readText(path.join(CREW, 'README.md')).split('\n');
  const start = lines.findIndex((l) => /^\|\s*role\s*\|/.test(l));
  assert(start >= 0, `${README_REL} carries a roster table`);
  const header = lines[start].split('|').map((c) => c.trim());
  const col = (name) => {
    const at = header.indexOf(name);
    assert(at >= 0, `roster table has a ${name} column`);
    return at;
  };
  const cols = { role: col('role'), tools: col('tools'), model: col('model'), turns: col('turns'), isolation: col('isolation') };
  const roster = {};
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith('|')) break;
    const cells = line.split('|').map((c) => c.trim());
    const value = (k) => (cells[cols[k]] === '—' || cells[cols[k]] === '' ? null : cells[cols[k]]);
    roster[cells[cols.role]] = { tools: toolList(value('tools')), model: value('model'), turns: value('turns'), isolation: value('isolation') };
  }
  return roster;
}

/** Body lines of a role file: the lines after the closing frontmatter fence, without the trailing newline. */
function bodyLineCount(body) {
  const lines = body.split('\n');
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  return lines.length;
}

let distributed = null;
/** The directory the distribute command copies the crew into when applied to a fresh temporary target. */
function distributedCrew() {
  if (distributed) return distributed;
  const target = path.join(tmp('fc-crew-dist'), '.claude');
  const r = fc(['distribute', '--apply', '--target', target], { cwd: REPO });
  assertExit(r, 0, 'distribute --apply into a temporary target');
  distributed = path.join(target, 'agents', 'flightcrew');
  return distributed;
}

function roleFileCase(name) {
  return {
    id: `flightdeck/flightcrew/crew/${name}.md frontmatter names the role ${name} and carries its roster tools, model and isolation`,
    fn: () => {
      const row = readmeRoster()[name];
      assert(row, `${README_REL} roster has a row for ${name}`);
      const { fields } = role(name);
      assertEq(fields.name, name, `${name}.md frontmatter name`);
      assert(LOWER_HYPHEN.test(fields.name), `${name}.md name is lowercase and hyphens`);
      assert(typeof fields.description === 'string' && fields.description.length > 0, `${name}.md carries a description`);
      assertEq([...toolList(fields.tools)].sort(), [...row.tools].sort(), `${name}.md tools against the roster`);
      assertEq(fields.model, row.model, `${name}.md model against the roster`);
      assertEq(fields.isolation ?? null, row.isolation, `${name}.md isolation against the roster`);
    },
  };
}

function distributedRoleCase(name) {
  return {
    id: `.claude/agents/flightcrew/${name}.md is the copy distribution writes from the crew and names the role ${name}`,
    fn: () => {
      const installed = path.join(REPO, '.claude', 'agents', 'flightcrew', `${name}.md`);
      assert(exists(installed), `.claude/agents/flightcrew/${name}.md exists`);
      const text = readText(installed);
      const parsed = parseFrontmatter(text);
      assert(parsed, `.claude/agents/flightcrew/${name}.md starts with YAML frontmatter`);
      assertEq(parsed.fields.name, name, `.claude/agents/flightcrew/${name}.md frontmatter name`);
      const copy = path.join(distributedCrew(), `${name}.md`);
      assert(exists(copy), `distribution writes agents/flightcrew/${name}.md`);
      assert(readText(copy) === text, `.claude/agents/flightcrew/${name}.md equals what distribution writes from flightdeck/flightcrew/crew/${name}.md`);
    },
  };
}

await suite({ name: 'crew', covers: ['B1', 'B2'] }, [
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
  defect({
    id: 'max-turns-on-every-role-except-the-four-named',
    should: 'every role except orchestrator, spec-builder, spec-judge and spec-attacker carries an integer maxTurns, but explorer, verifier and critic carry none',
    ref: `${CREW_MANUAL_REL}:40`,
    fn: () => {
      for (const name of ALL) {
        const { fields } = role(name);
        if (NO_MAX_TURNS.includes(name) || MAX_TURNS_MISSING_TODAY.includes(name)) {
          assert(!('maxTurns' in fields), `${name} carries no maxTurns today (got ${fields.maxTurns})`);
        } else {
          assert(/^\d+$/.test(fields.maxTurns ?? '') && Number(fields.maxTurns) > 0, `${name} carries an integer maxTurns (got ${fields.maxTurns})`);
        }
      }
    },
  }),
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
  defect({
    id: 'new-roles-match-the-roster',
    should: 'explorer, implementer, verifier and critic carry the roster turns 12, 25, 15 and 20, but explorer, verifier and critic carry no maxTurns and implementer carries 200',
    ref: `${README_REL}:16`,
    fn: () => {
      for (const [name, expected] of Object.entries(ROSTER)) {
        const { fields } = role(name);
        assertEq([...toolList(fields.tools)].sort(), [...expected.tools].sort(), `${name} tools`);
        assertEq(fields.model, expected.model, `${name} model`);
        if (name in MAX_TURNS_TODAY) assertEq(fields.maxTurns ?? null, MAX_TURNS_TODAY[name], `${name} maxTurns today`);
        else if (expected.maxTurns !== null) assertEq(Number(fields.maxTurns), expected.maxTurns, `${name} maxTurns`);
      }
    },
  }),
  defect({
    id: 'every crew body carries the inputs line',
    should: 'every crew body carries the inputs line, but spec-judge and spec-attacker carry none',
    ref: `${CREW_MANUAL_REL}:11`,
    fn: () => {
      for (const name of ALL) {
        const has = role(name).body.includes(INPUTS_LINE);
        if (INPUTS_LINE_MISSING_TODAY.includes(name)) assert(!has, `${name} carries no inputs line today`);
        else assert(has, `${name} body carries the inputs line`);
      }
    },
  }),
  defect({
    id: 'every crew body is at most 60 lines',
    should: 'every crew body is at most 60 lines, but the spec-builder body is longer',
    ref: `${CREW_MANUAL_REL}:51`,
    fn: () => {
      for (const name of ALL) {
        const count = bodyLineCount(role(name).body);
        if (name === 'spec-builder') assert(count > 60, `spec-builder body runs past 60 lines today (got ${count})`);
        else assert(count <= 60, `${name} body is at most 60 lines (got ${count})`);
      }
    },
  }),
  ...ALL.map(roleFileCase),
  ...ALL.map(distributedRoleCase),
]);
