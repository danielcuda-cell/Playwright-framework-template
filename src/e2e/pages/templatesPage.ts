import { Page, Locator, expect } from '@playwright/test';

export class TemplatesPage {
    private readonly page: Page;

    // ─── Templates list ───────────────────────────────────────────────────────────
    private readonly pageTitle: Locator;
    private readonly createNewTemplateButton: Locator;
    private readonly backButton: Locator;

    // ─── Create template dialog ───────────────────────────────────────────────────
    private readonly templateNameDialogInput: Locator;
    private readonly confirmCreateButton: Locator;

    // ─── Template editor ──────────────────────────────────────────────────────────
    private readonly addSectionButton: Locator;
    private readonly saveAsDraftButton: Locator;
    private readonly editButton: Locator;

    // ─── Component editor (inline) ───────────────────────────────────────────────
    private readonly dropdownTitleInput: Locator;
    private readonly addOptionButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Templates list
        this.pageTitle = page.getByRole('heading', { name: 'Templates', level: 1 });
        this.createNewTemplateButton = page.getByRole('button', { name: 'Create New Template' });
        this.backButton = page.getByRole('button', { name: 'Back', exact: true });

        // Create dialog
        this.templateNameDialogInput = page.getByRole('textbox', { name: 'Enter template name' });
        this.confirmCreateButton = page.getByRole('dialog').getByRole('button', { name: 'Create New Template' });

        // Editor
        this.addSectionButton = page.getByRole('button', { name: 'Add section' });
        this.saveAsDraftButton = page.getByRole('button', { name: 'Save as Draft' });
        this.editButton = page.getByRole('button', { name: 'Edit', exact: true });

