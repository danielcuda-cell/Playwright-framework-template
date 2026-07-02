import { test, expect } from '../fixtures/test-fixtures';
import { randomString } from '../../shared/utils/random';
import { companiesClient } from '../../api/clients/companiesClient';
import { getAuthApiContext } from '../../api/utils/apiContext';

const adminEmail    = process.env.E2E_USER_EMAIL!;
const adminPassword = process.env.E2E_USER_PASSWORD!;

const TEST_PHONE  = '+1 (555) 400-0001';
const TEST_JOB_FN = 'Engineering';
const TEST_ROLE   = 'Reader';

function makeUser(tag: string) {
    const uid = randomString(8);
    return {
        fullName: `E2E ${tag} ${uid}`,
        phone:    TEST_PHONE,
        email:    `e2e.${tag.toLowerCase()}.${uid}@test.invalid`,
    };
}

// ─── TC-COMP-01: Search filter and pagination ──────────────────────────────────

test.describe('Companies – search filter and pagination', () => {
    test.describe.configure({ mode: 'serial' });

    let seedCompanyIds: string[] = [];

    test.beforeAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        const names  = Array.from({ length: 12 }, (_, i) => `E2E Search ${randomString(6)} ${i}`);

        for (const name of names) {
            const res  = await client.createCompany({ name });
            const body = await res.json();
            seedCompanyIds.push(body.data.id);
        }
        await ctx.dispose();
    });

    test.afterAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        for (const id of seedCompanyIds) {
            await client.deleteCompany(id).catch(() => {});
        }
        await ctx.dispose();
    });

    test('search input filters the companies table by name', async ({ loginPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.assertPageLoaded();

        await companiesPage.search('E2E Search');

        await companiesPage.assertCompanyVisible('E2E Search');
        await companiesPage.assertValidPaginationRange();
    });

    test('clearing the search input restores all companies', async ({ loginPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.assertPageLoaded();

        await companiesPage.search('zzz_no_match_xyz');
        // Expect 0 results – pagination total must be 0 and end must not be negative
        await expect(companiesPage['paginationInfo']).toContainText('of 0', { timeout: 5000 });

        await companiesPage.search('');
        // After clearing, must show a valid range (catches "Showing 1-0" bug)
        await companiesPage.assertValidPaginationRange();
    });

    test('Next and Previous pagination buttons work correctly', async ({ loginPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.assertPageLoaded();

        // Page 1: must be a valid range starting at 1
        await companiesPage.assertValidPaginationRange();
        const page1 = await companiesPage.getPaginationStats();
        expect(page1.start).toBe(1);

        await companiesPage.clickNextPage();

        // Page 2: start must advance by exactly the page-1 row count
        await companiesPage.assertValidPaginationRange();
        const page2 = await companiesPage.getPaginationStats();
        expect(page2.start).toBe(page1.end + 1);
        expect(page2.total).toBe(page1.total);

        await companiesPage.clickPreviousPage();

        // Back to page 1: must be identical to the original snapshot
        await companiesPage.assertValidPaginationRange();
        const restored = await companiesPage.getPaginationStats();
        expect(restored.start).toBe(page1.start);
        expect(restored.end).toBe(page1.end);
    });

});

// ─── TC-COMP-02: Create company – required field validation ───────────────────
// The "Create Company" submit button is disabled until both required fields
// (Company Name and ZIP Code) are filled — no inline error messages are shown.

test.describe('Companies – Create Company required fields', () => {

    test('Create Company button is disabled when required fields are empty', async ({ loginPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.clickAddCompany();
        await companiesPage.assertCreateCompanyDialogOpen();

        // Button must be disabled before any field is filled
        await companiesPage.assertCreateCompanyButtonDisabled();
    });

});

// ─── TC-COMP-03: Create company – duplicate name ──────────────────────────────

test.describe('Companies – duplicate company name not allowed', () => {

    let existingCompanyId: string;
    const existingName = `E2E Dup ${randomString(6)}`;

    test.beforeAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        const res    = await client.createCompany({ name: existingName });
        const body   = await res.json();
        existingCompanyId = body.data.id;
        await ctx.dispose();
    });

    test.afterAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        await client.deleteCompany(existingCompanyId).catch(() => {});
        await ctx.dispose();
    });

    test('creating a company with a name already in use shows a duplicate error', async ({ loginPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.clickAddCompany();
        await companiesPage.assertCreateCompanyDialogOpen();

        await companiesPage.fillCreateCompanyForm(existingName);
        await companiesPage.submitCreateCompanyForm();
        await companiesPage.assertDuplicateNameError();
    });

});

