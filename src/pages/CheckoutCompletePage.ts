import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';

export class CheckoutCompletePage {
  readonly header: HeaderComponent;
  readonly completeHeader: Locator;

  constructor(page: Page) {
    this.header = new HeaderComponent(page);
    this.completeHeader = page.getByTestId('complete-header');
  }
}
