import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.join(__dirname, '../../../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
    fs.mkdirSync(path.dirname(authFile), { recursive: true });

    await page.goto('/');
    await page.getByPlaceholder('Type your email address').fill(process.env.E2E_USER_EMAIL!);
    await page.getByPlaceholder('Type your password').first().fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/app\.dev\.dap\.daedalusindustrial\.com/, { timeout: 15000 });

    // Navigate to IO Modules via the sidebar (client-side nav) to preserve the
    // in-memory auth token before saving state.
    const ioLink = page.locator('a[href="/io-modules"]');
    if (!await ioLink.isVisible()) {
        await page.getByRole('button', { name: 'Panels' }).click();
    }
    await ioLink.click();
    await page.getByText(/Showing [1-9]/).waitFor({ timeout: 15000 });

    // Remove single-use Auth0 SPA SDK transaction cookies (__txn_*). If these are
    // loaded into a new browser context they confuse the SDK into thinking there is
    // a pending (but unresumable) auth transaction, causing a hard redirect to login.
    const allCookies = await page.context().cookies();
    await page.context().clearCookies();
    await page.context().addCookies(allCookies.filter(c => !c.name.startsWith('__txn_')));

    await page.context().storageState({ path: authFile });
});