// ─── TC-COMP-04: Edit company ─────────────────────────────────────────────────

test.describe('Companies – edit company', () => {

    let editCompanyId: string;
    const originalName = `E2E Edit ${randomString(6)}`;
    const updatedName  = `E2E Edit Updated ${randomString(6)}`;

    test.beforeAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        const res    = await client.createCompany({ name: originalName });
        const body   = await res.json();
        editCompanyId = body.data.id;
        await ctx.dispose();
    });

    test.afterAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        await client.deleteCompany(editCompanyId).catch(() => {});
        await ctx.dispose();
    });

    test('admin edits a company name and the updated name appears in the table', async ({ loginPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.assertPageLoaded();

        await companiesPage.search(originalName);
        await companiesPage.openEditCompanyDialog(originalName);
        await companiesPage.fillEditCompanyForm(updatedName);
        await companiesPage.submitEditCompanyForm();

        await companiesPage.search(updatedName);
        await companiesPage.assertCompanyVisible(updatedName);
        await companiesPage.assertCompanyNotVisible(originalName);
    });

});

// ─── TC-COMP-05: Delete company ───────────────────────────────────────────────

test.describe('Companies – delete company', () => {

    let deleteCompanyId: string;
    const deleteCompanyName = `E2E Delete ${randomString(6)}`;

    test.beforeAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        const res    = await client.createCompany({ name: deleteCompanyName });
        const body   = await res.json();
        deleteCompanyId = body.data.id;
        await ctx.dispose();
    });

    test.afterAll(async () => {
        // Attempt cleanup in case the test failed before deleting
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        await client.deleteCompany(deleteCompanyId).catch(() => {});
        await ctx.dispose();
    });

    test('admin deletes a company and it no longer appears in the List tab', async ({ loginPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.assertPageLoaded();

        await companiesPage.search(deleteCompanyName);
        await companiesPage.openDeleteCompanyDialog(deleteCompanyName);
        await companiesPage.confirmDeleteCompany();

        await companiesPage.search(deleteCompanyName);
        await companiesPage.assertCompanyNotVisible(deleteCompanyName);
    });

});

// ─── TC-COMP-06 & 07: Link / Unlink company user ─────────────────────────────
// Users assigned to a company at creation time automatically appear as Company
// Users in the Companies detail panel — no manual "Link User" step needed.

test.describe('Companies – link and unlink company user', () => {
    test.describe.configure({ mode: 'serial' });

    let companyId: string;
    const companyName = `E2E UserLink ${randomString(6)}`;
    let userEmail: string;
    let userFullName: string;

    test.beforeAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        const res    = await client.createCompany({ name: companyName });
        const body   = await res.json();
        companyId = body.data.id;
        await ctx.dispose();
    });

    test.afterAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        await client.deleteCompany(companyId).catch(() => {});
        await ctx.dispose();
    });

    test('setup – create test user assigned to the company', async ({ loginPage, usersPage }) => {
        const user   = makeUser('LinkUsr');
        userEmail    = user.email;
        userFullName = user.fullName;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();
        await usersPage.fillCreateUserForm({ fullName: userFullName, phone: user.phone, email: userEmail });
        await usersPage.selectJobFunction(TEST_JOB_FN);
        await usersPage.selectRole(TEST_ROLE);
        await usersPage.selectCompany(companyName);
        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(userEmail);
    });

    // TC-COMP-06
    test('linked company user appears in the company detail panel', async ({ loginPage, companiesPage }) => {
        test.setTimeout(90000);
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.selectCompanyByName(companyName);
        await companiesPage.assertUserInCompanyUsers(userEmail);
    });

    // TC-COMP-07
    test('unlinking a company user removes them from the company detail panel', async ({ loginPage, companiesPage }) => {
        test.setTimeout(90000);
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.selectCompanyByName(companyName);
        await companiesPage.assertUserInCompanyUsers(userEmail);

        await companiesPage.unlinkUser(userEmail);
        await companiesPage.assertUserNotInCompanyUsers(userEmail);
    });

});

// ─── TC-COMP-08 & 09: Link / Unlink outside collaborator ─────────────────────
// The collaborator user must NOT be assigned to companyName at creation — if
// they were, the system would treat them as a Company User and refuse to add
// them as an Outside Collaborator. A separate helper company is used so the
// user has a company (required field) but no relation to the test company.

