import { Page, Locator, expect } from '@playwright/test';

export class CompaniesPage {
    private readonly page: Page;

    // ─── Page ─────────────────────────────────────────────────────────────────────
    private readonly listTab: Locator;
    private readonly archivedTab: Locator;
    private readonly addCompanyButton: Locator;
    private readonly searchInput: Locator;
    private readonly table: Locator;
    private readonly paginationInfo: Locator;
    private readonly previousPageButton: Locator;
    private readonly nextPageButton: Locator;

    // ─── Detail panel ─────────────────────────────────────────────────────────────
    private readonly noSelectionHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        this.listTab = page.getByRole('button', { name: 'List' });
        this.archivedTab = page.getByRole('button', { name: 'Archived' });
        this.addCompanyButton = page.getByRole('button', { name: 'Add Company' });
        this.searchInput = page.getByRole('main').getByPlaceholder('Search...');
        this.table = page.getByRole('table');
        this.paginationInfo = page.getByText(/Showing \d+-\d+ of \d+ companies/);
        this.previousPageButton = page.getByRole('button', { name: 'Previous' });
        this.nextPageButton = page.getByRole('button', { name: 'Next' });

        this.noSelectionHeading = page.getByRole('heading', { name: 'You have not selected a company yet', level: 3 });
    }

    // ─── Navigation ──────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.includes('/companies')) return;

        if (currentUrl.includes('daedalusindustrial.com')) {
            const companiesLink = this.page.locator('a[href="/companies"]');
            if (!await companiesLink.isVisible()) {
                await this.page.getByRole('button', { name: 'Management' }).click();
            }
            await companiesLink.click();
        } else {
            await this.page.goto('/companies');
        }

        await this.page.waitForURL(/\/companies/, { timeout: 15000 });
        await this.listTab.waitFor({ timeout: 10000 });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────────

    async clickListTab() {
        await this.listTab.click();
    }

    async clickArchivedTab() {
        await this.archivedTab.click();
    }

    async clickAddCompany() {
        await this.addCompanyButton.click();
    }

    async search(text: string) {
        await this.searchInput.fill(text);
        await this.page.waitForTimeout(400);
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

    async selectCompany(companyName: string) {
        await this.table
            .getByRole('row')
            .filter({ hasText: companyName })
            .click();
    }

    // ─── Assertions ──────────────────────────────────────────────────────────────

    async assertPageLoaded() {
        await expect(this.listTab).toBeVisible({ timeout: 10000 });
        await expect(this.addCompanyButton).toBeVisible();
        await expect(this.table).toBeVisible();
    }

    async assertNoSelectionState() {
        await expect(this.noSelectionHeading).toBeVisible();
    }

    async assertCompanyVisible(companyName: string) {
        await expect(
            this.table.getByRole('row').filter({ hasText: companyName })
        ).toBeVisible({ timeout: 10000 });
    }

    async assertCompanyNotVisible(companyName: string) {
        await expect(this.table).not.toContainText(companyName);
    }

    async assertPaginationInfo(text: string) {
        await expect(this.paginationInfo).toContainText(text);
    }
}
