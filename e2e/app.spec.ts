import { test, expect } from '@playwright/test';

test.describe('Git Catalogue App', () => {
  
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Web-first assertions auto-wait; avoid networkidle, which hangs on the
    // external Google Fonts CDN and makes this flaky on CI.
    await expect(page).toHaveTitle('GitCatalogue');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out network-related errors that are expected in CI environments
        const isNetworkError = text.includes('net::ERR_NAME_NOT_RESOLVED') ||
                              text.includes('Failed to load resource') ||
                              text.includes('fonts.googleapis.com') ||
                              text.includes('fonts.gstatic.com') ||
                              text.includes('HttpErrorResponse');
        
        if (!isNetworkError) {
          errors.push(text);
        }
      }
    });
    
    await page.goto('/');

    // Wait for Angular to bootstrap rather than networkidle, which never
    // settles when the external Google Fonts CDN stalls on CI.
    await expect(page.locator('app-root')).toBeVisible();

    expect(errors).toEqual([]);
  });
});