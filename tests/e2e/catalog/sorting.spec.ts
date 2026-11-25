import { parsePrice } from '../../../src/data/price';
import { expect, test } from '../../../src/fixtures';
import type { SortOption } from '../../../src/pages/InventoryPage';

type Compare = (a: string, b: string) => number;

const byName: Compare = (a, b) => a.localeCompare(b);
const byPrice: Compare = (a, b) => parsePrice(a) - parsePrice(b);

// Prices are compared as a column (not as product names): two products share the same price,
// so their relative order is not defined by the price sort.
const cases: {
  option: SortOption;
  startFrom: SortOption;
  column: 'productNames' | 'productPrices';
  compare: Compare;
}[] = [
  { option: 'Name (A to Z)', startFrom: 'Name (Z to A)', column: 'productNames', compare: byName },
  {
    option: 'Name (Z to A)',
    startFrom: 'Name (A to Z)',
    column: 'productNames',
    compare: (a, b) => byName(b, a),
  },
  { option: 'Price (low to high)', startFrom: 'Name (A to Z)', column: 'productPrices', compare: byPrice },
  {
    option: 'Price (high to low)',
    startFrom: 'Name (A to Z)',
    column: 'productPrices',
    compare: (a, b) => byPrice(b, a),
  },
];

test.describe('Catalog sorting', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  for (const { option, startFrom, column, compare } of cases) {
    test(
      `should order products by "${option}" when that sort option is selected`,
      { tag: ['@regression'] },
      async ({ inventoryPage }) => {
        const list = inventoryPage[column];
        await expect(list).not.toHaveCount(0);
        const expected = [...(await list.allInnerTexts())].sort(compare);

        await test.step(`Start from "${startFrom}" so the list is not already in the expected order`, async () => {
          await inventoryPage.sortBy(startFrom);
          await expect(list).not.toHaveText(expected);
        });

        await test.step(`Sort by "${option}"`, async () => {
          await inventoryPage.sortBy(option);
        });

        await test.step('Verify order', async () => {
          await expect(inventoryPage.activeSortOption).toHaveText(option);
          await expect(list).toHaveText(expected);
        });
      },
    );
  }
});
