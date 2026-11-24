import { env, STORAGE_STATE } from '../src/config/env';
import { expect, test as setup } from '../src/fixtures';

setup('should save authenticated state for e2e tests', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.open();
  await loginPage.login(env.users.standard);
  await expect(inventoryPage.title).toHaveText('Products');
  await page.context().storageState({ path: STORAGE_STATE });
});
