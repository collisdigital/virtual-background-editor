import { test, expect } from '@playwright/test';
import { getCanvasObject, hasBackgroundImage } from './utils/canvas-helper';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('select an image and enter text', async ({ page }) => {
  // Select the first image using data-testid
  await page.getByTestId('bg-select-1').click();

  // Verify background is loaded
  await expect.poll(async () => await hasBackgroundImage(page)).toBe(true);

  // Enter name and job title
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Job Title').fill('Software Engineer');

  // Verify Name on canvas
  await expect.poll(async () => {
    const obj = await getCanvasObject(page, 'name');
    return obj?.text;
  }).toBe('John Doe');

  // Verify Job Title on canvas
  await expect.poll(async () => {
    const obj = await getCanvasObject(page, 'title');
    return obj?.text;
  }).toBe('Software Engineer');
});