        // Component editor
        this.dropdownTitleInput = page.getByRole('textbox', { name: 'Type dropdown title here...' });
        this.addOptionButton = page.getByRole('button', { name: 'Add Option' });
    }

    // ─── Navigation ───────────────────────────────────────────────────────────────

    async goto() {
        const currentUrl = this.page.url();
        if (currentUrl.includes('/templates') && !currentUrl.includes('/templates/')) {
            // Already on templates list
        } else if (currentUrl.includes('daedalusindustrial.com')) {
            const panelsBtn = this.page.getByRole('button', { name: 'Panels' });
            const isExpanded = await panelsBtn.getAttribute('aria-expanded');
            if (!isExpanded || isExpanded === 'false') {
                await panelsBtn.click();
            }
            await this.page.locator('a[href="/templates"]').click();
        } else {
            await this.page.goto('/templates');
        }
        await this.pageTitle.waitFor({ timeout: 15000 });
    }

    async clickBack() {
        await this.backButton.click();
        await this.pageTitle.waitFor({ timeout: 10000 });
    }

    // ─── Templates list actions ───────────────────────────────────────────────────

    async clickCreateNewTemplate() {
        await this.createNewTemplateButton.click();
        await this.page.getByRole('dialog').waitFor({ timeout: 5000 });
    }

    async fillCreateTemplateForm(name: string, panelType: string) {
        await this.templateNameDialogInput.fill(name);
        await this.page.getByRole('dialog').getByRole('combobox').click();
        await this.page.getByRole('option', { name: panelType, exact: true }).click();
        await this.confirmCreateButton.click();
        await this.addSectionButton.waitFor({ timeout: 15000 });
    }

    async filterByStatus(status: string) {
        await this.page.getByRole('main').getByRole('combobox').first().click();
        await this.page.getByRole('option', { name: new RegExp(status) }).first().click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }

    async openTemplate(name: string) {
        await this.page.getByRole('button', { name: `Open template ${name}` }).click();
        await this.page.waitForURL(/\/templates\/view/, { timeout: 15000 });
    }

    // ─── Editor: Section actions ──────────────────────────────────────────────────

    async addSection(name: string) {
        await this.addSectionButton.click();
        const newSectionLabel = this.page.getByRole('button', { name: 'Edit label' }).filter({ hasText: 'New section' });
        await newSectionLabel.dblclick();
        const nameInput = this.page.getByRole('textbox', { name: 'Enter a name' });
        await nameInput.fill(name);
        await nameInput.press('Enter');
        await expect(this.page.getByRole('button', { name: 'Edit label' }).filter({ hasText: name })).toBeVisible();
    }

    // ─── Editor: Component actions ────────────────────────────────────────────────

    async addComponentToSection(sectionName: string, componentType: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });
        await section.getByRole('button', { name: 'Add Component' }).last().click();
        await this.page.getByRole('list').getByRole('button', { name: componentType, exact: true }).click();
    }

    async addDropdownToRack(rackName: string, dropdownTitle: string, options: string[]) {
        const rackContainer = this.page.getByRole('heading', { name: rackName, level: 3 }).locator('../..');
        await rackContainer.getByRole('button', { name: 'Add Component' }).click();
        await this.page.getByRole('list').getByRole('button', { name: 'Dropdown', exact: true }).click();

        await this.dropdownTitleInput.fill(dropdownTitle);

        for (const _option of options) {
            await this.addOptionButton.click();
        }

        for (let i = 0; i < options.length; i++) {
            await this.page.getByRole('textbox', { name: `Option ${i + 1}` }).fill(options[i]);
        }

        await this.page.getByRole('button', { name: 'Save', exact: true }).last().click();
        // After save the title becomes a paragraph (edit mode closes)
        await expect(this.dropdownTitleInput).not.toBeVisible({ timeout: 5000 });
    }

    // ─── Rules: shared helpers ────────────────────────────────────────────────────

    private async openRulesDialogForOption(dropdownTitle: string, optionLabel: string) {
        const titleParagraph = this.page.locator('p').filter({ hasText: dropdownTitle }).first();
        const contentArea = titleParagraph.locator('..');
        const optionRow = contentArea.locator('p').filter({ hasText: optionLabel }).first().locator('..');
        await optionRow.getByRole('button', { name: 'Add rule' }).click();
        await this.page.getByRole('heading', { name: 'Add Rule', level: 2 }).waitFor({ timeout: 5000 });
    }

    private async saveRuleRow() {
        // Save the newly-added (unsaved) rule row within the dialog
        await this.page
            .getByRole('dialog')
            .getByRole('button', { name: 'Save', exact: true })
            .last()
            .click();
    }

    private async closeRulesDialog() {
        // Use aria-label to target the X icon button, not the "Close" text button
        await this.page.getByRole('dialog').getByLabel('Close').click();
        await expect(this.page.getByRole('heading', { name: 'Add Rule', level: 2 })).not.toBeVisible();
    }

    // ─── Rules: Visibility ────────────────────────────────────────────────────────

    async addVisibilityRule(dropdownTitle: string, optionLabel: string, targetComponentName: string) {
        await this.openRulesDialogForOption(dropdownTitle, optionLabel);
        const dialog = this.page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Visibility' }).click();
        await dialog.getByRole('button', { name: '+ Add rule' }).click();
        await dialog.getByRole('checkbox', {
            name: new RegExp(`Toggle visibility target: ${targetComponentName}`),
        }).click();
        await this.saveRuleRow();
        await this.closeRulesDialog();
    }

    // ─── Rules: Filter ────────────────────────────────────────────────────────────

    async addFilterRule(
        dropdownTitle: string,
        optionLabel: string,
        targetComponentName: string,
        allowedValues: string[],
    ) {
        await this.openRulesDialogForOption(dropdownTitle, optionLabel);
        const dialog = this.page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Filter' }).click();
        await dialog.getByRole('button', { name: '+ Add rule' }).click();

        // First combobox = target component; second = allowed values (multi-select)
        await dialog.getByRole('combobox').first().click();
        await this.page.getByRole('option', { name: new RegExp(targetComponentName) }).click();

        for (const value of allowedValues) {
            await dialog.getByRole('combobox').last().click();
            await this.page.getByRole('option', { name: value, exact: true }).click();
        }

        await this.saveRuleRow();
        await this.closeRulesDialog();
    }

    // ─── Rules: Autoselect ────────────────────────────────────────────────────────

    async addAutoselectRule(
        dropdownTitle: string,
        optionLabel: string,
        targetComponentName: string,
        defaultValue: string,
    ) {
        await this.openRulesDialogForOption(dropdownTitle, optionLabel);
        const dialog = this.page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Autoselect' }).click();
        await dialog.getByRole('button', { name: '+ Add rule' }).click();

        // First combobox = target component; second = default value
        await dialog.getByRole('combobox').first().click();
        await this.page.getByRole('option', { name: new RegExp(targetComponentName) }).click();

        await dialog.getByRole('combobox').last().click();
        await this.page.getByRole('option', { name: defaultValue, exact: true }).click();

        await this.saveRuleRow();
        await this.closeRulesDialog();
    }

    // ─── Editor: Save / Publish ───────────────────────────────────────────────────

    async saveAsDraft() {
        await this.saveAsDraftButton.click();
        await expect(this.editButton).toBeVisible({ timeout: 15000 });
    }

    async publish() {
        await this.page.getByRole('button', { name: 'Publish', exact: true }).click();
        // Brief wait for the publish request to complete before navigating away
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }

    async enterEditMode() {
        await this.editButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.editButton.click();
        await this.addSectionButton.waitFor({ state: 'visible', timeout: 15000 });
    }

    // ─── Assertions ───────────────────────────────────────────────────────────────

    async assertPageLoaded() {
        await expect(this.pageTitle).toBeVisible();
        await expect(this.createNewTemplateButton).toBeVisible();
    }

    async assertTemplateVisible(name: string) {
        await expect(
            this.page.getByRole('button', { name: `Open template ${name}` }),
        ).toBeVisible({ timeout: 10000 });
    }

    async assertSectionVisible(sectionName: string) {
        // Works in both view mode (generic text) and edit mode (inside Edit label button)
        await expect(this.page.getByText(sectionName, { exact: true }).first()).toBeVisible({ timeout: 10000 });
    }

    async assertRackVisible(rackName: string) {
        await expect(this.page.getByRole('heading', { name: rackName, level: 3 })).toBeVisible();
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

    async assertRulesAppliedToDropdown(dropdownTitle: string) {
        const titleParagraph = this.page.locator('p').filter({ hasText: dropdownTitle }).first();
        const componentWrapper = titleParagraph.locator('../../..');
        await expect(componentWrapper.getByText('RULES APPLIED').first()).toBeVisible();
    }

    async assertRuleAppliedToOption(dropdownTitle: string, optionLabel: string) {
        const titleParagraph = this.page.locator('p').filter({ hasText: dropdownTitle }).first();
        const contentArea = titleParagraph.locator('..');
        const optionRow = contentArea.locator('p').filter({ hasText: optionLabel }).first().locator('..');
        await expect(optionRow.getByText('RULE APPLIED').first()).toBeVisible();
    }

    async assertOptionHasRuleConfigured(dropdownTitle: string, optionLabel: string) {
        // When rules exist, the button visible text changes from "Add rule" to "Edit rule"
        const titleParagraph = this.page.locator('p').filter({ hasText: dropdownTitle }).first();
        const contentArea = titleParagraph.locator('..');
        const optionRow = contentArea.locator('p').filter({ hasText: optionLabel }).first().locator('..');
        await expect(optionRow.getByText('Edit rule')).toBeVisible({ timeout: 5000 });
    }

    async assertOptionHasNoRule(dropdownTitle: string, optionLabel: string) {
        // Without rules, button text stays "Add rule" (not "Edit rule")
        const titleParagraph = this.page.locator('p').filter({ hasText: dropdownTitle }).first();
        const contentArea = titleParagraph.locator('..');
        const optionRow = contentArea.locator('p').filter({ hasText: optionLabel }).first().locator('..');
        await expect(optionRow.getByText('Add rule')).toBeVisible({ timeout: 5000 });
        await expect(optionRow.getByText('Edit rule')).not.toBeVisible();
    }

    async assertRulesSavedInDialog(dropdownTitle: string, optionLabel: string, ruleTypes: string[]) {
        await this.openRulesDialogForOption(dropdownTitle, optionLabel);
        const dialog = this.page.getByRole('dialog');
        for (const ruleType of ruleTypes) {
            const tabName = ruleType.charAt(0).toUpperCase() + ruleType.slice(1);
            await dialog.getByRole('button', { name: tabName }).click();
            await expect(dialog.getByText('No rules yet.')).not.toBeVisible({ timeout: 3000 });
        }
        await dialog.getByLabel('Close').click();
    }

    // ─── Rule content assertions (use in creation flow where dialog is accessible) ─

    /**
     * Opens the rules dialog for an option and verifies all three rule types
     * (Visibility, Filter, Autoselect) in a single dialog session.
     */
    async assertAllRulesForOption(
        dropdownTitle: string,
        optionLabel: string,
        expected: {
            visibility: { target: string };
            filter: { target: string; allowedValues: string[] };
            autoselect: { target: string; defaultValue: string };
        },
    ) {
        await this.openRulesDialogForOption(dropdownTitle, optionLabel);
        const dialog = this.page.getByRole('dialog');

        // ── Visibility rule ──
        await dialog.getByRole('button', { name: 'Visibility', exact: true }).click();
        // Saved row must show the target component name
        const visRow = dialog.getByRole('row').filter({ hasText: expected.visibility.target });
        await expect(visRow).toBeVisible({ timeout: 5000 });

        // ── Filter rule ──
        await dialog.getByRole('button', { name: 'Filter', exact: true }).click();
        // Saved row must show the target component and every allowed value
        const filterRow = dialog.getByRole('row').filter({ hasText: expected.filter.target });
        await expect(filterRow).toBeVisible({ timeout: 5000 });
        for (const value of expected.filter.allowedValues) {
            await expect(filterRow.getByText(value).first()).toBeVisible({ timeout: 5000 });
        }

        // ── Autoselect rule ──
        await dialog.getByRole('button', { name: 'Autoselect', exact: true }).click();
        // Saved row must show the target component and the default value
        const autoselectRow = dialog.getByRole('row').filter({ hasText: expected.autoselect.target });
        await expect(autoselectRow).toBeVisible({ timeout: 5000 });
        await expect(autoselectRow.getByText(expected.autoselect.defaultValue).first()).toBeVisible({ timeout: 5000 });

        await dialog.getByLabel('Close').click();
    }
}
