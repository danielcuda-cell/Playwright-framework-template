import { Page, Locator, expect } from '@playwright/test';

export class UsersPage {
    private readonly page: Page;

    private readonly heading: Locator;
    private readonly searchInput: Locator;

    // ─── Create User dialog ───────────────────────────────────────────────────────
    private readonly addUserButton: Locator;
    private readonly createUserDialog: Locator;
    private readonly fullNameInput: Locator;
    private readonly phoneInput: Locator;
    private readonly emailInput: Locator;
    private readonly createUserSubmitButton: Locator;
    private readonly cancelButton: Locator;
    private readonly closeDialogButton: Locator;
    private readonly dialogErrorBanner: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading     = page.locator('input[name="search"]'); // table search — reliable page-ready indicator
        this.searchInput = page.locator('input[name="search"]');

        this.addUserButton        = page.getByRole('button', { name: 'Add User' });
        this.createUserDialog     = page.getByRole('dialog').filter({ hasText: 'Create User' });
        this.fullNameInput        = page.getByPlaceholder('Enter full name');
        this.phoneInput           = page.getByPlaceholder('+1 (234) 567-8901');
        this.emailInput           = page.getByPlaceholder('Enter email');
        this.createUserSubmitButton = this.createUserDialog.getByRole('button', { name: 'Create User' });
        this.cancelButton         = this.createUserDialog.getByRole('button', { name: 'Cancel' });
        this.closeDialogButton    = this.createUserDialog.getByRole('button', { name: 'Close' });
        this.dialogErrorBanner    = this.createUserDialog.locator('[role="alert"], .error-banner, [class*="error"], [class*="banner"]').first();
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

    async clickAddUser() {
        await this.addUserButton.click();
    }

    async fillCreateUserForm(data: {
        fullName: string;
        phone: string;
        email: string;
    }) {
        await this.fullNameInput.fill(data.fullName);
        await this.phoneInput.fill(data.phone);
        await this.emailInput.fill(data.email);
    }

    async submitCreateUserForm() {
        await this.createUserSubmitButton.click();
    }

    async closeCreateUserDialog() {
        await this.closeDialogButton.click();
    }

    async cancelCreateUserDialog() {
        await this.cancelButton.click();
    }

    async assertCreateUserDialogOpen() {
        await expect(this.createUserDialog).toBeVisible({ timeout: 5000 });
    }

    async assertCreateUserDialogClosed() {
        await expect(this.createUserDialog).not.toBeVisible({ timeout: 5000 });
    }

    async assertErrorBannerVisible(messageFragment?: string) {
        await expect(this.dialogErrorBanner).toBeVisible({ timeout: 8000 });
        if (messageFragment) {
            await expect(this.dialogErrorBanner).toContainText(messageFragment);
        }
    }

    async assertErrorBannerNotVisible() {
        await expect(this.dialogErrorBanner).not.toBeVisible();
    }

    async getErrorBannerText(): Promise<string> {
        await expect(this.dialogErrorBanner).toBeVisible({ timeout: 8000 });
        return (await this.dialogErrorBanner.innerText()).trim();
    }

    async assertNoToastVisible() {
        await expect(this.page.locator('[class*="toast"], [role="status"]')).not.toBeVisible({ timeout: 3000 });
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
