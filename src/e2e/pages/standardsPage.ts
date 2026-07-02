import { Page, Locator, expect } from '@playwright/test';

export class StandardsPage {
    private readonly page: Page;

    private readonly pageTitle: Locator;
    private readonly createNewStandardButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.pageTitle = page.getByRole('heading', { name: 'Standards', level: 1 });
        this.createNewStandardButton = page.getByRole('button', { name: 'Create New Standard' });
    }

    // ─── Navigation ───────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.match(/\/standards\/?$/) || currentUrl.includes('/standards?')) {
            // Already on standards list
        } else if (currentUrl.includes('daedalusindustrial.com')) {
            const panelsBtn = this.page.getByRole('button', { name: 'Panels' });
            const isExpanded = await panelsBtn.getAttribute('aria-expanded');
            if (!isExpanded || isExpanded === 'false') {
                await panelsBtn.click();
            }
            await this.page.locator('a[href="/standards"]').click();
        } else {
            await this.page.goto('/standards');
        }
        await this.pageTitle.waitFor({ timeout: 15000 });
    }

    // ─── Standard creation (3-step dialog) ───────────────────────────────────────

    async createStandard(templateName: string, standardName: string) {
        await this.createNewStandardButton.click();
        await this.page.getByRole('dialog').waitFor({ timeout: 5000 });
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

        // Step 1: Select template by its accessible name (contains the template name)
        await this.page.getByRole('button', { name: new RegExp(templateName) }).click();
        await this.page.getByRole('button', { name: /Next: Name your Standard/ }).click();

        // Step 2: Name the standard
        await this.page.getByRole('textbox', { name: 'Enter standard name' }).fill(standardName);
        await this.page.getByRole('button', { name: /Next: Assign Companies/ }).click();

        // Step 3: Skip company assignment, create immediately
        await this.page.getByRole('button', { name: 'Create Standard', exact: true }).click();

        // Redirects to the standard detail page
        await this.page.waitForURL(/\/standards\/[a-z0-9]+$/, { timeout: 15000 });
    }

    // ─── Standard detail → editor navigation ─────────────────────────────────────

    async gotoStandardEditor() {
        await this.page.getByRole('link', { name: 'View and Edit Standard' }).click();
        await this.page.waitForURL(/\/standards\/template\/edit/, { timeout: 15000 });
    }

    // ─── Editor actions ───────────────────────────────────────────────────────────

    async saveAsDraftFromEditor() {
        await this.page.getByRole('button', { name: 'Save as Draft' }).click();
        // Brief wait for the save request to complete
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }

    // Clicking "Back" triggers a "Leave this page?" confirmation dialog.
    async navigateBackFromEditor() {
        await this.page.getByRole('button', { name: 'Back', exact: true }).click();
        const leaveBtn = this.page.getByRole('button', { name: 'Leave this page' });
        await leaveBtn.waitFor({ state: 'visible', timeout: 5000 });
        await leaveBtn.click();
        // Returns to the standard detail page (/standards/<id>)
        await this.page.waitForURL(/\/standards\/[a-z0-9]+$/, { timeout: 10000 });
    }

    // ─── Standards list actions ───────────────────────────────────────────────────

    async openStandard(name: string) {
        // Standard list items are <link> elements whose accessible name includes the standard name
        await this.page.getByRole('link').filter({ hasText: name }).first().click();
        await this.page.waitForURL(/\/standards\/[a-z0-9]+$/, { timeout: 10000 });
    }

    // ─── Assertions: standards list ───────────────────────────────────────────────

    async assertStandardVisible(name: string) {
        await expect(
            this.page.getByRole('link').filter({ hasText: name }).first(),
        ).toBeVisible({ timeout: 10000 });
    }

    // ─── Assertions: standard editor ─────────────────────────────────────────────

    async assertSectionVisible(sectionName: string) {
        await expect(this.page.getByText(sectionName, { exact: true }).first()).toBeVisible({ timeout: 10000 });
    }

    async assertRackVisible(rackName: string) {
        await expect(this.page.getByRole('heading', { name: rackName, level: 3 }).first()).toBeVisible();
    }

    async assertDropdownVisible(dropdownTitle: string) {
        await expect(this.page.locator('p').filter({ hasText: dropdownTitle }).first()).toBeVisible();
    }

    async assertDropdownHasOptions(dropdownTitle: string, expectedOptions: string[]) {
        const titleParagraph = this.page.locator('p').filter({ hasText: dropdownTitle }).first();
        const contentArea = titleParagraph.locator('..');
        for (const option of expectedOptions) {
            await expect(contentArea.locator('p').filter({ hasText: option }).first()).toBeVisible();
        }
    }

    // "RULE APPLIED" badge appears on options that have at least one rule bound to them.
    // This is the primary visual indicator that rule inheritance from the template worked.
    async assertRuleAppliedToOption(dropdownTitle: string, optionLabel: string) {
        const titleParagraph = this.page.locator('p').filter({ hasText: dropdownTitle }).first();
        const contentArea = titleParagraph.locator('..');
        const optionRow = contentArea.locator('p').filter({ hasText: optionLabel }).first().locator('..');
        await expect(optionRow.getByText('RULE APPLIED').first()).toBeVisible({ timeout: 5000 });
    }

    async assertOptionHasNoRuleApplied(dropdownTitle: string, optionLabel: string) {
        const titleParagraph = this.page.locator('p').filter({ hasText: dropdownTitle }).first();
        const contentArea = titleParagraph.locator('..');
        const optionRow = contentArea.locator('p').filter({ hasText: optionLabel }).first().locator('..');
        await expect(optionRow.getByText('RULE APPLIED')).not.toBeVisible({ timeout: 5000 });
    }
}
