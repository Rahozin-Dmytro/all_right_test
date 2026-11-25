import type { Locator, Page } from '@playwright/test';

export interface CustomerInformation {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutInformationPage {
  readonly title: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    const form = page.getByRole('form', { name: 'Checkout information' });
    this.title = page.getByTestId('title');
    this.firstNameInput = form.getByRole('textbox', { name: 'First Name' });
    this.lastNameInput = form.getByRole('textbox', { name: 'Last Name' });
    this.postalCodeInput = form.getByRole('textbox', { name: 'Zip/Postal Code' });
    this.continueButton = form.getByRole('button', { name: 'Continue' });
    this.errorMessage = form.getByRole('alert');
  }

  async fillInformation({ firstName, lastName, postalCode }: CustomerInformation): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }
}