test.describe('Companies – link and unlink outside collaborator', () => {
    test.describe.configure({ mode: 'serial' });

    let companyId: string;
    let helperCompanyId: string;
    const companyName       = `E2E CollabLink ${randomString(6)}`;
    const helperCompanyName = `E2E CollabHelper ${randomString(6)}`;
    let collabEmail: string;
    let collabFullName: string;

    test.beforeAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);

        const res1 = await client.createCompany({ name: companyName });
        companyId  = (await res1.json()).data.id;

        const res2     = await client.createCompany({ name: helperCompanyName });
        helperCompanyId = (await res2.json()).data.id;

        await ctx.dispose();
    });

    test.afterAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        await client.deleteCompany(companyId).catch(() => {});
        await client.deleteCompany(helperCompanyId).catch(() => {});
        await ctx.dispose();
    });

    // Setup: create user assigned to the HELPER company (not the test company)
    test('setup – create test user to be linked as outside collaborator', async ({ loginPage, usersPage }) => {
        const user     = makeUser('Collab');
        collabEmail    = user.email;
        collabFullName = user.fullName;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();
        await usersPage.fillCreateUserForm({ fullName: collabFullName, phone: user.phone, email: collabEmail });
        await usersPage.selectJobFunction(TEST_JOB_FN);
        await usersPage.selectRole(TEST_ROLE);
        await usersPage.selectCompany(helperCompanyName);   // ← helper, not test company
        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(collabEmail);
    });

    // TC-COMP-08
    test('linked outside collaborator appears in the company detail panel', async ({ loginPage, companiesPage }) => {
        test.setTimeout(90000);
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.selectCompanyByName(companyName);
        await companiesPage.clickOutsideCollaboratorsTab();
        await companiesPage.linkOutsideCollaborator(collabEmail);
        await companiesPage.assertCollaboratorInTable(collabEmail);
    });

    // TC-COMP-09
    test('unlinking an outside collaborator removes them from the company detail panel', async ({ loginPage, companiesPage }) => {
        test.setTimeout(90000);
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.selectCompanyByName(companyName);
        await companiesPage.clickOutsideCollaboratorsTab();
        await companiesPage.assertCollaboratorInTable(collabEmail);

        await companiesPage.unlinkOutsideCollaborator(collabEmail);
        await companiesPage.assertCollaboratorNotInTable(collabEmail);
    });

});

// ─── TC-COMP-10: Same user cannot hold both roles in the same company ─────────
// User is created assigned to companyName → auto-becomes Company User.
// Attempting to link them as Outside Collaborator must show the error:
// "This user is already a member of this company. Unlink them from the
//  company before adding them as a collaborator."

test.describe('Companies – same user cannot hold both roles in the same company', () => {
    test.describe.configure({ mode: 'serial' });

    let companyId: string;
    const companyName = `E2E DualRole ${randomString(6)}`;
    let dualEmail: string;
    let dualFullName: string;

    test.beforeAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        const res    = await client.createCompany({ name: companyName });
        const body   = await res.json();
        companyId = body.data.id;
        await ctx.dispose();
    });

    test.afterAll(async () => {
        const ctx    = await getAuthApiContext();
        const client = new companiesClient(ctx);
        await client.deleteCompany(companyId).catch(() => {});
        await ctx.dispose();
    });

    test('setup – create user and verify they appear as Company User', async ({ loginPage, usersPage, companiesPage }) => {
        test.setTimeout(90000);
        const user   = makeUser('DualRole');
        dualEmail    = user.email;
        dualFullName = user.fullName;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();
        await usersPage.fillCreateUserForm({ fullName: dualFullName, phone: user.phone, email: dualEmail });
        await usersPage.selectJobFunction(TEST_JOB_FN);
        await usersPage.selectRole(TEST_ROLE);
        await usersPage.selectCompany(companyName);
        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(dualEmail);

        // Confirm the user is already in Company Users tab
        await companiesPage.goto();
        await companiesPage.selectCompanyByName(companyName);
        await companiesPage.assertUserInCompanyUsers(dualEmail);
    });

    // TC-COMP-10
    test('attempting to add an existing Company User as Outside Collaborator shows a dual-role error', async ({ loginPage, companiesPage }) => {
        test.setTimeout(90000);
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.selectCompanyByName(companyName);
        await companiesPage.clickOutsideCollaboratorsTab();

        // tryLinkCollaborator opens the dialog, selects the user, and clicks the
        // submit button — but does NOT wait for the dialog to close.
        await companiesPage.tryLinkCollaborator(dualEmail);

        // The system must display the dual-role error inline in the dialog.
        await companiesPage.assertDuplicateRoleError();
    });

});
