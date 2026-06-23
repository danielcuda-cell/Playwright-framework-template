import { Page, Locator, expect } from '@playwright/test';

export class RolesPage {
    private readonly page: Page;

    // ─── Page ─────────────────────────────────────────────────────────────────────
    private readonly createRoleButton: Locator;
    private readonly searchInput: Locator;
    private readonly table: Locator;

    constructor(page: Page) {
        this.page = page;

        this.createRoleButton = page.getByRole('main').getByRole('button').first();
        this.searchInput = page.getByRole('main').getByPlaceholder('Search...');
        this.table = page.getByRole('table');
    }

    // ─── Navigation ──────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.includes('/roles')) return;

        if (currentUrl.includes('daedalusindustrial.com')) {
            const rolesLink = this.page.locator('a[href="/roles"]');
            if (!await rolesLink.isVisible()) {
                await this.page.getByRole('button', { name: 'Management' }).click();
            }
            await rolesLink.click();
        } else {
            await this.page.goto('/roles');
        }

        await this.page.waitForURL(/\/roles/, { timeout: 15000 });
        await this.table.waitFor({ timeout: 10000 });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────────

    async clickCreateRole() {
        await this.createRoleButton.click();
    }

    async search(text: string) {
        await this.searchInput.fill(text);
        await this.page.waitForTimeout(400);
    }

    async clickEditRole(roleName: string) {
        await this.table
            .getByRole('row')
            .filter({ hasText: roleName })
            .getByRole('button', { name: /Edit role/ })
            .click();
    }

    // ─── Assertions ──────────────────────────────────────────────────────────────

    async assertPageLoaded() {
        await expect(this.table).toBeVisible({ timeout: 10000 });
        await expect(this.searchInput).toBeVisible();
    }

    async assertRoleVisible(roleName: string) {
        await expect(
            this.table.getByRole('row').filter({ hasText: roleName })
        ).toBeVisible({ timeout: 10000 });
    }

    async assertRoleNotVisible(roleName: string) {
        await expect(this.table).not.toContainText(roleName);
    }

    async assertRoleDescription(roleName: string, description: string) {
        const row = this.table.getByRole('row').filter({ hasText: roleName });
        await expect(row).toContainText(description);
    }

    async assertPermissionTagVisible(roleName: string, permission: string) {
        const row = this.table.getByRole('row').filter({ hasText: roleName });
        await expect(row.getByRole('button', { name: permission })).toBeVisible();
    }
}
