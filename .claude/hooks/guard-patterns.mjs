#!/usr/bin/env node
// PreToolUse (Write|Edit|MultiEdit): blocks forbidden code patterns, asks before touching protected configs.
// Config: .claude/hooks/forbidden-patterns.json
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const hookDir = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(hookDir, 'forbidden-patterns.json'), 'utf8'));

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const toolInput = input.tool_input ?? {};
const filePath = toolInput.file_path;
if (!filePath) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const relPath = relative(projectDir, filePath).split('\\').join('/');

const isProtected = config.protectedFiles.some((p) =>
  p.endsWith('/') ? relPath.startsWith(p) : relPath === p,
);
if (isProtected) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `${relPath} is a protected quality config. Explain to the user why it must change.`,
      },
    }),
  );
  process.exit(0);
}

const isCode = config.codeExtensions.some((ext) => relPath.endsWith(ext));
const isIgnored = config.ignoreDirs.some((dir) => relPath.startsWith(dir));
if (!isCode || isIgnored) process.exit(0);

const newText = [toolInput.content, toolInput.new_string, ...(toolInput.edits ?? []).map((e) => e.new_string)]
  .filter((t) => typeof t === 'string')
  .join('\n');

const violations = config.patterns.filter(({ regex }) => new RegExp(regex).test(newText));
if (violations.length > 0) {
  const details = violations.map((v) => `- /${v.regex}/: ${v.message}`).join('\n');
  process.stderr.write(`Blocked edit of ${relPath}. Project rules forbid:\n${details}\n`);
  process.exit(2);
}
process.exit(0);
