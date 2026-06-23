import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly showPasswordToggle: Locator;
    private readonly forgotPasswordLink: Locator;
    private readonly signUpTab: Locator;
    private readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByPlaceholder('Type your email address');
        this.passwordInput = page.getByPlaceholder('Type your password').first();
        this.loginButton = page.getByRole('button', { name: 'Sign in' });
        this.showPasswordToggle = page.locator('.password-eye-toggle:visible');
        this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
        this.signUpTab = page.getByRole('link', { name: 'Sign Up' });
        this.errorMessage = page.locator('.custom-error-message');
    }

    async goto() {
        await this.page.goto('/');
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async fillPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    async togglePasswordVisibility() {
        await this.showPasswordToggle.click();
    }

    async clickForgotPassword() {
        await this.forgotPasswordLink.click();
    }

    async navigateToSignUp() {
        await this.signUpTab.click();
    }

    async assertPageLoaded() {
        await expect(this.emailInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.loginButton).toBeVisible();
    }

    async assertLoginError(message: string) {
        await expect(this.errorMessage).toContainText(message);
    }

    async assertPasswordInputType(type: 'password' | 'text') {
        await expect(this.passwordInput).toHaveAttribute('type', type);
    }

    async assertSignUpFormVisible() {
        await expect(this.page.getByRole('heading', { name: 'Create a new account' })).toBeVisible();
    }

    async assertForgotPasswordFormVisible() {
        await expect(this.page.getByRole('heading', { name: 'Forgot password?' })).toBeVisible();
    }

    async assertLoginSuccessful() {
        await expect(this.page).toHaveURL(/app\.dev\.dap\.daedalusindustrial\.com/, { timeout: 15000 });
    }
}