import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';

export class InventoryPage {
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly productCards: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.productCards = page.getByTestId('inventory-item');
  }

  async open(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  async addToCart(productName: string): Promise<void> {
    await this.productCard(productName).getByRole('button', { name: 'Add to cart' }).click();
  }

  removeButton(productName: string): Locator {
    return this.productCard(productName).getByRole('button', { name: 'Remove' });
  }

  private productCard(productName: string): Locator {
    return this.productCards.filter({ has: this.page.getByText(productName, { exact: true }) });
  }
}
