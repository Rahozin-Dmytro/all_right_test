import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';

export class ProductDetailsPage {
  readonly header: HeaderComponent;
  readonly productName: Locator;
  readonly productPrice: Locator;
  /** Matches only an enabled button: a missing or disabled button both count as "cannot add". */
  readonly enabledAddToCartButton: Locator;

  constructor(private readonly page: Page) {
    const details = page.getByTestId('inventory-item');
    this.header = new HeaderComponent(page);
    this.productName = details.getByTestId('inventory-item-name');
    this.productPrice = details.getByTestId('inventory-item-price');
    this.enabledAddToCartButton = details.getByRole('button', { name: 'Add to cart', disabled: false });
  }

  async open(productId: number): Promise<void> {
    await this.page.goto(`/inventory-item.html?id=${productId}`);
  }
}
