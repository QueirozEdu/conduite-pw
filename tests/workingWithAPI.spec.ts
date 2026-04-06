import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json';

test.beforeEach(async ({ page }) => {
  await page.route('*/**/api/tags', async (route) => {
    await route.fulfill({
      body: JSON.stringify(tags),
    });
  });

  await page.goto('https://conduit.bondaracademy.com/');
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
  await expect(page.locator('.navbar-brand')).toHaveText('conduit');
  await expect(page.locator('app-article-list h1').first()).toContainText('This is a mock test title');
  await expect(page.locator('app-article-list p').first()).toContainText('This is a mock description');
});

test('Delete article', async ({ page, request }) => {
  const randomString = generateSmallRandonString();
  const randomTitle = `This is a test ${randomString}`;

  const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
    data: {
      article: {
        title: randomTitle,
        description: 'test article',
        body: 'This is a test article',
        tagList: [],
      },
    },
  });

  expect(articleResponse.status()).toEqual(201);

  await page.getByText('Global Feed').click();
  await page.getByText(randomTitle).click();
  await page
    .getByRole('button', {
      name: 'Delete Article',
    })
    .first()
    .click();
  await page.getByText('Global Feed').click();

  await expect(page.locator('app-article-list h1').first()).not.toContainText(randomTitle);
});

test('create article', async ({ page, request }) => {
  const randomTitle = `Playwright is awesome ${generateSmallRandonString()}`;

  await page.getByText('New Article').click();
  await page
    .getByRole('textbox', {
      name: 'Article Title',
    })
    .fill(randomTitle);
  await page
    .getByRole('textbox', {
      name: "What's this article about?",
    })
    .fill('About playwright');
  await page
    .getByRole('textbox', {
      name: 'Write your article (in markdown)',
    })
    .fill('This is a test article');
  await page
    .getByRole('button', {
      name: ' Publish Article ',
    })
    .click();

  const articleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/');
  const articleResponseBody = await articleResponse.json();
  const slugId = articleResponseBody.article.slug;

  await expect(page.locator('.article-page h1')).toContainText(randomTitle);
  await page.getByText('Home').click();
  await page.getByText('Global Feed').click();
  await expect(page.locator('app-article-list h1').first()).toContainText(randomTitle);

  const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`, {});

  expect(deleteArticleResponse.status()).toEqual(204);
});

function generateSmallRandonString() {
  const randomString = Math.random() * 10000;
  return randomString.toFixed(0);
}
