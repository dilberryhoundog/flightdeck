// flightcrew/workflows/fc-explore.js — fans one explorer agent per open question, each read-only and bounded to its own scope paths, and returns the cited answers.
// Usage: /fc-explore with args { questions: [{id, question, stage, scope_paths}], timestamp?, model? }; it dispatches and returns payloads only — the orchestrator stores each answer with fc return explorer --id X<n>.

export const meta = {
  name: 'fc-explore',
  description: 'Fan one read-only explorer per open question and return the cited answers with their confidence.',
  phases: [
    { title: 'Explore', detail: 'one explorer per question, concurrently' },
  ],
};

const EXPLORER_RETURN = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "flightcrew/schemas/explorer-return.schema.json",
  "title": "Explorer return",
  "description": "launch/<L>/returns/explore-<id>.json: one explorer's answer to one question. id echoes the dispatcher's X<n>. This shape is a declared superset of the shape a spec session dispatches an explorer with, so one schema serves both.",
  "type": "object",
  "required": [
    "id",
    "question",
    "stage",
    "answer",
    "confidence",
    "pointers",
    "candidates"
  ],
  "additionalProperties": false,
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^X[0-9]+$"
    },
    "question": {
      "type": "string",
      "minLength": 1
    },
    "stage": {
      "type": "string",
      "enum": [
        "intent",
        "scope",
        "constraints",
        "interfaces",
        "behaviours",
        "verification",
        "planning"
      ]
    },
    "answer": {
      "type": "string",
      "minLength": 1
    },
    "confidence": {
      "type": "string",
      "enum": [
        "certain",
        "probable",
        "guess"
      ]
    },
    "pointers": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "description": "Files or locations the answer was read from."
    },
    "candidates": {
      "type": "array",
      "description": "Findings the dispatcher may fold into a spec or plan domain.",
      "items": {
        "type": "object",
        "required": [
          "domain",
          "text"
        ],
        "additionalProperties": false,
        "properties": {
          "domain": {
            "type": "string",
            "minLength": 1
          },
          "text": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    }
  }
};

/** Violations of the subset of JSON Schema these return shapes use, as one message per problem. */
function violations(value, node, at = 'value') {
  const out = [];
  if (!node || typeof node !== 'object') return out;
  const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value;
  if (types.length > 0 && !types.some((t) => t === actual || (t === 'number' && actual === 'integer'))) {
    out.push(`${at}: expected ${types.join(' or ')}, got ${actual}`);
    return out;
  }
  if (Array.isArray(node.enum) && !node.enum.some((option) => option === value)) out.push(`${at}: ${JSON.stringify(value)} is outside the enumeration`);
  if (typeof value === 'string') {
    if (node.pattern && !new RegExp(node.pattern).test(value)) out.push(`${at}: does not match ${node.pattern}`);
    if (typeof node.minLength === 'number' && value.length < node.minLength) out.push(`${at}: shorter than ${node.minLength}`);
  }
  if (typeof value === 'number' && typeof node.minimum === 'number' && value < node.minimum) out.push(`${at}: below ${node.minimum}`);
  if (Array.isArray(value) && node.items) value.forEach((item, i) => out.push(...violations(item, node.items, `${at}[${i}]`)));
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of node.required ?? []) if (!Object.prototype.hasOwnProperty.call(value, key)) out.push(`${at}.${key}: required`);
    const properties = node.properties ?? {};
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) out.push(...violations(child, properties[key], `${at}.${key}`));
      else if (node.additionalProperties === false) out.push(`${at}.${key}: not allowed`);
    }
  }
  return out;
}

function explorePrompt(question) {
  const scope = (question.scope_paths ?? []).join(', ') || 'the repository as a whole';
  return [
    `Question ${question.id} · stage ${question.stage}`,
    question.question,
    `Answer this one question and nothing else. Read only; change nothing. Read within: ${scope}.`,
    'Cite the files or locations the answer was read from — an answer without pointers cannot be checked. Say how sure you are: certain when you read it, probable when you inferred it from what you read, guess when you are extrapolating. Anything worth knowing that lies outside the question goes in candidates with the domain it belongs to, not into the answer.',
    `Echo the id ${question.id} and the stage ${question.stage} back in the return.`,
  ].join('\n\n');
}

const questions = Array.isArray(args.questions) ? args.questions : [];

phase('Explore');
log(`${questions.length} question(s): ${questions.map((question) => question.id).join(' ')}`);

const options = (question) => {
  const opts = { label: `${question.id} ${question.stage}`, phase: 'Explore', schema: EXPLORER_RETURN, agentType: 'explorer' };
  if (args.model) opts.model = args.model;
  return opts;
};

const raw = await parallel(questions.map((question) => () => agent(explorePrompt(question), options(question))));

const answers = [];
const rejected = [];
questions.forEach((question, i) => {
  const value = raw[i];
  const problems = value === null || value === undefined ? ['no return arrived'] : violations(value, EXPLORER_RETURN);
  if (problems.length === 0) answers.push(value);
  else rejected.push({ id: question.id, question: question.question, problems });
});

const result = {
  workflow: 'fc-explore',
  timestamp: args.timestamp ?? null,
  asked: questions.length,
  answers,
  rejected,
};

log(`${answers.length} answered, ${rejected.length} rejected`);

export default result;
