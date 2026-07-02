import { test, expect } from '../fixtures/test-fixtures';
import { randomString } from '../../shared/utils/random';

const email    = process.env.E2E_USER_EMAIL!;
const password = process.env.E2E_USER_PASSWORD!;

// Auth0 session cookies cannot be shared across browser contexts, so tests must
// each perform a fresh login. Serial mode prevents concurrent logins with the
// same credentials from invalidating each other's sessions.
test.describe.configure({ mode: 'serial' });

// Shared across all 3 describe blocks — set in TC-TEMPL-01, read in 02/03/04.
let templateName: string;

const SECTION_1 = 'SECTION 1';
const SECTION_2 = 'SECTION 2';
const RACK_1    = 'Rack 1';
const DROP_1    = 'drop 1';
const DROP_2    = 'drop 2';
const DROP_3    = 'drop 3';
const OPTIONS   = ['Option 1', 'Option 2', 'Option 3'];

// ─── TC-TEMPL-01: Create template with full configuration ─────────────────────

test.describe('Panel Templates – create', () => {

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should create a CONTROL template with sections, racks, dropdowns and rules', async ({ templatesPage }) => {
        test.setTimeout(120000);
        templateName = `e2e-ctrl-${randomString()}`;

        // Step 1: Create new template
        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(templateName, 'CONTROL');

        // Step 2: Add sections
        await templatesPage.addSection(SECTION_1);
        await templatesPage.addSection(SECTION_2);

        // Step 3: Add a Rack to SECTION 1
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

        // Step 7: Add a Rack with a dropdown to SECTION 2 so the template can be published.
        // Publish validation requires every section to have at least one rack, and every
        // rack to have at least one component — a bare text input in a section is not enough.
        // Done last so Rack 1 editors are all closed before a new component is opened.
        await templatesPage.addComponentToSection(SECTION_2, 'Rack');
        await templatesPage.addDropdownToRack('Rack 1', 'drop s2', ['opt a'], SECTION_2);

        // Step 8: Save as Draft (method waits for Edit button to confirm view mode)
        await templatesPage.saveAsDraft();
    });

});

// ─── TC-TEMPL-02 & 03: Find and validate saved template ──────────────────────

