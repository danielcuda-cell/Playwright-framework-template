import { test, expect } from '../fixtures/test-fixtures';
import { randomString } from '../../shared/utils/random';

const email = process.env.E2E_USER_EMAIL!;
const password = process.env.E2E_USER_PASSWORD!;

// Auth0 session cookies cannot be shared across browser contexts, so tests must
// each perform a fresh login. Serial mode prevents concurrent logins with the
// same credentials from invalidating each other's sessions.
test.describe.configure({ mode: 'serial' });

test.describe('Panel Templates', () => {

    let templateName: string;

    const SECTION_1 = 'SECTION 1';
    const SECTION_2 = 'SECTION 2';
    const RACK_1 = 'Rack 1';
    const DROP_1 = 'drop 1';
    const DROP_2 = 'drop 2';
    const DROP_3 = 'drop 3';
    const OPTIONS = ['Option 1', 'Option 2', 'Option 3'];

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    // ─── Create template with full configuration ──────────────────────────────────

    test('should create a CONTROL template with sections, racks, dropdowns and rules', async ({ templatesPage }) => {
        templateName = `e2e-ctrl-${randomString()}`;

        // Step 1: Create new template
        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(templateName, 'CONTROL');

        // Step 2: Add sections
        await templatesPage.addSection(SECTION_1);
        await templatesPage.addSection(SECTION_2);

        // Step 3: Add 2 Rack components to SECTION 1
        await templatesPage.addComponentToSection(SECTION_1, 'Rack');
        await templatesPage.addComponentToSection(SECTION_1, 'Rack');

        // Step 4: Add 3 Dropdown components to Rack 1 (each with 3 options)
        await templatesPage.addDropdownToRack(RACK_1, DROP_1, OPTIONS);
        await templatesPage.addDropdownToRack(RACK_1, DROP_2, OPTIONS);
        await templatesPage.addDropdownToRack(RACK_1, DROP_3, OPTIONS);

        // Step 5: Add rules to Option 1 of drop 1

        // Visibility rule → target: drop 3
        await templatesPage.addVisibilityRule(DROP_1, 'Option 1', DROP_3);

        // Filter rule → target: drop 3, allowed values: Option 1, Option 2
        await templatesPage.addFilterRule(DROP_1, 'Option 1', DROP_3, ['Option 1', 'Option 2']);

        // Autoselect rule → target: drop 3, default value: Option 1
        await templatesPage.addAutoselectRule(DROP_1, 'Option 1', DROP_3, 'Option 1');

        // Step 6: Validate all 3 rules and their specific targets/options before saving.
        // (The rules dialog is only accessible here, in the creation flow. In a saved
        //  template the rack-group is rendered inside a disabled wrapper.)
        await templatesPage.assertAllRulesForOption(DROP_1, 'Option 1', {
            visibility: { target: DROP_3 },
            filter:     { target: DROP_3, allowedValues: ['Option 1', 'Option 2'] },
            autoselect: { target: DROP_3, defaultValue: 'Option 1' },
        });

        // Step 7: Save as Draft (method waits for Edit button to confirm view mode)
        await templatesPage.saveAsDraft();
    });

    // ─── Find and validate the saved template ─────────────────────────────────────

    test('should find the saved draft template in the list', async ({ templatesPage }) => {
        // The list defaults to "Active" status — switch to Draft
        await templatesPage.filterByStatus('Draft');
        await templatesPage.assertTemplateVisible(templateName);
    });

    test('should open the template and validate all configurations', async ({ templatesPage }) => {
        // Navigate to list, switch to Draft filter, open template
        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(templateName);

        // Enter edit mode to see all sections, racks and components
        await templatesPage.enterEditMode();

        // Validate sections
        await templatesPage.assertSectionVisible(SECTION_1);
        await templatesPage.assertSectionVisible(SECTION_2);

        // Validate rack
        await templatesPage.assertRackVisible(RACK_1);

        // Validate dropdowns
        await templatesPage.assertDropdownVisible(DROP_1);
        await templatesPage.assertDropdownVisible(DROP_2);
        await templatesPage.assertDropdownVisible(DROP_3);

        // Validate options on each dropdown
        await templatesPage.assertDropdownHasOptions(DROP_1, OPTIONS);
        await templatesPage.assertDropdownHasOptions(DROP_2, OPTIONS);
        await templatesPage.assertDropdownHasOptions(DROP_3, OPTIONS);

        // Validate that rules survived the save/reopen cycle.
        // Components inside racks are read-only in the saved template editor, so
        // the rules dialog cannot be opened here — specific content was validated
        // in test 1 before saving. What IS accessible confirms persistence:

        // "RULES APPLIED" badge on the component confirms at least one rule exists
        await templatesPage.assertRulesAppliedToDropdown(DROP_1);
        // "RULE APPLIED" badge on Option 1 confirms rules are bound to that option
        await templatesPage.assertRuleAppliedToOption(DROP_1, 'Option 1');
        // The "Add rule" button changes its visible text to "Edit rule" when rules exist
        await templatesPage.assertOptionHasRuleConfigured(DROP_1, 'Option 1');
        // Option 2 and 3 should NOT have rules
        await templatesPage.assertOptionHasNoRule(DROP_1, 'Option 2');
        await templatesPage.assertOptionHasNoRule(DROP_1, 'Option 3');
    });

});
