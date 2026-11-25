import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';

export type SortOption = 'Name (A to Z)' | 'Name (Z to A)' | 'Price (low to high)' | 'Price (high to low)';

export class InventoryPage {
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly addToCartButtons: Locator;
  readonly sortSelect: Locator;
  readonly activeSortOption: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.productCards = page.getByTestId('inventory-item');
    this.productNames = this.productCards.getByTestId('inventory-item-name');
    this.productPrices = this.productCards.getByTestId('inventory-item-price');
    this.addToCartButtons = this.productCards.getByRole('button', { name: 'Add to cart' });
    this.sortSelect = page.getByRole('combobox', { name: 'Sort products' });
    this.activeSortOption = page.getByTestId('active-option');
  }

  async open(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async openProduct(productName: string): Promise<void> {
    await this.productCard(productName).getByTestId('inventory-item-name').click();
  }

  async addToCart(productName: string): Promise<void> {
    await this.productCard(productName).getByRole('button', { name: 'Add to cart' }).click();
  }

  productPrice(productName: string): Locator {
    return this.productCard(productName).getByTestId('inventory-item-price');
  }

  removeButton(productName: string): Locator {
    return this.productCard(productName).getByRole('button', { name: 'Remove' });
  }

  private productCard(productName: string): Locator {
    return this.productCards.filter({ has: this.page.getByText(productName, { exact: true }) });
  }
}