test.describe('Panel Templates – find and validate', () => {

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

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

// ─── TC-TEMPL-04: Publish template ───────────────────────────────────────────

test.describe('Panel Templates – publish', () => {

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should publish the template and validate it appears in the Active list', async ({ templatesPage }) => {
        // Publishing + backend propagation can take up to ~90s, so extend the timeout.
        test.setTimeout(120000);

        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(templateName);
        await templatesPage.enterEditMode();
        await templatesPage.publish();

        // The publish API returns before the read endpoint reflects the change, so
        // poll the Active list with full page reloads until the template appears.
        await templatesPage.waitForTemplateActive(templateName);
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Shared constants for TC-TEMPL-05 … TC-TEMPL-12
// ─────────────────────────────────────────────────────────────────────────────
const SEC_A       = 'SECTION A';
const SEC_B       = 'SECTION B';
const RACK_NAME   = 'Rack 1';       // both sections get "Rack 1" — methods disambiguate by sectionName
const TI_A        = 'text input A'; // text-input label for SECTION A
const TI_B        = 'text input B'; // text-input label for SECTION B
const DROP_A      = 'drop A';       // dropdown title inside SECTION A's rack
const DROP_B      = 'drop B';       // dropdown title inside SECTION B's rack
const DROP_OPTS   = ['opt 1', 'opt 2'];

// ─── TC-TEMPL-05: All components via button — add + validate ─────────────────

test.describe('Panel Templates – all components via button', () => {

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should add all available components via button to two sections and validate after reopening', async ({ templatesPage }) => {
        test.setTimeout(120000);
        const name = `e2e-allcomp-btn-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');

        // ── SECTION A ──
        await templatesPage.addSection(SEC_A);
        await templatesPage.addComponentToSection(SEC_A, 'Rack');
        await templatesPage.addTextInputToSection(SEC_A, TI_A);
        await templatesPage.addDropdownToRack(RACK_NAME, DROP_A, DROP_OPTS, SEC_A);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_A);

        // ── SECTION B ──
        await templatesPage.addSection(SEC_B);
        await templatesPage.addComponentToSection(SEC_B, 'Rack');
        await templatesPage.addTextInputToSection(SEC_B, TI_B);
        await templatesPage.addDropdownToRack(RACK_NAME, DROP_B, DROP_OPTS, SEC_B);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_B);

        await templatesPage.saveAsDraft();

        // ── Reopen ──
        await templatesPage.goto();
        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(name);
        await templatesPage.enterEditMode();

        // Sections present
        await templatesPage.assertSectionVisible(SEC_A);
        await templatesPage.assertSectionVisible(SEC_B);
        // Section order: A before B
        await templatesPage.assertSectionComponentsInOrder('', [SEC_A, SEC_B]);

        // SECTION A components
        await templatesPage.assertRackVisible(RACK_NAME);
        await templatesPage.assertTextInputVisible(TI_A);
        // Section-level order: Rack 1 was added first → must appear above Text input A
        await templatesPage.assertSectionComponentsInOrder(SEC_A, [RACK_NAME, TI_A]);
        // Rack-level components in SECTION A
        await templatesPage.assertDropdownVisible(DROP_A);
        await templatesPage.assertDropdownHasOptions(DROP_A, DROP_OPTS);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_A);
        // Rack-level order: Dropdown before Rack size
        await templatesPage.assertRackComponentsInOrder(RACK_NAME, [DROP_A, 'Rack size'], SEC_A);

        // SECTION B components
        await templatesPage.assertTextInputVisible(TI_B);
        await templatesPage.assertSectionComponentsInOrder(SEC_B, [RACK_NAME, TI_B]);
        await templatesPage.assertDropdownVisible(DROP_B);
        await templatesPage.assertDropdownHasOptions(DROP_B, DROP_OPTS);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_B);
        await templatesPage.assertRackComponentsInOrder(RACK_NAME, [DROP_B, 'Rack size'], SEC_B);
    });

});

// ─── TC-TEMPL-06: All components via drag & drop — add + validate ─────────────

test.describe('Panel Templates – all components via drag & drop', () => {

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should add all available components via drag & drop to two sections and validate after reopening', async ({ templatesPage }) => {
        test.setTimeout(120000);
        const name = `e2e-allcomp-dnd-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');

        // ── SECTION A ──
        // DnD from palette adds at section level; rack-internal components use the button method.
        await templatesPage.addSection(SEC_A);
        await templatesPage.addRackToSectionByDragDrop(SEC_A);
        await templatesPage.addTextInputToSection(SEC_A, TI_A);
        await templatesPage.addDropdownToRack(RACK_NAME, DROP_A, DROP_OPTS, SEC_A);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_A);

        // ── SECTION B ──
        await templatesPage.addSection(SEC_B);
        await templatesPage.addRackToSectionByDragDrop(SEC_B);
        await templatesPage.addTextInputToSection(SEC_B, TI_B);
        await templatesPage.addDropdownToRack(RACK_NAME, DROP_B, DROP_OPTS, SEC_B);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_B);

        await templatesPage.saveAsDraft();

        // ── Reopen ──
        await templatesPage.goto();
        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(name);
        await templatesPage.enterEditMode();

        await templatesPage.assertSectionVisible(SEC_A);
        await templatesPage.assertSectionVisible(SEC_B);
        await templatesPage.assertSectionComponentsInOrder('', [SEC_A, SEC_B]);

        await templatesPage.assertRackVisible(RACK_NAME);
        await templatesPage.assertTextInputVisible(TI_A);
        await templatesPage.assertSectionComponentsInOrder(SEC_A, [RACK_NAME, TI_A]);
        await templatesPage.assertDropdownVisible(DROP_A);
        await templatesPage.assertDropdownHasOptions(DROP_A, DROP_OPTS);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_A);
        await templatesPage.assertRackComponentsInOrder(RACK_NAME, [DROP_A, 'Rack size'], SEC_A);

        await templatesPage.assertTextInputVisible(TI_B);
        await templatesPage.assertSectionComponentsInOrder(SEC_B, [RACK_NAME, TI_B]);
        await templatesPage.assertDropdownVisible(DROP_B);
        await templatesPage.assertDropdownHasOptions(DROP_B, DROP_OPTS);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_B);
        await templatesPage.assertRackComponentsInOrder(RACK_NAME, [DROP_B, 'Rack size'], SEC_B);
    });

});

