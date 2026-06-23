import { test } from '../fixtures/test-fixtures';
import { randomString } from '../../shared/utils/random';

const email = process.env.E2E_USER_EMAIL!;
const password = process.env.E2E_USER_PASSWORD!;

// Auth0 session cookies cannot be shared across browser contexts, so tests must
// each perform a fresh login. Serial mode prevents concurrent logins with the
// same credentials from invalidating each other's sessions.
test.describe.configure({ mode: 'serial' });

test.describe('IO Modules', () => {

    test.beforeEach(async ({ loginPage, ioModulesPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await ioModulesPage.goto();
    });

    // ─── Page visibility ─────────────────────────────────────────────────────────

    test.describe('Page visibility', () => {

        test('should display page title, table and add button', async ({ ioModulesPage }) => {
            await ioModulesPage.assertPageLoaded();
        });

    });

    // ─── Search ──────────────────────────────────────────────────────────────────

    test.describe('Search', () => {

        test('should filter table when searching by module name', async ({ ioModulesPage }) => {
            await ioModulesPage.search('17344iolP');
            await ioModulesPage.assertRowVisible('17344iolP');
        });

        test('should show no results when searching for a non-existent module', async ({ ioModulesPage }) => {
            await ioModulesPage.search('zzz-nonexistent-xyz-e2e');
            await ioModulesPage.assertRowNotInTable('zzz-nonexistent-xyz-e2e');
        });

    });

    // ─── Pagination ───────────────────────────────────────────────────────────────

    test.describe('Pagination', () => {

        test('should navigate to next page when clicking Next', async ({ ioModulesPage }) => {
            await ioModulesPage.clickNextPage();
            await ioModulesPage.assertCurrentPage(2);
        });

        test('should navigate back to first page when clicking Previous', async ({ ioModulesPage }) => {
            await ioModulesPage.clickNextPage();
            await ioModulesPage.clickPreviousPage();
            await ioModulesPage.assertCurrentPage(1);
        });

        test('should navigate to a specific page by clicking page number', async ({ ioModulesPage }) => {
            await ioModulesPage.clickPageNumber(3);
            await ioModulesPage.assertCurrentPage(3);
        });

    });

    // ─── Add IO Module ────────────────────────────────────────────────────────────

    test.describe('Add IO Module', () => {

        test('should open Add IO Module modal when clicking the Add button', async ({ ioModulesPage }) => {
            await ioModulesPage.clickAddIOModule();
            await ioModulesPage.assertModalVisible('Add IO Module');
        });

        test('should close modal when clicking the X button', async ({ ioModulesPage }) => {
            await ioModulesPage.clickAddIOModule();
            await ioModulesPage.closeModal();
            await ioModulesPage.assertModalClosed();
        });

        test('should close modal when clicking Cancel', async ({ ioModulesPage }) => {
            await ioModulesPage.clickAddIOModule();
            await ioModulesPage.cancelModal();
            await ioModulesPage.assertModalClosed();
        });

        test('should create a new IO module with required fields only', async ({ ioModulesPage }) => {
            const key = `e2e-${randomString()}`;

            await ioModulesPage.clickAddIOModule();
            await ioModulesPage.fillIOModuleForm({ key, label: 'E2E Test Label', ioPoints: 4, ioPointType: 'digital-input' });
            await ioModulesPage.saveIOModule();
            await ioModulesPage.search(key);
            await ioModulesPage.assertRowVisible(key);

            await ioModulesPage.clickDeleteByModule(key);
            await ioModulesPage.confirmDelete();
        });

        test('should create a new IO module with all fields', async ({ ioModulesPage }) => {
            const key = `e2e-full-${randomString()}`;

            await ioModulesPage.clickAddIOModule();
            await ioModulesPage.fillIOModuleForm({
                key,
                label: 'E2E Full Label',
                ioPoints: 8,
                ioPointType: 'digital-input',
                description: 'E2E test description',
                manufacturer: 'Allen-Bradley',
                family: '1734 POINT I/O',
            });
            await ioModulesPage.saveIOModule();
            await ioModulesPage.search(key);
            await ioModulesPage.assertRowVisible(key);

            await ioModulesPage.clickDeleteByModule(key);
            await ioModulesPage.confirmDelete();
        });

    });

    // ─── Edit IO Module ───────────────────────────────────────────────────────────

    test.describe('Edit IO Module', () => {
        let moduleKey: string;

        test.beforeEach(async ({ ioModulesPage }) => {
            moduleKey = `e2e-edit-${randomString()}`;
            await ioModulesPage.clickAddIOModule();
            await ioModulesPage.fillIOModuleForm({ key: moduleKey, label: 'Original Label', ioPoints: 2, ioPointType: 'digital-input' });
            await ioModulesPage.saveIOModule();
            await ioModulesPage.search(moduleKey);
        });

        test.afterEach(async ({ ioModulesPage }) => {
            if (!moduleKey) return;
            try {
                await ioModulesPage.dismissModalIfOpen();
                await ioModulesPage.search(moduleKey);
                if (await ioModulesPage.getRow(moduleKey).isVisible()) {
                    await ioModulesPage.clickDeleteByModule(moduleKey);
                    await ioModulesPage.confirmDelete();
                }
            } catch {}
        });

        test('should open Edit modal for an existing module', async ({ ioModulesPage }) => {
            await ioModulesPage.clickEditByModule(moduleKey);
            await ioModulesPage.assertModalVisible('Edit IO Module');
        });

        test('should update an existing IO module', async ({ ioModulesPage }) => {
            const updatedLabel = `Updated-${randomString()}`;

            await ioModulesPage.clickEditByModule(moduleKey);
            await ioModulesPage.fillIOModuleForm({ label: updatedLabel, ioPoints: 2 });
            await ioModulesPage.saveIOModule();
            await ioModulesPage.assertRowVisible(updatedLabel);
        });

    });

    // ─── Delete IO Module ─────────────────────────────────────────────────────────

    test.describe('Delete IO Module', () => {
        let moduleKey: string;

        test.beforeEach(async ({ ioModulesPage }) => {
            moduleKey = `e2e-del-${randomString()}`;
            await ioModulesPage.clickAddIOModule();
            await ioModulesPage.fillIOModuleForm({ key: moduleKey, label: 'Delete Test Label', ioPoints: 1, ioPointType: 'digital-input' });
            await ioModulesPage.saveIOModule();
            await ioModulesPage.search(moduleKey);
        });

        test.afterEach(async ({ ioModulesPage }) => {
            if (!moduleKey) return;
            try {
                await ioModulesPage.search(moduleKey);
                if (await ioModulesPage.getRow(moduleKey).isVisible()) {
                    await ioModulesPage.clickDeleteByModule(moduleKey);
                    await ioModulesPage.confirmDelete();
                }
            } catch {}
        });

        test('should show delete confirmation dialog with module details', async ({ ioModulesPage }) => {
            await ioModulesPage.clickDeleteByModule(moduleKey);
            await ioModulesPage.assertModalVisible('Delete IO Module');
            await ioModulesPage.assertDeleteConfirmationVisible('Delete Test Label');
            await ioModulesPage.cancelDelete();
        });

        test('should cancel deletion and keep the module in the table', async ({ ioModulesPage }) => {
            await ioModulesPage.clickDeleteByModule(moduleKey);
            await ioModulesPage.cancelDelete();
            await ioModulesPage.assertModalClosed();
            await ioModulesPage.assertRowVisible(moduleKey);
        });

        test('should delete an IO module and remove it from the table', async ({ ioModulesPage }) => {
            await ioModulesPage.clickDeleteByModule(moduleKey);
            await ioModulesPage.confirmDelete();
            await ioModulesPage.assertRowNotInTable(moduleKey);
            moduleKey = '';
        });

    });

});
