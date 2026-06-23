import { Page, Locator, expect } from '@playwright/test';

export type PartFormData = {
    key: string;
    displayName?: string;
    category?: string;
    manufacturer?: string;
    family?: string;
};

export class PartsPage {
    private readonly page: Page;

    // ─── Page ─────────────────────────────────────────────────────────────────────
    private readonly pageTitle: Locator;
    private readonly addPartButton: Locator;
    private readonly manageButton: Locator;
    private readonly searchInput: Locator;
    private readonly categoryFilter: Locator;
    private readonly manufacturerFilter: Locator;
    private readonly familyFilter: Locator;
    private readonly table: Locator;
    private readonly paginationInfo: Locator;
    private readonly previousPageButton: Locator;
    private readonly nextPageButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.pageTitle = page.getByRole('heading', { name: 'Parts', level: 1 });
        this.addPartButton = page.getByRole('button', { name: 'Add Part' });
        this.manageButton = page.getByRole('button', { name: 'Manage' });
        this.searchInput = page.getByRole('main').getByPlaceholder('Search...').first();
        this.categoryFilter = page.getByRole('main').getByRole('combobox').nth(0);
        this.manufacturerFilter = page.getByRole('main').getByRole('combobox').nth(1);
        this.familyFilter = page.getByRole('main').getByRole('combobox').nth(2);
        this.table = page.getByRole('table');
        this.paginationInfo = page.getByText(/Showing \d+-\d+ of \d+ items/);
        this.previousPageButton = page.getByRole('button', { name: 'Previous' });
        this.nextPageButton = page.getByRole('button', { name: 'Next' });
    }

    // ─── Navigation ──────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.includes('/parts')) return;

        if (currentUrl.includes('daedalusindustrial.com')) {
            const partsLink = this.page.locator('a[href="/parts"]');
            if (!await partsLink.isVisible()) {
                await this.page.getByRole('button', { name: 'Panels' }).click();
            }
            await partsLink.click();
        } else {
            await this.page.goto('/parts');
        }

        await this.page.waitForURL(/\/parts/, { timeout: 15000 });
        await this.pageTitle.waitFor({ timeout: 10000 });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────────

    async clickAddPart() {
        await this.addPartButton.click();
    }

    async clickManage() {
        await this.manageButton.click();
    }

    async search(text: string) {
        await this.searchInput.fill(text);
        await this.page.waitForTimeout(400);
    }

    async filterByCategory(value: string) {
        await this.categoryFilter.click();
        await this.page.getByRole('option', { name: value, exact: true }).click();
    }

    async filterByManufacturer(value: string) {
        await this.manufacturerFilter.click();
        await this.page.getByRole('option', { name: value, exact: true }).click();
    }

    async filterByFamily(value: string) {
        await this.familyFilter.click();
        await this.page.getByRole('option', { name: value, exact: true }).click();
    }

    async clickNextPage() {
        const prevText = (await this.paginationInfo.innerText()).trim();
        await this.nextPageButton.click();
        await this.waitForPaginationChange(prevText);
    }

    async clickPreviousPage() {
        const prevText = (await this.paginationInfo.innerText()).trim();
        await this.previousPageButton.click();
        await this.waitForPaginationChange(prevText);
    }

    private async waitForPaginationChange(prevText: string) {
        await expect(async () => {
            const currentText = (await this.paginationInfo.innerText({ timeout: 3000 })).trim();
            expect(currentText).not.toBe(prevText);
        }).toPass({ timeout: 15000 });
    }

    // ─── Row actions ──────────────────────────────────────────────────────────────

    getRow(partKey: string): Locator {
        return this.table.getByRole('row').filter({ hasText: partKey });
    }

    async clickEditPart(partKey: string) {
        await this.getRow(partKey).getByRole('button', { name: 'Edit part' }).click();
    }

    async clickDeletePart(partKey: string) {
        await this.getRow(partKey).getByRole('button', { name: 'Delete part' }).click();
    }

    // ─── Assertions ──────────────────────────────────────────────────────────────

    async assertPageLoaded() {
        await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
        await expect(this.addPartButton).toBeVisible();
        await expect(this.table).toBeVisible();
    }

    async assertPartVisible(partKey: string) {
        await expect(this.getRow(partKey)).toBeVisible({ timeout: 10000 });
    }

    async assertPartNotVisible(partKey: string) {
        await expect(this.table).not.toContainText(partKey);
    }

    async assertPaginationInfo(text: string) {
        await expect(this.paginationInfo).toContainText(text);
    }
}
