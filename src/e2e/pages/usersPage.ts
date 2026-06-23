import { Page, Locator, expect } from '@playwright/test';

export class UsersPage {
    private readonly page: Page;

    private readonly heading: Locator;
    private readonly searchInput: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading     = page.locator('input[name="search"]'); // table search — reliable page-ready indicator
        this.searchInput = page.locator('input[name="search"]');
    }

    // ─── Navigation ───────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.includes('/users')) {
            // Already on users page
        } else if (currentUrl.includes('daedalusindustrial.com')) {
            // Wait for any in-flight post-login redirect to settle before navigating
            await this.page.waitForURL(/\/(home|dashboard)/, { timeout: 15000 }).catch(() => {});
            await this.page.goto('/users');
        } else {
            await this.page.goto('/users');
        }
        await this.page.waitForURL(/\/users/, { timeout: 15000 });
        await this.heading.waitFor({ timeout: 10000 });
    }

    // ─── Actions ──────────────────────────────────────────────────────────────────

    async searchUser(query: string) {
        await this.searchInput.fill(query);
        // Allow debounce/filter to apply
        await this.page.waitForTimeout(500);
    }

    // ─── Assertions ───────────────────────────────────────────────────────────────

    async assertUserRowVisible(email: string) {
        await expect(
            this.page.getByRole('cell', { name: email }).or(this.page.locator(`td:has-text("${email}")`))
        ).toBeVisible({ timeout: 10000 });
    }

    async assertUserData(email: string, data: {
        fullName?: string;
        phone?: string;
        role?: string;
        company?: string;
        jobFunction?: string;
    }) {
        // Find the row that contains the email
        const row = this.page.locator('tr', { hasText: email });
        await expect(row).toBeVisible({ timeout: 10000 });

        if (data.fullName)    await expect(row.getByText(data.fullName)).toBeVisible();
        if (data.phone)       await expect(row.getByText(data.phone)).toBeVisible();
        if (data.role)        await expect(row.getByText(data.role)).toBeVisible();
        if (data.company)     await expect(row.getByText(data.company)).toBeVisible();
        if (data.jobFunction) await expect(row.getByText(data.jobFunction)).toBeVisible();
    }
}
