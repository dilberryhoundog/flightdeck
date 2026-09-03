// flightcrew/bin/cmd/distribute.mjs — copies the two distributable parts of flightcrew into a project's .claude directory: the crew definitions and the workflow scripts, never a hook, and prints the settings fragment the harness still needs by hand.
// Usage: fc distribute [--target <dir>] [--apply] [--force]; exit 0 when the plan was printed or applied, 1 on a usage error, 2 when a target file differs and --force was not passed.

import fs from 'node:fs';
import path from 'node:path';
import { EXIT, fail, print } from '../../checks/lib/output.mjs';

export const help = [
  'fc distribute                      list what would be copied into <root>/.claude',
  'fc distribute --target <dir>       list what would be copied into another directory',
  'fc distribute --apply [--force]    copy the crew and the workflows, then print the settings fragment',
].join('\n');

/** distribute acts on the installation, not on a run, so it never resolves a launch. */
export const needsLaunch = false;

function parse(args) {
  const flags = { target: null, apply: false, force: false };
  for (let i = 0; i < args.length; i += 1) {
    const item = String(args[i]);
    if (item === '--apply') flags.apply = true;
    else if (item === '--force') flags.force = true;
    else if (item === '--target') {
      i += 1;
      if (i >= args.length) throw new Error('fc distribute: --target needs a directory');
      flags.target = String(args[i]);
    } else if (item.startsWith('--target=')) flags.target = item.slice('--target='.length);
    else throw new Error(`fc distribute: unexpected argument ${item}`);
  }
  return flags;
}

function listing(dir, filter) {
  try {
    return fs.readdirSync(dir).filter(filter).sort();
  } catch {
    return [];
  }
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

/**
 * The copies a distribution makes: every crew file that carries frontmatter (a file without it is documentation, not
 * an agent) and every workflow script. Hooks are never copied — they run in place from flightcrew/hooks/.
 */
export function plannedCopies(fd, target) {
  const copies = [];
  for (const name of listing(fd.crew, (n) => n.endsWith('.md'))) {
    const from = path.join(fd.crew, name);
    const text = readText(from);
    if (text === null || !text.startsWith('---')) continue;
    copies.push({ from, to: path.join(target, 'agents', 'flightcrew', name), rel: `agents/flightcrew/${name}` });
  }
  for (const name of listing(fd.workflows, (n) => n.endsWith('.js'))) {
    copies.push({ from: path.join(fd.workflows, name), to: path.join(target, 'workflows', name), rel: `workflows/${name}` });
  }
  return copies;
}

/** The copies whose target file exists with different content: applying over one of these loses a local change. */
function conflictsIn(copies) {
  return copies.filter((copy) => {
    const there = readText(copy.to);
    return there !== null && there !== readText(copy.from);
  });
}

/** The settings fragment as it should be pasted, with the leading `node` of every hook command made absolute. */
function fragmentText(fd, node) {
  const file = path.join(fd.hooks, 'settings.fragment.json');
  const text = readText(file);
  if (text === null) return null;
  let fragment;
  try {
    fragment = JSON.parse(text);
  } catch {
    return null;
  }
  for (const entries of Object.values(fragment.hooks ?? {})) {
    for (const entry of Array.isArray(entries) ? entries : []) {
      for (const hook of Array.isArray(entry.hooks) ? entry.hooks : []) {
        if (typeof hook.command === 'string') hook.command = hook.command.replace(/^node(?=\s)/, node);
      }
    }
  }
  return JSON.stringify(fragment, null, 2);
}

export async function run(args, ctx) {
  let flags;
  try {
    flags = parse(args);
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  const fd = ctx.fd;
  const target = flags.target
    ? path.resolve(ctx.cwd ?? process.cwd(), flags.target)
    : path.join(ctx.root, '.claude');
  const copies = plannedCopies(fd, target);
  if (copies.length === 0) {
    fail('nothing to distribute: flightcrew/crew/ carries no agent file and flightcrew/workflows/ no script');
    return EXIT.usage;
  }

  if (!flags.apply) {
    print(`would copy ${copies.length} files into ${target} (no hook is ever copied):`);
    for (const copy of copies) print(`  ${path.relative(fd.fd, copy.from)} -> ${copy.rel}`);
    print('run again with --apply to copy them.');
    return EXIT.ok;
  }

  const conflicts = conflictsIn(copies);
  if (conflicts.length > 0 && !flags.force) {
    fail(['these target files differ from the source and were left alone; pass --force to overwrite:', ...conflicts.map((copy) => `  ${copy.rel}`)]);
    return EXIT.blocked;
  }
  for (const copy of copies) {
    fs.mkdirSync(path.dirname(copy.to), { recursive: true });
    fs.copyFileSync(copy.from, copy.to);
  }
  print(`copied ${copies.length} files into ${target}`);
  for (const copy of copies) print(`  ${copy.rel}`);

  const fragment = fragmentText(fd, process.execPath);
  print('');
  print('add to <target>/settings.json by hand, appending to any hooks and permissions already there:');
  print(fragment ?? '(flightcrew/hooks/settings.fragment.json is missing or unreadable)');
  print('');
  print('add to .gitignore:');
  print('.claude/worktrees/');
  const constitution = readText(path.join(fd.templates, 'constitution-fragment.md'));
  print('');
  print('add to the project instructions:');
  print(constitution === null ? '(flightcrew/templates/constitution-fragment.md is missing)' : constitution.replace(/\n+$/, ''));
  return EXIT.ok;
}
