import { env } from '../../../src/config/env';
import { expect, test } from '../../../src/fixtures';

test.describe('Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test(
    'should open inventory when credentials are valid',
    { tag: ['@smoke'] },
    async ({ loginPage, inventoryPage, page }) => {
      await loginPage.login(env.users.standard);

      await expect(page).toHaveURL(/\/inventory\.html$/);
      await expect(inventoryPage.title).toHaveText('Products');
    },
  );

  const negativeCases = [
    {
      title: 'should show error when user is locked out',
      credentials: env.users.locked,
      error: 'Epic sadface: Sorry, this user has been locked out.',
    },
    {
      title: 'should show error when password is wrong',
      credentials: { username: env.users.standard.username, password: 'wrong_password' },
      error: 'Epic sadface: Username and password do not match any user in this service',
    },
    {
      title: 'should show error when username is empty',
      credentials: { username: '', password: env.users.standard.password },
      error: 'Epic sadface: Username is required',
    },
  ];

  for (const { title, credentials, error } of negativeCases) {
    test(title, { tag: ['@regression'] }, async ({ loginPage, page }) => {
      await loginPage.login(credentials);

      await expect(loginPage.errorMessage).toHaveText(error);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }
});
