import { Page, Locator, expect } from '@playwright/test';

export const PASSWORD_RULES = {
    minLength:     'At least 8 characters',
    lowercase:     'At least 1 lowercase',
    uppercase:     'At least 1 uppercase',
    number:        'At least 1 number',
    specialChar:   'At least 1 special character',
} as const;

export class SignUpPage {
    private readonly page: Page;

    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly confirmPasswordInput: Locator;
    private readonly submitButton: Locator;
    private readonly signUpTab: Locator;
    private readonly successMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput          = page.locator('input[name="email"]');
        this.passwordInput       = page.locator('input[name="password"]');
        this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
        this.submitButton        = page.getByRole('button', { name: 'Sign up' });
        this.signUpTab           = page.getByRole('link', { name: 'Sign Up' });
        this.successMessage      = page.getByText('Thanks for signing up.');
    }

    // ─── Navigation ───────────────────────────────────────────────────────────────

    async goto() {
        await this.page.goto('/');
        await this.page.waitForURL(/auth0\.com/);
    }

    async navigateToSignUpTab() {
        await this.signUpTab.click();
        await expect(this.page.getByRole('heading', { name: 'Create a new account' })).toBeVisible();
    }

    // ─── Form actions ─────────────────────────────────────────────────────────────

    async fillEmail(email: string) {
        await this.emailInput.fill(email);
    }

    async fillPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    async fillConfirmPassword(password: string) {
        await this.confirmPasswordInput.fill(password);
    }

    async submit() {
        await this.submitButton.click();
    }

    async signUp(email: string, password: string) {
        await this.fillEmail(email);
        await this.fillPassword(password);
        await this.fillConfirmPassword(password);
        await this.submit();
    }

    // ─── Assertions ───────────────────────────────────────────────────────────────

    async assertSubmitButtonDisabled() {
        await expect(this.submitButton).toBeDisabled();
    }

    async assertSubmitButtonEnabled() {
        await expect(this.submitButton).toBeEnabled();
    }

    async assertSignUpSuccess() {
        await expect(this.successMessage).toBeVisible({ timeout: 10000 });
    }

    async assertPasswordRulePasses(ruleText: string) {
        const rule = this.page.locator('p').filter({ hasText: ruleText });
        await expect(rule).toBeVisible();
        const isGreen = await rule.evaluate(el => {
            const color = window.getComputedStyle(el).color;
            // Auth0 renders passing rules with a green color (non-gray)
            return !color.startsWith('rgb(0,') && color !== 'rgb(156, 163, 175)';
        });
        expect(isGreen, `Expected rule "${ruleText}" to be passing (green)`).toBe(true);
    }

    async assertPasswordRuleFails(ruleText: string) {
        const rule = this.page.locator('p').filter({ hasText: ruleText });
        await expect(rule).toBeVisible();
        const isGreen = await rule.evaluate(el => {
            const color = window.getComputedStyle(el).color;
            return !color.startsWith('rgb(0,') && color !== 'rgb(156, 163, 175)';
        });
        expect(isGreen, `Expected rule "${ruleText}" to be failing (gray)`).toBe(false);
    }
}
