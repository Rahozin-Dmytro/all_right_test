# Playwright starter (UI + API)

Playwright Test + TypeScript template with rules for Claude Code that are **enforced**, not just written down.
Examples run against public demo apps: [saucedemo.com](https://www.saucedemo.com) (UI) and [restful-booker](https://restful-booker.herokuapp.com) (API). Replace them with your app.

## Setup

```bash
cp .env.example .env
npm i -D @playwright/test @types/node typescript eslint @eslint/js typescript-eslint \
  eslint-plugin-playwright eslint-config-prettier prettier
npx playwright install chromium
git init && npm run check && npm test
```

## How the rules work (3 layers)

| Layer               | Files                                                            | When it acts                                                                                             |
| ------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Context (short)     | `CLAUDE.md`                                                      | Every session: commands, structure, 10 golden rules, canonical examples                                  |
| Context (on demand) | `.claude/rules/*.md` (path-scoped), `.claude/skills/*`           | Rules load when Claude opens matching files; skills load for "write a test" / "fix flaky test"           |
| Enforcement         | `eslint.config.mjs`, `.claude/settings.json` + `.claude/hooks/*` | Hooks block forbidden patterns before writing, lint every edited file, type-check before Claude finishes |

ESLint also protects you without Claude: run `npm run check` locally or in CI.

## Adapting to a new project

1. Change `.env.example`, `testIdAttribute` in `playwright.config.ts`.
2. Replace page objects/specs, keep the patterns (fixtures, builders, cleanup).
3. Update the "Canonical examples" list in `CLAUDE.md` to point to your real files.
4. Add project-specific forbidden patterns to `.claude/hooks/forbidden-patterns.json`.

## Commands

`npm test` · `npm run test:e2e` · `npm run test:api` · `npm run test:smoke` · `npm run test:new -- <file>` · `npm run check` · `npm run report`
