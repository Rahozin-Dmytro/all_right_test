import { PRODUCTS } from '../../../src/data/products';
import { expect, knownBug, test } from '../../../src/fixtures';

const PRODUCT_COUNT = 6;
const NON_EXISTENT_PRODUCT_ID = 999;

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
        await expect(inventoryPage.productPrice(PRODUCTS.backpack)).toBeVisible();
        return inventoryPage.productPrice(PRODUCTS.backpack).innerText();
      });

      await test.step('Open product details', async () => {
        await inventoryPage.openProduct(PRODUCTS.backpack);
        await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
      });

      await test.step('Verify details match catalog', async () => {
        await expect(productDetailsPage.productName).toHaveText(PRODUCTS.backpack);
        await expect(productDetailsPage.productPrice).toHaveText(catalogPrice);
      });
    },
  );

  test.fixme(
    'should not allow adding to cart when product does not exist',
    { tag: ['@regression'], annotation: knownBug('bug-01') },
    async ({ productDetailsPage }) => {
      await productDetailsPage.open(NON_EXISTENT_PRODUCT_ID);
      // Anchor: the app shell has rendered, so "no enabled button" below is a real result, not an empty page.
      await expect(productDetailsPage.header.cartLink).toBeVisible();

      await expect(productDetailsPage.enabledAddToCartButton).toBeHidden();
    },
  );
});
