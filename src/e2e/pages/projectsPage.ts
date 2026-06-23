import { Page, Locator, expect } from '@playwright/test';

export type ProjectFormData = {
    name: string;
    client?: string;
    integrator?: string;
    site?: string;
};

export class ProjectsPage {
    private readonly page: Page;

    // ─── Page ─────────────────────────────────────────────────────────────────────
    private readonly pageTitle: Locator;
    private readonly newProjectButton: Locator;
    private readonly newOrderButton: Locator;
    private readonly searchInput: Locator;
    private readonly clientFilter: Locator;
    private readonly statusFilter: Locator;
    private readonly table: Locator;
    private readonly paginationInfo: Locator;
    private readonly previousPageButton: Locator;
    private readonly nextPageButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.pageTitle = page.getByRole('heading', { name: 'Projects', level: 1 });
        this.newProjectButton = page.getByRole('button', { name: 'New Project' });
        this.newOrderButton = page.getByRole('button', { name: 'New Order' });
        this.searchInput = page.getByRole('main').getByPlaceholder('Search...');
        this.clientFilter = page.getByRole('main').getByRole('combobox').nth(0);
        this.statusFilter = page.getByRole('main').getByRole('combobox').nth(1);
        this.table = page.getByRole('table');
        this.paginationInfo = page.getByText(/Showing \d+-\d+ of \d+ projects/);
        this.previousPageButton = page.getByRole('button', { name: 'Previous' });
        this.nextPageButton = page.getByRole('button', { name: 'Next' });
    }

    // ─── Navigation ──────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.includes('/projects')) return;

        if (currentUrl.includes('daedalusindustrial.com')) {
            const projectsLink = this.page.locator('a[href="/projects"]');
            if (!await projectsLink.isVisible()) {
                await this.page.getByRole('button', { name: 'Dashboard' }).click();
            }
            await projectsLink.click();
        } else {
            await this.page.goto('/projects');
        }

        await this.page.waitForURL(/\/projects/, { timeout: 15000 });
        await this.pageTitle.waitFor({ timeout: 10000 });
    }

    // ─── Actions ─────────────────────────────────────────────────────────────────

    async clickNewProject() {
        await this.newProjectButton.click();
    }

    async clickNewOrder() {
        await this.newOrderButton.click();
    }

    async search(text: string) {
        await this.searchInput.fill(text);
        await this.page.waitForTimeout(400);
    }

    async filterByClient(value: string) {
        await this.clientFilter.click();
        await this.page.getByRole('option', { name: value, exact: true }).click();
    }

    async filterByStatus(value: string) {
        await this.statusFilter.click();
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

    getRow(projectName: string): Locator {
        return this.table.getByRole('row').filter({ hasText: projectName });
    }

    async openRowActions(projectName: string) {
        await this.getRow(projectName).getByRole('button', { name: 'Row actions' }).click();
    }

    async clickViewDetails(projectName: string) {
        await this.openRowActions(projectName);
        await this.page.getByRole('link', { name: 'View Details' }).click();
    }

    async clickEdit(projectName: string) {
        await this.openRowActions(projectName);
        await this.page.getByRole('button', { name: 'Edit' }).click();
    }

    async clickArchive(projectName: string) {
        await this.openRowActions(projectName);
        await this.page.getByRole('button', { name: 'Archive' }).click();
    }

    // ─── Assertions ──────────────────────────────────────────────────────────────

    async assertPageLoaded() {
        await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
        await expect(this.newProjectButton).toBeVisible();
        await expect(this.table).toBeVisible();
    }

    async assertRowVisible(projectName: string) {
        await expect(this.getRow(projectName)).toBeVisible({ timeout: 10000 });
    }

    async assertRowNotVisible(projectName: string) {
        await expect(this.table).not.toContainText(projectName, { timeout: 5000 });
    }

    async assertPaginationInfo(text: string) {
        await expect(this.paginationInfo).toContainText(text);
    }
}
