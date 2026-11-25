import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';

/**
 * The details page reuses the catalog card test ids (`inventory-item`, `inventory-item-name`), so right after
 * in-app navigation these locators still match the catalog. Wait for `backButton` — it exists only here.
 */
export class ProductDetailsPage {
  readonly header: HeaderComponent;
  readonly backButton: Locator;
  readonly productName: Locator;
  readonly productPrice: Locator;
  /** Matches only an enabled button: a missing or disabled button both count as "cannot add". */
  readonly enabledAddToCartButton: Locator;

  constructor(private readonly page: Page) {
    const details = page.getByTestId('inventory-item');
    this.header = new HeaderComponent(page.getByTestId('primary-header'));
    this.backButton = page.getByRole('button', { name: 'Back to products' });
    this.productName = details.getByTestId('inventory-item-name');
    this.productPrice = details.getByTestId('inventory-item-price');
    this.enabledAddToCartButton = details.getByRole('button', { name: 'Add to cart', disabled: false });
  }

  async open(productId: number): Promise<void> {
    await this.page.goto(`/inventory-item.html?id=${productId}`);
  }
}
