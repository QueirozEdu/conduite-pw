import { test as setup } from '@playwright/test';

const authFile = '.auth/user.json';

setup('authentication', async ({ page }) => {
  await page.goto('https://conduit.bondaracademy.com/');
  await page.getByText('Sign in').click();
  await page
    .getByRole('textbox', {
      name: 'Email',
    })
    .fill('eduardo@email.com');
  await page
    .getByRole('textbox', {
      name: 'Password',
    })
    .fill('password');
  await page.getByRole('button').click();
  await page.waitForResponse('https://conduit-api.bondaracademy.com/api/tags');

  await page.context().storageState({ path: authFile });
});
