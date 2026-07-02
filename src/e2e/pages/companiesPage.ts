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

    // ─── Create Company dialog ────────────────────────────────────────────────────
    private readonly createCompanyDialog: Locator;
    private readonly createCompanyNameInput: Locator;
    private readonly createCompanyZipInput: Locator;
    private readonly createCompanySubmitButton: Locator;

    // ─── Edit Company dialog ──────────────────────────────────────────────────────
    private readonly editCompanyDialog: Locator;
    private readonly editCompanyNameInput: Locator;
    private readonly editCompanyZipInput: Locator;
    private readonly editCompanySubmitButton: Locator;

    // ─── Delete Company dialog ────────────────────────────────────────────────────
    private readonly deleteCompanyDialog: Locator;

    // ─── Link User dialog (Company Users tab) ─────────────────────────────────────
    // Uses `has` with exact heading to avoid matching "Unlink User" dialog
    private readonly linkUserDialog: Locator;

    // ─── Link Collaborator dialog (Outside Collaborators tab) ────────────────────
    private readonly linkCollaboratorDialog: Locator;

    constructor(page: Page) {
        this.page = page;

        this.listTab             = page.getByRole('button', { name: 'List' });
        this.archivedTab         = page.getByRole('button', { name: 'Archived' });
        this.addCompanyButton    = page.getByRole('button', { name: 'Add Company' });
        this.searchInput         = page.getByRole('main').getByPlaceholder('Search...').first();
        this.table               = page.getByRole('table').first();
        this.paginationInfo      = page.getByText(/Showing \d+-\d+ of \d+ companies/);
        this.previousPageButton  = page.getByRole('button', { name: 'Previous' }).first();
        this.nextPageButton      = page.getByRole('button', { name: 'Next' }).first();

        this.noSelectionHeading  = page.getByRole('heading', { name: 'You have not selected a company yet', level: 3 });

        this.createCompanyDialog       = page.locator('dialog').filter({ hasText: 'Create Company' });
        this.createCompanyNameInput    = this.createCompanyDialog.getByPlaceholder('Enter company name');
        this.createCompanyZipInput     = this.createCompanyDialog.getByPlaceholder('Enter zip code');
        this.createCompanySubmitButton = this.createCompanyDialog.getByRole('button', { name: 'Create Company' });

        this.editCompanyDialog         = page.locator('dialog').filter({ hasText: 'Edit Company' });
        this.editCompanyNameInput      = this.editCompanyDialog.getByPlaceholder('Enter company name');
        this.editCompanyZipInput       = this.editCompanyDialog.getByPlaceholder('Enter zip code');
        this.editCompanySubmitButton   = this.editCompanyDialog.getByRole('button', { name: 'Edit Company' });

        this.deleteCompanyDialog = page.locator('dialog').filter({ hasText: 'Delete Company' });

        // exact heading prevents matching "Unlink User" which also contains "user"
        this.linkUserDialog = page.locator('dialog').filter({
            has: page.getByRole('heading', { name: 'Link User', exact: true }),
        });

        this.linkCollaboratorDialog = page.locator('dialog').filter({
            has: page.getByRole('heading', { name: 'Link Collaborator', exact: true }),
        });
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

    // ─── List tab actions ─────────────────────────────────────────────────────────

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

    // ─── Page assertions ─────────────────────────────────────────────────────────

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
            this.table.getByRole('row').filter({ hasText: companyName }).first()
        ).toBeVisible({ timeout: 10000 });
    }

    async assertCompanyNotVisible(companyName: string) {
        await expect(this.table).not.toContainText(companyName);
    }

    async assertPaginationInfo(text: string) {
        await expect(this.paginationInfo).toContainText(text);
    }

    // Parses "Showing {start}-{end} of {total} companies" and throws if malformed.
    async getPaginationStats(): Promise<{ start: number; end: number; total: number }> {
        const text = (await this.paginationInfo.innerText({ timeout: 8000 })).trim();
        const match = text.match(/Showing (\d+)-(\d+) of (\d+) companies/);
        if (!match) throw new Error(`Pagination text did not match expected format: "${text}"`);
        return {
            start: parseInt(match[1], 10),
            end:   parseInt(match[2], 10),
            total: parseInt(match[3], 10),
        };
    }

    async assertValidPaginationRange() {
        const { start, end, total } = await this.getPaginationStats();

        if (total === 0) {
            expect(start, `start must be 0 when total is 0, got ${start}`).toBe(0);
            expect(end,   `end must be 0 when total is 0, got ${end}`).toBe(0);
        } else {
            expect(start, `start must be ≥ 1, got ${start}`).toBeGreaterThanOrEqual(1);
            expect(end,   `end (${end}) must be ≥ start (${start})`).toBeGreaterThanOrEqual(start);
            expect(end,   `end (${end}) must be ≤ total (${total})`).toBeLessThanOrEqual(total);

            const dataRows = await this.table.locator('tbody').getByRole('row').count();
            const expectedRows = end - start + 1;
            expect(dataRows, `visible rows (${dataRows}) must match pagination range ${start}–${end} (expected ${expectedRows})`).toBe(expectedRows);
        }
    }

    // ─── Select company and load detail panel ─────────────────────────────────────

    async selectCompanyByName(companyName: string) {
        await this.search(companyName);
        await this.page.getByRole('main').getByRole('button', { name: companyName, exact: true }).first().click();
        await this.page.getByRole('button', { name: 'Link Users' }).waitFor({ timeout: 10000 });
    }

    // ─── Create Company ───────────────────────────────────────────────────────────

    async assertCreateCompanyDialogOpen() {
        await expect(this.createCompanyDialog).toBeVisible({ timeout: 5000 });
        await this.createCompanySubmitButton.waitFor({ state: 'visible' });
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    }

    async fillCreateCompanyForm(name: string, zipCode = '00000') {
        await this.createCompanyNameInput.click();
        await this.createCompanyNameInput.pressSequentially(name);
        if (zipCode) {
            await this.createCompanyZipInput.click();
            await this.createCompanyZipInput.pressSequentially(zipCode);
        }
    }

    async submitCreateCompanyForm() {
        await this.createCompanySubmitButton.click();
    }

    // The "Create Company" button is disabled until required fields (name + zip) are filled
    async assertCreateCompanyButtonDisabled() {
        await expect(this.createCompanySubmitButton).toBeDisabled();
    }

    async assertDuplicateNameError() {
        await expect(
            this.createCompanyDialog.getByText('Company with this name already exists')
        ).toBeVisible({ timeout: 8000 });
    }

    // ─── Edit Company ─────────────────────────────────────────────────────────────

    async openEditCompanyDialog(companyName: string) {
        await this.table
            .getByRole('row')
            .filter({ hasText: companyName })
            .getByRole('button', { name: 'Edit', exact: true })
            .click();
        await expect(this.editCompanyDialog).toBeVisible({ timeout: 5000 });
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    }

    async fillEditCompanyForm(newName: string, zipCode = '00000') {
        await this.editCompanyNameInput.click();
        await this.page.keyboard.press('Control+a');
        await this.editCompanyNameInput.pressSequentially(newName);
        if (zipCode) {
            await this.editCompanyZipInput.click();
            await this.editCompanyZipInput.pressSequentially(zipCode);
        }
    }

    async submitEditCompanyForm() {
        await this.editCompanySubmitButton.click();
        await expect(this.editCompanyDialog).not.toBeVisible({ timeout: 10000 });
    }

    // ─── Delete Company ───────────────────────────────────────────────────────────

    async openDeleteCompanyDialog(companyName: string) {
        await this.table
            .getByRole('row')
            .filter({ hasText: companyName })
            .getByRole('button', { name: 'Delete', exact: true })
            .click();
        await expect(this.deleteCompanyDialog).toBeVisible({ timeout: 5000 });
    }

    async confirmDeleteCompany() {
        await this.deleteCompanyDialog.getByRole('button', { name: 'Delete' }).click();
        await expect(this.deleteCompanyDialog).not.toBeVisible({ timeout: 10000 });
    }

    // ─── Company Users tab: link / unlink ─────────────────────────────────────────

    async linkUser(email: string) {
        await this.page.getByRole('button', { name: 'Link Users' }).click();
        await expect(this.linkUserDialog).toBeVisible({ timeout: 5000 });
        await this.linkUserDialog.locator('#users-select').click();
        await this.linkUserDialog.locator('#users-select').fill(email);
        await this.page.waitForTimeout(400);
        await this.page.getByRole('option', { name: new RegExp(email, 'i') }).click();
        await this.linkUserDialog.getByRole('button', { name: 'Link User' }).click();
        await expect(this.linkUserDialog).not.toBeVisible({ timeout: 10000 });
    }

    async unlinkUser(email: string) {
        const row = this.page.locator('td', { hasText: email }).first().locator('..');
        await row.getByRole('button', { name: 'Unlink' }).click();
        const confirmDialog = this.page.locator('dialog').filter({
            has: this.page.getByRole('heading', { name: 'Unlink User', exact: true }),
        });
        await expect(confirmDialog).toBeVisible({ timeout: 5000 });
        await confirmDialog.getByRole('button', { name: 'Unlink User' }).click();
        await expect(confirmDialog).not.toBeVisible({ timeout: 10000 });
    }

    async assertUserInCompanyUsers(email: string) {
        await expect(
            this.page.locator('td', { hasText: email }).first()
        ).toBeVisible({ timeout: 60000 });
    }

    async assertUserNotInCompanyUsers(email: string) {
        await expect(
            this.page.getByText(/Showing \d+-\d+ of \d+ users/)
        ).toBeVisible({ timeout: 60000 });
        await expect(
            this.page.locator('td', { hasText: email })
        ).not.toBeVisible({ timeout: 5000 });
    }

    // ─── Outside Collaborators tab: link / unlink ─────────────────────────────────

    async clickOutsideCollaboratorsTab() {
        await this.page.getByRole('button', { name: 'Outside Collaborators' }).click();
    }

    async linkOutsideCollaborator(email: string) {
        await this.page.getByRole('button', { name: 'Link Users' }).click();
        await expect(this.linkCollaboratorDialog).toBeVisible({ timeout: 5000 });
        await this.linkCollaboratorDialog.locator('#users-select').click();
        await this.linkCollaboratorDialog.locator('#users-select').fill(email);
        await this.page.waitForTimeout(400);
        await this.page.getByRole('option', { name: new RegExp(email, 'i') }).click();
        await this.linkCollaboratorDialog.getByRole('button', { name: 'Link Collaborator' }).click();
        await expect(this.linkCollaboratorDialog).not.toBeVisible({ timeout: 10000 });
    }

    // Opens "Link Collaborator" and submits without asserting success — used to trigger duplicate-role error
    async tryLinkCollaborator(email: string) {
        await this.page.getByRole('button', { name: 'Link Users' }).click();
        await expect(this.linkCollaboratorDialog).toBeVisible({ timeout: 5000 });
        await this.linkCollaboratorDialog.locator('#users-select').click();
        await this.linkCollaboratorDialog.locator('#users-select').fill(email);
        await this.page.waitForTimeout(400);
        await this.page.getByRole('option', { name: new RegExp(email, 'i') }).click();
        await this.linkCollaboratorDialog.getByRole('button', { name: 'Link Collaborator' }).click();
    }

    async unlinkOutsideCollaborator(email: string) {
        const row = this.page.locator('td', { hasText: email }).first().locator('..');
        await row.getByRole('button', { name: 'Unlink' }).click();
        const confirmDialog = this.page.locator('dialog').filter({
            has: this.page.getByRole('heading', { name: 'Unlink Collaborator', exact: true }),
        });
        await expect(confirmDialog).toBeVisible({ timeout: 5000 });
        await confirmDialog.getByRole('button', { name: 'Unlink Collaborator' }).click();
        await expect(confirmDialog).not.toBeVisible({ timeout: 10000 });
    }

    async assertCollaboratorInTable(email: string) {
        await expect(
            this.page.locator('td', { hasText: email }).first()
        ).toBeVisible({ timeout: 30000 });
    }

    async assertCollaboratorNotInTable(email: string) {
        await expect(
            this.page.locator('td', { hasText: email })
        ).not.toBeVisible({ timeout: 5000 });
    }

    async assertDuplicateRoleError() {
        await expect(
            this.linkCollaboratorDialog.getByText('This user is already a member of this company')
        ).toBeVisible({ timeout: 8000 });
    }
}
