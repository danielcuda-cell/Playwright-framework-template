import { test } from '../fixtures/test-fixtures';
import { LoginMessages } from '../../shared/messages';

const messages = new LoginMessages();

test.describe('Login Page', () => {

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.goto();
    });

    test.describe('Form visibility', () => {

        test('should display all login form elements', async ({ loginPage }) => {
            await loginPage.assertPageLoaded();
        });

    });

    test.describe('Authentication', () => {

        test('should login successfully with valid credentials', async ({ loginPage }) => {
            await loginPage.login(process.env.E2E_USER_EMAIL!, process.env.E2E_USER_PASSWORD!);
            await loginPage.assertLoginSuccessful();
        });

        test('should show error message with invalid credentials', async ({ loginPage }) => {
            await loginPage.login('invalid@test.com', 'WrongPassword123!');
            await loginPage.assertLoginError(messages.INVALID_CREDENTIALS);
        });

        test('should show error message with valid email and wrong password', async ({ loginPage }) => {
            await loginPage.login(process.env.E2E_USER_EMAIL!, 'WrongPassword123!');
            await loginPage.assertLoginError(messages.INVALID_CREDENTIALS);
        });

    });

    test.describe('Password field', () => {

        test('should hide password by default', async ({ loginPage }) => {
            await loginPage.fillPassword('TestPassword123!');
            await loginPage.assertPasswordInputType('password');
        });

        test('should reveal password when toggle is clicked', async ({ loginPage }) => {
            await loginPage.fillPassword('TestPassword123!');
            await loginPage.togglePasswordVisibility();
            await loginPage.assertPasswordInputType('text');
        });

        test('should hide password again when toggle is clicked twice', async ({ loginPage }) => {
            await loginPage.fillPassword('TestPassword123!');
            await loginPage.togglePasswordVisibility();
            await loginPage.togglePasswordVisibility();
            await loginPage.assertPasswordInputType('password');
        });

    });

    test.describe('Navigation', () => {

        test('should show Sign Up form when Sign Up tab is clicked', async ({ loginPage }) => {
            await loginPage.navigateToSignUp();
            await loginPage.assertSignUpFormVisible();
        });

        test('should show Forgot Password form when Forgot Password link is clicked', async ({ loginPage }) => {
            await loginPage.clickForgotPassword();
            await loginPage.assertForgotPasswordFormVisible();
        });

    });

});
