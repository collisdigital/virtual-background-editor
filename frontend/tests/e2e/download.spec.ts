import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('download a customized image', async ({ page }) => {
  // Select the first image
  await page.getByTestId('bg-select-1').click();

  // Enter name and job title
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Job Title').fill('Product Manager');

  // Click the download button and wait for the download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download' }).click(),
  ]);

  // Assert that the download is not null
  expect(download).not.toBeNull();

  // Assert that the downloaded file has the correct name
  expect(download.suggestedFilename()).toBe('virtual-background.png');
});