import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json';

test.beforeEach(async ({ page }) => {
  await page.route('*/**/api/tags', async (route) => {
    await route.fulfill({ body: JSON.stringify(tags) });
  });

  await page.goto('https://conduit.bondaracademy.com/');
  await page.getByText('Sign in').click();
  await page.getByRole('textbox', { name: 'Email' }).fill('eduardo@email.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button').click();
});

test('has title', async ({ page }) => {
  await page.route('*/**/api/articles*', async (route) => {
    const response = await route.fetch();
    const responseBody = await response.json();
    responseBody.articles[0].title = 'This is a mock test title';
    responseBody.articles[0].description = 'This is a mock description';
    await route.fulfill({
      body: JSON.stringify(responseBody),
    });
  });

  await page.getByText('Global Feed').click();
  await page.getByText('Sign in').click();
  await page.getByRole('textbox', { name: 'Email' }).fill('eduardo@email.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button').click();

  await expect(page.locator('.navbar-brand')).toHaveText('conduit');
  await expect(page.locator('app-article-list h1').first()).toContainText(
    'This is a mock test title'
  );
  await expect(page.locator('app-article-list p').first()).toContainText(
    'This is a mock description'
  );
});

test('Delete article', async ({ page, request }) => {
  const randomString = generateSmallRandonString();
  const randomTitle = `This is a test ${randomString}`;
  const response = await request.post(
    'https://conduit-api.bondaracademy.com/api/users/login',
    {
      data: {
        user: { email: 'eduardo@email.com', password: 'password' },
      },
    }
  );
  const responseBody = await response.json();
  const accessToken = responseBody.user.token;

  const articleResponse = await request.post(
    'https://conduit-api.bondaracademy.com/api/articles/',
    {
      data: {
        article: {
          title: randomTitle,
          description: 'test article',
          body: 'This is a test article',
          tagList: [],
        },
      },
      headers: {
        Authorization: `Token ${accessToken}`,
      },
    }
  );

  expect(articleResponse.status()).toEqual(201);

  await page.getByText('Global Feed').click();
  await page.getByText(randomTitle).click();
  await page.getByRole('button', { name: 'Delete Article' }).first().click();
  await page.getByText('Global Feed').click();

  await expect(page.locator('app-article-list h1').first()).not.toContainText(
    randomTitle
  );
});

function generateSmallRandonString() {
  const randomString = Math.random() * 10000;
  return randomString.toFixed(0);
}
