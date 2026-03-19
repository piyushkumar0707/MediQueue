import { expect, test } from '@playwright/test';

test('@smoke redirects unauthenticated patient route to login', async ({ page }) => {
  await page.goto('/patient');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});
