import type { Locator } from '@playwright/test';

/** Top bar shared by every page after login; the owning page passes its root (`primary-header`). */
export class HeaderComponent {
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(root: Locator) {
    this.cartBadge = root.getByTestId('shopping-cart-badge');
    this.cartLink = root.getByTestId('shopping-cart-link');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
