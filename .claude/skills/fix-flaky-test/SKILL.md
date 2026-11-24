---
name: fix-flaky-test
description: Use when a Playwright test is flaky, fails only sometimes, only in CI, only in parallel, or times out, and the user wants it stabilized or the root cause found.
---

# Stabilize a flaky Playwright test

Never "fix" by adding `waitForTimeout`, raising timeouts, adding retries, or `force: true`. Find the cause.

1. **Reproduce:** `npx playwright test <file> --repeat-each=20 --retries=0 --workers=4`. Then `--workers=1`. Passing only with 1 worker → shared state between tests.
2. **Read the evidence:** `npx playwright test <file> --trace on`, open `npx playwright show-trace <trace.zip>`. Check the action log, DOM snapshot before/after the failing step and network tab.
3. **Match the root cause:**

| Symptom                               | Typical cause                                                    | Fix                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Element found but click does nothing  | Clicked before hydration/animation finished                      | Assert the state that proves readiness (`toBeEnabled`, content loaded) before acting |
| Strict mode violation / wrong element | Locator matches several elements                                 | Scope to a container, `filter({ hasText })`, exact `name`                            |
| Assertion on old value                | Read value before the update (`textContent()` + `expect(value)`) | Web-first assertion on the locator: `toHaveText`                                     |
| Fails after an action that calls API  | UI asserted before response arrived                              | `waitForResponse` started before the action, or assert final UI state                |
| Fails only in parallel                | Shared user/data, same entity edited by two tests                | Unique data per test via builders, separate accounts per worker                      |
| Fails only in CI                      | Slower machine, different viewport/locale/timezone               | Set `viewport`, `locale`, `timezoneId` in config; assert states, not timings         |
| Fails on second run                   | Data left from previous run                                      | Cleanup in fixture teardown; unique names                                            |

4. **Fix in the right layer:** locator issues → Page Object; data collisions → builders/fixtures; app bug → `test.fixme()` with a ticket and tell the user.
5. **Prove it:** `--repeat-each=20 --workers=4` all green, then `npm run check`.
6. **Report:** root cause in one sentence, what was changed, evidence (20/20).
