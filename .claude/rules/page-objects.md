---
paths:
  - 'src/pages/**/*.ts'
  - 'src/components/**/*.ts'
---

# Page Objects and components

- One class per page/component. Constructor takes `page: Page` (component: root `Locator`).
- Locators are `readonly` fields defined in the constructor — no locator strings inside methods.
- Methods are user actions named by intent (`addToCart(name)`, `login(user)`), return `Promise<void>`, a value, or another page object.
- No `expect` inside (ESLint blocks importing it). Exception: none — expose a locator and assert in the spec.
- Scope locators to the container: `this.root.getByRole(...)`, list items via `filter({ hasText })` instead of `nth()`.
- Shared UI (header, modals) → `src/components`, composed into pages as fields, not inherited.
- No base-class chains. A small `open()` per page using relative URL (`baseURL` comes from config).
- Register every new page object in `src/fixtures/index.ts`.

```ts
export class InventoryPage {
  readonly title: Locator;
  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
  }
  async addToCart(productName: string): Promise<void> {
    await this.productCard(productName).getByRole('button', { name: 'Add to cart' }).click();
  }
  private productCard(productName: string): Locator {
    return this.page.getByTestId('inventory-item').filter({ hasText: productName });
  }
}
```
