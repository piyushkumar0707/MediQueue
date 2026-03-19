import { expect, test } from '@playwright/test';

test('@smoke redirects unauthenticated doctor route to login', async ({ page }) => {
  await page.goto('/doctor');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});

test('@smoke redirects unauthenticated admin route to login', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});

test('@smoke allows authenticated patient to access patient route using persisted auth state', async ({ page }) => {
  await page.addInitScript(() => {
    const persisted = {
      state: {
        user: {
          role: 'patient',
          personalInfo: {
            firstName: 'E2E',
            lastName: 'Patient',
          },
        },
        isAuthenticated: true,
      },
      version: 0,
    };

    window.localStorage.setItem('auth-storage', JSON.stringify(persisted));
  });

  await page.goto('/patient');

  await expect(page).toHaveURL(/\/patient$/);
  await expect(page.getByRole('heading', { name: /welcome back, e2e/i })).toBeVisible();
});
