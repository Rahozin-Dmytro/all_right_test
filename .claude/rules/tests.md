---
paths:
  - 'tests/**/*.ts'
---

# Writing specs

- Import `test`, `expect` only from `src/fixtures`. Get page objects/clients from fixtures, never `new` them in a spec.
- Structure: `test.describe('<Feature>')` → `test('should <result> when <condition>', { tag: ['@smoke'] }, ...)`.
- Tags: `@smoke` (critical path, fast), `@regression`, `@api`. Every test has at least one tag.
- Arrange → Act → Assert. Wrap meaningful user steps in `test.step()` so the report reads like a scenario.
- 1 behaviour per test; several `expect`s are fine if they check the same outcome. No `if`/loops in tests — split into separate tests or use parametrization:
  ```ts
  for (const { user, error } of cases) {
    test(`should show error for ${user}`, async ({ loginPage }) => { ... });
  }
  ```
- Clean session for auth tests: `test.use({ storageState: { cookies: [], origins: [] } })`.
- Wait for network only via `page.waitForResponse()` started BEFORE the action:
  ```ts
  const saved = page.waitForResponse((r) => r.url().includes('/api/orders') && r.ok());
  await checkoutPage.placeOrder();
  await saved;
  ```
- Non-UI polling: `await expect.poll(() => client.getStatus(id)).toBe('done')`.
- Soft assertions (`expect.soft`) only for checking many independent fields of one screen.
- Use `test.fixme()` with a ticket link for known app bugs, never comment tests out.

```ts
// BAD                                          // GOOD
await page.waitForTimeout(2000);
await expect(cart.items).toHaveCount(1);
expect(await btn.isVisible()).toBe(true);
await expect(btn).toBeVisible();
await page.locator('//div[3]/button').click();
await page.getByRole('button', { name: 'Checkout' }).click();
```
