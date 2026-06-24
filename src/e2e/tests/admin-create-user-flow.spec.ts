import { test, expect } from '../fixtures/test-fixtures';
import { createInbox, waitForLatestEmail } from '../../shared/utils/mailslurp';
import { randomString } from '../../shared/utils/random';

test.describe.configure({ mode: 'serial' });

const adminEmail    = process.env.E2E_USER_EMAIL!;
const adminPassword = process.env.E2E_USER_PASSWORD!;
const newPassword   = 'TestPass123!';

let inboxId:   string;
let userEmail: string;
const fullName = `E2E Admin Created ${randomString(6)}`;

test.describe('Admin creates a new user — full flow', () => {

    test('admin fills and submits the Create User form', async ({ loginPage, usersPage }) => {
        const inbox = await createInbox();
        inboxId   = inbox.id;
        userEmail = inbox.emailAddress;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();

        await usersPage.fillCreateUserForm({
            fullName,
            phone: '+1 (555) 100-0001',
            email: userEmail,
        });
        await usersPage.selectJobFunction('Other');
        await usersPage.selectRole('Reader');
        await usersPage.selectCompany('Daedalus Industries');

        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(userEmail);
    });

    test('new user receives account verification email', async () => {
        test.setTimeout(60000);
        const email = await waitForLatestEmail(inboxId, 45000);
        expect(email).not.toBeNull();
        expect(
            email.subject!.toLowerCase().includes('verify') ||
            email.subject!.toLowerCase().includes('welcome') ||
            email.subject!.toLowerCase().includes('confirm')
        ).toBe(true);
    });

    test('new user receives email to set password', async () => {
        test.setTimeout(60000);
        // Auth0 sends a second email with a password setup / change-password link
        const email = await waitForLatestEmail(inboxId, 45000);
        expect(email).not.toBeNull();
        expect(email.body).toBeTruthy();
        const bodyText = email.body ?? '';
        expect(
            bodyText.toLowerCase().includes('password') ||
            email.subject!.toLowerCase().includes('password')
        ).toBe(true);
    });

    test('new user sets password via the email link', async ({ page }) => {
        test.setTimeout(60000);
        const email = await waitForLatestEmail(inboxId, 45000);
        expect(email).not.toBeNull();

        // Extract the password-setup link from the email body
        const bodyText = email.body ?? '';
        const linkMatch = bodyText.match(/https?:\/\/[^\s"<>]+(?:reset|set|password)[^\s"<>]*/i);
        expect(linkMatch, 'Password setup link not found in email body').not.toBeNull();

        await page.goto(linkMatch![0]);
        await page.waitForLoadState('domcontentloaded');

        // Auth0 password reset form — fill new password and confirm
        const passwordInput = page.getByPlaceholder(/new password/i).or(page.locator('input[type="password"]').first());
        await passwordInput.fill(newPassword);

        const confirmInput = page.locator('input[type="password"]').last();
        if (await confirmInput.count() > 0) {
            await confirmInput.fill(newPassword);
        }

        await page.getByRole('button', { name: /submit|reset|save|continue/i }).click();
        await page.waitForTimeout(2000);
    });

    test('new user can log in with the new password', async ({ loginPage }) => {
        await loginPage.goto();
        await loginPage.login(userEmail, newPassword);
        await loginPage.assertLoginSuccessful();
    });

    test('new user accesses the dashboard after login', async ({ loginPage, homePage }) => {
        await loginPage.goto();
        await loginPage.login(userEmail, newPassword);
        await homePage.assertPageLoaded();
    });

});
