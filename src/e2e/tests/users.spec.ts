import { test, expect } from '../fixtures/test-fixtures';
import { randomString } from '../../shared/utils/random';

const adminEmail    = process.env.E2E_USER_EMAIL!;
const adminPassword = process.env.E2E_USER_PASSWORD!;

const TEST_COMPANY   = 'Acme Corporation';
const TEST_PHONE     = '+1 (555) 300-0001';
const TEST_JOB_FN    = 'Engineering';
const TEST_ROLE      = 'Reader';

function makeUser(tag: string) {
    const uid = randomString(8);
    return {
        fullName: `E2E ${tag} ${uid}`,
        phone:    TEST_PHONE,
        email:    `e2e.${tag.toLowerCase()}.${uid}@test.invalid`,
    };
}

test.describe.configure({ mode: 'serial' });

// ─── TC1: Create user + validate in company ────────────────────────────────────

test.describe('Users – create user and validate in company', () => {

    let createdEmail: string;
    let createdFullName: string;

    test('admin creates a user and the user appears in the Users table', async ({ loginPage, usersPage }) => {
        const user = makeUser('Create');
        createdEmail    = user.email;
        createdFullName = user.fullName;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();

        await usersPage.fillCreateUserForm({ fullName: createdFullName, phone: user.phone, email: createdEmail });
        await usersPage.selectJobFunction(TEST_JOB_FN);
        await usersPage.selectRole(TEST_ROLE);
        await usersPage.selectCompany(TEST_COMPANY);

        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(createdEmail);
    });

    test('newly created user appears in their assigned company on the Companies page', async ({ loginPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await companiesPage.goto();
        await companiesPage.selectCompanyByName(TEST_COMPANY);
        await companiesPage.assertUserInCompanyUsers(createdEmail);
    });

});

// ─── TC2: Required fields validation ──────────────────────────────────────────

test.describe('Users – Create User form required fields', () => {

    test('submitting the empty Create User form shows all required field errors', async ({ loginPage, usersPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();

        await usersPage.submitCreateUserForm();
        await usersPage.assertRequiredFieldErrors();
    });

});

// ─── TC3: Edit user ────────────────────────────────────────────────────────────

test.describe('Users – edit user', () => {

    let editableEmail: string;
    let editedFullName: string;

    test('admin creates a user to use for the edit test', async ({ loginPage, usersPage }) => {
        const user = makeUser('Edit');
        editableEmail  = user.email;
        editedFullName = `${user.fullName} Updated`;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();

        await usersPage.fillCreateUserForm({ fullName: user.fullName, phone: user.phone, email: editableEmail });
        await usersPage.selectJobFunction(TEST_JOB_FN);
        await usersPage.selectRole(TEST_ROLE);
        await usersPage.selectCompany(TEST_COMPANY);

        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(editableEmail);
    });

    test('admin edits the user and changes are saved successfully', async ({ loginPage, usersPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.editUser(editableEmail, { fullName: editedFullName });

        await usersPage.searchUser(editableEmail);
        await usersPage.assertUserData(editableEmail, { fullName: editedFullName });
    });

});

// ─── TC4: Delete user ──────────────────────────────────────────────────────────

test.describe('Users – delete user', () => {

    let deletableEmail: string;

    test('admin creates a user to use for the delete test', async ({ loginPage, usersPage }) => {
        const user  = makeUser('Delete');
        deletableEmail = user.email;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();

        await usersPage.fillCreateUserForm({ fullName: user.fullName, phone: user.phone, email: deletableEmail });
        await usersPage.selectJobFunction(TEST_JOB_FN);
        await usersPage.selectRole(TEST_ROLE);
        await usersPage.selectCompany(TEST_COMPANY);

        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(deletableEmail);
    });

    test('admin deletes the user and they no longer appear in the Users list', async ({ loginPage, usersPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.deleteUser(deletableEmail);
        await usersPage.assertUserNotVisible(deletableEmail);
    });

});

// ─── TC5: Delete user + validate not in company ────────────────────────────────

test.describe('Users – delete user and validate removed from company', () => {

    let companyDeleteEmail: string;

    test('admin creates a user assigned to a company (setup for company-removal check)', async ({ loginPage, usersPage }) => {
        const user         = makeUser('DelComp');
        companyDeleteEmail = user.email;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();

        await usersPage.fillCreateUserForm({ fullName: user.fullName, phone: user.phone, email: companyDeleteEmail });
        await usersPage.selectJobFunction(TEST_JOB_FN);
        await usersPage.selectRole(TEST_ROLE);
        await usersPage.selectCompany(TEST_COMPANY);

        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(companyDeleteEmail);
    });

    test('admin deletes the user and they no longer appear in their company on Companies page', async ({ loginPage, usersPage, companiesPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.deleteUser(companyDeleteEmail);
        await usersPage.assertUserNotVisible(companyDeleteEmail);

        await companiesPage.goto();
        await companiesPage.selectCompanyByName(TEST_COMPANY);
        await companiesPage.assertUserNotInCompanyUsers(companyDeleteEmail);
    });

});
