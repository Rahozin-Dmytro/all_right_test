import type { Locator, Page } from '@playwright/test';

export class ProductDetailsPage {
  readonly productName: Locator;
  readonly productPrice: Locator;

  constructor(page: Page) {
    const details = page.getByTestId('inventory-item');
    this.productName = details.getByTestId('inventory-item-name');
    this.productPrice = details.getByTestId('inventory-item-price');
  }
}
