import { Page, Locator, expect } from '@playwright/test';

export type IOModuleFormData = {
    key?: string;
    label: string;
    ioPoints: number | string;
    ioPointType?: string;
    description?: string;
    manufacturer?: string;
    family?: string;
};

export class IOModulesPage {
    private readonly page: Page;

    // ─── Page ────────────────────────────────────────────────────────────────────
    private readonly pageTitle: Locator;
    private readonly addButton: Locator;
    private readonly searchInput: Locator;
    private readonly manufacturerFilter: Locator;
    private readonly familyFilter: Locator;
    private readonly table: Locator;
    private readonly paginationInfo: Locator;
    private readonly previousPageButton: Locator;
    private readonly nextPageButton: Locator;

    // ─── Add / Edit modal ────────────────────────────────────────────────────────
    private readonly modal: Locator;
    private readonly modalTitle: Locator;
    private readonly closeModalButton: Locator;
    private readonly keyInput: Locator;
    private readonly labelInput: Locator;
    private readonly ioPointsInput: Locator;
    private readonly ioPointTypeInput: Locator;
    private readonly descriptionInput: Locator;
    private readonly manufacturerSelect: Locator;
    private readonly familySelect: Locator;
    private readonly saveButton: Locator;
    private readonly cancelButton: Locator;

    // ─── Delete confirmation modal ───────────────────────────────────────────────
    private readonly deleteConfirmButton: Locator;
    private readonly deleteModalText: Locator;

