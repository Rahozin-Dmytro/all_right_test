import { expect, test } from '../../../src/fixtures';

const PRODUCT_COUNT = 6;
const BACKPACK = 'Sauce Labs Backpack';

test.describe('Catalog', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test(
    'should show every product with name, price and add button when catalog is opened',
    { tag: ['@smoke'] },
    async ({ inventoryPage }) => {
      // Precondition: every card shows "Add to cart" only while the cart is empty.
      await expect(inventoryPage.header.cartBadge).toBeHidden();

      await expect(inventoryPage.productCards).toHaveCount(PRODUCT_COUNT);
      await expect(inventoryPage.productNames).toHaveText(Array(PRODUCT_COUNT).fill(/\S/));
      await expect(inventoryPage.productPrices).toHaveText(Array(PRODUCT_COUNT).fill(/^\$\d+\.\d{2}$/));
      await expect(inventoryPage.addToCartButtons).toHaveCount(PRODUCT_COUNT);
    },
  );

  test(
    'should show the same name and price on details page when product is opened from catalog',
    { tag: ['@regression'] },
    async ({ inventoryPage, productDetailsPage, page }) => {
      const catalogPrice = await test.step('Read product price in catalog', async () => {
        await expect(inventoryPage.productPrice(BACKPACK)).toBeVisible();
        return inventoryPage.productPrice(BACKPACK).innerText();
      });

      await test.step('Open product details', async () => {
        await inventoryPage.openProduct(BACKPACK);
        await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
      });

      await test.step('Verify details match catalog', async () => {
        await expect(productDetailsPage.productName).toHaveText(BACKPACK);
        await expect(productDetailsPage.productPrice).toHaveText(catalogPrice);
      });
    },
  );
});
