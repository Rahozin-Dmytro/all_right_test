# Playwright automation project

UI E2E + API tests on Playwright Test + TypeScript. Never use WebdriverIO syntax here.
Detailed rules load automatically from `.claude/rules/` when you open matching files.
Workflows: skill `new-test` (write a test), skill `fix-flaky-test` (stabilize a test).

## Commands

- `npm test` — all projects · `npm run test:e2e` · `npm run test:api` · `npm run test:smoke`
- `npm run test:new -- <file>` — run a file 3× without retries (proof of stability)
- `npm run check` — lint + typecheck (must be green before you finish)
- `npx playwright test <file> --debug` / `--trace on` · `npm run report`

## Structure

```
src/config/env.ts      single source of env vars (fails fast if missing)
src/fixtures/index.ts  test.extend: page objects, API clients, data — tests import test/expect ONLY from here
src/pages/             one Page Object per page: readonly locators + action methods, no assertions
src/components/        reusable UI parts used by several pages (header, modal, table)
src/api/               API clients over APIRequestContext, typed request/response
src/data/              test data builders (unique per run)
tests/auth.setup.ts    login once → .auth/user.json (storageState)
tests/e2e/<feature>/   UI specs         tests/api/<feature>/   API specs
```

## Golden rules (non-negotiable)

1. Test user-visible behaviour. One test = one behaviour; independent, parallel-safe, any order.
2. Locators: `getByRole` → `getByLabel`/`getByPlaceholder` → `getByTestId` (`data-test`). No XPath, no CSS chains, no `nth()` without reason.
3. Only web-first assertions (`await expect(locator).toBeVisible()`). Never `waitForTimeout`, `networkidle`, `force: true`, `waitForSelector`.
4. Assertions live in specs. Page Objects/clients return data or locators, never assert.
5. Setup and cleanup through API/fixtures, not UI. Data unique per run (`src/data` builders).
6. No `test.only`, no unconditional `test.skip`, no `eslint-disable`, no `@ts-ignore`, no `any`.
7. Every env value comes from `src/config/env.ts`. No secrets or URLs hardcoded.
8. Reuse before creating: search `src/` for an existing page object/helper first.
9. Get locators from the real page via Playwright MCP snapshot — never guess.
10. Flaky test = bug in the test or app. Find the root cause; never raise timeouts or add retries to hide it.

## Canonical examples — copy these patterns

- UI spec with fixtures + steps: `tests/e2e/cart/cart.spec.ts`
- Negative cases / clean session: `tests/e2e/auth/login.spec.ts`
- Page Object: `src/pages/InventoryPage.ts` · Component: `src/components/HeaderComponent.ts`
- API spec with fixture setup/teardown: `tests/api/booking/booking.spec.ts` · client: `src/api/BookingClient.ts`

## Definition of done

1. New/changed tests pass `npm run test:new -- <file>` (3/3).
2. `npm run check` is green.
3. Report: what changed, how to run, assumptions, anything left open.

## Enforced automatically (do not try to bypass)

- PreToolUse hook blocks forbidden patterns (see `.claude/hooks/forbidden-patterns.json`) and asks before editing lint/ts/hook configs.
- PostToolUse hook runs Prettier + ESLint on every edited file — fix every reported error before moving on.
- Stop hook runs `tsc` — you cannot finish with type errors.
  If a rule blocks a legitimate case, stop and explain it to the user instead of working around it.
