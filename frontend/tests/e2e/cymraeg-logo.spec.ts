import { test, expect } from '@playwright/test';
import { getCanvasObject } from './utils/canvas-helper';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('User can select Cymraeg status and canvas remains visible', async ({ page }) => {
  // Check if Cymraeg dropdown exists and defaults to 'None'
  const cymraegSelect = page.getByLabel('Cymraeg');
  await expect(cymraegSelect).toBeVisible();
  await expect(cymraegSelect).toHaveValue('None');

  // Select 'Learner'
  await cymraegSelect.selectOption('Learner');
  await expect(cymraegSelect).toHaveValue('Learner');

  // Select 'Fluent'
  await cymraegSelect.selectOption('Fluent');
  await expect(cymraegSelect).toHaveValue('Fluent');

  // Verify canvas is still visible (no crash)
  const canvas = page.getByRole('presentation');
  await expect(canvas).toBeVisible();
});

test('should display correct Cymraeg text when Learner or Fluent is selected', async ({ page }) => {
  // Select an image (Image 1 has logo config)
  await page.getByTestId('bg-select-1').click();

  // Select 'Learner' from the Cymraeg dropdown
  await page.getByLabel('Cymraeg').selectOption('Learner');

  // Verify 'Dysgwyr\nLearner' text object exists on canvas
  await expect.poll(async () => {
    const obj = await getCanvasObject(page, 'cymraeg-text');
    return obj?.text;
  }).toBe('Dysgwyr\nLearner');

  // Select 'Fluent' from the Cymraeg dropdown
  await page.getByLabel('Cymraeg').selectOption('Fluent');

  // Verify 'Rhugl\nFluent' text object exists on canvas
  await expect.poll(async () => {
    const obj = await getCanvasObject(page, 'cymraeg-text');
    return obj?.text;
  }).toBe('Rhugl\nFluent');
});

test('Cymraeg logo functionality does not crash application', async ({ page }) => {
    // Select background 1
    await page.getByTestId('bg-select-1').click();

    const cymraegSelect = page.getByLabel('Cymraeg');
    
    // Toggle through options
    await cymraegSelect.selectOption('Learner');
    
    // Verify object exists instead of waiting arbitrarily
    await expect.poll(async () => {
        const obj = await getCanvasObject(page, 'cymraeg-text');
        return !!obj;
    }).toBe(true);
    
    await cymraegSelect.selectOption('None');
    
    // Verify object is gone
    await expect.poll(async () => {
        const obj = await getCanvasObject(page, 'cymraeg-text');
        return !!obj;
    }).toBe(false);

    // Enter some text as well to ensure interactions work together
    await page.getByLabel('Name').fill('Test User');
    
    await cymraegSelect.selectOption('Fluent');
    
    // Check download button still works (clickable)
    const downloadBtn = page.getByRole('button', { name: 'Download Image' });
    await expect(downloadBtn).toBeEnabled();
});