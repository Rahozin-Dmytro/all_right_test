import { expect, test } from '../../../src/fixtures';

const BACKPACK = 'Sauce Labs Backpack';

test.describe('Checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test(
    'should show first name error when information form is submitted empty',
    { tag: ['@regression'] },
    async ({ inventoryPage, cartPage, checkoutInformationPage, page }) => {
      await test.step('Add product and open checkout', async () => {
        await inventoryPage.addToCart(BACKPACK);
        await inventoryPage.header.openCart();
        await cartPage.checkout();
        await expect(checkoutInformationPage.title).toHaveText('Checkout: Your Information');
      });

      await test.step('Submit empty information form', async () => {
        await checkoutInformationPage.continue();
      });

      await test.step('Verify validation error', async () => {
        await expect(checkoutInformationPage.errorMessage).toHaveText('Error: First Name is required');
        await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
      });
    },
  );
});
