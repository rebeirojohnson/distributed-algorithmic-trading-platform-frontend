import { test, expect } from '@playwright/test';

test('renders login terminal', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me'))
      return route.fulfill({ json: { id: 'user-1', email: 'trader@example.com' } });
    return route.fulfill({ json: {} });
  });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /access terminal/i })).toBeVisible();
});
