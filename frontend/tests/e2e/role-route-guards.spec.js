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
    // Include fake tokens so initializeAuth() doesn't force-logout when the
    // /auth/refresh-token API call fails (no backend running in CI).
    // Without tokens, the catch block calls logout() -> clears state -> redirect to /login.
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
        accessToken: 'e2e-fake-access-token',
        refreshToken: 'e2e-fake-refresh-token',
      },
      version: 0,
    };

    window.localStorage.setItem('auth-storage', JSON.stringify(persisted));
  });

  await page.goto('/patient');

  await expect(page).toHaveURL(/\/patient/);
  // Wait up to 10 s for the heading — hydration + failed refresh-token call settle first
  await expect(page.getByRole('heading', { name: /welcome back, e2e/i })).toBeVisible({ timeout: 10000 });
});