// ─── TC-TEMPL-07: Add via button + reorder via arrows ────────────────────────

test.describe('Panel Templates – reorder via arrow buttons', () => {

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should reorder components using arrow buttons, save draft, and validate new order after reopening', async ({ templatesPage }) => {
        test.setTimeout(180000);
        const name = `e2e-reorder-btn-${randomString()}`;

        // ── Setup: add components in initial order ──
        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');

        await templatesPage.addSection(SEC_A);
        // Section-level initial order: Rack 1, then Text input A
        await templatesPage.addComponentToSection(SEC_A, 'Rack');
        await templatesPage.addTextInputToSection(SEC_A, TI_A);
        // Rack-level initial order: drop A, then Rack size
        await templatesPage.addDropdownToRack(RACK_NAME, DROP_A, DROP_OPTS, SEC_A);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_A);

        await templatesPage.addSection(SEC_B);
        await templatesPage.addComponentToSection(SEC_B, 'Rack');
        await templatesPage.addTextInputToSection(SEC_B, TI_B);
        await templatesPage.addDropdownToRack(RACK_NAME, DROP_B, DROP_OPTS, SEC_B);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_B);

        await templatesPage.saveAsDraft();

        // ── Reopen and reorder ──
        await templatesPage.goto();
        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(name);
        await templatesPage.enterEditMode();

        // Move Text input A UP → it should now appear before Rack 1 in SECTION A
        await templatesPage.moveComponentUp(TI_A, SEC_A);
        // Move Rack size UP → it should now appear before drop A in SECTION A's Rack 1
        await templatesPage.moveComponentUp('Rack size', SEC_A);

        // Move Text input B UP → same inversion in SECTION B
        await templatesPage.moveComponentUp(TI_B, SEC_B);
        await templatesPage.moveComponentUp('Rack size', SEC_B);

        await templatesPage.saveAsDraft();

        // ── Reopen and validate new order ──
        await templatesPage.goto();
        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(name);
        await templatesPage.enterEditMode();

        // Section A: Text input A should now be above Rack 1
        await templatesPage.assertSectionComponentsInOrder(SEC_A, [TI_A, RACK_NAME]);
        // Rack A: Rack size should now be above drop A
        await templatesPage.assertRackComponentsInOrder(RACK_NAME, ['Rack size', DROP_A], SEC_A);

        // Section B: same
        await templatesPage.assertSectionComponentsInOrder(SEC_B, [TI_B, RACK_NAME]);
        await templatesPage.assertRackComponentsInOrder(RACK_NAME, ['Rack size', DROP_B], SEC_B);

        // All components still present
        await templatesPage.assertDropdownVisible(DROP_A);
        await templatesPage.assertDropdownHasOptions(DROP_A, DROP_OPTS);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_A);
        await templatesPage.assertDropdownVisible(DROP_B);
        await templatesPage.assertDropdownHasOptions(DROP_B, DROP_OPTS);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_B);
    });

});

// ─── TC-TEMPL-08: Add via drag & drop + reorder via drag & drop ──────────────

