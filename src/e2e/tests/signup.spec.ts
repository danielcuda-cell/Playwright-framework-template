import { test, expect } from '../fixtures/test-fixtures';
import { PASSWORD_RULES } from '../pages/signUpPage';
import { createInbox, waitForLatestEmail } from '../../shared/utils/mailslurp';
import { randomString } from '../../shared/utils/random';

const adminEmail    = process.env.E2E_USER_EMAIL!;
const adminPassword = process.env.E2E_USER_PASSWORD!;
const adminCreatedPassword = 'TestPass123!';

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
        test.setTimeout(60000);
        const email = await waitForLatestEmail(inboxId, 45000);
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

    test('admin should change the new user role to Reader', async ({ loginPage, usersPage }) => {
        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.changeUserRole(userEmail, 'Reader');

        await usersPage.searchUser(userEmail);
        await usersPage.assertUserData(userEmail, { role: 'Reader' });
    });

    test('user with Reader role should land on home dashboard after login', async ({ loginPage, homePage }) => {
        await loginPage.goto();
        await loginPage.login(userEmail, userPassword);
        await homePage.assertPageLoaded();
    });

});

// ─── Admin creates a new user ──────────────────────────────────────────────────

test.describe('Sign Up – admin creates a new user flow', () => {

    let adminCreatedInboxId: string;
    let adminCreatedEmail: string;
    let adminCreatedAuthEmail: Awaited<ReturnType<typeof waitForLatestEmail>>;
    const adminCreatedFullName = `E2E Admin Created ${randomString(6)}`;

    test('admin fills and submits the Create User form', async ({ loginPage, usersPage }) => {
        const inbox = await createInbox();
        adminCreatedInboxId = inbox.id;
        adminCreatedEmail   = inbox.emailAddress;

        await loginPage.goto();
        await loginPage.login(adminEmail, adminPassword);
        await loginPage.assertLoginSuccessful();

        await usersPage.goto();
        await usersPage.clickAddUser();
        await usersPage.assertCreateUserDialogOpen();

        await usersPage.fillCreateUserForm({
            fullName: adminCreatedFullName,
            phone: '+1 (555) 100-0001',
            email: adminCreatedEmail,
        });
        await usersPage.selectJobFunction('Other');
        await usersPage.selectRole('Reader');
        await usersPage.selectCompany('Daedalus Industries');

        await usersPage.submitCreateUserForm();
        await usersPage.assertUserCreatedSuccessfully(adminCreatedEmail);
    });

    test('new user receives an email from Auth0 after account creation', async () => {
        test.setTimeout(60000);
        adminCreatedAuthEmail = await waitForLatestEmail(adminCreatedInboxId, 45000);
        expect(adminCreatedAuthEmail).not.toBeNull();
        expect(adminCreatedAuthEmail.subject).toBeTruthy();
        // Admin-created users receive a password setup email from Auth0
        expect(
            adminCreatedAuthEmail.subject!.toLowerCase().includes('password') ||
            adminCreatedAuthEmail.subject!.toLowerCase().includes('reset')    ||
            adminCreatedAuthEmail.subject!.toLowerCase().includes('verify')   ||
            adminCreatedAuthEmail.subject!.toLowerCase().includes('welcome')  ||
            adminCreatedAuthEmail.subject!.toLowerCase().includes('confirm')
        ).toBe(true);
    });

    test('new user sets up their password', async ({ page }) => {
        test.setTimeout(120000);
        // Reuse the email fetched by the previous test — Auth0 sends only one email
        const email = adminCreatedAuthEmail;
        expect(email).not.toBeNull();

        const bodyText = email.body ?? '';
        // Find the Auth0 action link — contains ticket/token, not a static asset
        const allLinks = bodyText.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
        const actionLink = allLinks
            .map(l => l.replace(/&amp;.*/i, ''))
            .find(l =>
                l.length > 60 &&
                !l.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|ttf|eot)(\?|$)/i) &&
                !l.includes('unsubscribe') &&
                (l.includes('ticket') || l.includes('token') || l.includes('/u/') ||
                 l.includes('auth0') || l.includes('reset') || l.includes('invite') || l.includes('activate'))
            );
        expect(actionLink, 'Auth0 action link not found in email body').toBeTruthy();

        await page.goto(actionLink!);
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        let passwordInputs = page.locator('input[type="password"]');

        if (await passwordInputs.count() === 0) {
            // Auth0 sent an email-verification link (not a password-reset link).
            // Wait a few seconds for Auth0 to propagate the email-verified status before triggering forgot-password
            await page.waitForTimeout(5000);
            await page.goto('/');
            await page.getByRole('link', { name: 'Forgot password?' }).click();
            await page.getByRole('heading', { name: 'Forgot password?' }).waitFor({ timeout: 10000 });

            // Fill the email field — try common patterns
            const emailInput = page.locator('input[type="email"]')
                .or(page.getByPlaceholder(/email/i))
                .first();
            await emailInput.fill(adminCreatedEmail);
            const forgotPasswordSubmittedAt = new Date();
            await page.getByRole('button', { name: /send|submit|reset/i }).click();
            await page.waitForLoadState('networkidle', { timeout: 15000 });

            // Wait for the new password-reset email — only accept emails received after the submit
            const resetEmail = await waitForLatestEmail(adminCreatedInboxId, 60000, forgotPasswordSubmittedAt);
            expect(resetEmail, 'Password reset email not received after forgot-password').not.toBeNull();

            const resetBody = resetEmail.body ?? '';
            const resetLinks = resetBody.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
            const resetLink = resetLinks
                .map(l => l.replace(/&amp;.*/i, ''))
                .find(l =>
                    l.includes('auth0') &&
                    !l.match(/\.(png|jpg|svg|ico)(\?|$)/i) &&
                    l.length > 60
                );
            expect(resetLink, 'Password reset link not found in forgot-password email').toBeTruthy();

            await page.goto(resetLink!);
            await page.waitForLoadState('networkidle', { timeout: 30000 });
            passwordInputs = page.locator('input[type="password"]');
        }

        const count = await passwordInputs.count();
        expect(count, 'No password input found on the reset page').toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            await passwordInputs.nth(i).fill(adminCreatedPassword);
        }
        await page.getByRole('button', { name: /submit|reset|save|continue|change/i }).click();
        await page.waitForLoadState('networkidle', { timeout: 30000 });
    });

    test('new user can log in with the new password', async ({ loginPage }) => {
        await loginPage.goto();
        await loginPage.login(adminCreatedEmail, adminCreatedPassword);
        await loginPage.assertLoginSuccessful();
    });

    test('new user is in the app after login with no auth error', async ({ loginPage, page }) => {
        await loginPage.goto();
        await loginPage.login(adminCreatedEmail, adminCreatedPassword);
        // Verify login is accepted: URL reaches the app domain (home, pending-approval, or callback)
        await loginPage.assertLoginSuccessful();
        // Verify no login-error message is shown (credentials were accepted)
        await expect(page.locator('.custom-error-message')).not.toBeVisible();
    });

});