    constructor(page: Page) {
        this.page = page;

        // Page
        this.pageTitle = page.getByRole('heading', { name: 'IO Modules', level: 1 });
        this.addButton = page.getByRole('button', { name: 'Add IO Module' });
        this.searchInput = page.locator('input[name="search"]');
        this.manufacturerFilter = page.getByRole('main').getByRole('combobox').nth(0);
        this.familyFilter = page.getByRole('main').getByRole('combobox').nth(1);
        this.table = page.getByRole('table');
        this.paginationInfo = page.getByText(/Showing \d+-\d+ of \d+ items/);
        this.previousPageButton = page.getByRole('button', { name: 'Previous' });
        this.nextPageButton = page.getByRole('button', { name: 'Next' });

        // Add / Edit modal
        this.modal = page.getByRole('dialog');
        this.modalTitle = page.getByRole('dialog').getByRole('heading', { level: 2 });
        this.closeModalButton = page.getByRole('dialog').getByRole('button', { name: 'Close' });
        this.keyInput = page.getByPlaceholder('e.g. ab-1734-ib8');
        this.labelInput = page.getByPlaceholder('e.g. 8-Point Digital Input Module');
        this.ioPointsInput = page.getByRole('dialog').getByRole('spinbutton').first();
        this.ioPointTypeInput = page.getByPlaceholder('e.g. digital-input');
        this.descriptionInput = page.getByPlaceholder('e.g. Digital input module for 24V DC signals');
        this.manufacturerSelect = page.getByRole('dialog').getByRole('combobox').first();
        this.familySelect = page.getByRole('dialog').getByRole('combobox').last();
        this.saveButton = page.getByRole('button', { name: 'Save IO Module' });
        this.cancelButton = page.getByRole('dialog').getByRole('button', { name: 'Cancel' });

        // Delete confirmation modal
        this.deleteConfirmButton = page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true });
        this.deleteModalText = page.getByRole('dialog').getByRole('paragraph');
    }

    // ─── Navigation ──────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();

        if (currentUrl.includes('/io-modules')) {
            // Already on the page — just wait for data
        } else if (currentUrl.includes('app.dev.dap.daedalusindustrial.com')) {
            // Use the sidebar link for client-side React Router navigation.
            // page.goto('/io-modules') does a full HTTP reload which wipes the in-memory
            // auth token, causing Auth0 to require interactive re-login every time.
            const ioLink = this.page.locator('a[href="/io-modules"]');
            if (!await ioLink.isVisible()) {
                await this.page.getByRole('button', { name: 'Panels' }).click();
            }
            await ioLink.click();
        } else {
            await this.page.goto('/io-modules');
        }

        await this.page.getByText(/Showing [1-9]/).waitFor({ timeout: 15000 });
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }

    // ─── Page actions ────────────────────────────────────────────────────────────

    async clickAddIOModule() {
        await this.addButton.click();
    }

    async search(text: string) {
        await this.searchInput.fill(text);
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

    async clickPageNumber(n: number) {
        const prevText = (await this.paginationInfo.innerText()).trim();
        await this.page.getByRole('button', { name: String(n), exact: true }).click();
        await this.waitForPaginationChange(prevText);
    }

    private async waitForPaginationChange(prevText: string) {
        await expect(async () => {
            const currentText = (await this.paginationInfo.innerText({ timeout: 3000 })).trim();
            expect(currentText).not.toBe(prevText);
            expect(currentText).toMatch(/Showing \d+-\d+ of \d+ items/);
        }).toPass({ timeout: 15000 });
    }

    // ─── Table row actions ───────────────────────────────────────────────────────

    getRow(moduleName: string): Locator {
        return this.table.getByRole('row').filter({ hasText: moduleName });
    }

    async clickEditByModule(moduleName: string) {
        await this.getRow(moduleName).getByRole('button', { name: 'Edit IO module' }).click();
    }

    async clickDeleteByModule(moduleName: string) {
        await this.getRow(moduleName).getByRole('button', { name: 'Delete IO module' }).click();
    }

    // ─── Add / Edit modal actions ────────────────────────────────────────────────

    async fillIOModuleForm({ key, label, ioPoints, ioPointType, description, manufacturer, family }: IOModuleFormData) {
        if (key !== undefined) await this.keyInput.fill(key);
        await this.labelInput.fill(label);
        await this.ioPointsInput.fill(String(ioPoints));
        if (ioPointType !== undefined) await this.ioPointTypeInput.fill(ioPointType);
        if (description !== undefined) await this.descriptionInput.fill(description);
        if (manufacturer !== undefined) {
            await this.manufacturerSelect.click();
            await this.page.getByRole('option', { name: manufacturer, exact: true }).first().click();
        }
        if (family !== undefined) {
            await this.familySelect.click();
            await this.page.getByRole('option', { name: family, exact: true }).first().click();
        }
    }

    async saveIOModule() {
        await this.saveButton.click();
        await expect(this.modal).not.toBeVisible({ timeout: 10000 });
    }

    async cancelModal() {
        await this.cancelButton.click();
    }

    async closeModal() {
        await this.closeModalButton.click();
    }

    async dismissModalIfOpen() {
        if (await this.modal.isVisible()) {
            await this.closeModalButton.click();
        }
    }

    // ─── Delete confirmation actions ─────────────────────────────────────────────

    async confirmDelete() {
        await this.deleteConfirmButton.click();
    }

    async cancelDelete() {
        await this.cancelButton.click();
    }

    // ─── Assertions ──────────────────────────────────────────────────────────────

    async assertPageLoaded() {
        await expect(this.pageTitle).toBeVisible();
        await expect(this.addButton).toBeVisible();
        await expect(this.table).toBeVisible();
    }

    async assertModalVisible(expectedTitle: 'Add IO Module' | 'Edit IO Module' | 'Delete IO Module') {
        await expect(this.modalTitle).toHaveText(expectedTitle);
    }

    async assertModalClosed() {
        await expect(this.modal).not.toBeVisible();
    }

    async assertRowVisible(moduleName: string) {
        await expect(this.getRow(moduleName)).toBeVisible({ timeout: 10000 });
    }

    async assertRowNotInTable(moduleName: string) {
        await expect(this.table).not.toContainText(moduleName);
    }

    async assertPaginationInfo(text: string) {
        await expect(this.paginationInfo).toContainText(text);
    }

    async assertDeleteConfirmationVisible(label: string) {
        await expect(this.deleteModalText).toContainText(label);
    }

    async assertCurrentPage(n: number) {
        await expect(this.page.getByRole('button', { name: String(n), exact: true })).toBeDisabled({ timeout: 10000 });
    }
}
