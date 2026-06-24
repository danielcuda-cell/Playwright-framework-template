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
    private readonly jobFunctionSelect: Locator;
    private readonly roleSelect: Locator;
    private readonly companySelect: Locator;
    private readonly createUserSubmitButton: Locator;
    private readonly cancelButton: Locator;
    private readonly closeDialogButton: Locator;
    private readonly dialogErrorBanner: Locator;

    // ─── Edit User dialog ─────────────────────────────────────────────────────────
    private readonly editUserDialog: Locator;
    private readonly editRoleSelect: Locator;
    private readonly saveUserButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading     = page.locator('input[name="search"]'); // table search — reliable page-ready indicator
        this.searchInput = page.locator('input[name="search"]');

        this.addUserButton        = page.getByRole('button', { name: 'Add User' });
        this.createUserDialog     = page.locator('dialog').filter({ hasText: 'Create User' });
        this.fullNameInput        = this.createUserDialog.getByPlaceholder('Enter full name');
        this.phoneInput           = this.createUserDialog.getByPlaceholder('+1 (234) 567-8901');
        this.emailInput           = this.createUserDialog.getByPlaceholder('Enter email');
        this.jobFunctionSelect    = this.createUserDialog.locator('#job-function-selected');
        this.roleSelect           = this.createUserDialog.locator('#role-option-selected');
        this.companySelect        = this.createUserDialog.locator('#company-option-selected');
        this.createUserSubmitButton = this.createUserDialog.getByRole('button', { name: 'Create User' });
        this.cancelButton         = this.createUserDialog.getByRole('button', { name: 'Cancel' });
        this.closeDialogButton    = this.createUserDialog.getByRole('button', { name: 'Close' });
        this.dialogErrorBanner    = this.createUserDialog.locator('.bg-alert-50');

        this.editUserDialog  = page.locator('dialog').filter({ hasText: 'Edit User' });
        this.editRoleSelect  = this.editUserDialog.locator('#role-option-selected');
        this.saveUserButton  = this.editUserDialog.getByRole('button', { name: 'Save' });
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

    async changeUserRole(email: string, newRole: string) {
        await this.searchUser(email);
        const row = this.page.locator('tr', { hasText: email });
        await row.getByRole('combobox').click();
        await this.page.getByRole('option', { name: newRole, exact: true }).click();
        // Confirmation dialog — "Are you sure you want to assign the role X to this user?"
        await this.page.getByRole('button', { name: 'Assign Role' }).click();
        await expect(row.getByText(newRole)).toBeVisible({ timeout: 10000 });
    }

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
        jobFunction?: string;
        role?: string;
        company?: string;
    }) {
        await this.fullNameInput.fill(data.fullName);
        await this.phoneInput.fill(data.phone);
        await this.emailInput.fill(data.email);
        if (data.jobFunction) {
            await this.jobFunctionSelect.fill(data.jobFunction);
            await this.createUserDialog.getByRole('option', { name: data.jobFunction, exact: true }).click();
        }
        if (data.role) {
            await this.roleSelect.fill(data.role);
            await this.createUserDialog.getByRole('option', { name: data.role, exact: true }).click();
        }
        if (data.company) {
            await this.companySelect.fill(data.company);
            await this.createUserDialog.getByRole('option', { name: data.company }).click();
        }
    }

    async selectJobFunction(value: string) {
        await this.jobFunctionSelect.fill(value);
        await this.createUserDialog.getByRole('option', { name: value, exact: true }).click();
    }

    async selectRole(value: string) {
        await this.roleSelect.fill(value);
        await this.createUserDialog.getByRole('option', { name: value, exact: true }).click();
    }

    async selectCompany(value: string) {
        await this.companySelect.fill(value);
        await this.createUserDialog.getByRole('option', { name: value }).click();
    }

    async submitCreateUserForm() {
        await this.createUserSubmitButton.click();
    }

    async assertUserCreatedSuccessfully(email: string) {
        await this.assertCreateUserDialogClosed();
        await this.searchUser(email);
        await this.assertUserRowVisible(email);
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