test.describe('Panel Templates – reorder via drag & drop', () => {

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should reorder components using drag & drop, save draft, and validate new order after reopening', async ({ templatesPage }) => {
        test.setTimeout(360000);
        const name = `e2e-reorder-dnd-${randomString()}`;

        // ── Setup: build initial template state ──
        // DnD from palette always drops at section level; rack-internal components
        // require the "Add Component" button inside the rack (addDropdownToRack / addRackSizeToRack).
        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');

        await templatesPage.addSection(SEC_A);
        await templatesPage.addRackToSectionByDragDrop(SEC_A);
        await templatesPage.addTextInputToSection(SEC_A, TI_A);
        await templatesPage.addDropdownToRack(RACK_NAME, DROP_A, DROP_OPTS, SEC_A);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_A);

        await templatesPage.addSection(SEC_B);
        await templatesPage.addRackToSectionByDragDrop(SEC_B);
        await templatesPage.addTextInputToSection(SEC_B, TI_B);
        await templatesPage.addDropdownToRack(RACK_NAME, DROP_B, DROP_OPTS, SEC_B);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_B);

        await templatesPage.saveAsDraft();

        // ── Reopen and reorder via drag & drop ──
        await templatesPage.goto();
        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(name);
        await templatesPage.enterEditMode();

        // Drag Text input A onto Rack 1 → Text input A moves above Rack 1
        await templatesPage.reorderSectionComponentByDragDrop(SEC_A, TI_A, RACK_NAME);
        // Drag Rack size onto drop A → Rack size moves above drop A
        await templatesPage.reorderRackComponentByDragDrop(RACK_NAME, 'Rack size', DROP_A, SEC_A);

        await templatesPage.reorderSectionComponentByDragDrop(SEC_B, TI_B, RACK_NAME);
        await templatesPage.reorderRackComponentByDragDrop(RACK_NAME, 'Rack size', DROP_B, SEC_B);

        await templatesPage.saveAsDraft();

        // ── Reopen and validate new order ──
        await templatesPage.goto();
        await templatesPage.filterByStatus('Draft');
        await templatesPage.openTemplate(name);
        await templatesPage.enterEditMode();

        await templatesPage.assertSectionComponentsInOrder(SEC_A, [TI_A, RACK_NAME]);
        await templatesPage.assertRackComponentsInOrder(RACK_NAME, ['Rack size', DROP_A], SEC_A);
        await templatesPage.assertSectionComponentsInOrder(SEC_B, [TI_B, RACK_NAME]);
        await templatesPage.assertRackComponentsInOrder(RACK_NAME, ['Rack size', DROP_B], SEC_B);

        await templatesPage.assertDropdownVisible(DROP_A);
        await templatesPage.assertDropdownHasOptions(DROP_A, DROP_OPTS);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_A);
        await templatesPage.assertDropdownVisible(DROP_B);
        await templatesPage.assertDropdownHasOptions(DROP_B, DROP_OPTS);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_B);
    });

});

// ─── TC-TEMPL-09: Delete confirmation modals ────────────────────────────────

test.describe('Panel Templates – delete confirmation modals', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should show and cancel delete confirmation modals for rack, rack group and section — added via button', async ({ templatesPage }) => {
        const name = `e2e-del-btn-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');
        await templatesPage.addSection(SEC_A);
        await templatesPage.addComponentToSection(SEC_A, 'Rack');

        // Delete rack → modal → cancel
        await templatesPage.clickDeleteRack(RACK_NAME, SEC_A);
        await templatesPage.assertDeleteConfirmModalVisible();
        await templatesPage.cancelDeleteModal();

        // Delete rack group → modal → cancel
        await templatesPage.clickDeleteRackGroup(RACK_NAME, SEC_A);
        await templatesPage.assertDeleteConfirmModalVisible();
        await templatesPage.cancelDeleteModal();

        // Delete section → modal → cancel
        await templatesPage.clickDeleteSection(SEC_A);
        await templatesPage.assertDeleteConfirmModalVisible();
        await templatesPage.cancelDeleteModal();

        // All entities still present after cancelling every modal
        await templatesPage.assertSectionVisible(SEC_A);
        await templatesPage.assertRackVisible(RACK_NAME);
    });

    test('should show and cancel delete confirmation modals for rack, rack group and section — added via drag & drop', async ({ templatesPage }) => {
        const name = `e2e-del-dnd-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');
        await templatesPage.addSection(SEC_A);
        await templatesPage.addRackToSectionByDragDrop(SEC_A);

        await templatesPage.clickDeleteRack(RACK_NAME, SEC_A);
        await templatesPage.assertDeleteConfirmModalVisible();
        await templatesPage.cancelDeleteModal();

        await templatesPage.clickDeleteRackGroup(RACK_NAME, SEC_A);
        await templatesPage.assertDeleteConfirmModalVisible();
        await templatesPage.cancelDeleteModal();

        await templatesPage.clickDeleteSection(SEC_A);
        await templatesPage.assertDeleteConfirmModalVisible();
        await templatesPage.cancelDeleteModal();

        await templatesPage.assertSectionVisible(SEC_A);
        await templatesPage.assertRackVisible(RACK_NAME);
    });

});

