---
name: new-test
description: Use when asked to write, add or automate a UI or API test, cover a scenario/feature/bug with tests, or extend an existing spec in this Playwright project.
---

# Write a new Playwright test

Follow the steps in order. Do not skip step 1–2 even for "small" tests.

1. **Clarify the scenario.** State in one line: preconditions → action → expected result, and which tags. If the expected result is unknown, ask the user.
2. **Reuse first.** Search `src/pages`, `src/components`, `src/api`, `src/data`, `src/fixtures/index.ts` for what already exists. Extend existing classes instead of creating parallel ones.
3. **Explore the real app** (UI tests): open the page with Playwright MCP (`browser_navigate`, `browser_snapshot`). Take role/name/test-id from the accessibility snapshot. Note dynamic parts (spinners, toasts, async lists) — they need web-first assertions.
4. **Page Object / client.** Add locators as `readonly` fields and intent-named methods. Register new classes in fixtures. Follow `src/pages/InventoryPage.ts` / `src/api/BookingClient.ts`.
5. **Spec.** Put it in `tests/e2e/<feature>/` or `tests/api/<feature>/`. Copy the shape of `tests/e2e/cart/cart.spec.ts` or `tests/api/booking/booking.spec.ts`. Data from `src/data` builders; setup/cleanup through fixtures/API.
6. **Prove stability:** `npm run test:new -- <file>` must pass 3/3. On failure open the trace (`npx playwright show-trace test-results/**/trace.zip`) and fix the cause — see skill `fix-flaky-test`.
7. **Quality gate:** `npm run check`.
8. **Report** in 3–5 lines: files added/changed, scenario covered, run command, assumptions/open questions (e.g. missing test ids → propose adding `data-test` to the app).

## Checklist before reporting

- [ ] Test name says behaviour: `should <result> when <condition>`
- [ ] Has tag(s), no `test.only`, no unconditional skip
- [ ] No raw locators in the spec, no XPath, no `nth()` without reason
- [ ] Only web-first assertions, no fixed waits
- [ ] Independent: passes alone and in parallel, creates and cleans its own data
