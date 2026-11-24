#!/usr/bin/env node
// PostToolUse (Write|Edit|MultiEdit): Prettier + ESLint --fix on the edited file.
// Exit 2 → Claude sees remaining lint errors in the same turn and must fix them.
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const filePath = input.tool_input?.file_path;
if (!filePath || !/\.(m|c)?(t|j)s$/.test(filePath)) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const relPath = relative(projectDir, filePath);
if (relPath.startsWith('.claude') || relPath.startsWith('node_modules') || !existsSync(filePath))
  process.exit(0);

const bin = (name) => join(projectDir, 'node_modules', '.bin', name);
if (!existsSync(bin('eslint'))) {
  process.stderr.write('ESLint is not installed (run npm install). Skipping lint hook.\n');
  process.exit(0);
}

if (existsSync(bin('prettier'))) {
  spawnSync(bin('prettier'), ['--write', '--log-level', 'warn', filePath], {
    cwd: projectDir,
    encoding: 'utf8',
  });
}

const lint = spawnSync(bin('eslint'), ['--fix', '--max-warnings', '0', filePath], {
  cwd: projectDir,
  encoding: 'utf8',
});
if (lint.status !== 0) {
  const output = `${lint.stdout}${lint.stderr}`.trim().split('\n').slice(0, 40).join('\n');
  process.stderr.write(`ESLint failed for ${relPath}. Fix these before continuing:\n${output}\n`);
  process.exit(2);
}
process.exit(0);
