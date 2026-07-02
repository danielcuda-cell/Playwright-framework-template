import { test } from '../fixtures/test-fixtures';
import { expect } from '../fixtures/test-fixtures';
import { randomString } from '../../shared/utils/random';
import { companiesClient } from '../../api/clients/companiesClient';
import { getAuthApiContext } from '../../api/utils/apiContext';

const email = process.env.E2E_USER_EMAIL!;
const password = process.env.E2E_USER_PASSWORD!;

// Existing email used to trigger a duplicate-user service error
const DUPLICATE_EMAIL = 'randy.letona@designli.co';

let testCompanyName: string;
let testCompanyId:   string;

const VALID_USER_BASE = {
    fullName: 'Test Error Banner',
    phone: '+1 (555) 000-0001',
    email: DUPLICATE_EMAIL,
    jobFunction: 'Other',
    role: 'Reader',
};

// Auth0 session cookies cannot be shared across browser contexts, so tests must
// each perform a fresh login. Serial mode prevents concurrent logins with the
// same credentials from invalidating each other's sessions.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
    const ctx    = await getAuthApiContext();
    const client = new companiesClient(ctx);
    testCompanyName = `E2E Company ${randomString(6)}`;
    const res    = await client.createCompany({ name: testCompanyName });
    const body   = await res.json();
    testCompanyId = body.data.id;
    await ctx.dispose();
});

test.afterAll(async () => {
    const ctx    = await getAuthApiContext();
    const client = new companiesClient(ctx);
    await client.deleteCompany(testCompanyId);
    await ctx.dispose();
});

test.describe('Create User — service error banner', () => {

    test.beforeEach(async ({ loginPage, usersPage }) => {
        await loginPage.goto();
        await loginPage.login(email, password);
        await loginPage.assertLoginSuccessful();
        await usersPage.goto();
    });

    test('should display error banner inside the dialog when a duplicate email is submitted', async ({ usersPage }) => {
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();
        await usersPage.fillCreateUserForm({ ...VALID_USER_BASE, company: testCompanyName });
        await usersPage.submitCreateUserForm();
        await usersPage.assertErrorBannerVisible();
    });

    test('should NOT show a toast notification when Create User fails', async ({ usersPage }) => {
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();
        await usersPage.fillCreateUserForm({ ...VALID_USER_BASE, company: testCompanyName });
        await usersPage.submitCreateUserForm();
        await usersPage.assertNoToastVisible();
        await usersPage.assertErrorBannerVisible();
    });

    test('should display a descriptive error message in the banner when Create User fails', async ({ usersPage }) => {
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();
        await usersPage.fillCreateUserForm({ ...VALID_USER_BASE, company: testCompanyName });
        await usersPage.submitCreateUserForm();
        // Banner must exist and contain some text (not be empty or generic)
        const bannerText = await usersPage.getErrorBannerText();
        expect(bannerText.length).toBeGreaterThan(0);
    });

    test('should keep the Create User dialog open after a service error', async ({ usersPage }) => {
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();
        await usersPage.fillCreateUserForm({ ...VALID_USER_BASE, company: testCompanyName });
        await usersPage.submitCreateUserForm();
        await usersPage.assertErrorBannerVisible();
        await usersPage.assertCreateUserDialogOpen();
    });

});
