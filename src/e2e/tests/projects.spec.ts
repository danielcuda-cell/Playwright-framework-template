import { test } from '../fixtures/test-fixtures';
import { randomString } from '../../shared/utils/random';

const adminEmail    = process.env.E2E_USER_EMAIL!;
const adminPassword = process.env.E2E_USER_PASSWORD!;

const TEST_COMPANY  = 'Daedalus Industries';
const TEST_ZIP      = '12345';
const TEST_EMAIL    = 'e2e.project@test.com';
const TEST_PHONE    = '+1 (555) 000-1111';

let projectName: string;
let editedName: string;

test.describe.configure({ mode: 'serial' });

// ─── TC1: Filters ─────────────────────────────────────────────────────────────

test.describe('Projects – filters', () => {

    test('client filter narrows table to matching rows', async ({ loginPage, projectsPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.assertPageLoaded();

        await projectsPage.filterByClient(TEST_COMPANY);
        await projectsPage.assertAllVisibleRowsHaveClient(TEST_COMPANY);
    });

    test('status filter narrows table to matching rows', async ({ loginPage, projectsPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.assertPageLoaded();

        await projectsPage.filterByStatus('Inactive');
        await projectsPage.assertAllVisibleRowsHaveStatus('Inactive');
    });

    test('free-text search filters by project name', async ({ loginPage, projectsPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.assertPageLoaded();

        await projectsPage.search('New Project Test 2212');
        await projectsPage.assertRowVisible('New Project Test 2212');
    });

    test('free-text search filters by client name', async ({ loginPage, projectsPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.assertPageLoaded();

        // "test project 1 company" is the client for "test project 1 - edited"
        await projectsPage.search('test project 1 company');
        await projectsPage.assertRowVisible('test project 1 - edited');
    });

});

// ─── TC2: Create project ──────────────────────────────────────────────────────

test.describe('Projects – create project', () => {

    test('admin creates a project and it appears in the table', async ({ loginPage, projectsPage }) => {
        projectName = `E2E Project ${randomString(8)}`;
        editedName  = `${projectName} Edited`;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.createProject({
            name:        projectName,
            companyName: TEST_COMPANY,
            zipCode:     TEST_ZIP,
            email:       TEST_EMAIL,
            phone:       TEST_PHONE,
        });

        await projectsPage.goto();
        await projectsPage.search(projectName);
        await projectsPage.assertRowVisible(projectName);
        await projectsPage.assertRowHasClient(projectName, TEST_COMPANY);
    });

    test('created project info is correct in the details view', async ({ loginPage, projectsPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.search(projectName);
        await projectsPage.clickViewDetails(projectName);

        await projectsPage.assertDetailsHeading(projectName);
        await projectsPage.assertDetailsCompany(TEST_COMPANY);
    });

});

// ─── TC3: Edit project ────────────────────────────────────────────────────────

test.describe('Projects – edit project', () => {

    test('admin edits the project name and change persists in the table', async ({ loginPage, projectsPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.search(projectName);
        await projectsPage.editProjectName(projectName, editedName);

        await projectsPage.goto();
        await projectsPage.search(editedName);
        await projectsPage.assertRowVisible(editedName);
    });

    test('edited project name is correct in the details view', async ({ loginPage, projectsPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.search(editedName);
        await projectsPage.clickViewDetails(editedName);

        await projectsPage.assertDetailsHeading(editedName);
        await projectsPage.assertDetailsCompany(TEST_COMPANY);
    });

});

// ─── TC4: Archive project ─────────────────────────────────────────────────────

test.describe('Projects – archive project', () => {

    test('admin archives the project and it no longer appears in the table', async ({ loginPage, projectsPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await projectsPage.goto();
        await projectsPage.search(editedName);
        await projectsPage.archiveProject(editedName);

        // After archiving, the project should not appear in the active list
        await projectsPage.goto();
        await projectsPage.search(editedName);
        await projectsPage.assertRowNotVisible(editedName);
    });

});
