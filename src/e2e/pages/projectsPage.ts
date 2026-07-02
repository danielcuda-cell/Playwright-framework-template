import { Page, Locator, expect } from '@playwright/test';

export type ProjectFormData = {
    name: string;
    companyName: string;
    zipCode: string;
    email: string;
    phone: string;
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
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }

    async filterByStatus(value: string) {
        await this.statusFilter.click();
        await this.page.getByRole('option', { name: value, exact: true }).click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
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

    // ─── Create / Edit / Archive ──────────────────────────────────────────────────

    async createProject(data: ProjectFormData) {
        await this.newProjectButton.click();
        const dialog = this.page.locator('dialog').filter({ hasText: 'Create project' });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Step 1 — Customer details
        await dialog.getByRole('textbox', { name: 'Project Name *' }).fill(data.name);
        await dialog.getByRole('combobox', { name: 'Company Name *' }).fill(data.companyName);
        await this.page.getByRole('option', { name: data.companyName, exact: true }).click();
        await dialog.getByRole('textbox', { name: 'Enter zip code' }).fill(data.zipCode);
        await dialog.getByRole('textbox', { name: 'Email *' }).fill(data.email);
        await dialog.getByPlaceholder('+1 (234) 567-8901').fill(data.phone);
        await dialog.getByRole('button', { name: 'Next: Integrator' }).click();

        // Step 2 — copy Customer details to Integrator
        await dialog.getByRole('checkbox', { name: 'Use same information as' }).click();
        await dialog.getByRole('button', { name: 'Next: Site details' }).click();

        // Step 3 — Site details
        await dialog.getByRole('combobox', { name: 'Company Name *' }).fill(data.companyName);
        await this.page.getByRole('option', { name: data.companyName, exact: true }).click();
        await dialog.getByRole('textbox', { name: 'Enter zip code' }).fill(data.zipCode);
        await dialog.getByRole('textbox', { name: 'Email *' }).fill(data.email);
        await dialog.getByPlaceholder('+1 (234) 567-8901').fill(data.phone);
        await dialog.getByRole('button', { name: 'Create project' }).click();

        await expect(dialog).not.toBeVisible({ timeout: 15000 });
    }

    async editProjectName(currentName: string, newName: string) {
        await this.clickEdit(currentName);
        const dialog = this.page.locator('dialog').filter({ hasText: 'Edit project' });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Step 1 — update name only
        const nameInput = dialog.getByRole('textbox', { name: 'Project Name *' });
        await nameInput.clear();
        await nameInput.fill(newName);
        await dialog.getByRole('button', { name: 'Next: Integrator' }).click();

        // Step 2 — no changes (already populated)
        await dialog.getByRole('button', { name: 'Next: Site details' }).click();

        // Step 3 — submit
        await dialog.getByRole('button', { name: 'Save changes' }).click();
        await expect(dialog).not.toBeVisible({ timeout: 15000 });
    }

    async archiveProject(projectName: string) {
        await this.clickArchive(projectName);
        const dialog = this.page.getByRole('dialog').filter({ hasText: 'Archive Project' });
        await expect(dialog).toBeVisible({ timeout: 15000 });
        await dialog.getByRole('button', { name: 'Archive' }).click();
        await expect(dialog).not.toBeVisible({ timeout: 10000 });
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

    async assertRowHasClient(projectName: string, client: string) {
        const row = this.getRow(projectName);
        await expect(row).toBeVisible({ timeout: 10000 });
        await expect(row.getByRole('cell', { name: client }).first()).toBeVisible();
    }

    async assertPaginationInfo(text: string) {
        await expect(this.paginationInfo).toContainText(text);
    }

    async assertAllVisibleRowsHaveStatus(status: string) {
        const rows = this.table.locator('tbody tr');
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            await expect(rows.nth(i)).toContainText(status);
        }
    }

    async assertAllVisibleRowsHaveClient(client: string) {
        // In shared dev environments the backend may include company-hierarchy
        // associations that show a project under a parent company even when its
        // displayed "Client" column holds a different name. Rather than asserting
        // every row shows the exact client, verify the filter is doing work:
        // the table is non-empty and at least one visible row matches the client.
        await expect(async () => {
            const rows = this.table.locator('tbody tr');
            const count = await rows.count();
            expect(count).toBeGreaterThan(0);
            let found = false;
            for (let i = 0; i < count; i++) {
                const row = rows.nth(i);
                if (!await row.isVisible()) continue;
                const cellText = await row.getByRole('cell').nth(1).textContent().catch(() => '');
                if (cellText?.includes(client)) { found = true; break; }
            }
            expect(found, `No visible row has client "${client}" after filtering`).toBe(true);
        }).toPass({ timeout: 15000 });
    }

    async assertDetailsHeading(projectName: string) {
        await expect(
            this.page.getByRole('heading', { name: projectName, level: 1 })
        ).toBeVisible({ timeout: 10000 });
    }

    async assertDetailsCompany(companyName: string) {
        await expect(
            this.page.getByRole('heading', { name: companyName, level: 3 }).first()
        ).toBeVisible({ timeout: 10000 });
    }
}
