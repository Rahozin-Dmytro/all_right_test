import { expect, test } from '../../../src/fixtures';

const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';

test.describe('Cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('should show added product in cart', { tag: ['@smoke'] }, async ({ inventoryPage, cartPage }) => {
    await test.step('Add product to cart', async () => {
      await inventoryPage.addToCart(BACKPACK);
      await expect(inventoryPage.removeButton(BACKPACK)).toBeVisible();
      await expect(inventoryPage.header.cartBadge).toHaveText('1');
    });

    await test.step('Open cart', async () => {
      await inventoryPage.header.openCart();
      await expect(cartPage.title).toHaveText('Your Cart');
    });

    await test.step('Verify cart content', async () => {
      await expect(cartPage.itemNames).toHaveText([BACKPACK]);
    });
  });

  test(
    'should count every added product in cart badge',
    { tag: ['@regression'] },
    async ({ inventoryPage }) => {
      await inventoryPage.addToCart(BACKPACK);
      await inventoryPage.addToCart(BIKE_LIGHT);

      await expect(inventoryPage.header.cartBadge).toHaveText('2');
    },
  );
});
