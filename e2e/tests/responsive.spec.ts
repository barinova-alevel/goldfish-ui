import { expect, test, type Page } from '@playwright/test';

const publicRoutes = ['/', '/login', '/register', '/forgot-password'];

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function openDrawer(page: Page) {
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
}

test.describe('mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens, highlights, and closes the navigation drawer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-heading')).toBeVisible();

    const menu = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

    await openDrawer(page);
    const drawer = page.getByRole('navigation', { name: 'Mobile' });
    const labels = ['SFMB', 'Operations', 'Operation Types', 'Daily Report', 'Period Report'];
    await expect(drawer.getByRole('link')).toHaveText(labels);
    await expect(drawer.getByRole('link', { name: 'SFMB' })).toHaveClass(/bg-brown\/15/);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');

    await openDrawer(page);
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(drawer).toBeHidden();

    await openDrawer(page);
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    await page.mouse.click(viewport!.width - 8, 240);
    await expect(drawer).toBeHidden();

    await openDrawer(page);
    await drawer.getByRole('link', { name: 'SFMB' }).click();
    await expect(page).toHaveURL('/');
    await expect(drawer).toBeHidden();
    await expect(page.getByTestId('home-page')).toBeVisible();
  });

  test('login form stays inside a 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/login');

    await expect(page.getByTestId('login-heading')).toBeVisible();
    await expect(page.getByTestId('login-demo')).toBeVisible();

    const email = page.getByTestId('login-email');
    await email.fill('person@example.com');
    await page.getByTestId('login-password').fill('secret12');
    await expect(email).toHaveValue('person@example.com');

    const box = await email.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.x + box!.width).toBeLessThanOrEqual(321);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  for (const route of publicRoutes) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    });
  }

  test('register and forgot-password forms are usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    const name = page.getByLabel('Name');
    await name.fill('Gold Fish');
    await expect(name).toHaveValue('Gold Fish');
    const nameBox = await name.boundingBox();
    expect(nameBox).not.toBeNull();
    expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(376);

    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible();
    const email = page.getByLabel('Email');
    await email.fill('person@example.com');
    await expect(email).toHaveValue('person@example.com');
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('protected list and report pages redirect without overflow', async ({ page }) => {
    for (const route of ['/operations', '/operation-types', '/daily-report', '/period-report']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByTestId('login-form')).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    }
  });
});

test.describe('desktop layout', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('keeps the permanent sidebar and hides the menu button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
    const sidebar = page.getByRole('navigation', { name: 'Main' });
    await expect(sidebar.getByRole('link', { name: 'Operations' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeHidden();
    await expect(page.getByTestId('home-heading')).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});

test.describe('signed-in mobile pages', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('operations, types, and reports stay within the viewport', async ({ page }) => {
    test.slow();
    await page.goto('/login');
    await page.getByTestId('login-demo').click();

    const home = page.getByTestId('home-page');
    const failure = page.getByTestId('login-form-error');
    await expect(home.or(failure)).toBeVisible({ timeout: 20_000 });
    if (await failure.isVisible()) {
      test.skip(true, 'Demo login API is not available');
    }

    const pages = [
      { route: '/operations', heading: 'Operations' },
      { route: '/operation-types', heading: 'Operation Types' },
      { route: '/daily-report', heading: 'Daily Report' },
      { route: '/period-report', heading: 'Period Report' },
    ];

    for (const entry of pages) {
      await page.goto(entry.route);
      await expect(page.getByRole('heading', { name: entry.heading })).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    }

    await page.goto('/operations');
    const table = page.getByRole('table');
    if ((await table.count()) > 0) {
      await expect(table.locator('thead')).toBeHidden();
      const edit = page.getByRole('button', { name: /Edit operation/ });
      if ((await edit.count()) > 0) {
        await expect(edit.first()).toBeVisible();
      }
    }

    await page.getByRole('button', { name: 'Add New Operation' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const amount = dialog.getByLabel('Amount *');
    await amount.fill('12.5');
    await expect(amount).toHaveValue('12.5');
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox).not.toBeNull();
    expect(dialogBox!.width).toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });
});
