import { PRODUCTS } from '../../../src/data/products';
import { expect, test } from '../../../src/fixtures';

test.describe('Cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('should show added product in cart', { tag: ['@smoke'] }, async ({ inventoryPage, cartPage }) => {
    await test.step('Add product to cart', async () => {
      await inventoryPage.addToCart(PRODUCTS.backpack);
      await expect(inventoryPage.removeButton(PRODUCTS.backpack)).toBeVisible();
      await expect(inventoryPage.header.cartBadge).toHaveText('1');
    });

    await test.step('Open cart', async () => {
      await inventoryPage.header.openCart();
      await expect(cartPage.title).toHaveText('Your Cart');
    });

    await test.step('Verify cart content', async () => {
      await expect(cartPage.itemNames).toHaveText([PRODUCTS.backpack]);
    });
  });

  test(
    'should count every added product in cart badge',
    { tag: ['@regression'] },
    async ({ inventoryPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack);
      await inventoryPage.addToCart(PRODUCTS.bikeLight);

      await expect(inventoryPage.header.cartBadge).toHaveText('2');
    },
  );
});
