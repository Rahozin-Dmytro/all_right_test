import type { Locator, Page } from '@playwright/test';

export class CheckoutOverviewPage {
  readonly title: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    const items = page.getByTestId('cart-list').getByTestId('inventory-item');
    this.title = page.getByTestId('title');
    this.itemNames = items.getByTestId('inventory-item-name');
    this.itemPrices = items.getByTestId('inventory-item-price');
    this.itemTotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