// ─── TC-TEMPL-10: Max 3 racks per section ────────────────────────────────────

test.describe('Panel Templates – max 3 racks per section', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should disable the Rack option after 3 racks are added — via button', async ({ templatesPage }) => {
        const name = `e2e-maxrack-btn-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');
        await templatesPage.addSection(SEC_A);

        await templatesPage.addComponentToSection(SEC_A, 'Rack');
        await templatesPage.addComponentToSection(SEC_A, 'Rack');
        await templatesPage.addComponentToSection(SEC_A, 'Rack');

        // 4th rack must not be addable — Rack option should be disabled
        await templatesPage.assertRackOptionDisabledInSectionMenu(SEC_A);
    });

    test('should disable the Rack option after 3 racks are added — via drag & drop', async ({ templatesPage }) => {
        const name = `e2e-maxrack-dnd-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');
        await templatesPage.addSection(SEC_A);

        // First rack via DnD; subsequent ones via button because dropping onto a
        // non-empty section hits the existing rack group (dnd-kit collision detection),
        // causing "Cannot nest a Rack inside another Rack".
        await templatesPage.addRackToSectionByDragDrop(SEC_A);
        await templatesPage.addComponentToSection(SEC_A, 'Rack');
        await templatesPage.addComponentToSection(SEC_A, 'Rack');

        await templatesPage.assertRackOptionDisabledInSectionMenu(SEC_A);
    });

});

// ─── TC-TEMPL-11: Rack size component only allowed inside a rack ─────────────

test.describe('Panel Templates – rack size only inside a rack', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should not show Rack size in section-level menu but show it in rack-level menu — button setup', async ({ templatesPage }) => {
        const name = `e2e-racksize-sec-btn-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');
        await templatesPage.addSection(SEC_A);

        // Rack size must NOT appear when adding at section level
        await templatesPage.assertRackSizeNotInSectionMenu(SEC_A);

        // Add a rack — Rack size MUST be available inside the rack
        await templatesPage.addComponentToSection(SEC_A, 'Rack');
        // Verify the option is enabled (not disabled, not hidden) inside the rack
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_A);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_A);
    });

    test('should not show Rack size in section-level menu but show it in rack-level menu — drag & drop setup', async ({ templatesPage }) => {
        const name = `e2e-racksize-sec-dnd-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');
        await templatesPage.addSection(SEC_A);

        await templatesPage.assertRackSizeNotInSectionMenu(SEC_A);

        await templatesPage.addRackToSectionByDragDrop(SEC_A);
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_A);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_A);
    });

});

// ─── TC-TEMPL-12: Maximum one Rack size per rack ─────────────────────────────

test.describe('Panel Templates – max one rack size per rack', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ loginPage, templatesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await templatesPage.goto();
    });

    test('should disable Rack size option after one is added to a rack — via button', async ({ templatesPage }) => {
        const name = `e2e-maxracksize-btn-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');
        await templatesPage.addSection(SEC_A);
        await templatesPage.addComponentToSection(SEC_A, 'Rack');

        // Add the first (and only allowed) Rack size
        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_A);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_A);

        // A second Rack size must not be addable
        await templatesPage.assertRackSizeOptionDisabledInRackMenu(RACK_NAME, SEC_A);
    });

    test('should disable Rack size option after one is added to a rack — via DnD rack + button rack size', async ({ templatesPage }) => {
        const name = `e2e-maxracksize-dnd-${randomString()}`;

        await templatesPage.clickCreateNewTemplate();
        await templatesPage.fillCreateTemplateForm(name, 'CONTROL');
        await templatesPage.addSection(SEC_A);
        await templatesPage.addRackToSectionByDragDrop(SEC_A);

        await templatesPage.addRackSizeToRack(RACK_NAME, SEC_A);
        await templatesPage.assertRackSizeVisible(RACK_NAME, SEC_A);

        await templatesPage.assertRackSizeOptionDisabledInRackMenu(RACK_NAME, SEC_A);
    });

});
