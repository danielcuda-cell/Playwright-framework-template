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
        } else if (currentUrl.includes('daedalusindustrial.com') && !currentUrl.includes('/templates/')) {
            // On another app page — navigate via sidebar
            const panelsBtn = this.page.getByRole('button', { name: 'Panels' });
            const isExpanded = await panelsBtn.getAttribute('aria-expanded');
            if (!isExpanded || isExpanded === 'false') {
                await panelsBtn.click();
            }
            await this.page.locator('a[href="/templates"]').click();
        } else {
            // Direct navigation: local env or already inside a specific template page
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
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
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
        // Brief wait for the section's DnD droppable zone to register after the React state update
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    }

    // ─── Editor: Component actions ────────────────────────────────────────────────

    async addComponentToSection(sectionName: string, componentType: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });
        await section.getByRole('button', { name: 'Add Component' }).last().click();
        await this.page.getByRole('list').getByRole('button', { name: componentType, exact: true }).click();
    }

    async addTextInputToSection(sectionName: string, label: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });
        await section.getByRole('button', { name: 'Add Component' }).last().click();
        await this.page.getByRole('list').getByRole('button', { name: 'Text input', exact: true }).click();
        const titleInput = this.page.getByRole('textbox', { name: 'Type text input title here...' });
        await titleInput.click();
        await titleInput.pressSequentially(label);
        await this.page.getByRole('button', { name: 'Save', exact: true }).last().click();
        await titleInput.waitFor({ state: 'hidden', timeout: 5000 });
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    }

    async addDropdownToRack(rackName: string, dropdownTitle: string, options: string[], sectionName?: string) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;
        const rackContainer = root.getByRole('heading', { name: rackName, level: 3 }).locator('../..');
        await rackContainer.getByRole('button', { name: 'Add Component' }).click();
        await this.page.getByRole('list').getByRole('button', { name: 'Dropdown', exact: true }).click();

        await this.dropdownTitleInput.click();
        await this.dropdownTitleInput.pressSequentially(dropdownTitle);

        for (const _option of options) {
            await this.addOptionButton.click();
        }

        for (let i = 0; i < options.length; i++) {
            const optInput = this.page.getByRole('textbox', { name: `Option ${i + 1}` });
            await optInput.click();
            await optInput.pressSequentially(options[i]);
        }

        // Scope Save to rackContainer — other components in the section may also have
        // inline Save buttons (disabled) and `.last()` on the page would pick those instead.
        await rackContainer.getByRole('button', { name: 'Save', exact: true }).last().click();
        // After save the title becomes a paragraph (edit mode closes)
        await expect(this.dropdownTitleInput).not.toBeVisible({ timeout: 5000 });
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
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

        // Clicking "Publish" opens a confirmation dialog — click "Confirm" to proceed.
        const dialog = this.page.getByRole('dialog');
        await dialog.waitFor({ state: 'visible', timeout: 10000 });
        await dialog.getByRole('button', { name: 'Confirm' }).click();

        // Wait for the actual publish API call to complete.
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
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
        ).toBeVisible({ timeout: 30000 });
    }

    // Polls the Active template list with full page reloads until the template appears.
    // Needed because the publish API returns before the read endpoint reflects the change.
    async waitForTemplateActive(name: string, totalTimeoutMs = 90000) {
        const deadline = Date.now() + totalTimeoutMs;
        while (Date.now() < deadline) {
            await this.page.goto('/templates');
            await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
            const found = await this.page
                .getByRole('button', { name: `Open template ${name}` })
                .isVisible({ timeout: 3000 })
                .catch(() => false);
            if (found) return;
            await this.page.waitForTimeout(5000);
        }
        throw new Error(`Template "${name}" did not appear in the Active list within ${totalTimeoutMs / 1000}s`);
    }

    async assertSectionVisible(sectionName: string) {
        // Works in both view mode (generic text) and edit mode (inside Edit label button)
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

    // ─── Rack size component ──────────────────────────────────────────────────────

    async addRackSizeToRack(rackName: string, sectionName?: string) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;
        const rackContainer = root.getByRole('heading', { name: rackName, level: 3 }).locator('../..');
        await rackContainer.getByRole('button', { name: 'Add Component' }).click();
        await this.page.getByRole('list').getByRole('button', { name: 'Rack size', exact: true }).click();
        // Title field already defaults to "Rack size" — no need to fill it.
        // Options are numeric spinbuttons; at least one is required before Save is accepted.
        await this.addOptionButton.click();
        const spinbutton = this.page.getByRole('spinbutton').last();
        await spinbutton.click();
        await spinbutton.pressSequentially('1');
        await rackContainer.getByRole('button', { name: 'Save', exact: true }).last().click();
        // Wait for the form to close (spinbutton disappears when saved)
        await spinbutton.waitFor({ state: 'hidden', timeout: 5000 });
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    }

    // ─── Assertions: text input and rack size ─────────────────────────────────────

    async assertTextInputVisible(label: string) {
        await expect(this.page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 5000 });
    }

    async assertRackSizeVisible(rackName: string, sectionName?: string) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;
        const rackContainer = root.getByRole('heading', { name: rackName, level: 3 }).locator('../..');
        await expect(rackContainer.getByText('Rack size').first()).toBeVisible({ timeout: 5000 });
    }

    // ─── Component order assertions ───────────────────────────────────────────────

    // Validates that labels appear top-to-bottom in the given order.
    // Pass empty string for sectionName to scope to the full page (e.g. validating section order).
    // Uses DOM order (document position) rather than viewport y-coordinates so the assertion
    // is scroll-independent.
    async assertSectionComponentsInOrder(sectionName: string, expectedLabels: string[]) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;

        if (sectionName) {
            await expect(root).toBeVisible({ timeout: 5000 });
        }

        // When sectionName is empty we're checking section ORDER — section names live in
        // buttons, not p/h3, so check the DOM order of <section> containers instead.
        const domIndices = sectionName
            ? await (root as import('@playwright/test').Locator).evaluate((rootEl, labels) => {
                const allTextEls = Array.from(rootEl.querySelectorAll('p, h3'));
                return labels.map((label: string) => allTextEls.findIndex(el => el.textContent?.trim() === label));
            }, expectedLabels)
            : await this.page.evaluate((labels) => {
                const sections = Array.from(document.querySelectorAll('section'));
                return labels.map((label: string) => sections.findIndex(s => s.textContent?.includes(label)));
            }, expectedLabels);

        for (let i = 0; i < domIndices.length - 1; i++) {
            expect(domIndices[i], `"${expectedLabels[i]}" not found in section`).toBeGreaterThanOrEqual(0);
            expect(domIndices[i + 1], `"${expectedLabels[i + 1]}" not found in section`).toBeGreaterThanOrEqual(0);
            expect(
                domIndices[i],
                `"${expectedLabels[i]}" (DOM pos ${domIndices[i]}) must appear before "${expectedLabels[i + 1]}" (DOM pos ${domIndices[i + 1]})`
            ).toBeLessThan(domIndices[i + 1]);
        }
    }

    // Same but scoped to a rack container.
    async assertRackComponentsInOrder(rackName: string, expectedLabels: string[], sectionName?: string) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;
        const rack = root.getByRole('heading', { name: rackName, level: 3 }).locator('../..');
        await expect(rack).toBeVisible({ timeout: 5000 });

        const domIndices = await rack.evaluate((rackEl, labels) => {
            const allTextEls = Array.from(rackEl.querySelectorAll('p, h3'));
            return labels.map(label => allTextEls.findIndex(el => el.textContent?.trim() === label));
        }, expectedLabels);

        for (let i = 0; i < domIndices.length - 1; i++) {
            expect(domIndices[i], `"${expectedLabels[i]}" not found in rack`).toBeGreaterThanOrEqual(0);
            expect(domIndices[i + 1], `"${expectedLabels[i + 1]}" not found in rack`).toBeGreaterThanOrEqual(0);
            expect(
                domIndices[i],
                `"${expectedLabels[i]}" (DOM pos ${domIndices[i]}) must appear before "${expectedLabels[i + 1]}" (DOM pos ${domIndices[i + 1]})`
            ).toBeLessThan(domIndices[i + 1]);
        }
    }

    // ─── Component reordering: arrow buttons ─────────────────────────────────────

    private async _clickMoveButton(
        componentTitle: string,
        ariaLabel: 'Move up' | 'Move down',
        sectionName?: string,
    ) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;

        // Walk up the DOM from the component title paragraph to find the nearest
        // ancestor that contains the target button. This handles both the "collapsed
        // idle" state (div[role=button] wrapper, all action btns disabled) and the
        // normal edit state (no wrapper, buttons directly enabled/disabled by logic).
        // Using DOM evaluate avoids ARIA leaf-node scoping issues with getByRole.
        const state = await root.evaluate((rootEl, { title, label }) => {
            const para = Array.from(rootEl.querySelectorAll('p'))
                .find(p => p.textContent && p.textContent.trim() === title);
            if (!para) return 'not_found';

            let el = para.parentElement;
            while (el && el !== rootEl) {
                const actionBtn = el.querySelector(`[aria-label="${label}"]`);
                if (actionBtn) {
                    if (!actionBtn.disabled) { actionBtn.click(); return 'clicked'; }
                    // Disabled: click the first unnamed enabled button (the expand toggle)
                    const toggle = Array.from(el.querySelectorAll('button'))
                        .find(b => !b.disabled && !b.getAttribute('aria-label'));
                    if (toggle) { toggle.click(); return 'toggled'; }
                    return 'disabled';
                }
                el = el.parentElement;
            }
            return 'not_found';
        }, { title: componentTitle, label: ariaLabel });

        if (state === 'toggled') {
            // Wait for React to re-render (remove disabled state after expand)
            await this.page.waitForTimeout(500);
            await root.evaluate((rootEl, { title, label }) => {
                const para = Array.from(rootEl.querySelectorAll('p'))
                    .find(p => p.textContent && p.textContent.trim() === title);
                if (!para) return;
                let el = para.parentElement;
                while (el && el !== rootEl) {
                    const btn = el.querySelector(`[aria-label="${label}"]`);
                    if (btn) { btn.click(); return; }
                    el = el.parentElement;
                }
            }, { title: componentTitle, label: ariaLabel });
        } else if (state !== 'clicked') {
            throw new Error(`${ariaLabel} for "${componentTitle}": ${state}`);
        }

        await this.page.waitForTimeout(300);
    }

    async moveComponentDown(componentTitle: string, sectionName?: string) {
        await this._clickMoveButton(componentTitle, 'Move down', sectionName);
    }

    async moveComponentUp(componentTitle: string, sectionName?: string) {
        await this._clickMoveButton(componentTitle, 'Move up', sectionName);
    }

    // ─── Component reordering: drag and drop ─────────────────────────────────────

    // Returns { handle: {x,y} for drag start (inner enabled toggle button),
    //           card: {x,y,w,h} for drop target bounding box }.
    // Component cards are div[role=button][aria-disabled=true] wrappers; the DnD
    // library doesn't start a drag from the disabled wrapper itself. The actual
    // drag handle is the first enabled unnamed <button> inside the card (the
    // Returns the drag-handle center and card bounds for a component card identified by label.
    // The outer card wrapper has aria-disabled="true" (dnd-kit accessibility marker) but the
    // inner grip handle element has aria-disabled="false" — that is the element dnd-kit attaches
    // its pointer-event listener to, so drag must start from there.
    private async _getCardInfo(root: import('@playwright/test').Locator, label: string) {
        return root.evaluate((rootEl, { label }) => {
            const textEl = Array.from(rootEl.querySelectorAll('p, h3'))
                .find(el => el.textContent?.trim() === label);
            if (!textEl) return null;

            // Walk up to find the card wrapper (first role=button ancestor)
            let cardEl: Element | null = textEl.parentElement;
            while (cardEl && cardEl !== rootEl) {
                if ((cardEl as HTMLElement).tagName === 'BUTTON' || cardEl.getAttribute('role') === 'button') break;
                cardEl = cardEl.parentElement;
            }
            if (!cardEl || cardEl === rootEl) return null;

            const cardRect = cardEl.getBoundingClientRect();

            // The real dnd-kit drag handle is a nested div[role="button"][aria-disabled="false"]
            // (a 20×20 grip icon on the left of the card header).
            let handleX = cardRect.x + cardRect.width / 2;
            let handleY = cardRect.y + cardRect.height / 2;
            const handle = cardEl.querySelector('[role="button"][aria-disabled="false"]') as HTMLElement | null;
            if (handle) {
                const hr = handle.getBoundingClientRect();
                if (hr.width > 0 && hr.height > 0) {
                    handleX = hr.x + hr.width / 2;
                    handleY = hr.y + hr.height / 2;
                }
            }

            return {
                handle: { x: handleX, y: handleY },
                card:   { x: cardRect.x, y: cardRect.y, w: cardRect.width, h: cardRect.height },
            };
        }, { label });
    }

    async reorderSectionComponentByDragDrop(sectionName: string, sourceLabel: string, targetLabel: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });

        // The RACK GROUP card is very tall (~514px) and fills most of the visible content area.
        // Its internal rack-component droppables (DROPDOWN, RACK SIZE) intercept pointer drops
        // anywhere inside RACK GROUP's bounds below the first ~80px. To land in the SECTION-LEVEL
        // sortable context we must drop inside RACK GROUP's outer header rows (≡ RACK GROUP label
        // row + Rack N name row = first ~80px of the card) which contain NO rack-component
        // droppables. To bring those header rows into the visible content area (below the ~190px
        // fixed app header) without pushing the source handle below the viewport, expand the
        // viewport to 900px tall and scroll the content container backward.
        await this.page.setViewportSize({ width: 1280, height: 900 });

        await section.getByText(sourceLabel, { exact: true }).first().scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(200);

        const srcInit = await this._getCardInfo(section, sourceLabel);
        const tgtInit = await this._getCardInfo(section, targetLabel);
        if (!srcInit || !tgtInit)
            throw new Error(`reorderSectionComponentByDragDrop: card not found for "${sourceLabel}" or "${targetLabel}"`);

        const CONTENT_Y = 190;
        const RACK_TOP_MIN = 215; // target card must be at least this far below the fixed header
        const viewportH = 900;

        if (tgtInit.card.y < RACK_TOP_MIN) {
            const needed = RACK_TOP_MIN - tgtInit.card.y;
            // Cap so source stays ≥50px above the new viewport bottom
            const maxBackward = Math.max(0, viewportH - 50 - srcInit.handle.y);
            const delta = -Math.min(needed, maxBackward);
            if (delta < 0) {
                await section.evaluate((sectionEl, d) => {
                    let el: HTMLElement | null = sectionEl.parentElement as HTMLElement;
                    while (el && el !== document.documentElement) {
                        const oy = window.getComputedStyle(el).overflowY;
                        if (oy === 'auto' || oy === 'scroll') {
                            el.scrollTop = Math.max(0, el.scrollTop + d);
                            return;
                        }
                        el = el.parentElement as HTMLElement;
                    }
                    window.scrollBy(0, d);
                }, delta);
                await this.page.waitForTimeout(200);
            }
        }

        const src = await this._getCardInfo(section, sourceLabel);
        const tgt = await this._getCardInfo(section, targetLabel);
        if (!src || !tgt)
            throw new Error(`reorderSectionComponentByDragDrop: card not found after scroll for "${sourceLabel}" or "${targetLabel}"`);

        const sx = src.handle.x;
        const sy_v = src.handle.y;
        const tx = tgt.card.x + tgt.card.w / 2;

        // Drop 60px below RACK GROUP card top = outer-header / rack-name row area.
        // Rack component droppables begin ~80px into the card (after two 40px header rows).
        const ty = Math.max(CONTENT_Y, tgt.card.y + 60);

        await this.page.mouse.move(sx, sy_v);
        await this.page.waitForTimeout(200);
        await this.page.mouse.down();
        await this.page.waitForTimeout(500);
        await this.page.mouse.move(tx, ty, { steps: 30 });
        await this.page.mouse.up();
        await this.page.waitForTimeout(800);
    }

    async reorderRackComponentByDragDrop(rackName: string, sourceLabel: string, targetLabel: string, sectionName?: string) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;

        // Scroll source into viewport first
        await root.getByText(sourceLabel, { exact: true }).first().scrollIntoViewIfNeeded();

        const src = await this._getCardInfo(root, sourceLabel);
        const tgt = await this._getCardInfo(root, targetLabel);
        if (!src || !tgt) throw new Error(`reorderRackComponentByDragDrop: card not found for "${sourceLabel}" or "${targetLabel}"`);

        const sx = src.handle.x;
        const sy = src.handle.y;
        const tx = tgt.card.x + tgt.card.w / 2;
        const ty = Math.max(170, tgt.card.y + tgt.card.h * 0.25);

        await this.page.mouse.move(sx, sy);
        await this.page.waitForTimeout(200);
        await this.page.mouse.down();
        // Hold 500ms without moving — satisfies dnd-kit's delay activation constraint.
        await this.page.waitForTimeout(500);
        await this.page.mouse.move(tx, ty, { steps: 30 });
        await this.page.mouse.up();
        await this.page.waitForTimeout(800);
    }

    // ─── Drag-and-drop: add components from palette ───────────────────────────────
    // The palette lives in a panel headed by an h2 "Components" with text
    // "Drag fields to sections". Each component type is a button in that panel.

    private paletteItem(componentType: string) {
        return this.page
            .getByRole('heading', { name: 'Components', level: 2 })
            .locator('../..')
            .getByRole('button', { name: componentType, exact: true });
    }

    // Drags a palette item onto target using manual mouse events with intermediate steps.
    // Targets 75% of the element height to skip headers and land in the content/drop zone.
    // page.mouse.move does not auto-scroll, so scrollIntoViewIfNeeded() must be called first.
    private async dragFromPaletteToElement(componentType: string, target: import('@playwright/test').Locator) {
        const src = this.paletteItem(componentType);
        await target.scrollIntoViewIfNeeded();

        const srcBox = await src.boundingBox();
        const tgtBox = await target.boundingBox();
        if (!srcBox || !tgtBox) throw new Error(`DnD bounding boxes not found for "${componentType}"`);

        const sx = srcBox.x + srcBox.width / 2;
        const sy = srcBox.y + srcBox.height / 2;
        const tx = tgtBox.x + tgtBox.width / 2;
        const ty = tgtBox.y + tgtBox.height * 0.75;

        await this.page.mouse.move(sx, sy);
        await this.page.mouse.down();
        await this.page.mouse.move(sx + 5, sy + 5, { steps: 5 });
        // Move DOWN within the palette column first to avoid crossing other sections' DnD zones,
        // then move RIGHT to the target. The palette column has no droppable zones.
        await this.page.mouse.move(sx, ty, { steps: 15 });
        await this.page.mouse.move(tx, ty, { steps: 15 });
        await this.page.mouse.up();
        await this.page.waitForTimeout(600);
    }

    async addComponentToSectionByDragDrop(sectionName: string, componentType: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });
        // Scroll the section so its BOTTOM edge is at the viewport bottom. After this scroll,
        // the section-level "Add Component" button (always the last item in the section) is
        // 20-60px from the viewport bottom — a safe drop zone below all component cards.
        await section.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'end' }));
        await this.page.waitForTimeout(100);

        const src = this.paletteItem(componentType);
        const srcBox = await src.boundingBox();
        const sectionBox = await section.boundingBox();
        if (!srcBox || !sectionBox) throw new Error(`DnD bounding boxes not found for "${componentType}"`);

        const sx = srcBox.x + srcBox.width / 2;
        const sy = srcBox.y + srcBox.height / 2;
        const tx = sectionBox.x + sectionBox.width / 2;
        // After block:'end' scroll, sectionBox.y + sectionBox.height ≈ viewport height.
        // Dropping 20px from the section bottom lands inside the section-level Add Component
        // button (40px tall, at the very end of the section) — never inside a rack card.
        const ty = sectionBox.y + sectionBox.height - 20;

        await this.page.mouse.move(sx, sy);
        await this.page.mouse.down();
        await this.page.mouse.move(sx + 5, sy + 5, { steps: 5 });
        await this.page.mouse.move(sx, ty, { steps: 15 });
        await this.page.mouse.move(tx, ty, { steps: 15 });
        await this.page.mouse.up();
        await this.page.waitForTimeout(600);
    }

    async addRackToSectionByDragDrop(sectionName: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });
        const src = this.paletteItem('Rack');
        // Scroll the section to the CENTER of the viewport so the horizontal drag phase
        // crosses only SECTION B's body and not other sections' DnD zones.
        await section.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
        const srcBox = await src.boundingBox();
        const sectionBox = await section.boundingBox();
        if (!srcBox || !sectionBox) throw new Error('DnD bounding boxes not found for Rack');
        const sx = srcBox.x + srcBox.width / 2;
        const sy = srcBox.y + srcBox.height / 2;
        const tx = sectionBox.x + sectionBox.width / 2;
        // Target the vertical center of the section element.
        const ty = sectionBox.y + sectionBox.height / 2;
        await this.page.mouse.move(sx, sy);
        await this.page.mouse.down();
        await this.page.mouse.move(sx + 5, sy + 5, { steps: 5 });
        // L-shaped: move down within the palette column (no DnD zones), then move right.
        // The right-phase crosses only this section's zone (section is at viewport center).
        await this.page.mouse.move(sx, ty, { steps: 15 });
        await this.page.mouse.move(tx, ty, { steps: 15 });
        await this.page.mouse.up();
        await this.page.waitForTimeout(600);
        // Wait for the rack heading to confirm the DnD succeeded before proceeding
        await section.getByRole('heading', { name: /Rack \d+/, level: 3 }).first()
            .waitFor({ state: 'visible', timeout: 8000 });
    }

    // ─── Delete actions ───────────────────────────────────────────────────────────

    // The rack delete button includes a UUID in its accessible name: "Remove rack {uuid}".
    async clickDeleteRack(rackName: string, sectionName?: string) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;
        const rackContainer = root.getByRole('heading', { name: rackName, level: 3 }).locator('../..');
        await rackContainer.getByRole('button', { name: /Remove rack/i }).click();
    }

    // "Rack Group" is the outer wrapper. Its delete button may be CSS-hidden until hover.
    // Walk the real DOM tree from the rack heading upward to find and click the button,
    // because the a11y tree collapses levels that XPath traversal would count differently.
    async clickDeleteRackGroup(rackName: string, sectionName?: string) {
        const clicked = await this.page.evaluate(([rName, sName]: string[]) => {
            const scope: Element = sName
                ? (Array.from(document.querySelectorAll('section')).find(s => s.textContent?.includes(sName)) ?? document.body)
                : document.body;
            const h3 = Array.from(scope.querySelectorAll('h3')).find(h => h.textContent?.trim() === rName);
            if (!h3) return false;
            let el: Element | null = h3.parentElement;
            while (el && el !== scope.parentElement) {
                const delBtn = Array.from(el.querySelectorAll('button')).find(b =>
                    b.getAttribute('aria-label')?.toLowerCase().includes('delete rack group') ||
                    b.textContent?.trim().toLowerCase().includes('delete rack group')
                );
                if (delBtn) {
                    delBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    return true;
                }
                el = el.parentElement;
            }
            return false;
        }, [rackName, sectionName ?? '']);
        if (!clicked) throw new Error(`Delete Rack Group button not found near "${rackName}"`);
    }

    // The section delete button includes a UUID: "Delete section {uuid}".
    async clickDeleteSection(sectionName: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });
        await section.getByRole('button', { name: /Delete section/i }).click();
    }

    async assertDeleteConfirmModalVisible() {
        await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }

    async cancelDeleteModal() {
        const dialog = this.page.getByRole('dialog');
        await dialog.getByRole('button', { name: /cancel/i }).click();
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
    }

    // ─── Constraint assertions ────────────────────────────────────────────────────

    // After 3 racks in a section, Rack is removed from the Add Component dropdown entirely.
    async assertRackOptionDisabledInSectionMenu(sectionName: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });
        // The section-level Add Component dropdown always includes "Text input".
        // Filtering on it makes the locator specific to that dropdown, not other <ul>s.
        const compMenu = this.page.getByRole('list').filter({
            has: this.page.getByRole('button', { name: 'Text input' }),
        });
        const addBtn = section.getByRole('button', { name: 'Add Component' }).last();
        await addBtn.click(); // open
        await expect(compMenu).toBeVisible({ timeout: 5000 });
        await expect(
            compMenu.getByRole('button', { name: 'Rack', exact: true })
        ).not.toBeVisible({ timeout: 3000 });
        await addBtn.click(); // close via toggle (Escape re-opens due to focus restoration)
        await expect(compMenu).not.toBeVisible({ timeout: 3000 });
    }

    // Rack size must NOT appear in the section-level Add Component menu.
    async assertRackSizeNotInSectionMenu(sectionName: string) {
        const section = this.page.locator('section').filter({ hasText: sectionName });
        const addBtn = section.getByRole('button', { name: 'Add Component' }).last();
        // Scope to the specific section-level dropdown (which always has "Text input").
        // This avoids matching other persistent <ul> elements on the page.
        const compMenu = this.page.getByRole('list').filter({
            has: this.page.getByRole('button', { name: 'Text input' }),
        });
        await addBtn.click(); // open
        await expect(compMenu).toBeVisible({ timeout: 5000 });
        await expect(
            compMenu.getByRole('button', { name: 'Rack size', exact: true })
        ).not.toBeVisible({ timeout: 3000 });
        await addBtn.click(); // close via toggle (Escape re-opens due to focus restoration)
        await expect(compMenu).not.toBeVisible({ timeout: 3000 });
    }

    // After one Rack size is added, the option must be disabled in that rack's menu.
    async assertRackSizeOptionDisabledInRackMenu(rackName: string, sectionName?: string) {
        const root = sectionName
            ? this.page.locator('section').filter({ hasText: sectionName })
            : this.page;
        const rackContainer = root.getByRole('heading', { name: rackName, level: 3 }).locator('../..');
        // Scope to the rack-level dropdown (which always has "Dropdown" as an option).
        const rackMenu = this.page.getByRole('list').filter({
            has: this.page.getByRole('button', { name: 'Dropdown' }),
        });
        const rackAddBtn = rackContainer.getByRole('button', { name: 'Add Component' });
        await rackAddBtn.click(); // open
        await expect(rackMenu).toBeVisible({ timeout: 5000 });
        await expect(
            rackMenu.getByRole('button', { name: 'Rack size', exact: true })
        ).not.toBeVisible({ timeout: 3000 });
        await rackAddBtn.click(); // close via toggle
        await expect(rackMenu).not.toBeVisible({ timeout: 3000 });
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
