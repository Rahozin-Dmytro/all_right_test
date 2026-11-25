import { buildCustomer } from '../../../src/data/customer';
import { parsePrice } from '../../../src/data/price';
import { PRODUCTS } from '../../../src/data/products';
import { expect, knownBug, test } from '../../../src/fixtures';
import type { CartPage } from '../../../src/pages/CartPage';
import type { InventoryPage } from '../../../src/pages/InventoryPage';

const CUSTOMER_INFORMATION_URL = /\/checkout-step-one\.html$/;
/**
 * Sanity bound, not a requirement: no real-world tax rate exceeds the highest standard VAT (27%, Hungary).
 * The exact rate is not specified for the app, so the test does not pin it.
 */
const MAX_REALISTIC_TAX_RATE = 0.27;

async function openCheckout(inventoryPage: InventoryPage, cartPage: CartPage): Promise<void> {
  await inventoryPage.header.openCart();
  await cartPage.checkout();
}

test.describe('Checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test.describe('order', () => {
    test(
      'should place order with correct totals when customer information is valid',
      { tag: ['@smoke'] },
      async ({
        inventoryPage,
        cartPage,
        checkoutInformationPage,
        checkoutOverviewPage,
        checkoutCompletePage,
      }) => {
        const catalogPrices = await test.step('Read product prices in catalog', async () => {
          await expect(inventoryPage.productPrice(PRODUCTS.backpack)).toBeVisible();
          return [
            await inventoryPage.productPrice(PRODUCTS.backpack).innerText(),
            await inventoryPage.productPrice(PRODUCTS.bikeLight).innerText(),
          ];
        });

        await test.step('Add two products and fill customer information', async () => {
          await inventoryPage.addToCart(PRODUCTS.backpack);
          await inventoryPage.addToCart(PRODUCTS.bikeLight);
          await expect(inventoryPage.header.cartBadge).toHaveText('2');
          await openCheckout(inventoryPage, cartPage);
          await checkoutInformationPage.fillInformation(buildCustomer());
          await checkoutInformationPage.continue();
        });

        await test.step('Verify overview items and totals', async () => {
          await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
          await expect(checkoutOverviewPage.itemNames).toHaveText([PRODUCTS.backpack, PRODUCTS.bikeLight]);
          await expect(checkoutOverviewPage.itemPrices).toHaveText(catalogPrices);

          const itemTotal = parsePrice(await checkoutOverviewPage.itemTotal.innerText());
          const tax = parsePrice(await checkoutOverviewPage.tax.innerText());
          const total = parsePrice(await checkoutOverviewPage.total.innerText());
          const sumOfPrices = catalogPrices.map(parsePrice).reduce((sum, price) => sum + price, 0);

          expect(itemTotal).toBeCloseTo(sumOfPrices, 2);
          expect(tax).toBeGreaterThan(0);
          expect(tax / itemTotal).toBeLessThanOrEqual(MAX_REALISTIC_TAX_RATE);
          expect(total).toBeCloseTo(itemTotal + tax, 2);
        });

        await test.step('Finish order', async () => {
          await checkoutOverviewPage.finish();
          await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
          await expect(checkoutCompletePage.header.cartBadge).toBeHidden();
        });
      },
    );

    test.fixme(
      'should not reopen completed order when user goes back after finish',
      { tag: ['@regression'], annotation: knownBug('bug-03') },
      async ({
        page,
        inventoryPage,
        cartPage,
        checkoutInformationPage,
        checkoutOverviewPage,
        checkoutCompletePage,
      }) => {
        await inventoryPage.addToCart(PRODUCTS.backpack);
        await openCheckout(inventoryPage, cartPage);
        await checkoutInformationPage.fillInformation(buildCustomer());
        await checkoutInformationPage.continue();
        await checkoutOverviewPage.finish();
        await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');

        await page.goBack();
        // Anchor: the complete screen is gone, so the next screen has rendered before we check what it lacks.
        await expect(checkoutCompletePage.completeHeader).toBeHidden();

        await expect(checkoutOverviewPage.finishButton).toBeHidden();
      },
    );
  });

  test.describe('customer information', () => {
    test.beforeEach(async ({ inventoryPage, cartPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack);
      await openCheckout(inventoryPage, cartPage);
    });

    const requiredFieldCases = [
      {
        when: 'form is empty',
        customer: { firstName: '', lastName: '', postalCode: '' },
        error: 'Error: First Name is required',
      },
      {
        when: 'last name is empty',
        customer: buildCustomer({ lastName: '' }),
        error: 'Error: Last Name is required',
      },
      {
        when: 'postal code is empty',
        customer: buildCustomer({ postalCode: '' }),
        error: 'Error: Postal Code is required',
      },
    ];

    for (const { when, customer, error } of requiredFieldCases) {
      test(
        `should show "${error}" when ${when}`,
        { tag: ['@regression'] },
        async ({ checkoutInformationPage, page }) => {
          await checkoutInformationPage.fillInformation(customer);
          await checkoutInformationPage.continue();

          await expect(checkoutInformationPage.errorMessage).toHaveText(error);
          await expect(page).toHaveURL(CUSTOMER_INFORMATION_URL);
        },
      );
    }

    // One field per case: a fix that trims only one field must not turn the other cases green.
    const spacesOnlyCases = [
      {
        when: 'first name contains only spaces',
        customer: buildCustomer({ firstName: '   ' }),
        error: 'Error: First Name is required',
      },
      {
        when: 'last name contains only spaces',
        customer: buildCustomer({ lastName: '   ' }),
        error: 'Error: Last Name is required',
      },
      {
        when: 'postal code contains only spaces',
        customer: buildCustomer({ postalCode: '   ' }),
        error: 'Error: Postal Code is required',
      },
    ];

    for (const { when, customer, error } of spacesOnlyCases) {
      test.fixme(
        `should show "${error}" when ${when}`,
        { tag: ['@regression'], annotation: knownBug('bug-04') },
        async ({ checkoutInformationPage, page }) => {
          await checkoutInformationPage.fillInformation(customer);
          await checkoutInformationPage.continue();

          await expect(checkoutInformationPage.errorMessage).toHaveText(error);
          await expect(page).toHaveURL(CUSTOMER_INFORMATION_URL);
        },
      );
    }

    test.fixme(
      'should reject postal code when it contains special characters',
      { tag: ['@regression'], annotation: knownBug('bug-05') },
      async ({ checkoutInformationPage, page }) => {
        await checkoutInformationPage.fillInformation(buildCustomer({ postalCode: 'abc!@#' }));
        await checkoutInformationPage.continue();

        await expect(checkoutInformationPage.errorMessage).toBeVisible();
        await expect(page).toHaveURL(CUSTOMER_INFORMATION_URL);
      },
    );
  });

  test.describe('empty cart', () => {
    test.fixme(
      'should not allow checkout when cart is empty',
      { tag: ['@regression'], annotation: knownBug('bug-02') },
      async ({ inventoryPage, cartPage }) => {
        await inventoryPage.header.openCart();
        // Anchor: the cart has rendered, so the checks below see the real cart, not an empty page.
        await expect(cartPage.title).toHaveText('Your Cart');
        await expect(cartPage.itemNames).toHaveCount(0);

        await expect(cartPage.enabledCheckoutButton).toBeHidden();
      },
    );
  });
});
