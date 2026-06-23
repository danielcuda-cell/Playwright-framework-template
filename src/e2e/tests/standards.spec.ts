import { test, expect } from '../fixtures/test-fixtures';
import { randomString } from '../../shared/utils/random';

const email = process.env.E2E_USER_EMAIL!;
const password = process.env.E2E_USER_PASSWORD!;

test.describe.configure({ mode: 'serial' });

test.describe('Standards', () => {

    let templateName: string;
    let standardName: string;

    const SECTION_1 = 'SECTION 1';
    const SECTION_2 = 'SECTION 2';
    const RACK_1 = 'Rack 1';
    const DROP_1 = 'drop 1';
    const DROP_2 = 'drop 2';
    const DROP_3 = 'drop 3';
    const OPTIONS = ['Option 1', 'Option 2', 'Option 3'];

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
    });

    // ─── Prerequisite: create and publish a template ──────────────────────────────

    test('should create and publish a CONTROL template for standard creation', async ({ templatesPage }) => {
        templateName = `e2e-std-tmpl-${randomString()}`;

        await templatesPage.goto();
        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(templateName, 'CONTROL');

        await templatesPage.addSection(SECTION_1);
        await templatesPage.addSection(SECTION_2);

        await templatesPage.addComponentToSection(SECTION_1, 'Rack');
        await templatesPage.addComponentToSection(SECTION_1, 'Rack');

        await templatesPage.addDropdownToRack(RACK_1, DROP_1, OPTIONS);
        await templatesPage.addDropdownToRack(RACK_1, DROP_2, OPTIONS);
        await templatesPage.addDropdownToRack(RACK_1, DROP_3, OPTIONS);

        await templatesPage.addVisibilityRule(DROP_1, 'Option 1', DROP_3);
        await templatesPage.addFilterRule(DROP_1, 'Option 1', DROP_3, ['Option 1', 'Option 2']);
        await templatesPage.addAutoselectRule(DROP_1, 'Option 1', DROP_3, 'Option 1');

        await templatesPage.saveAsDraft();

        // Publish so the template is available in the standard creation wizard
        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(templateName);
        await templatesPage.enterEditMode();
        await templatesPage.publish();
    });

    // ─── Create standard from the published template ──────────────────────────────

    test('should create a standard from the published template and save as draft', async ({ standardsPage }) => {
        standardName = `e2e-std-${randomString()}`;

        await standardsPage.goto();
        await standardsPage.createStandard(templateName, standardName);

        await standardsPage.gotoStandardEditor();
        await standardsPage.saveAsDraftFromEditor();
        await standardsPage.navigateBackFromEditor();
    });

    test('should find the saved draft standard in the standards list', async ({ standardsPage }) => {
        await standardsPage.goto();
        await standardsPage.assertStandardVisible(standardName);
    });

    // ─── Open standard and validate inherited rules ───────────────────────────────

    test('should open the standard and validate that rules were inherited from the template', async ({ standardsPage }) => {
        await standardsPage.goto();
        await standardsPage.openStandard(standardName);
        await standardsPage.gotoStandardEditor();

        // Validate structure is inherited from the template
        await standardsPage.assertSectionVisible(SECTION_1);
        await standardsPage.assertSectionVisible(SECTION_2);
        await standardsPage.assertRackVisible(RACK_1);
        await standardsPage.assertDropdownVisible(DROP_1);
        await standardsPage.assertDropdownVisible(DROP_2);
        await standardsPage.assertDropdownVisible(DROP_3);
        await standardsPage.assertDropdownHasOptions(DROP_1, OPTIONS);
        await standardsPage.assertDropdownHasOptions(DROP_2, OPTIONS);
        await standardsPage.assertDropdownHasOptions(DROP_3, OPTIONS);

        // Validate rule inheritance via "RULE APPLIED" visual badges:
        //   • Option 1 of drop 1 has the badge → rules were inherited
        //   • Options 2 and 3 of drop 1 have no badge → only Option 1 is rule-bound
        await standardsPage.assertRuleAppliedToOption(DROP_1, 'Option 1');
        await standardsPage.assertOptionHasNoRuleApplied(DROP_1, 'Option 2');
        await standardsPage.assertOptionHasNoRuleApplied(DROP_1, 'Option 3');
    });

});
