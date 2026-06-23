import { test, expect } from '../fixtures/test-fixtures';
import { PASSWORD_RULES } from '../pages/signUpPage';
import { createInbox, waitForLatestEmail } from '../../shared/utils/mailslurp';
import { randomString } from '../../shared/utils/random';

const adminEmail    = process.env.E2E_USER_EMAIL!;
const adminPassword = process.env.E2E_USER_PASSWORD!;

test.describe.configure({ mode: 'serial' });

// ─── Password validation ───────────────────────────────────────────────────────

test.describe('Sign Up – password validation', () => {

    test.beforeEach(async ({ signUpPage }) => {
        await signUpPage.goto();
        await signUpPage.navigateToSignUpTab();
    });

    test('submit button is disabled when form is empty', async ({ signUpPage }) => {
        await signUpPage.assertSubmitButtonDisabled();
    });

    // Auth0 policy: at least 8 chars AND at least 3 of 4 types (lower, upper, number, special)

    test('submit button stays disabled when password is too short (< 8 chars)', async ({ signUpPage }) => {
        await signUpPage.fillEmail('test@example.com');
        await signUpPage.fillPassword('Ab1!');
        await signUpPage.fillConfirmPassword('Ab1!');
        await signUpPage.assertSubmitButtonDisabled();
    });

    test('submit button stays disabled when password has only 1 character type', async ({ signUpPage }) => {
        await signUpPage.fillEmail('test@example.com');
        await signUpPage.fillPassword('aaaaaaaa');   // only lowercase
        await signUpPage.fillConfirmPassword('aaaaaaaa');
        await signUpPage.assertSubmitButtonDisabled();
    });

    test('submit button stays disabled when password has only 2 character types', async ({ signUpPage }) => {
        await signUpPage.fillEmail('test@example.com');
        await signUpPage.fillPassword('AAAAaaaa');   // only lower + upper
        await signUpPage.fillConfirmPassword('AAAAaaaa');
        await signUpPage.assertSubmitButtonDisabled();
    });

    test('submit button enables with 3 of 4 types and 8+ chars (lower + number + special)', async ({ signUpPage }) => {
        await signUpPage.fillEmail('test@example.com');
        await signUpPage.fillPassword('abcdef1!');   // lower + number + special
        await signUpPage.fillConfirmPassword('abcdef1!');
        await signUpPage.assertSubmitButtonEnabled();
    });

    test('submit button enables with all 4 character types and 8+ chars', async ({ signUpPage }) => {
        await signUpPage.fillEmail('test@example.com');
        await signUpPage.fillPassword('TestPass123!');
        await signUpPage.fillConfirmPassword('TestPass123!');
        await signUpPage.assertSubmitButtonEnabled();
    });

});

// ─── Full sign-up flow ─────────────────────────────────────────────────────────

test.describe('Sign Up – full flow', () => {

    let inboxId: string;
    let userEmail: string;
    const userPassword = 'TestPass123!';
    const fullName     = `E2E User ${randomString(6)}`;
    const phone        = '(234)345-4444';
    const jobFunction  = 'Engineering';

    test('should create a MailSlurp inbox and complete sign up', async ({ signUpPage }) => {
        const inbox = await createInbox();
        inboxId   = inbox.id;
        userEmail = inbox.emailAddress;

        await signUpPage.goto();
        await signUpPage.navigateToSignUpTab();
        await signUpPage.signUp(userEmail, userPassword);
        await signUpPage.assertSignUpSuccess();
    });

    test('should receive a confirmation email from Auth0', async () => {
        const email = await waitForLatestEmail(inboxId, 30000);
        expect(email).not.toBeNull();
        expect(email.subject).toBeTruthy();
        // Auth0 sends a "verify your email" or "welcome" email on signup
        expect(
            email.subject!.toLowerCase().includes('verify') ||
            email.subject!.toLowerCase().includes('welcome') ||
            email.subject!.toLowerCase().includes('confirm')
        ).toBe(true);
    });

    test('should log in and land on pending-approval page', async ({ loginPage, pendingApprovalPage }) => {
        await loginPage.goto();
        await loginPage.login(userEmail, userPassword);
        await expect(pendingApprovalPage.page).toHaveURL(/\/pending-approval/, { timeout: 15000 });
        await pendingApprovalPage.assertAccessRequiresApproval();
        await pendingApprovalPage.clickCompleteInformation();
    });

    test('should show validation errors when profile form is submitted empty', async ({ loginPage, pendingApprovalPage }) => {
        await loginPage.goto();
        await loginPage.login(userEmail, userPassword);
        await pendingApprovalPage.assertAccessRequiresApproval();
        await pendingApprovalPage.clickCompleteInformation();

        await pendingApprovalPage.clickSubmitRequest();

        await pendingApprovalPage.assertFullNameError('Full name cannot start/end with whitespace');
        await pendingApprovalPage.assertPhoneError('Phone number is required');
    });

    test('should show "Invalid phone number" for a bad phone format', async ({ loginPage, pendingApprovalPage }) => {
        await loginPage.goto();
        await loginPage.login(userEmail, userPassword);
        await pendingApprovalPage.assertAccessRequiresApproval();
        await pendingApprovalPage.clickCompleteInformation();

        await pendingApprovalPage.fillFullName('Test User');
        await pendingApprovalPage.fillPhone('+1234567890');
        await pendingApprovalPage.clickSubmitRequest();

        await pendingApprovalPage.assertPhoneError('Invalid phone number');
    });

    test('should complete profile and show success page', async ({ loginPage, pendingApprovalPage }) => {
        await loginPage.goto();
        await loginPage.login(userEmail, userPassword);
        await pendingApprovalPage.assertAccessRequiresApproval();
        await pendingApprovalPage.clickCompleteInformation();

        await pendingApprovalPage.assertEmailPrefilled(userEmail);
        await pendingApprovalPage.completeProfile({ fullName, jobFunction, phone });
        await pendingApprovalPage.assertProfileSubmittedSuccessfully();
    });

    test('should log out from pending-approval success page', async ({ loginPage, pendingApprovalPage }) => {
        await loginPage.goto();
        await loginPage.login(userEmail, userPassword);
        await expect(pendingApprovalPage.page).toHaveURL(/\/pending-approval/, { timeout: 15000 });

        const logoutButton = pendingApprovalPage.page.getByRole('button', { name: 'Log Out' });
        await expect(logoutButton).toBeVisible();

        await logoutButton.click();
        // Auth0 /v2/logout is called → returnTo redirects back to the app
        // The full redirect chain completes back at /pending-approval/success (JWT still locally valid)
        await expect(pendingApprovalPage.page).toHaveURL(/\/pending-approval/, { timeout: 20000 });
    });

    test('admin should see the new user with correct data in Users page', async ({ loginPage, usersPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.searchUser(userEmail);

        await usersPage.assertUserData(userEmail, {
            fullName,
            phone:   '+1 (234) 345-4444',
            role:    'Default',
            company: 'N/A',
        });
    });

});
