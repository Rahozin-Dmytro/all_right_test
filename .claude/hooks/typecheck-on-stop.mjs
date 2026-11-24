#!/usr/bin/env node
// Stop: runs `tsc --noEmit` when TypeScript files changed. Exit 2 → Claude cannot finish with type errors.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
if (input.stop_hook_active) process.exit(0); // already continuing because of this hook — avoid loops

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const tsc = join(projectDir, 'node_modules', '.bin', 'tsc');
if (!existsSync(tsc)) process.exit(0);

const git = spawnSync('git', ['status', '--porcelain'], { cwd: projectDir, encoding: 'utf8' });
if (git.status === 0 && !/\.(m|c)?ts$/m.test(git.stdout)) process.exit(0); // no TS changes

const result = spawnSync(tsc, ['--noEmit', '-p', 'tsconfig.json'], { cwd: projectDir, encoding: 'utf8' });
if (result.status !== 0) {
  const output = `${result.stdout}${result.stderr}`.trim().split('\n').slice(0, 40).join('\n');
  process.stderr.write(`Type check failed. Fix these errors before finishing:\n${output}\n`);
  process.exit(2);
}
process.exit(0);
