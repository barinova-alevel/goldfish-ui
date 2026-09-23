import { expect, test, type Page } from '@playwright/test';
import { credentials } from '../config';

const USER_SESSION_KEY = 'sfmb.user';

async function submitLogin(page: Page, email: string, password: string) {
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

function header(page: Page) {
  return page.locator('header');
}

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-heading')).toBeVisible();
  });

  test('valid credentials → login successful', async ({ page }) => {
    const { email, password } = credentials();

    await submitLogin(page, email, password);

    await expect(page).toHaveURL('/');
    await expect(header(page).getByRole('button', { name: 'Logout' })).toBeVisible();
    await expect(page.getByTestId('login-form-error')).toHaveCount(0);

    const stored = await page.evaluate((key) => sessionStorage.getItem(key), USER_SESSION_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).email.toLowerCase()).toBe(email.toLowerCase());
  });

  test('invalid password → error', async ({ page }) => {
    const { email } = credentials();

    await submitLogin(page, email, `wrong-${Date.now()}`);

    await expect(page.getByTestId('login-form-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(header(page).getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('invalid email → error', async ({ page }) => {
    const { password } = credentials();

    await submitLogin(page, `no-such-user-${Date.now()}@example.com`, password);

    await expect(page.getByTestId('login-form-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(header(page).getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('malformed email → validation', async ({ page }) => {
    await submitLogin(page, 'not-an-email', 'whatever123');

    await expect(page.getByTestId('login-email-error')).toHaveText('Enter a valid email address');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('empty fields → validation', async ({ page }) => {
    let loginRequested = false;
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/login')) {
        loginRequested = true;
      }
    });

    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-email-error')).toHaveText('Email is required');
    await expect(page.getByTestId('login-password-error')).toHaveText('Password is required');
    await expect(page).toHaveURL(/\/login$/);
    expect(loginRequested).toBe(false);
  });

  test('logout → user logged out', async ({ page }) => {
    const { email, password } = credentials();

    await submitLogin(page, email, password);
    await expect(page).toHaveURL('/');

    await header(page).getByRole('button', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(header(page).getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(header(page).getByRole('button', { name: 'Logout' })).toHaveCount(0);

    const stored = await page.evaluate((key) => sessionStorage.getItem(key), USER_SESSION_KEY);
    expect(stored).toBeNull();

    // Protected pages must send the user back to login.
    await page.goto('/operations');
    await expect(page).toHaveURL(/\/login$/);
  });
});
