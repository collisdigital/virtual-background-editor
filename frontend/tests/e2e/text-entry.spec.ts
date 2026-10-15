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

for (const width of [1280, 390]) {
  test(`alignment rulers span the preview and drag without changing the image at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.getByTestId('bg-select-1').click();
    await expect.poll(() => hasBackgroundImage(page)).toBe(true);
    await page.getByLabel('Name', { exact: true }).fill('Alignment test');
    await expect.poll(async () => (await getCanvasObject(page, 'name'))?.text).toBe('Alignment test');
    const canvas = page.locator('canvas.lower-canvas');
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const imageBefore = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
    await page.getByLabel('Horizontal ruler', { exact: true }).check();
    await page.getByLabel('Vertical ruler', { exact: true }).check();
    const horizontal = page.getByRole('separator', { name: 'horizontal alignment ruler' });
    const vertical = page.getByRole('separator', { name: 'vertical alignment ruler' });
    await expect(async () => {
      const canvasBounds = (await canvas.boundingBox())!;
      const horizontalBounds = (await horizontal.boundingBox())!;
      const verticalBounds = (await vertical.boundingBox())!;
      expect(horizontalBounds.width).toBeCloseTo(canvasBounds.width, 0);
      expect(verticalBounds.height).toBeCloseTo(canvasBounds.height, 0);
    }).toPass();
    const bounds = (await canvas.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 4, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 4, bounds.y + bounds.height / 4, { steps: 5 });
    await page.mouse.up();
    expect(Number(await horizontal.getAttribute('aria-valuenow'))).toBeCloseTo(25, 0);
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height * 0.75);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height * 0.75, { steps: 5 });
    await page.mouse.up();
    expect(Number(await vertical.getAttribute('aria-valuenow'))).toBeCloseTo(75, 0);
    expect(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())).toBe(imageBefore);
    await page.screenshot({ path: testInfo.outputPath('rulers.png'), fullPage: true });
    await page.setViewportSize({ width: width === 1280 ? 900 : 430, height: 900 });
    await expect(async () => {
      const resized = (await canvas.boundingBox())!;
      expect((await horizontal.boundingBox())!.width).toBeCloseTo(resized.width, 0);
      expect((await vertical.boundingBox())!.height).toBeCloseTo(resized.height, 0);
    }).toPass();
  });
}