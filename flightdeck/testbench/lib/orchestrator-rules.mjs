// testbench/lib/orchestrator-rules.mjs — the readings of an orchestrator session that B21–B24, B62, B63 and E15 turn on, as one analyser a suite can calibrate on a fixture and then apply to a real run.
// Usage: import { readSession, rules } from '../../lib/orchestrator-rules.mjs'; then rules.sequenceInOrder(readSession(file, liftoff)) → { ok, why }.
//
// Each rule takes a session and answers { ok: boolean, why: string }. A rule never throws: an input it cannot read is not ok, with why saying so.
// The rules read only what the spec fixes: the liftoff written to the run, the workflow calls and their order, the human turns between them, the workflow_end events, and the pull request command after fc-report.

import { bashCalls, readTranscript, workflowCalls } from './core-lib.mjs';

/** A session: the turns, the workflow calls, the bash calls, and the liftoff it was handed. */
export function readSession(transcriptFile, liftoff) {
  const turns = readTranscript(transcriptFile);
  return { turns, workflows: workflowCalls(turns), bash: bashCalls(turns), liftoff };
}

const no = (why) => ({ ok: false, why });
const yes = (why = '') => ({ ok: true, why });

export const rules = {
  /** B21: the liftoff reaches the run folder unchanged, and before the first workflow is invoked. */
  liftoffWrittenUnchangedFirst(session) {
    const writes = session.turns
      .map((turn, at) => ({ turn, at }))
      .filter(({ turn }) => turn.kind === 'use' && ['Write', 'Edit'].includes(turn.tool) && /runs\/run-\d+\/liftoff\/[\w.-]+\.json$/.test(String(turn.input.file_path ?? '')));
    if (writes.length === 0) return no('no write of a liftoff file into the run folder');
    const first = writes[0];
    const expected = `${JSON.stringify(session.liftoff, null, 2)}\n`;
    const written = String(first.turn.input.content ?? '');
    if (written.trim() !== expected.trim()) return no('the liftoff written to the run is not the liftoff the human handed over');
    const firstWorkflow = session.workflows[0];
    if (!firstWorkflow) return no('no workflow was invoked at all');
    if (first.at > firstWorkflow.at) return no('the first workflow was invoked before the liftoff was written');
    const name = String(first.turn.input.file_path).split('/').pop().replace(/\.json$/, '');
    if (name !== session.liftoff.name) return no(`the liftoff was written as ${name}, not as ${session.liftoff.name}`);
    return yes();
  },

  /** B22: the workflows invoked are the liftoff's sequence, in its order. */
  sequenceInOrder(session) {
    const wanted = (session.liftoff.sequence ?? []).map((entry) => entry.workflow);
    const got = session.workflows.map((call) => call.name);
    if (got.length !== wanted.length) return no(`the session invoked ${got.join(', ') || 'nothing'}; the liftoff sequence is ${wanted.join(', ')}`);
    for (const [index, name] of wanted.entries()) {
      if (got[index] !== name) return no(`entry ${index + 1} of the sequence is ${name}, and the session invoked ${got[index]}`);
    }
    return yes();
  },

  /** B22: each workflow is called with the entry args the liftoff states for it. */
  entryArgsAsStated(session) {
    for (const [index, entry] of (session.liftoff.sequence ?? []).entries()) {
      const call = session.workflows[index];
      if (!call) return no(`the session never invoked entry ${index + 1}, ${entry.workflow}`);
      const passed = call.args?.entry;
      if (JSON.stringify(passed ?? null) !== JSON.stringify(entry.args ?? null)) {
        return no(`${entry.workflow} was invoked with entry args ${JSON.stringify(passed)}, and the liftoff states ${JSON.stringify(entry.args)}`);
      }
      if (call.args?.liftoff && JSON.stringify(call.args.liftoff) !== JSON.stringify(session.liftoff)) {
        return no(`${entry.workflow} was handed a liftoff that is not the one the human gave`);
      }
    }
    return yes();
  },

  /** B23: every workflow invocation has a human turn between it and the one before. */
  onePerHumanInstruction(session) {
    let previous = -1;
    for (const call of session.workflows) {
      const between = session.turns.slice(previous + 1, call.at).filter((turn) => turn.kind === 'human');
      if (between.length === 0) return no(`${call.name} was invoked with no human turn since the previous invocation`);
      previous = call.at;
    }
    return session.workflows.length === 0 ? no('no workflow was invoked at all') : yes();
  },

  /** B88: a workflow_end event is appended after each workflow returns, naming it. */
  workflowEndAfterEach(session) {
    const appended = session.bash
      .filter(({ command }) => /\bflight\b.*\bevent\b/.test(command) && command.includes('workflow_end'))
      .map(({ command, at }) => ({ at, workflow: (/"workflow"\s*:\s*"([\w-]+)"/.exec(command) ?? [])[1] ?? null }));
    for (const call of session.workflows) {
      const match = appended.find((entry) => entry.workflow === call.name && entry.at > call.at);
      if (!match) return no(`no workflow_end event was appended after ${call.name}`);
    }
    return session.workflows.length === 0 ? no('no workflow was invoked at all') : yes();
  },

  /** B62, B63: after fc-report, a pull request is opened from the run branch and its URL is reported. */
  pullRequestAfterReport(session) {
    const report = session.workflows.find((call) => call.name === 'fc-report');
    if (!report) return no('fc-report was never invoked');
    const pr = session.bash.find(({ command, at }) => at > report.at && /gh\s+pr\s+create/.test(command));
    if (!pr) return no('no pull request was opened after fc-report');
    const outcome = session.turns[pr.at + 1];
    const url = /https:\/\/\S+\/pull\/\d+/.exec(JSON.stringify(outcome?.output ?? ''))?.[0] ?? null;
    if (!url) return no('the pull request command returned no URL');
    const said = session.turns.slice(pr.at).some((turn) => turn.kind === 'say' && turn.text.includes(url));
    return said ? yes() : no('the pull request URL was never reported to the human');
  },

  /** E15: when the pull request cannot be opened, the failure and the run branch are reported and nothing is opened. */
  pullRequestFailureReported(session) {
    const report = session.workflows.find((call) => call.name === 'fc-report');
    if (!report) return no('fc-report was never invoked');
    const pr = session.bash.find(({ command, at }) => at > report.at && /gh\s+pr\s+create/.test(command));
    if (!pr) return no('no pull request was attempted');
    const outcome = session.turns[pr.at + 1];
    const failed = JSON.stringify(outcome?.output ?? '').includes('"exit":1') || /fatal|error/i.test(JSON.stringify(outcome?.output ?? ''));
    if (!failed) return no('the pull request command did not fail, so this is not the E15 case');
    const after = session.turns.slice(pr.at).filter((turn) => turn.kind === 'say').map((turn) => turn.text).join('\n');
    if (!/run\/[\w-]+-\d+/.test(after)) return no('the run branch name was not reported');
    if (!/could not|failed|fatal/i.test(after)) return no('the failure itself was not reported');
    return yes();
  },
};

/** Every rule that must hold of an obedient session, by the id it is named for. */
export const REQUIRED = {
  B21: rules.liftoffWrittenUnchangedFirst,
  B22: rules.sequenceInOrder,
  'B22 args': rules.entryArgsAsStated,
  B23: rules.onePerHumanInstruction,
  B88: rules.workflowEndAfterEach,
  'B62/B63': rules.pullRequestAfterReport,
};
