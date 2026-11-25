import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly title: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  /** Matches only an enabled button: a missing or disabled button both count as "cannot check out". */
  readonly enabledCheckoutButton: Locator;

  constructor(page: Page) {
    this.title = page.getByTestId('title');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.enabledCheckoutButton = page.getByRole('button', { name: 'Checkout', disabled: false });
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
